"""
MicroSmart PF - Backend API
---------------------------
This is the FastAPI server. It receives requests from the Frontend
and delegates work to the Vision and Brain agents.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv  
load_dotenv()                  
from src.agents.vision import VisionAgent
from src.agents.brain import BrainAgent
# --------------------------
import shutil
import os
import logging

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MicroSmartAPI")

app = FastAPI(title="MicroSmart PF API", version="1.1.0")

# Enable CORS so your React frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Agents
vision_bot = None
brain_bot = None

@app.on_event("startup")
async def startup_event():
    """Initialize the AI agents when the server starts."""
    global vision_bot, brain_bot
    # We load the model once here, instead of reloading it for every request
    if os.path.exists("models/best.pt"):
        vision_bot = VisionAgent(model_path="models/best.pt")
        brain_bot = BrainAgent()
        logger.info("✅ Vision and Brain Agents are online.")
    else:
        logger.warning("⚠️ Model not found. Vision features will be disabled.")

@app.post("/analyze")
async def analyze_sample(file: UploadFile = File(...)):
    """
    1. Receives image from Frontend
    2. Sends to Vision Agent -> Gets counts + bounding box image
    3. Sends counts to Brain Agent -> Gets medical report
    4. Returns everything to Frontend
    """
    if not vision_bot:
        raise HTTPException(status_code=503, detail="AI System is initializing...")
    
    # Save the uploaded file temporarily so YOLO can read it
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Run the pipeline
        vision_results = vision_bot.analyze_image(temp_filename)
        clinical_report = brain_bot.generate_report(vision_results)
        
        return {
            "analysis": vision_results,
            "report": clinical_report
        }
    
    except Exception as e:
        logger.error(f"Pipeline Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up the temp file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)