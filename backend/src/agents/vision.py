"""
MicroSmart PF - Vision Agent
----------------------------
This module handles the computer vision tasks for the malaria diagnosis system.
It utilizes a YOLOv8 model to detect and quantify malaria parasites and blood cells
in microscopic images.
"""

import logging
import base64
import cv2
import numpy as np
from typing import Dict, Any
from ultralytics import YOLO

# Configure logging to standard output
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VisionAgent:
    """
    Orchestrates the loading of the YOLO model and running inference on blood smears.
    """

    def __init__(self, model_path: str = "models/best.pt"):
        try:
            logger.info(f"Loading Vision Model from: {model_path}")
            self.model = YOLO(model_path)
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise

    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        logger.info(f"Running inference on: {image_path}")
        
        # SENSITIVITY FIX: Lowered confidence threshold from 0.4 to 0.15
        # This catches subtle parasites the model is less "certain" about.
        results = self.model.predict(image_path, conf=0.15, verbose=False)
        result = results[0] 

        # --- 1. Generate Annotated Image ---
        annotated_bgr = result.plot() 
        _, buffer = cv2.imencode('.jpg', annotated_bgr)
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        # --- 2. Count Cells (The Data) ---
        # Initialize counters
        counts = {
            "Red_Blood_Cell": 0,
            "Leukocyte": 0,
            "Ring": 0,
            "Trophozoite": 0,
            "Gametocyte": 0,
            "Schizont": 0
        }

        # LOGIC FIX: Map specific PF class names to category keys
        for box in result.boxes:
            class_id = int(box.cls[0])
            # Convert name to lowercase for safer matching
            raw_name = self.model.names[class_id].lower()
            
            if "rbc" in raw_name or "red_blood_cell" in raw_name:
                counts["Red_Blood_Cell"] += 1
            elif "leukocyte" in raw_name or "wbc" in raw_name:
                counts["Leukocyte"] += 1
            elif "ring" in raw_name:
                counts["Ring"] += 1
            elif "trophozoite" in raw_name:
                counts["Trophozoite"] += 1
            elif "gametocyte" in raw_name:
                counts["Gametocyte"] += 1
            elif "schizont" in raw_name:
                counts["Schizont"] += 1

        # --- 3. Calculate Parasitemia ---
        rbc_count = counts["Red_Blood_Cell"]
        total_rbc = rbc_count if rbc_count > 0 else 1 

        # Now this math will actually find the PF parasites detected above
        total_parasites = counts["Ring"] + counts["Trophozoite"] + counts["Gametocyte"] + counts["Schizont"]
        parasitemia = (total_parasites / total_rbc) * 100

        analysis_report = {
            "counts": counts,
            "parasitemia_pct": round(parasitemia, 4), # Higher precision for low-density cases
            "annotated_image": img_base64,
            "image_metadata": {
                "height": result.orig_shape[0],
                "width": result.orig_shape[1]
            }
        }

        logger.info(f"Analysis Complete: {total_parasites} parasites found. Parasitemia {parasitemia:.4f}%")
        return analysis_report