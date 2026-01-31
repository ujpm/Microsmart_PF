"""
MicroSmart PF - Vision Agent
----------------------------
This module handles the computer vision tasks for the malaria diagnosis system.
It utilizes a YOLOv8 model to detect and quantify malaria parasites and blood cells
in microscopic images.
"""

import logging
import cv2
import numpy as np
from ultralytics import YOLO
from src import config  # Import central config

logger = logging.getLogger(__name__)

class VisionAgent:
    def __init__(self, model_path: str = "models/best.pt"):
        self.model = YOLO(model_path)

    def analyze_image(self, image_path: str, file_id: str):
        # 1. Inference
        results = self.model.predict(image_path, conf=0.15, verbose=False)
        result = results[0]
        
        # 2. Dynamic Font Scaling Logic
        h, w = result.orig_shape[:2]
        # Calculate scale: 1500px -> 0.5, 3000px -> 1.0
        font_scale = max(w, h) / config.BASE_IMAGE_SIZE * config.BASE_FONT_SCALE
        font_scale = max(font_scale, 0.4) # Never go below 0.4
        thickness = max(1, int(font_scale * 2))
        font_scale = font_scale * 2.5 
        thickness = max(1, int(font_scale * 2))

        # 3. Process Detections
        counts = {
            "Red_Blood_Cell": 0, "Leukocyte": 0, 
            "Ring": 0, "Trophozoite": 0, "Gametocyte": 0, "Schizont": 0
        }
        
        annotated_img = result.orig_img.copy()

        for box in result.boxes:
            class_id = int(box.cls[0])
            name = self.model.names[class_id].lower()
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # Label Logic
            label = ""
            color = (100, 100, 100)

            if "rbc" in name or "red_blood" in name:
                counts["Red_Blood_Cell"] += 1
                # RBCs: No bounding box to keep image clean
            
            elif "leukocyte" in name or "wbc" in name:
                counts["Leukocyte"] += 1
                color = (255, 0, 255) # Magenta
                label = "WBC"
            
            else:
                # Parasites (Cyan)
                color = (0, 255, 255)
                code = "Pf?"
                if "ring" in name: 
                    counts["Ring"] += 1; code = "PfR"
                elif "trophozoite" in name: 
                    counts["Trophozoite"] += 1; code = "PfT"
                elif "gametocyte" in name: 
                    counts["Gametocyte"] += 1; code = "PfG"
                elif "schizont" in name: 
                    counts["Schizont"] += 1; code = "PfS"
                elif "vivax" in name or "falciparum" in name:
                    counts["Trophozoite"] += 1; code = "PfT" # The Patch
                
                label = f"{code} {conf:.2f}"

            # Draw (if label exists)
            if label:
                cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, thickness)
                (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
                cv2.rectangle(annotated_img, (x1, y1 - th - 5), (x1 + tw, y1), color, -1)
                cv2.putText(annotated_img, label, (x1, y1 - 4), 
                           cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 0), thickness)

        # 4. Save Image to Static Disk (The Good Solution)
        filename = f"analyzed_{file_id}.jpg"
        output_path = config.RESULTS_DIR / filename
        cv2.imwrite(str(output_path), annotated_img)

        # 5. Parasitemia Math (The Safety Floor)
        total_p = counts["Ring"] + counts["Trophozoite"] + counts["Gametocyte"] + counts["Schizont"]
        detected_rbc = counts["Red_Blood_Cell"]
        
        # Use the MAX of detected RBCs or the Safety Floor (150)
        effective_rbc = max(detected_rbc, config.MIN_RBC_PER_FIELD)
        
        parasitemia_str = "N/A"
        if effective_rbc > 0:
            # Standard Formula: P / RBC * 100
            val = (total_p / effective_rbc) * 100
            parasitemia_str = f"{val:.2f}%"

        return {
            "summary_headline": f"{total_p} Parasites Detected",
            "total_parasites": total_p,
            "parasitemia_calculation": {
                "value": parasitemia_str,
                "rbc_used": effective_rbc,
                "note": "Used Safety Floor" if detected_rbc < config.MIN_RBC_PER_FIELD else "Actual Count"
            },
            "detailed_counts": counts,
            "image_url": f"/static/results/{filename}" # Returning URL now!
        }