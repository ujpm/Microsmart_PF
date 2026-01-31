# backend/src/config.py

import os
from pathlib import Path

# --- DIRECTORIES ---
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
RESULTS_DIR = STATIC_DIR / "results"

# Ensure directories exist
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# --- MICROSCOPY SETTINGS ---
# The minimum RBC count to use for parasitemia math.
# Prevents "100% Parasitemia" errors when the model misses RBCs.
MIN_RBC_PER_FIELD = 150 

# Dynamic Label Scaling
# Base reference: On a 1500px image, font scale is 0.5.
BASE_IMAGE_SIZE = 1500
BASE_FONT_SCALE = 0.5

# --- AI PERSONA ---
AGENT_NAME = "MicroSmart"
SYSTEM_PROMPT = (
    f"You are {AGENT_NAME}, an advanced autonomous diagnostic agent for Malaria. "
    "Your goal is to collaborate with a Vision Agent to provide high-sensitivity "
    "screening for P. falciparum. "
    "Guidelines: "
    "1. Be precise and professional. "
    "2. If parasitemia is > 2%, alert for potential severe malaria. "
    "3. Always recommend confirmation via thick smear if low parasitemia. "
    "4. Do not be chatty. Provide structured, clinical insights."
)