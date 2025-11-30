"""
MicroSmart PF - Backend API
---------------------------
This FastAPI application serves as the bridge between the React frontend
and the AI agents. It handles image uploads, runs the vision pipeline,
and queries the reasoning engine.

Author: MicroSmart Team
Date: 2025-11-25
Bridge between Frontend, AI Agents, and LiquidMetal Raindrop Infrastructure.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from agents.vision import VisionAgent
from agents.brain import BrainAgent
from lm_raindrop import Raindrop
import shutil
import os
import logging
import uuid
import asyncio

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MicroSmartAPI")

# Initialize App
app = FastAPI(title="MicroSmart PF API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global State
vision_bot = None
brain_bot = None
raindrop_client = None

# Bucket configuration from raindrop.manifest
BUCKET_NAME = "patient-records"

@app.on_event("startup")
async def startup_event():
    """Initialize AI models and cloud infrastructure connection."""
    global vision_bot, brain_bot, raindrop_client
    
    # Initialize AI Agents
    try:
        model_path = "models/best.pt"
        if os.path.exists(model_path):
            vision_bot = VisionAgent(model_path=model_path)
            brain_bot = BrainAgent()
            logger.info("✅ AI Agents initialized.")
        else:
            logger.warning(f"⚠️ Model not found at {model_path}.")
    except Exception as e:
        logger.error(f"❌ Failed to load agents: {e}")

    # Initialize Raindrop Client
    try:
        api_key = os.environ.get("RAINDROP_API_KEY")
        if api_key:
            raindrop_client = Raindrop(api_key=api_key)
            logger.info("✅ Connected to LiquidMetal Raindrop.")
        else:
            logger.warning("⚠️ RAINDROP_API_KEY not found. Memory features disabled.")
    except Exception as e:
        logger.error(f"❌ Failed to connect to Raindrop: {e}")

@app.get("/")
def health_check():
    return {
        "status": "online", 
        "system": "MicroSmart PF", 
        "memory": raindrop_client is not None
    }

@app.post("/analyze")
async def analyze_sample(file: UploadFile = File(...)):
    """
    Process image sample, generate diagnosis, and archive to cloud.
    """
    if not vision_bot or not brain_bot:
        raise HTTPException(status_code=503, detail="AI Agents are not ready.")

    # Create unique identifier for patient record
    case_id = str(uuid.uuid4())[:8]
    temp_filename = f"temp_{case_id}_{file.filename}"
    
    # Write to temporary storage
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Execute Vision Pipeline
        logger.info(f"Scanning image: {temp_filename}")
        vision_results = vision_bot.analyze_image(temp_filename)
        
        # Execute Reasoning Pipeline
        logger.info("Generating clinical report...")
        clinical_report = brain_bot.generate_report(vision_results)

        # Archive to Raindrop (Background Task)
        if raindrop_client:
            asyncio.create_task(upload_case_data(
                case_id, 
                temp_filename, 
                file.filename, 
                clinical_report
            ))

        return {
            "case_id": case_id,
            "analysis": vision_results,
            "report": clinical_report
        }

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Note: In production, use a robust file cleanup strategy
        if not raindrop_client and os.path.exists(temp_filename):
            os.remove(temp_filename)

async def upload_case_data(case_id: str, local_path: str, original_name: str, report_text: str):
    """
    Uploads raw image and generated report to SmartBucket.
    Raindrop automatically indexes report_text for semantic search.
    """
    try:
        # Upload Source Image
        with open(local_path, "rb") as f:
            file_bytes = f.read()
            
        raindrop_client.object.upload(
            key=f"cases/{case_id}/{original_name}",
            bucket=BUCKET_NAME,
            body=file_bytes
        )
        
        # Upload Diagnostic Report
        raindrop_client.object.upload(
            key=f"cases/{case_id}/report.md",
            bucket=BUCKET_NAME,
            body=report_text.encode('utf-8')
        )
        logger.info(f"☁️ Case {case_id} archived to Raindrop.")
        
        # Cleanup
        if os.path.exists(local_path):
            os.remove(local_path)
            
    except Exception as e:
        logger.error(f"Upload failed for {case_id}: {e}")

@app.post("/search")
async def search_cases(query: str = Body(..., embed=True)):
    """
    Perform semantic search across historical patient records.
    """
    if not raindrop_client:
        raise HTTPException(status_code=503, detail="Raindrop memory is offline.")

    try:
        logger.info(f"Searching memory for: {query}")
        results = raindrop_client.search.perform(
            input=query,
            bucket=BUCKET_NAME
        )
        return {"matches": results}
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)