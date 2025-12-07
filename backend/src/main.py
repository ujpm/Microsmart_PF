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

import logging
from typing import Dict, Any
from ultralytics import YOLO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VisionAgent:
    """
    Orchestrates the loading of the YOLO model and running inference on blood smears.
    """

    def __init__(self, model_path: str = "models/best.pt"):
        """
        Initializes the Vision Agent.
        """
        try:
            logger.info(f"Loading Vision Model from: {model_path}")
            self.model = YOLO(model_path)
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise

    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """
        Performs inference on a single image and calculates cell statistics.
        """
        logger.info(f"Running inference on: {image_path}")
        
        # Run inference 
        # conf=0.25 is a standard baseline for YOLOv8
        results = self.model.predict(image_path, conf=0.25, verbose=False)
        result = results[0]

        # Initialize counters
        counts = {
            "Red_Blood_Cell": 0,
            "Leukocyte": 0,
            "Ring": 0,
            "Trophozoite": 0,
            "Gametocyte": 0,
            "Schizont": 0
        }

        # Update counts based on detections
        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = self.model.names[class_id]
            
            if class_name in counts:
                counts[class_name] += 1
            else:
                counts[class_name] = counts.get(class_name, 0) + 1

        # --- FIX FOR DIVISION BY ZERO ---
        # If no RBCs are found, we assume 1 to prevent crash (parasitemia will be >100% effectively)
        total_rbc = max(counts["Red_Blood_Cell"], 1)
        
        total_parasites = (
            counts["Ring"] + 
            counts["Trophozoite"] + 
            counts["Gametocyte"] + 
            counts["Schizont"]
        )
        
        parasitemia = (total_parasites / total_rbc) * 100

        analysis_report = {
            "counts": counts,
            "parasitemia_pct": round(parasitemia, 2),
            "image_metadata": {
                "height": result.orig_shape[0],
                "width": result.orig_shape[1]
            }
        }

        logger.info(f"Analysis Complete: Parasitemia {parasitemia:.2f}% (RBCs: {counts['Red_Blood_Cell']})")
        return analysis_report