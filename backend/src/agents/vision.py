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
        
        # 1. Run Inference
        # Increased confidence slightly to reduce pure noise, but kept low enough for sensitivity
        results = self.model.predict(image_path, conf=0.20, verbose=False)
        result = results[0] 

        # --- 2. Calculate Counts (Data Logic) ---
        counts = {
            "Red_Blood_Cell": 0,
            "Leukocyte": 0,
            "Ring": 0,
            "Trophozoite": 0,
            "Gametocyte": 0,
            "Schizont": 0
        }

        # We need to collect box data to draw them manually later
        boxes_to_draw = []

        for box in result.boxes:
            class_id = int(box.cls[0])
            raw_name = self.model.names[class_id].lower()
            conf = float(box.conf[0])
            
            # Label Overrides
            final_label = raw_name
            is_parasite = False

            if "rbc" in raw_name or "red_blood_cell" in raw_name:
                counts["Red_Blood_Cell"] += 1
                final_label = "RBC"
            
            elif "leukocyte" in raw_name or "wbc" in raw_name:
                counts["Leukocyte"] += 1
                final_label = "WBC"

            # --- THE FIX: RELABELING LOGIC ---
            elif "vivax" in raw_name:
                # Force "vivax" detections to count as PF Trophozoites
                counts["Trophozoite"] += 1
                final_label = f"P. falciparum Trophozoite {conf:.2f}"
                is_parasite = True
                
            elif "trophozoite" in raw_name:
                counts["Trophozoite"] += 1
                final_label = f"P. falciparum Trophozoite {conf:.2f}"
                is_parasite = True

            elif "ring" in raw_name:
                counts["Ring"] += 1
                final_label = f"P. falciparum Ring {conf:.2f}"
                is_parasite = True

            elif "gametocyte" in raw_name:
                counts["Gametocyte"] += 1
                final_label = f"P. falciparum Gametocyte {conf:.2f}"
                is_parasite = True

            elif "schizont" in raw_name:
                counts["Schizont"] += 1
                final_label = f"P. falciparum Schizont {conf:.2f}"
                is_parasite = True
            
            # Save for drawing
            boxes_to_draw.append({
                "coords": box.xyxy[0],
                "label": final_label,
                "is_parasite": is_parasite
            })

        # --- 3. Generate Annotated Image (Visual Logic) ---
        # We draw manually on the original image instead of using result.plot()
        annotated_bgr = result.orig_img.copy()

        for item in boxes_to_draw:
            x1, y1, x2, y2 = map(int, item["coords"])
            label = item["label"]
            
            # Color coding: Cyan for Parasites, Gray for Cells
            color = (255, 255, 0) if item["is_parasite"] else (150, 150, 150)
            thickness = 2 if item["is_parasite"] else 1
            
            # Don't draw box for RBCs to keep image clean (optional, currently drawing)
            # If you want to hide RBC boxes, uncomment the next line:
            # if label == "RBC": continue 

            cv2.rectangle(annotated_bgr, (x1, y1), (x2, y2), color, thickness)
            
            # Draw Label Background
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(annotated_bgr, (x1, y1 - 20), (x1 + w, y1), color, -1)
            
            # Draw Label Text
            text_color = (0, 0, 0) # Black text
            cv2.putText(annotated_bgr, label, (x1, y1 - 5), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 1)

        _, buffer = cv2.imencode('.jpg', annotated_bgr)
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        # --- 4. Calculate Parasitemia ---
        rbc_count = counts["Red_Blood_Cell"]
        total_rbc = rbc_count if rbc_count > 0 else 1 

        total_parasites = counts["Ring"] + counts["Trophozoite"] + counts["Gametocyte"] + counts["Schizont"]
        parasitemia = (total_parasites / total_rbc) * 100

        analysis_report = {
            "counts": counts,
            "parasitemia_pct": round(parasitemia, 4),
            "annotated_image": img_base64,
            "image_metadata": {
                "height": result.orig_shape[0],
                "width": result.orig_shape[1]
            }
        }

        logger.info(f"Analysis Complete: {total_parasites} parasites found. Parasitemia {parasitemia:.4f}%")
        return analysis_report