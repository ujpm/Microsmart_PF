import os
import shutil
import uuid
import logging
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import FileResponse
from src.core.pdf_generator import generate_clinical_pdf
from starlette.background import BackgroundTask

from src.agents.vision import VisionAgent
from src.agents.brain import BrainAgent
from src.db.database import get_db, AsyncSessionLocal
from src.db.crud import get_or_create_default_org_and_user, get_user_by_auth_id, create_session, save_inference_result, get_session_with_results, update_session_status
from src.models.domain import SampleTypeEnum, SessionStatusEnum
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

os.makedirs("temp", exist_ok=True)
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

vision_agent = VisionAgent()
brain_agent = BrainAgent()

async def process_sample_background(
    session_id: uuid.UUID, temp_filename: str, final_image_path: str,
    image_url: str, engine: str, mode: str, sample_type: str
):
    async with AsyncSessionLocal() as db:
        try:
            logger.info(f"Background Task Started for Session: {session_id}")
            shutil.move(temp_filename, final_image_path)
            
            vision_results = vision_agent.analyze_image(final_image_path, engine=engine, sample_type=sample_type)
            
            brain_report = None
            if mode == "full": brain_report = brain_agent.generate_report(vision_results)
                 
            await save_inference_result(db, session_id, image_url, vision_results, brain_report)
            
        except Exception as e:
            logger.error(f"Background Processing Failed: {e}")
            await update_session_status(db, session_id, SessionStatusEnum.FAILED)
            if os.path.exists(final_image_path): os.remove(final_image_path)
        finally:
            if os.path.exists(temp_filename): os.remove(temp_filename)

@app.post("/analyze")
async def analyze_sample(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    mode: str = Form("full"), engine: str = Form("local"), sample_type: str = Form("malaria"),
    db: AsyncSession = Depends(get_db), auth_token: str = Depends(get_current_user_token)
):
    if not files: raise HTTPException(status_code=400, detail="No files uploaded")
    
    if auth_token:
        current_user = await get_user_by_auth_id(db, auth_token)
        if not current_user: raise HTTPException(status_code=401, detail="User not registered")
    else:
        current_user = await get_or_create_default_org_and_user(db)
    
    db_sample_type = SampleTypeEnum.MALARIA if sample_type.lower() == "malaria" else SampleTypeEnum.OVA_AND_PARASITES
    session = await create_session(db, current_user.id, current_user.facility_id, db_sample_type)

    primary_file = files[0]
    file_id = f"{uuid.uuid4()}_{primary_file.filename}"
    temp_filename = f"temp/{file_id}"
    final_image_path = f"static/{file_id}"
    image_url = f"{str(request.base_url).rstrip('/')}/static/{file_id}"

    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(primary_file.file, buffer)

    background_tasks.add_task(
        process_sample_background, session_id=session.id, temp_filename=temp_filename,
        final_image_path=final_image_path, image_url=image_url, engine=engine, mode=mode, sample_type=sample_type
    )

    return { "status": "PROCESSING", "message": "Samples queued.", "session_id": str(session.id) }

@app.get("/export/{session_id}")
async def export_report_pdf(session_id: str, db: AsyncSession = Depends(get_db)):
    try: session_uuid = uuid.UUID(session_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid Session ID")

    session = await get_session_with_results(db, session_uuid)
    if not session or session.status.value != "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot export incomplete session")

    inference = session.inferences[0] if session.inferences else None
    session_data = {
        "session_id": str(session.id), "facility_name": "Kigali Central Lab", 
        "user_email": "tech@kigalilab.test", "date": session.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "sample_type": session.sample_type.value, "status": session.status.value,
        "object_count": len(inference.vision_metrics.get("predictions", [])) if inference else 0,
        "clinical_report": inference.clinical_report if inference else ""
    }

    pdf_filename = f"temp/MicroSmart_Report_{session_id}.pdf"
    generate_clinical_pdf(session_data, pdf_filename)

    return FileResponse(path=pdf_filename, filename=f"Report_{session_id}.pdf", media_type="application/pdf", background=BackgroundTask(os.remove, pdf_filename))

@app.get("/results/{session_id}")
async def get_results(session_id: str, db: AsyncSession = Depends(get_db)):
    try: session_uuid = uuid.UUID(session_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid format")

    session = await get_session_with_results(db, session_uuid)
    if not session: raise HTTPException(status_code=404, detail="Not found")

    if session.status.value in ["PENDING", "PROCESSING", "FAILED"]:
        return {"status": session.status.value, "message": "Analysis is currently: " + session.status.value}

    inference = session.inferences[0] if session.inferences else None
    if not inference: return {"status": "ERROR", "message": "No results found."}

    return {
        "status": "COMPLETED", "session_id": str(session.id),
        "vision_metrics": inference.vision_metrics, "clinical_report": inference.clinical_report,
        "image_url": inference.image_url
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
