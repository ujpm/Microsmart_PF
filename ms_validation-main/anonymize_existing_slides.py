import json
import os
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SLIDES_DIR = ROOT / "public" / "slides"
OUTPUT_JSON = ROOT / "public" / "ground_truth_master_key.json"


def is_image(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}


def main() -> None:
    SLIDES_DIR.mkdir(parents=True, exist_ok=True)

    existing_images = sorted(
        p for p in SLIDES_DIR.iterdir() if is_image(p) and not p.name.startswith("slide_")
    )

    if not existing_images:
        print("No unprocessed slide images found in public/slides.")
        return

    mapping = {}
    counter = 1

    for original_path in existing_images:
        new_name = f"slide_{counter}.jpg"
        target_path = SLIDES_DIR / new_name

        while target_path.exists():
            counter += 1
            new_name = f"slide_{counter}.jpg"
            target_path = SLIDES_DIR / new_name

        shutil.move(str(original_path), str(target_path))

        original_name = original_path.name
        truth = "Negative" if original_name.lower().startswith("negative_") else "Positive"
        mapping[new_name] = {"original": original_name, "truth": truth}
        counter += 1

    with OUTPUT_JSON.open("w", encoding="utf-8") as handle:
        json.dump(mapping, handle, indent=2)

    print(f"Processed {len(mapping)} images into {SLIDES_DIR}.")
    print(f"Wrote mapping to {OUTPUT_JSON}.")


if __name__ == "__main__":
    main()
