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
from typing import Dict, Any, List
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
        """
        Runs YOLOv8 inference on the provided image and returns a structured report.
        Includes logic to map all parasites to P. falciparum (Pf) codes for the Beta version.
        """
        logger.info(f"Running inference on: {image_path}")
        
        # 1. Run Inference
        # conf=0.25 is set to reduce noise while keeping sensitivity high
        results = self.model.predict(image_path, conf=0.25, verbose=False)
        result = results[0] 

        # --- 2. Data Collection (Counts & Labels) ---
        counts = {
            "Red_Blood_Cell": 0, 
            "Leukocyte": 0, 
            "Ring": 0, 
            "Trophozoite": 0, 
            "Gametocyte": 0, 
            "Schizont": 0
        }

        boxes_to_draw = []

        for box in result.boxes:
            class_id = int(box.cls[0])
            raw_name = self.model.names[class_id].lower()
            conf = float(box.conf[0])
            
            # --- LABEL LOGIC: Short Codes (PfR, PfT, PfG, PfS) ---
            label_text = ""
            color = (150, 150, 150) # Default Gray for background objects
            is_parasite = False

            # A. Cells (Background)
            if "rbc" in raw_name or "red_blood_cell" in raw_name:
                counts["Red_Blood_Cell"] += 1
                # We intentionally do NOT label RBCs to keep the image clean
            
            elif "leukocyte" in raw_name or "wbc" in raw_name:
                counts["Leukocyte"] += 1
                label_text = "WBC"
                color = (255, 0, 255) # Magenta for WBCs

            # B. Parasites (The "Pf" Patch)
            # Logic: Map everything to P. falciparum short codes for this version
            else:
                is_parasite = True
                color = (0, 255, 255) # Cyan for Parasites
                
                stage_code = "Pf?" # Default fallback
                
                if "ring" in raw_name: 
                    counts["Ring"] += 1
                    stage_code = "PfR" # Ring
                elif "trophozoite" in raw_name: 
                    counts["Trophozoite"] += 1
                    stage_code = "PfT" # Trophozoite
                elif "gametocyte" in raw_name: 
                    counts["Gametocyte"] += 1
                    stage_code = "PfG" # Gametocyte
                elif "schizont" in raw_name: 
                    counts["Schizont"] += 1
                    stage_code = "PfS" # Schizont
                
                # Handling "Vivax" or generic labels by forcing them to Pf Trophs
                # This fixes the "Vivax Over-detection" issue temporarily
                elif "vivax" in raw_name or "falciparum" in raw_name:
                    counts["Trophozoite"] += 1
                    stage_code = "PfT"

                # FINAL LABEL FORMAT: "PfT 0.85"
                label_text = f"{stage_code} {conf:.2f}"

            # Save valid boxes for the drawing phase
            if label_text: 
                boxes_to_draw.append({
                    "coords": box.xyxy[0],
                    "label": label_text,
                    "color": color,
                    "is_parasite": is_parasite
                })

        # --- 3. Draw Clean Image ---
        # We work on a copy of the original image
        annotated_bgr = result.orig_img.copy()

        for item in boxes_to_draw:
            x1, y1, x2, y2 = map(int, item["coords"])
            
            # Draw Bounding Box
            cv2.rectangle(annotated_bgr, (x1, y1), (x2, y2), item["color"], 2)
            
            # Draw Label Background (Small and tight for readability)
            # Scale font size slightly based on image width if needed, but 0.4 is usually good
            (w, h), _ = cv2.getTextSize(item["label"], cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
            cv2.rectangle(annotated_bgr, (x1, y1 - 15), (x1 + w, y1), item["color"], -1)
            
            # Draw Label Text
            cv2.putText(annotated_bgr, item["label"], (x1, y1 - 4), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)

        # Encode image to Base64 for the frontend
        _, buffer = cv2.imencode('.jpg', annotated_bgr)
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        # --- 4. The Report Logic (Parasitemia Calculation) ---
        total_parasites = counts["Ring"] + counts["Trophozoite"] + counts["Gametocyte"] + counts["Schizont"]
        total_rbc = counts["Red_Blood_Cell"]

        # Calculation Logic: Avoids "3100%" errors if RBC count is low
        parasitemia_str = "N/A"
        if total_rbc > total_parasites:
             # Formula: (Parasites / (RBCs + Parasites)) * 100
             # We add parasites to denominator to approximate total cell count better
            p_val = (total_parasites / (total_rbc + total_parasites)) * 100
            parasitemia_str = f"{p_val:.2f}%"

        # Construct the final JSON response
        analysis_report = {
            "summary_headline": f"{total_parasites} Parasites Detected", 
            "total_parasites": total_parasites,
            "parasitemia_calculation": {
                "status": "Success" if parasitemia_str != "N/A" else "Insufficient RBCs",
                "value": parasitemia_str,
                "rbc_count": total_rbc
            },
            "detailed_counts": counts,
            "annotated_image": img_base64,
            "image_metadata": {
                "height": result.orig_shape[0],
                "width": result.orig_shape[1]
            }
        }

        logger.info(f"Report: {analysis_report['summary_headline']} | Parasitemia: {parasitemia_str}")
        return analysis_report