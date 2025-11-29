🔬 MicroSmart PF

The AI-Powered Autonomous Malaria Diagnosis Agent

MicroSmart PF is an agentic AI system designed to assist laboratory technicians in low-resource settings. It combines computer vision (for parasite quantification) with large language models (for clinical reasoning) to provide instant, expert-level malaria diagnosis from standard blood smear images.

🏥 The Problem

Microscopy remains the gold standard for malaria diagnosis, but it is:

Time-Consuming: Technicians must manually count hundreds of cells.

Subjective: Fatigue leads to misdiagnosis, especially in distinguishing P. falciparum (deadly) from P. vivax (benign).

Disconnected: Data is rarely digitized or analyzed for longitudinal trends.

💡 The Solution

MicroSmart PF acts as a "Digital Pathologist" that never gets tired. It uses a Neuro-Symbolic architecture:

The Eye: A custom-trained YOLOv8 model detects and counts parasites with 98.1% accuracy for P. falciparum.

The Brain: The Cerebras Inference API (Llama 3.3) analyzes the counts, calculates parasitemia, and generates a WHO-compliant medical report.

The Memory: LiquidMetal Raindrop stores patient data and enables semantic search across past cases.

⚡ Key Features

1. Multi-Species Detection

Unlike simple classifiers, MicroSmart PF distinguishes between specific life stages:

Ring Stage: Early infection detection.

Gametocytes: Identifies transmission potential.

Schizonts: Flags severe/advanced reproduction.

2. Automated Parasitemia Calculation

Automatically counts Red Blood Cells (RBCs) vs. Infected Cells to calculate the exact infection percentage, removing human calculation error.

3. "The Skeptic" Protocol

The system doesn't just guess. It employs a multi-agent check where the Vision Agent passes data to a Reasoning Agent that validates findings against medical guidelines before issuing a report.

🛠️ Tech Stack

Vision: ultralytics (YOLOv8 Nano) - Trained on Broad Institute DiagMal dataset.

Reasoning: cerebras_cloud_sdk - Powered by the Wafer-Scale Engine for ultra-low latency.

Backend: FastAPI - High-performance API handling image processing pipelines.

Infrastructure: LiquidMetal Raindrop - Cloud-native data persistence and vector storage.

Compute: Vultr - Cloud GPU instances for model training and hosting.

🚀 Getting Started

Prerequisites

Python 3.10+

Cerebras API Key

LiquidMetal Account

Installation

Clone the repository

git clone [https://github.com/ujpm/microsmart_pf.git](https://github.com/ujpm/microsmart_pf.git)
cd microsmart_pf


Install Dependencies

pip install -r requirements.txt


Configure Environment

export CEREBRAS_API_KEY="your_key_here"


Run the Agent

python src/app.py


📊 Performance Metrics (v1.0)

P. falciparum Trophozoite: 98.1% mAP50

P. malariae Schizont: 99.5% mAP50

Inference Speed: <200ms per slide

Part of the MicroSmart Family of Laboratory Agents.
Built for The AI Champion Ship 2025.