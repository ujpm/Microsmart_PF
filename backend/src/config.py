import os
from dotenv import load_dotenv

load_dotenv()

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")

DISEASE_REGISTRY = {
    "MALARIA": {
        "models": {
            "local": "models/malaria_best.pt", 
            "cloud_workspace": "malaria_broadinstitute_diagmal",
            "cloud_version": 6
        },
        "colors": {
            "difficult": "#718096", # Gray
            "leukocyte": "#805AD5", # Purple
            "red blood cell": "#F56565", # Light Red (Uninfected)
            "p-falciparum gametocyte": "#C53030", # Dark Red
            "p-falciparum trophozoite": "#E53E3E", # Red
            "p-malariae mature trophozoite": "#276749", # Dark Green
            "p-malariae schizont": "#38A169", # Green
            "p-ovale mature trophozoite": "#319795", # Teal
            "p-vivax gametocyte": "#2B6CB0", # Dark Blue
            "p-vivax mature trophozoite": "#4299E1", # Blue
            "p-vivax schizont": "#4C51BF", # Indigo
            "p-vivax trophozoite": "#6B46C1" # Dark Purple
        },
        "default_color": "#A0AEC0",
        "brain_system_prompt": "You are MicroSmart, a clinical AI specializing in Malaria diagnosis. Analyze the telemetry to confirm the presence and species of Plasmodium, assess parasitemia severity, and recommend standard antimalarial protocols."
    },
    
    "OVA_AND_PARASITES": {
        "models": {
            "local": "models/op_best.pt",
            "cloud_workspace": "intestinal_parasites_xyz",
            "cloud_version": 1
        },
        "colors": {
            "ascaris": "#DD6B20",
            "hookworm": "#805AD5",
        },
        "default_color": "#A0AEC0",
        "brain_system_prompt": "You are MicroSmart, a clinical AI specializing in intestinal parasites."
    }
}
