"""
MicroSmart PF - Digital Pathology Dashboard
-------------------------------------------
This is the user interface for the malaria diagnosis agent.
It allows lab technicians to upload blood smears and receive
real-time AI analysis and clinical recommendations.

Built with Streamlit.
"""

import streamlit as st
import tempfile
import os
from PIL import Image
import numpy as np

# Import our custom agents
# (We use a try-except block so the UI doesn't crash if models aren't ready yet)
try:
    from agents.vision import VisionAgent
    from agents.brain import BrainAgent
    AGENTS_LOADED = True
except ImportError:
    AGENTS_LOADED = False

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="MicroSmart PF | Malaria Assistant",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- HEADER ---
st.title("🔬 MicroSmart PF")
st.markdown("*AI-Powered Autonomous Malaria Diagnosis Agent*")

# --- SIDEBAR (Controls) ---
with st.sidebar:
    st.header("Patient Sample")
    uploaded_file = st.file_uploader("Upload Blood Smear (Giemsa)", type=['jpg', 'png', 'jpeg'])
    
    st.divider()
    st.info("System Status:")
    if AGENTS_LOADED:
        st.success("Agents Online")
    else:
        st.error("Agents Offline (Check imports)")

    # Simulation Mode (For testing while waiting for Vultr/Training)
    enable_demo = st.checkbox("Enable Demo Mode (No GPU)", value=not AGENTS_LOADED)

# --- MAIN WORKFLOW ---
def main():
    if uploaded_file:
        # 1. DISPLAY RAW IMAGE
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("1. Visual Scan")
            image = Image.open(uploaded_file)
            st.image(image, caption="Microscopic View (40x/100x)", use_column_width=True)
            
            # Save temp file for YOLO processing
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
                image.save(tmp_file.name)
                tmp_path = tmp_file.name

        # 2. RUN ANALYSIS
        if st.button("Run Diagnostics", type="primary"):
            with st.spinner("Initializing Agent Swarm..."):
                
                # --- A. VISION AGENT (The Eye) ---
                if not enable_demo and AGENTS_LOADED:
                    vision_bot = VisionAgent(model_path="models/best.pt")
                    vision_data = vision_bot.analyze_image(tmp_path)
                    
                    # Draw boxes (YOLO usually returns a plotted image, we can save/show it)
                    # For now, we just show metrics
                else:
                    # Simulated Data for Interface Testing
                    import time
                    time.sleep(2) # Fake processing time
                    vision_data = {
                        "counts": {"Red_Blood_Cell": 150, "Ring": 12, "Trophozoite": 3, "Leukocyte": 1},
                        "parasitemia_pct": 10.0
                    }
                
                # Show Quantitative Results
                with col1:
                    st.success("Scan Complete")
                    metrics = vision_data['counts']
                    
                    # Display metrics in a grid
                    m1, m2, m3 = st.columns(3)
                    m1.metric("RBC Count", metrics.get('Red_Blood_Cell', 0))
                    m2.metric("Parasites Detected", metrics.get('Ring', 0) + metrics.get('Trophozoite', 0))
                    m3.metric("Parasitemia", f"{vision_data['parasitemia_pct']}%")

                # --- B. BRAIN AGENT (The Reasoning) ---
                with col2:
                    st.subheader("2. Clinical Report")
                    report_container = st.empty()
                    report_container.info("Generating medical assessment...")
                    
                    if not enable_demo and AGENTS_LOADED:
                        brain_bot = BrainAgent()
                        report = brain_bot.generate_report(vision_data)
                    else:
                        report = """
                        **SIMULATED REPORT:**
                        Based on the parasitemia of 10.0%, this patient exhibits signs of **Severe Malaria**.
                        
                        **Recommendations:**
                        1. Immediate hospitalization required.
                        2. Initiate IV Artesunate protocol per Rwanda MOH guidelines.
                        3. Monitor blood glucose and hematocrit levels.
                        """
                    
                    report_container.markdown(report)
                    
                    # Optional: Add "Chat with Report" feature here later
                    st.text_input("Ask a follow-up question to the Agent:", disabled=True, placeholder="Coming soon...")

        # Cleanup
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    main()