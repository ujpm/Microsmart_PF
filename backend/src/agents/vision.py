import logging
import cv2
import os
import base64
import requests
from typing import Dict, Any, List
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VisionAgent:
    def __init__(self, local_model_path: str = "models/best.pt"):
        try:
            logger.info(f"Loading MicroSmart Model from: {local_model_path}")
            self.local_model = YOLO(local_model_path)
        except Exception as e:
            logger.error(f"Failed to load Local YOLO model: {e}")
            self.local_model = None

        self.rf_api_key = os.getenv("ROBOFLOW_API_KEY")
        self.rf_model_id = os.getenv("ROBOFLOW_MODEL_ID", "malaria_broadinstitute_diagmal/6")
        if not self.rf_api_key:
            logger.warning("ROBOFLOW_API_KEY missing from .env")

    def analyze_image(self, image_path: str, engine: str = "local") -> Dict[str, Any]:
        """Routes traffic to the requested engine, with automatic network fallback."""
        if engine == "cloud" and self.rf_api_key:
            logger.info(f"Attempting CLOUD ENGINE on: {image_path}")
            try:
                return self._run_cloud(image_path)
            except Exception as e:
                logger.error(f"Cloud Engine failed ({e}), falling back to EDGE ENGINE.")
                return self._run_local(image_path)
        else:
            logger.info(f"Running EDGE ENGINE on: {image_path}")
            return self._run_local(image_path)

    # --- SHARED HELPERS (Preventing God Component) ---
    def _format_label(self, raw_name: str) -> str:
        """Unifies taxonomy across both engines."""
        display_name = raw_name.replace("p-", "P. ").title()
        if raw_name.lower() in ["red blood cell", "rbc"]: return "RBC"
        if raw_name.lower() in ["leukocyte", "wbc"]: return "WBC"
        return display_name

    def _get_color(self, label: str):
        """Generates bounding box colors based on standard taxonomy."""
        lower = label.lower()
        if "wbc" in lower: return (255, 0, 255)
        if "rbc" in lower: return (150, 150, 150)
        if "difficult" in lower: return (0, 165, 255)
        if "falciparum" in lower: return (0, 255, 255)
        if "vivax" in lower: return (0, 255, 0)
        if "malariae" in lower: return (255, 100, 100)
        if "ovale" in lower: return (0, 100, 255)
        return (0, 255, 255) # Default parasite

    def _draw_annotations(self, image, boxes_to_draw: List[Dict]) -> str:
        """Handles OpenCV drawing logic outside of the core ML inference."""
        annotated_bgr = image.copy()
        for item in boxes_to_draw:
            x1, y1, x2, y2 = item["coords"]
            color = item["color"]
            label = item["label"]
            
            cv2.rectangle(annotated_bgr, (x1, y1), (x2, y2), color, 3)
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(annotated_bgr, (x1, y1 - h - 12), (x1 + w, y1), color, -1)
            cv2.putText(annotated_bgr, label, (x1, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

        _, buffer = cv2.imencode('.jpg', annotated_bgr)
        return base64.b64encode(buffer).decode('utf-8')

    # ==========================================
    # ENGINE A: EDGE
    # ==========================================
    def _run_local(self, image_path: str) -> Dict[str, Any]:
        results = self.local_model.predict(image_path, conf=0.25, verbose=False)
        result = results[0] 

        counts = {}
        total_parasites = 0
        total_rbc = 0
        boxes_to_draw = []

        for box in result.boxes:
            class_id = int(box.cls[0])
            raw_name = self.local_model.names[class_id]
            conf = float(box.conf[0])
            
            display_name = self._format_label(raw_name)
            color = self._get_color(display_name)
            label_text = ""

            if display_name == "RBC":
                total_rbc += 1
                counts["RBC"] = counts.get("RBC", 0) + 1
            elif display_name == "WBC":
                counts["WBC"] = counts.get("WBC", 0) + 1
                label_text = f"WBC {conf:.2f}"
            elif "Difficult" in display_name:
                counts["Difficult"] = counts.get("Difficult", 0) + 1
                label_text = f"Difficult {conf:.2f}"
            else:
                total_parasites += 1
                # ACCURATE LOGGING: No more guessing or forcing to PfT
                counts[display_name] = counts.get(display_name, 0) + 1
                label_text = f"{display_name} {conf:.2f}"

            if label_text: 
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                boxes_to_draw.append({"coords": [x1, y1, x2, y2], "label": label_text, "color": color})

        annotated_b64 = self._draw_annotations(result.orig_img, boxes_to_draw)
        parasitemia_str = f"{((total_parasites / (total_rbc + total_parasites)) * 100):.2f}%" if total_rbc > 0 else "N/A"

        return {
            "summary_headline": f"{total_parasites} Parasites Detected", 
            "total_parasites": total_parasites,
            "parasitemia_calculation": {"status": "Success" if parasitemia_str != "N/A" else "Insufficient RBCs", "value": parasitemia_str, "rbc_count": total_rbc},
            "detailed_counts": counts,
            "annotated_image": annotated_b64,
            "image_metadata": {"height": result.orig_shape[0], "width": result.orig_shape[1]}
        }

    # ==========================================
    # ENGINE B: CLOUD 
    # ==========================================
    def _run_cloud(self, image_path: str) -> Dict[str, Any]:
        orig_img = cv2.imread(image_path)
        with open(image_path, "rb") as image_file:
            img_b64 = base64.b64encode(image_file.read()).decode("utf-8")
        
        url = f"https://detect.roboflow.com/{self.rf_model_id}"
        response = requests.post(
            url, params={"api_key": self.rf_api_key}, data=img_b64, 
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status() # Triggers fallback if API fails
        result = response.json()
        
        counts = {}
        total_parasites = 0
        total_rbc = 0
        boxes_to_draw = []

        if "predictions" in result:
            for p in result["predictions"]:
                raw_name = p["class"]
                conf = p["confidence"]
                
                x_c, y_c, w, h = p["x"], p["y"], p["width"], p["height"]
                x1, y1, x2, y2 = int(x_c - w/2), int(y_c - h/2), int(x_c + w/2), int(y_c + h/2)
                
                display_name = self._format_label(raw_name)
                color = self._get_color(display_name)
                label_text = ""

                if display_name == "RBC":
                    total_rbc += 1
                    counts["RBC"] = counts.get("RBC", 0) + 1
                elif display_name == "WBC":
                    counts["WBC"] = counts.get("WBC", 0) + 1
                    label_text = f"WBC {conf:.2f}"
                elif "Difficult" in display_name:
                    counts["Difficult"] = counts.get("Difficult", 0) + 1
                    label_text = f"Difficult {conf:.2f}"
                else:
                    total_parasites += 1
                    counts[display_name] = counts.get(display_name, 0) + 1
                    label_text = f"{display_name} {conf:.2f}"

                if label_text: 
                    boxes_to_draw.append({"coords": [x1, y1, x2, y2], "label": label_text, "color": color})

        annotated_b64 = self._draw_annotations(orig_img, boxes_to_draw)
        parasitemia_str = f"{((total_parasites / (total_rbc + total_parasites)) * 100):.2f}%" if total_rbc > 0 else "N/A"

        return {
            "summary_headline": f"{total_parasites} Parasites Detected", 
            "total_parasites": total_parasites,
            "parasitemia_calculation": {"status": "Success" if parasitemia_str != "N/A" else "Insufficient RBCs", "value": parasitemia_str, "rbc_count": total_rbc},
            "detailed_counts": counts,
            "annotated_image": annotated_b64,
            "image_metadata": {"height": orig_img.shape[0], "width": orig_img.shape[1]}
        }