"""
MicroSmart PF - Backend API
---------------------------
This FastAPI application serves as the bridge between the React frontend
and the AI agents. It handles image uploads, runs the vision pipeline,
and queries the reasoning engine.

Author: MicroSmart Team
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from agents.vision import VisionAgent
from agents.brain import BrainAgent
import shutil
import os
import logging

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MicroSmartAPI")

# Initialize App
app = FastAPI(title="MicroSmart PF API", version="1.0.0")

# Enable CORS (Allows your React app to talk to this Python server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Agents (Lazy loaded on startup)
vision_bot = None
brain_bot = None

@app.on_event("startup")
async def startup_event():
    """Load AI models when the server starts to reduce latency per request."""
    global vision_bot, brain_bot
    try:
        # Ensure model exists before loading
        model_path = "models/best.pt"
        if os.path.exists(model_path):
            vision_bot = VisionAgent(model_path=model_path)
            brain_bot = BrainAgent()
            logger.info("✅ AI Agents initialized successfully.")
        else:
            logger.warning(f"⚠️ Model not found at {model_path}. Vision features will be disabled.")
    except Exception as e:
        logger.error(f"❌ Failed to load agents: {e}")

@app.get("/")
def health_check():
    return {"status": "online", "system": "MicroSmart PF"}

@app.post("/analyze")
async def analyze_sample(file: UploadFile = File(...)):
    """
    Full Diagnostic Pipeline:
    1. Save image temporarily.
    2. Vision Agent counts parasites.
    3. Brain Agent generates clinical report.
    4. Return structured JSON to frontend.
    """
    if not vision_bot or not brain_bot:
        raise HTTPException(status_code=503, detail="AI Agents are not ready.")

    # 1. Save Temp File
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. Vision Analysis (The Eye)
        logger.info(f"Scanning image: {temp_filename}")
        vision_results = vision_bot.analyze_image(temp_filename)
        
        # 3. Brain Reasoning (The Mind)
        logger.info("Generating clinical report...")
        clinical_report = brain_bot.generate_report(vision_results)

        # 4. Construct Response
        return {
            "analysis": vision_results,
            "report": clinical_report
        }

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)