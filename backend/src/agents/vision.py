import cv2
import base64
import numpy as np
from roboflow import Roboflow
from ultralytics import YOLO
import logging
from typing import Dict, List, Optional
from src.config import ROBOFLOW_API_KEY, DISEASE_REGISTRY

logger = logging.getLogger(__name__)

class VisionAgent:
    def __init__(self):
        """
        Initializes the agent with an empty model cache.
        Models are lazy-loaded only when requested to save RAM.
        """
        self.rf_api_key = ROBOFLOW_API_KEY
        self._local_models = {} # Cache dictionary for YOLO models

    def _get_local_model(self, sample_type: str) -> YOLO:
        """Lazy-loads and caches the correct YOLO model based on context."""
        sample_type = sample_type.upper()
        if sample_type not in DISEASE_REGISTRY:
             raise ValueError(f"Unknown sample type: {sample_type}")
             
        if sample_type not in self._local_models:
            model_path = DISEASE_REGISTRY[sample_type]["models"]["local"]
            logger.info(f"Loading YOLO weights into memory from: {model_path}")
            try:
                self._local_models[sample_type] = YOLO(model_path)
            except Exception as e:
                logger.error(f"Failed to load local model {model_path}: {e}")
                raise RuntimeError(f"Local AI Model for {sample_type} is missing or corrupted.")
                
        return self._local_models[sample_type]

    def _get_color(self, class_id: int, sample_type: str) -> str:
        registry = DISEASE_REGISTRY[sample_type.upper()]
        return registry["classes"].get(class_id, {}).get("color", registry["default_color"])

    def _format_label(self, class_id: int, sample_type: str) -> str:
         registry = DISEASE_REGISTRY[sample_type.upper()]
         return registry["classes"].get(class_id, {}).get("label", f"Unknown Class {class_id}")

    def analyze_image(self, image_path: str, engine: str = "local", sample_type: str = "MALARIA") -> Dict:
        """
        Routes the image analysis to either the local YOLO or cloud Roboflow engine
        based on the dynamically requested sample_type.
        """
        sample_type = sample_type.upper()
        if sample_type not in DISEASE_REGISTRY:
             raise ValueError(f"Unsupported diagnostic module: {sample_type}")

        logger.info(f"Starting vision analysis using {engine} engine for {sample_type}")
        
        if engine == "cloud":
            return self._run_cloud(image_path, sample_type)
        return self._run_local(image_path, sample_type)

    def _run_local(self, image_path: str, sample_type: str) -> Dict:
        model = self._get_local_model(sample_type)
        results = model(image_path)[0]
        
        # We must manually extract and format the predictions from Ultralytics
        predictions = []
        for box in results.boxes:
            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            width = x2 - x1
            height = y2 - y1
            x_center = x1 + (width / 2)
            y_center = y1 + (height / 2)

            pred = {
                "x": x_center,
                "y": y_center,
                "width": width,
                "height": height,
                "confidence": confidence,
                "class": self._format_label(class_id, sample_type),
                "class_id": class_id,
                "color": self._get_color(class_id, sample_type)
            }
            predictions.append(pred)

        return self._build_payload(image_path, predictions, sample_type)

    def _run_cloud(self, image_path: str, sample_type: str) -> Dict:
        if not self.rf_api_key:
             raise ValueError("Roboflow API Key is not configured for cloud engine.")

        try:
            from roboflow import Roboflow
        except ImportError as e:
            raise RuntimeError(
                "Roboflow support is not installed. Install 'roboflow' or use the local engine instead."
            ) from e

        rf = Roboflow(api_key=self.rf_api_key)
        
        # Dynamically fetch the correct cloud workspace
        cloud_config = DISEASE_REGISTRY[sample_type]["models"]
        project = rf.workspace().project(cloud_config["cloud_workspace"])
        model = project.version(cloud_config["cloud_version"]).model
        
        # Roboflow returns its own prediction format
        result = model.predict(image_path, confidence=40, overlap=30).json()
        
        # Normalize the Roboflow output to match our standard format
        predictions = []
        for pred in result.get("predictions", []):
            # Roboflow returns string classes, we map them back to IDs if possible, or just use 0
            class_id = 0 # Fallback
            # Simple matching logic to find the ID
            for c_id, metadata in DISEASE_REGISTRY[sample_type]["classes"].items():
                if metadata["label"].lower() in pred["class"].lower():
                    class_id = c_id
                    break
                    
            normalized_pred = {
                "x": pred["x"],
                "y": pred["y"],
                "width": pred["width"],
                "height": pred["height"],
                "confidence": pred["confidence"],
                "class": pred["class"],
                "class_id": class_id,
                "color": self._get_color(class_id, sample_type)
            }
            predictions.append(normalized_pred)

        return self._build_payload(image_path, predictions, sample_type)

    def _build_payload(self, image_path: str, predictions: List[Dict], sample_type: str) -> Dict:
        """Draws the dynamic bounding boxes and packages the JSON."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image at {image_path}")
            
        annotated_img = img.copy()

        # Draw boxes dynamically
        for pred in predictions:
            x_center = pred["x"]
            y_center = pred["y"]
            w = pred["width"]
            h = pred["height"]
            
            x1 = int(x_center - w/2)
            y1 = int(y_center - h/2)
            x2 = int(x_center + w/2)
            y2 = int(y_center + h/2)
            
            # Convert hex to BGR for OpenCV
            hex_color = pred["color"].lstrip('#')
            rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            bgr_color = (rgb[2], rgb[1], rgb[0])
            
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), bgr_color, 2)
            cv2.putText(annotated_img, f'{pred["class"]} {pred["confidence"]:.2f}', 
                        (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, bgr_color, 2)

        # Convert to Base64 for the frontend
        _, buffer = cv2.imencode('.jpg', annotated_img)
        base64_img = base64.b64encode(buffer).decode('utf-8')

        return {
            "predictions": predictions,
            "annotated_image": f"data:image/jpeg;base64,{base64_img}",
            "diagnostic_context": sample_type
        }
