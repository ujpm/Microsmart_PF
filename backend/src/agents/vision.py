import cv2
import base64
import numpy as np
from roboflow import Roboflow
from ultralytics import YOLO
import logging
from typing import Dict, List
from src.config import ROBOFLOW_API_KEY, DISEASE_REGISTRY

logger = logging.getLogger(__name__)

class VisionAgent:
    def __init__(self):
        self.rf_api_key = ROBOFLOW_API_KEY
        self._local_models = {}

    def _get_local_model(self, sample_type: str) -> YOLO:
        sample_type = sample_type.upper()
        if sample_type not in DISEASE_REGISTRY:
             raise ValueError(f"Unknown sample type: {sample_type}")
             
        if sample_type not in self._local_models:
            model_path = DISEASE_REGISTRY[sample_type]["models"]["local"]
            logger.info(f"Loading YOLO weights from: {model_path}")
            try:
                self._local_models[sample_type] = YOLO(model_path)
            except Exception as e:
                logger.error(f"Failed to load local model {model_path}: {e}")
                raise RuntimeError(f"Local AI Model for {sample_type} is missing.")
        return self._local_models[sample_type]

    def _get_color_by_name(self, class_name: str, sample_type: str) -> str:
        registry = DISEASE_REGISTRY[sample_type.upper()]
        return registry.get("colors", {}).get(class_name.lower(), registry["default_color"])

    def analyze_image(self, image_path: str, engine: str = "local", sample_type: str = "MALARIA") -> Dict:
        sample_type = sample_type.upper()
        if sample_type not in DISEASE_REGISTRY:
             raise ValueError(f"Unsupported diagnostic module: {sample_type}")

        if engine == "cloud":
            return self._run_cloud(image_path, sample_type)
        return self._run_local(image_path, sample_type)

    def _run_local(self, image_path: str, sample_type: str) -> Dict:
        model = self._get_local_model(sample_type)
        results = model(image_path)[0]
        
        predictions = []
        for box in results.boxes:
            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            w = x2 - x1
            h = y2 - y1
            
            # Extract the exact string name directly from the YOLO model
            class_name = model.names[class_id]
            
            predictions.append({
                "x": x1 + (w / 2),
                "y": y1 + (h / 2),
                "width": w,
                "height": h,
                "confidence": confidence,
                "class": class_name,
                "class_id": class_id,
                "color": self._get_color_by_name(class_name, sample_type)
            })

        return self._build_payload(image_path, predictions, sample_type)

    def _run_cloud(self, image_path: str, sample_type: str) -> Dict:
        if not self.rf_api_key:
             raise ValueError("Roboflow API Key missing.")
        rf = Roboflow(api_key=self.rf_api_key)
        cloud_config = DISEASE_REGISTRY[sample_type]["models"]
        project = rf.workspace().project(cloud_config["cloud_workspace"])
        model = project.version(cloud_config["cloud_version"]).model
        result = model.predict(image_path, confidence=40, overlap=30).json()
        
        predictions = []
        for pred in result.get("predictions", []):
            class_name = pred["class"]
            predictions.append({
                "x": pred["x"], "y": pred["y"], "width": pred["width"], "height": pred["height"],
                "confidence": pred["confidence"], "class": class_name,
                "class_id": 0, "color": self._get_color_by_name(class_name, sample_type)
            })
        return self._build_payload(image_path, predictions, sample_type)

    def _build_payload(self, image_path: str, predictions: List[Dict], sample_type: str) -> Dict:
        img = cv2.imread(image_path)
        if img is None: raise ValueError(f"Could not read image at {image_path}")
        annotated_img = img.copy()

        # 1. PARASITEMIA MATH ENGINE (Upgraded for String Names)
        summary_stats = {"total_objects_detected": len(predictions)}
        
        if sample_type == "MALARIA":
            rbc_uninfected_count = sum(1 for p in predictions if p["class"].lower() == "red blood cell")
            wbc_count = sum(1 for p in predictions if p["class"].lower() == "leukocyte")
            
            # Identify all parasites dynamically (starts with "p-")
            parasite_preds = [p for p in predictions if p["class"].lower().startswith("p-")]
            parasite_count = len(parasite_preds)
            
            # Species Breakdown
            pf_count = sum(1 for p in parasite_preds if p["class"].lower().startswith("p-falciparum"))
            pv_count = sum(1 for p in parasite_preds if p["class"].lower().startswith("p-vivax"))
            pm_count = sum(1 for p in parasite_preds if p["class"].lower().startswith("p-malariae"))
            po_count = sum(1 for p in parasite_preds if p["class"].lower().startswith("p-ovale"))

            # WHO formula: (Infected Cells / Total RBCs) * 100
            total_rbcs = rbc_uninfected_count + parasite_count 
            parasitemia_pct = (parasite_count / total_rbcs * 100) if total_rbcs > 0 else 0.0
            
            summary_stats.update({
                "uninfected_rbc_count": rbc_uninfected_count,
                "wbc_count": wbc_count,
                "total_parasite_count": parasite_count,
                "species_breakdown": {
                    "p_falciparum": pf_count,
                    "p_vivax": pv_count,
                    "p_malariae": pm_count,
                    "p_ovale": po_count
                },
                "estimated_parasitemia_percent": round(parasitemia_pct, 4)
            })

        # 2. DRAW BOXES
        for pred in predictions:
            x_center, y_center, w, h = pred["x"], pred["y"], pred["width"], pred["height"]
            x1, y1 = int(x_center - w/2), int(y_center - h/2)
            x2, y2 = int(x_center + w/2), int(y_center + h/2)
            
            hex_color = pred["color"].lstrip('#')
            bgr_color = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))[::-1]
            
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), bgr_color, 2)
            cv2.putText(annotated_img, f'{pred["class"]} {pred["confidence"]:.2f}', 
                        (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, bgr_color, 2)

        _, buffer = cv2.imencode('.jpg', annotated_img)
        base64_img = base64.b64encode(buffer).decode('utf-8')

        return {
            "summary_statistics": summary_stats,
            "predictions": predictions,
            "annotated_image": f"data:image/jpeg;base64,{base64_img}",
            "diagnostic_context": sample_type
        }