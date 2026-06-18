import os
from dotenv import load_dotenv

load_dotenv()

# Universal System Keys
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")

# --- DYNAMIC DISEASE REGISTRY ---
# This registry allows the backend to instantly adapt its vision models,
# bounding box colors, and labels based on the active diagnostic context.

DISEASE_REGISTRY = {
    "MALARIA": {
        "models": {
            "local": "models/malaria_best.pt", # We will rename best.pt to this
            "cloud_workspace": "malaria_broadinstitute_diagmal",
            "cloud_version": 6
        },
        "classes": {
            0: {"label": "Red Blood Cell", "color": "#E53E3E"}, # Red
            1: {"label": "White Blood Cell", "color": "#D69E2E"}, # Yellow
            2: {"label": "Plasmodium falciparum", "color": "#38A169"}, # Green
        },
        "default_color": "#A0AEC0",
        "brain_system_prompt": "You are MicroSmart, a clinical AI specializing in Malaria diagnosis. Analyze the bounding box data to confirm the presence of Plasmodium falciparum, assess parasitemia severity, and recommend standard antimalarial protocols."
    },
    
    "OVA_AND_PARASITES": {
        "models": {
            "local": "models/op_best.pt", # Placeholder for your future O&P weights
            "cloud_workspace": "intestinal_parasites_xyz",
            "cloud_version": 1
        },
        "classes": {
            0: {"label": "Ascaris lumbricoides", "color": "#DD6B20"}, # Orange
            1: {"label": "Hookworm", "color": "#805AD5"}, # Purple
            2: {"label": "Trichuris trichiura", "color": "#3182CE"}, # Blue
        },
        "default_color": "#A0AEC0",
        "brain_system_prompt": "You are MicroSmart, a clinical AI specializing in intestinal parasites. Analyze the bounding box data to identify specific helminth ova, assess the infection burden, and recommend appropriate anthelmintic treatments."
    }
}
