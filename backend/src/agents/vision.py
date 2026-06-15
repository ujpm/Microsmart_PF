import logging
import cv2
import os
import base64
import numpy as np
from typing import Dict, Any
from ultralytics import YOLO
from inference_sdk import InferenceHTTPClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VisionAgent:
    def __init__(self, local_model_path: str = "models/best.pt"):
        # 1. Initialize MicroSmart Local Model
        try:
            logger.info(f"Loading MicroSmart Model from: {local_model_path}")
            self.local_model = YOLO(local_model_path)
        except Exception as e:
            logger.error(f"Failed to load Local YOLO model: {e}")
            self.local_model = None

        # 2. Initialize Roboflow Cloud Model
        rf_api_key = os.getenv("ROBOFLOW_API_KEY")
        self.rf_client = None
        if rf_api_key:
            self.rf_client = InferenceHTTPClient(
                api_url="https://serverless.roboflow.com",
                api_key=rf_api_key
            )
            self.rf_model_id = "malaria_broadinstitute_diagmal/6"

    def analyze_image(self, image_path: str, engine: str = "local") -> Dict[str, Any]:
        """Routes traffic to ensure strict separation of logic."""
        if engine == "cloud" and self.rf_client:
            logger.info(f"Running ROBOFLOW ENGINE on: {image_path}")
            return self._run_cloud(image_path)
        else:
            logger.info(f"Running MICROSMART ENGINE on: {image_path}")
            return self._run_local(image_path)

    # ==========================================
    # ENGINE A: MICROSMART (EXACT CURRENT LOGIC)
    # ==========================================
    def _run_local(self, image_path: str) -> Dict[str, Any]:
        results = self.local_model.predict(image_path, conf=0.25, verbose=False)
        result = results[0] 

        counts = {
            "Red_Blood_Cell": 0, "Leukocyte": 0, 
            "Ring": 0, "Trophozoite": 0, "Gametocyte": 0, "Schizont": 0
        }
        boxes_to_draw = []

        for box in result.boxes:
            class_id = int(box.cls[0])
            raw_name = self.local_model.names[class_id].lower()
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

        annotated_bgr = result.orig_img.copy()
        for item in boxes_to_draw:
            x1, y1, x2, y2 = map(int, item["coords"])
            cv2.rectangle(annotated_bgr, (x1, y1), (x2, y2), item["color"], 3)
            font_scale = 0.8
            thickness = 2
            (w, h), _ = cv2.getTextSize(item["label"], cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
            cv2.rectangle(annotated_bgr, (x1, y1 - h - 12), (x1 + w, y1), item["color"], -1)
            cv2.putText(annotated_bgr, item["label"], (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 0), thickness)

        _, buffer = cv2.imencode('.jpg', annotated_bgr)
        annotated_b64 = base64.b64encode(buffer).decode('utf-8')

        total_parasites = sum([counts["Ring"], counts["Trophozoite"], counts["Gametocyte"], counts["Schizont"]])
        total_rbc = counts["Red_Blood_Cell"]

        parasitemia_str = "N/A"
        if total_rbc > total_parasites:
            parasitemia_str = f"{((total_parasites / (total_rbc + total_parasites)) * 100):.2f}%"

        return {
            "summary_headline": f"{total_parasites} Parasites Detected", 
            "total_parasites": total_parasites,
            "parasitemia_calculation": {"status": "Success" if parasitemia_str != "N/A" else "Insufficient RBCs", "value": parasitemia_str, "rbc_count": total_rbc},
            "detailed_counts": counts,
            "annotated_image": annotated_b64,
            "image_metadata": {"height": result.orig_shape[0], "width": result.orig_shape[1]}
        }

    # ==========================================
    # ENGINE B: ROBOFLOW CLOUD (DYNAMIC LOGIC)
    # ==========================================
    def _run_cloud(self, image_path: str) -> Dict[str, Any]:
        result = self.rf_client.infer(image_path, model_id=self.rf_model_id)
        orig_img = cv2.imread(image_path)
        
        counts = {}
        total_parasites = 0
        total_rbc = 0
        boxes_to_draw = []

        if "predictions" in result:
            for p in result["predictions"]:
                raw_name = p["class"]
                conf = p["confidence"]
                
                # Convert Center X/Y to X1/Y1
                x_c, y_c, w, h = p["x"], p["y"], p["width"], p["height"]
                x1, y1, x2, y2 = int(x_c - w/2), int(y_c - h/2), int(x_c + w/2), int(y_c + h/2)
                
                # Format to nice Title Case
                display_name = raw_name.replace("p-", "P. ").title()
                if raw_name.lower() in ["red blood cell", "rbc"]: display_name = "RBC"
                if raw_name.lower() in ["leukocyte", "wbc"]: display_name = "WBC"
                
                label_text = ""
                color = (150, 150, 150)
                raw_lower = raw_name.lower()

                if "rbc" in display_name:
                    total_rbc += 1
                    counts[display_name] = counts.get(display_name, 0) + 1
                elif "wbc" in display_name:
                    counts[display_name] = counts.get(display_name, 0) + 1
                    label_text, color = f"WBC {conf:.2f}", (255, 0, 255)
                elif "difficult" in raw_lower:
                    counts[display_name] = counts.get(display_name, 0) + 1
                    label_text, color = f"Difficult {conf:.2f}", (0, 165, 255) # Orange
                else:
                    total_parasites += 1
                    counts[display_name] = counts.get(display_name, 0) + 1
                    
                    # Dynamic Species Color Coding
                    if "falciparum" in raw_lower: color = (0, 255, 255)
                    elif "vivax" in raw_lower: color = (0, 255, 0)
                    elif "malariae" in raw_lower: color = (255, 100, 100)
                    elif "ovale" in raw_lower: color = (0, 100, 255)
                    else: color = (0, 255, 255)
                    
                    label_text = f"{display_name} {conf:.2f}"

                if label_text: 
                    boxes_to_draw.append({"coords": [x1, y1, x2, y2], "label": label_text, "color": color})

        annotated_bgr = orig_img.copy()
        for item in boxes_to_draw:
            x1, y1, x2, y2 = item["coords"]
            cv2.rectangle(annotated_bgr, (x1, y1), (x2, y2), item["color"], 3)
            (w, h), _ = cv2.getTextSize(item["label"], cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            cv2.rectangle(annotated_bgr, (x1, y1 - h - 12), (x1 + w, y1), item["color"], -1)
            cv2.putText(annotated_bgr, item["label"], (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)

        _, buffer = cv2.imencode('.jpg', annotated_bgr)
        annotated_b64 = base64.b64encode(buffer).decode('utf-8')
        parasitemia_str = f"{((total_parasites / (total_rbc + total_parasites)) * 100):.2f}%" if total_rbc > 0 else "N/A"

        return {
            "summary_headline": f"{total_parasites} Parasites Detected", 
            "total_parasites": total_parasites,
            "parasitemia_calculation": {"status": "Success" if parasitemia_str != "N/A" else "Insufficient RBCs", "value": parasitemia_str, "rbc_count": total_rbc},
            "detailed_counts": counts,
            "annotated_image": annotated_b64,
            "image_metadata": {"height": orig_img.shape[0], "width": orig_img.shape[1]}
        }