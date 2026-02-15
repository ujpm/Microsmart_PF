import shutil
import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv() 

from src.agents.vision import VisionAgent
from src.agents.brain import BrainAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vision_bot = None
brain_bot = None

@app.on_event("startup")
async def startup_event():
    global vision_bot, brain_bot
    try:
        vision_bot = VisionAgent()
        logger.info("✅ Vision Agent Ready")
    except Exception as e:
        logger.error(f"❌ Vision Agent Failed: {e}")

    try:
        if os.getenv("CEREBRAS_API_KEY"):
            brain_bot = BrainAgent()
            logger.info("✅ Brain Agent Ready")
        else:
            logger.warning("⚠️ CEREBRAS_API_KEY missing.")
    except Exception as e:
        logger.error(f"❌ Brain Agent Failed: {e}")

class DiagnoseRequest(BaseModel):
    total_parasites: int
    parasitemia_pct: str
    detailed_counts: Dict[str, int]

@app.get("/")
def read_root():
    return {"status": "Online"}

@app.post("/analyze")
async def analyze_sample(file: UploadFile = File(...), mode: str = "full"):
    if not vision_bot:
        raise HTTPException(status_code=503, detail="Vision Agent down.")

    temp_filename = f"temp_{file.filename}"
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        vision_results = vision_bot.analyze_image(temp_filename)

        if mode == "vision_only":
            return {"analysis": vision_results}

        if not brain_bot:
            return {"analysis": vision_results, "report": "Brain Agent offline."}

        clinical_report = brain_bot.generate_report(vision_results)
        return {"analysis": vision_results, "report": clinical_report}

    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@app.post("/diagnose")
async def diagnose_session(data: DiagnoseRequest):
    if not brain_bot:
        raise HTTPException(status_code=503, detail="Brain Agent is offline.")
    try:
        aggregated_vision_data = {
            "detailed_counts": data.detailed_counts,
            "total_parasites": data.total_parasites,
            "parasitemia_calculation": {"value": data.parasitemia_pct}
        }
        return {"report": brain_bot.generate_report(aggregated_vision_data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))