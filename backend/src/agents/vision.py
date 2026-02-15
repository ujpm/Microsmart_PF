"""
MicroSmart PF - Vision Agent
----------------------------
This module handles the computer vision tasks for the malaria diagnosis system.
It utilizes a YOLOv8 model to detect and quantify malaria parasites and blood cells
in microscopic images.
"""

import logging
import cv2
import os
import numpy as np
from typing import Dict, Any
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VisionAgent:
    def __init__(self, model_path: str = "models/best.pt"):
        try:
            logger.info(f"Loading Vision Model from: {model_path}")
            self.model = YOLO(model_path)
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise

    # UPDATED: Now accepts file_id to name the output file
    def analyze_image(self, image_path: str, file_id: str) -> Dict[str, Any]:
        logger.info(f"Running inference on: {image_path}")
        
        results = self.model.predict(image_path, conf=0.25, verbose=False)
        result = results[0] 

        counts = {
            "Red_Blood_Cell": 0, "Leukocyte": 0, 
            "Ring": 0, "Trophozoite": 0, "Gametocyte": 0, "Schizont": 0
        }
        boxes_to_draw = []

        for box in result.boxes:
            class_id = int(box.cls[0])
            raw_name = self.model.names[class_id].lower()
            conf = float(box.conf[0])
            
            label_text = ""
            color = (150, 150, 150)
            is_parasite = False

            if "rbc" in raw_name or "red_blood_cell" in raw_name:
                counts["Red_Blood_Cell"] += 1
            elif "leukocyte" in raw_name or "wbc" in raw_name:
                counts["Leukocyte"] += 1
                label_text = "WBC"
                color = (255, 0, 255)
            else:
                is_parasite = True
                color = (0, 255, 255)
                stage_code = "Pf?"
                if "ring" in raw_name: 
                    counts["Ring"] += 1
                    stage_code = "PfR"
                elif "trophozoite" in raw_name: 
                    counts["Trophozoite"] += 1
                    stage_code = "PfT"
                elif "gametocyte" in raw_name: 
                    counts["Gametocyte"] += 1
                    stage_code = "PfG"
                elif "schizont" in raw_name: 
                    counts["Schizont"] += 1
                    stage_code = "PfS"
                elif "vivax" in raw_name or "falciparum" in raw_name:
                    counts["Trophozoite"] += 1
                    stage_code = "PfT"

                label_text = f"{stage_code} {conf:.2f}"

            if label_text: 
                boxes_to_draw.append({
                    "coords": box.xyxy[0],
                    "label": label_text,
                    "color": color,
                    "is_parasite": is_parasite
                })

        # Draw
        annotated_bgr = result.orig_img.copy()
        for item in boxes_to_draw:
            x1, y1, x2, y2 = map(int, item["coords"])
            cv2.rectangle(annotated_bgr, (x1, y1), (x2, y2), item["color"], 2)
            (w, h), _ = cv2.getTextSize(item["label"], cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
            cv2.rectangle(annotated_bgr, (x1, y1 - 15), (x1 + w, y1), item["color"], -1)
            cv2.putText(annotated_bgr, item["label"], (x1, y1 - 4), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1)

        # --- SAVE TO DISK ---
        # Clean filename to avoid issues
        clean_id = os.path.basename(file_id)
        output_filename = f"annotated_{clean_id}"
        save_path = os.path.join("static/results", output_filename)
        
        cv2.imwrite(save_path, annotated_bgr)
        
        # Return Relative URL
        image_url = f"/static/results/{output_filename}"
        # ---------------------

        total_parasites = sum([counts["Ring"], counts["Trophozoite"], counts["Gametocyte"], counts["Schizont"]])
        total_rbc = counts["Red_Blood_Cell"]

        parasitemia_str = "N/A"
        if total_rbc > total_parasites:
            p_val = (total_parasites / (total_rbc + total_parasites)) * 100
            parasitemia_str = f"{p_val:.2f}%"

        return {
            "summary_headline": f"{total_parasites} Parasites Detected", 
            "total_parasites": total_parasites,
            "parasitemia_calculation": {
                "status": "Success" if parasitemia_str != "N/A" else "Insufficient RBCs",
                "value": parasitemia_str,
                "rbc_count": total_rbc
            },
            "detailed_counts": counts,
            "annotated_image": image_url, # URL sent to frontend
            "image_metadata": {
                "height": result.orig_shape[0],
                "width": result.orig_shape[1]
            }
        }