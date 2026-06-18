import os
import shutil
import uuid
import logging
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import FileResponse
from src.core.pdf_generator import generate_clinical_pdf
from starlette.background import BackgroundTask

from src.agents.vision import VisionAgent
from src.agents.brain import BrainAgent
from src.db.database import get_db, AsyncSessionLocal
from src.db.crud import get_or_create_default_org_and_user, create_session, save_inference_result, get_session_with_results
from src.models.domain import SampleTypeEnum
from src.core.security import get_current_user_token

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MicroSmart Enterprise API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vision_agent = VisionAgent()
brain_agent = BrainAgent()
os.makedirs("temp", exist_ok=True)

async def process_sample_background(
    session_id: uuid.UUID,
    temp_filename: str,
    engine: str,
    mode: str,
    sample_type: str
):
    """This runs completely in the background without freezing the API."""
    # We must open a fresh database connection for the background task
    async with AsyncSessionLocal() as db:
        try:
            logger.info(f"Background Task Started for Session: {session_id}")
            
            # 1. Run Vision Agent
            vision_results = vision_agent.analyze_image(temp_filename, engine=engine, sample_type=sample_type)
            
            # 2. Run Brain Agent
            brain_report = None
            if mode == "full":
                 brain_report = brain_agent.generate_report(vision_results)
                 
            # 3. Save to Database
            placeholder_image_url = f"https://storage.kigali-lab.test/{os.path.basename(temp_filename)}"
            await save_inference_result(db, session_id, placeholder_image_url, vision_results, brain_report)
            logger.info(f"Background Task Completed successfully for {session_id}")
            
        except Exception as e:
            logger.error(f"Background Processing Failed: {e}")
            # In production, we update session status to FAILED here
        finally:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)


@app.post("/analyze")
async def analyze_sample(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    mode: str = Form("full"),
    engine: str = Form("local"),
    sample_type: str = Form("malaria"),
    db: AsyncSession = Depends(get_db),
    auth_token: str = Depends(get_current_user_token) # Security Gate
):
    """Accepts the image, queues the background task, and returns instantly."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Resolve User (Auth token OR fallback test user)
    current_user = await get_or_create_default_org_and_user(db)
    
    db_sample_type = SampleTypeEnum.MALARIA if sample_type.lower() == "malaria" else SampleTypeEnum.OVA_AND_PARASITES

    # Create session immediately
    session = await create_session(db, current_user.id, current_user.facility_id, db_sample_type)

    temp_filename = f"temp/{uuid.uuid4()}_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Hand the heavy lifting off to the background task
    background_tasks.add_task(
        process_sample_background,
        session_id=session.id,
        temp_filename=temp_filename,
        engine=engine,
        mode=mode,
        sample_type=sample_type
    )

    # API returns instantly
    return {
        "status": "PROCESSING",
        "message": "Sample queued for asynchronous analysis.",
        "session_id": str(session.id)
    }

@app.get("/export/{session_id}")
async def export_report_pdf(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Generates a secure, branded PDF report for a completed session.
    """
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Session ID format")

    # Fetch the session and its related data
    session = await get_session_with_results(db, session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.status.value != "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot export incomplete session")

    inference = session.inferences[0] if session.inferences else None
    if not inference:
        raise HTTPException(status_code=404, detail="Inference data missing")

    # Package the data for the template
    session_data = {
        "session_id": str(session.id),
        "facility_name": "Kigali Central Lab (Test)", # In prod, fetch from session.facility
        "user_email": "tech@kigalilab.test",          # In prod, fetch from session.user
        "date": session.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "sample_type": session.sample_type.value,
        "status": session.status.value,
        "object_count": len(inference.vision_metrics.get("predictions", [])),
        "clinical_report": inference.clinical_report
    }

    # Generate the PDF
    pdf_filename = f"temp/MicroSmart_Report_{session_id}.pdf"
    generate_clinical_pdf(session_data, pdf_filename)

    # Return the file, and use a BackgroundTask to delete the file from the server AFTER sending it
    return FileResponse(
        path=pdf_filename, 
        filename=f"Report_{session_id}.pdf", 
        media_type="application/pdf",
        background=BackgroundTask(os.remove, pdf_filename)
    )

@app.get("/results/{session_id}")
async def get_results(session_id: str, db: AsyncSession = Depends(get_db)):
    """Frontend will poll this endpoint to check if the background task is done."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Session ID format")

    session = await get_session_with_results(db, session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status.value == "PENDING" or session.status.value == "PROCESSING":
        return {"status": session.status.value, "message": "Analysis is still running."}

    # Extract the results from the joined database table
    inference = session.inferences[0] if session.inferences else None
    
    if not inference:
        return {"status": "ERROR", "message": "Session marked complete but no results found."}

    return {
        "status": "COMPLETED",
        "session_id": str(session.id),
        "vision_metrics": inference.vision_metrics,
        "clinical_report": inference.clinical_report,
        "image_url": inference.image_url
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
