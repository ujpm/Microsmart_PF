"""
MicroSmart PF - Backend API
---------------------------
This is the FastAPI server. It receives requests from the Frontend
and delegates work to the Vision and Brain agents.
"""
import shutil
import os
import logging
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from dotenv import load_dotenv

from src import config
from src.agents.vision import VisionAgent
from src.agents.brain import BrainAgent

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MicroSmart-Backend")

app = FastAPI()

# 1. MOUNT STATIC FILES (The "Good Solution" for images)
# Access images at: http://localhost:8000/static/results/filename.jpg
app.mount("/static", StaticFiles(directory=config.STATIC_DIR), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AGENTS ---
vision_bot = VisionAgent()
brain_bot = None

if os.getenv("CEREBRAS_API_KEY"):
    brain_bot = BrainAgent()
else:
    logger.warning("⚠️ Brain Agent Offline (Missing API Key)")

# --- ENDPOINTS ---

@app.post("/analyze")
async def analyze_sample(file: UploadFile = File(...), mode: str = "full"):
    if not vision_bot:
        raise HTTPException(503, "Vision Agent offline")

    # Save Upload Temporarily
    temp_id = str(uuid.uuid4())
    temp_ext = file.filename.split(".")[-1]
    temp_path = config.RESULTS_DIR / f"raw_{temp_id}.{temp_ext}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run Vision (Now saves to disk and returns URL)
        vision_results = vision_bot.analyze_image(str(temp_path), temp_id)

        if mode == "vision_only":
            return {"analysis": vision_results}

        # Brain Analysis
        if not brain_bot:
            return {"analysis": vision_results, "report": "Brain Agent Offline."}
            
        report = brain_bot.generate_report(vision_results)
        return {"analysis": vision_results, "report": report}

    except Exception as e:
        logger.error(f"Analysis Error: {e}")
        return {"error": str(e)}
    finally:
        # Cleanup the RAW upload, but keep the Annotated result
        if temp_path.exists():
            os.remove(temp_path)

class DiagnoseRequest(BaseModel):
    total_parasites: int
    parasitemia_pct: str
    detailed_counts: Dict[str, int]

@app.post("/diagnose")
async def diagnose_session(data: DiagnoseRequest):
    if not brain_bot:
        raise HTTPException(503, "Brain Agent Offline")
    
    # Reconstruct data structure for the Brain
    agg_data = {
        "detailed_counts": data.detailed_counts,
        "total_parasites": data.total_parasites,
        "parasitemia_calculation": {"value": data.parasitemia_pct}
    }
    return {"report": brain_bot.generate_report(agg_data)}