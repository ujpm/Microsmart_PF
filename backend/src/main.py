"""
MicroSmart PF - Backend API
---------------------------
This is the FastAPI server. It receives requests from the Frontend
and delegates work to the Vision and Brain agents.
"""
import shutil
import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv() 

from src.agents.vision import VisionAgent
from src.agents.brain import BrainAgent

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# --- CORS Configuration ---
origins = [
    "http://localhost:5173",                 # Local Development
    "https://app.microsmartpf.xyz",          # Production Frontend
    "https://microsmartpf.pages.dev",           # Backup Domain
]

# Wildcard to allow any Codespaces instance to work automatically
origin_regex = r"https://.*\.app\.github\.dev"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Agent Variables ---
vision_bot = None
brain_bot = None

# Initialize Agents
try:
    logger.info("Initializing Agents...")
    vision_bot = VisionAgent()
    logger.info("✅ Vision Agent Ready")
except Exception as e:
    logger.error(f"❌ Vision Agent Failed: {e}")

try:
    if not os.getenv("CEREBRAS_API_KEY"):
        logger.warning("⚠️ CEREBRAS_API_KEY is missing. Brain Agent will be offline.")
    else:
        brain_bot = BrainAgent()
        logger.info("✅ Brain Agent Ready")
except Exception as e:
    logger.error(f"❌ Brain Agent Failed: {e}")

# --- Data Schemas ---
class DiagnoseRequest(BaseModel):
    total_parasites: int
    parasitemia_pct: str
    detailed_counts: Dict[str, int]

# --- Endpoints ---

@app.get("/")
def read_root():
    return {
        "status": "Online",
        "vision_agent": "Active" if vision_bot else "Down",
        "brain_agent": "Active" if brain_bot else "Down (Check API Key)"
    }

@app.post("/analyze")
async def analyze_sample(file: UploadFile = File(...), mode: str = "full"):
    if not vision_bot:
        raise HTTPException(status_code=503, detail="Vision Agent is not running.")

    temp_filename = f"temp_{file.filename}"
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        vision_results = vision_bot.analyze_image(temp_filename)

        if mode == "vision_only":
            return {"analysis": vision_results}

        # Legacy Mode (Single Image Full Report)
        if not brain_bot:
            return {
                "analysis": vision_results,
                "report": "Error: Brain Agent is offline. Please check server logs for API Key issues."
            }

        clinical_report = brain_bot.generate_report(vision_results)
        return {"analysis": vision_results, "report": clinical_report}

    except Exception as e:
        logger.error(f"Analysis Failed: {e}")
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@app.post("/diagnose")
async def diagnose_session(data: DiagnoseRequest):
    """
    Generates a report from AGGREGATED session data.
    """
    if not brain_bot:
        raise HTTPException(
            status_code=503, 
            detail="Brain Agent is offline. Check backend logs for 'CEREBRAS_API_KEY' error."
        )

    try:
        aggregated_vision_data = {
            "detailed_counts": data.detailed_counts,
            "total_parasites": data.total_parasites,
            "parasitemia_calculation": {"value": data.parasitemia_pct}
        }
        report = brain_bot.generate_report(aggregated_vision_data)
        return {"report": report}
    except Exception as e:
        logger.error(f"Diagnosis Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))