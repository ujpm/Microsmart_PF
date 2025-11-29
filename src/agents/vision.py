"""
MicroSmart PF - Vision Agent
----------------------------
This module handles the computer vision tasks for the malaria diagnosis system.
It utilizes a YOLOv8 model to detect and quantify malaria parasites and blood cells
in microscopic images.

"""

import logging
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

        Args:
            image_path (str): File path to the blood smear image.

        Returns:
            Dict[str, Any]: A structured report containing counts of detected classes
                            (e.g., RBC, WBC, Rings, Trophozoites) and raw detection data.
        """
        logger.info(f"Running inference on: {image_path}")
        
        # Run inference with a confidence threshold suitable for medical screening
        results = self.model.predict(image_path, conf=0.4, verbose=False)
        result = results[0] # Process the first image

        # Initialize counters for all known classes in the dataset
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
            
            # Map dataset specific names to standardized keys if necessary
            # Assuming dataset uses standard names; add mapping logic here if needed
            if class_name in counts:
                counts[class_name] += 1
            else:
                # Log unexpected classes for debugging
                counts[class_name] = counts.get(class_name, 0) + 1

        # Calculate preliminary Parasitemia (Percentage of infected cells)
        # Formula: (Infected Cells / Total RBCs) * 100
        total_rbc = counts.get("Red_Blood_Cell", 1) # Avoid division by zero
        total_parasites = counts["Ring"] + counts["Trophozoite"] + counts["Gametocyte"] + counts["Schizont"]
        parasitemia = (total_parasites / total_rbc) * 100

        analysis_report = {
            "counts": counts,
            "parasitemia_pct": round(parasitemia, 2),
            "image_metadata": {
                "height": result.orig_shape[0],
                "width": result.orig_shape[1]
            }
        }

        logger.info(f"Analysis Complete: Parasitemia {parasitemia:.2f}%")
        return analysis_report