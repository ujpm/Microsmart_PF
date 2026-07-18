import os
import csv
import time
from ultralytics import YOLO

# Paths
MODEL_PATH = "models/malaria_best.pt"
# Pointing to the expert's image directory
SLIDES_DIR = "../ms_validation-main/public/slides/" 
OUTPUT_CSV = "model_validation_results.csv"

def generate_csv():
    print(f"Loading model from {MODEL_PATH}...")
    model = YOLO(MODEL_PATH)
    
    # Check if we have the right class names. 
    # Update these strings if your YOLO model uses different exact names.
    class_names = model.names
    print(f"Model classes: {class_names}")

    with open(OUTPUT_CSV, mode='w', newline='') as file:
        writer = csv.writer(file)
        # Matching the expert's database.ts schema
        writer.writerow(['slide_id', 'trophozoite_count', 'gametocyte_count', 'wbc_count', 'inference_time_ms'])

        # Loop through slide_1.jpg to slide_100.jpg
        for i in range(1, 101):
            slide_name = f"slide_{i}.jpg"
            slide_path = os.path.join(SLIDES_DIR, slide_name)

            if not os.path.exists(slide_path):
                print(f"Warning: {slide_name} not found. Skipping.")
                continue

            print(f"Analyzing {slide_name}...")
            
            start_time = time.time()
            # Run inference (conf=0.25 is standard, adjust if you want stricter thresholding)
            results = model(slide_path, conf=0.25, verbose=False)
            inference_time_ms = round((time.time() - start_time) * 1000, 2)

            # Tally up the detections
            trophozoite_count = 0
            gametocyte_count = 0
            wbc_count = 0

            # results[0].boxes contains all detected bounding boxes
            for box in results[0].boxes:
                class_id = int(box.cls[0].item())
                class_name = class_names[class_id].lower()

                if "trophozoite" in class_name or "falciparum" in class_name:
                    trophozoite_count += 1
                elif "gametocyte" in class_name:
                    gametocyte_count += 1
                elif "wbc" in class_name or "white blood cell" in class_name:
                    wbc_count += 1

            # Write row to CSV
            writer.writerow([slide_name, trophozoite_count, gametocyte_count, wbc_count, inference_time_ms])

    print(f"\n✅ Validation complete! Results saved to backend/{OUTPUT_CSV}")

if __name__ == "__main__":
    generate_csv()
