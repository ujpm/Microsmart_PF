# MicroSmart PF Backend

This folder contains the FastAPI backend and AI agents for MicroSmart PF.

## Quick Start

```bash
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## Environment
- Add your Cerebras API key to `.env` in this folder:
  ```env
  CEREBRAS_API_KEY="your-key-here"
  ```
- YOLOv8 model weights should be in `models/best.pt`

## Tech Stack
- FastAPI
- YOLOv8 (Ultralytics)
- Cerebras Llama 3.3

API endpoints are documented in the main `README.md` in the root folder.
