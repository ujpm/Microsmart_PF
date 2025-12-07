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
        """
        Initializes the Vision Agent.

        Args:
            model_path (str): Path to the trained YOLOv8 weights (.pt file).
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
        Returns a structured report and a Base64 encoded annotated image.
        """
        logger.info(f"Running inference on: {image_path}")
        
        # Run inference with a confidence threshold suitable for medical screening
        results = self.model.predict(image_path, conf=0.4, verbose=False)
        result = results[0] # Process the first image

        # --- 1. Generate Annotated Image (The Visuals) ---
        # Plot the detections (draws boxes on the image)
        annotated_bgr = result.plot() 
        # Convert BGR (OpenCV default) to RGB for web display
        annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)
        # Encode to JPEG in memory
        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(annotated_rgb, cv2.COLOR_RGB2BGR))
        # Convert to Base64 string for the frontend
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        # --- 2. Count Cells (The Data) ---
        # Initialize counters for all known classes
        counts = {
            "Red_Blood_Cell": 0,
            "Leukocyte": 0,
            "Ring": 0,
            "Trophozoite": 0,
            "Gametocyte": 0,
            "Schizont": 0
        }

        # Iterate through detections and update counts
        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = self.model.names[class_id]
            
            if class_name in counts:
                counts[class_name] += 1
            else:
                counts[class_name] = counts.get(class_name, 0) + 1

        # --- 3. Calculate Parasitemia (The Math) ---
        # FIX: Explicitly handle the 0 case. 
        # .get() fails here because the key exists but is 0.
        rbc_count = counts["Red_Blood_Cell"]
        total_rbc = rbc_count if rbc_count > 0 else 1 

        total_parasites = counts["Ring"] + counts["Trophozoite"] + counts["Gametocyte"] + counts["Schizont"]
        parasitemia = (total_parasites / total_rbc) * 100

        analysis_report = {
            "counts": counts,
            "parasitemia_pct": round(parasitemia, 2),
            "annotated_image": img_base64,  # Return the visualized scan
            "image_metadata": {
                "height": result.orig_shape[0],
                "width": result.orig_shape[1]
            }
        }

        logger.info(f"Analysis Complete: Parasitemia {parasitemia:.2f}%")
        return analysis_report