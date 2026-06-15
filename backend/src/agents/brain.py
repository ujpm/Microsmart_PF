import os
import logging
from typing import Dict
try:
    from cerebras.cloud.sdk import Cerebras
except ImportError:
    Cerebras = None
    logging.warning("cerebras_cloud_sdk not found. Please install it.")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BrainAgent:
    def __init__(self):
        self.api_key = os.environ.get("CEREBRAS_API_KEY")
        if not self.api_key:
            logger.error("CEREBRAS_API_KEY environment variable is not set.")
            raise EnvironmentError("Missing Cerebras API Key")
        
        if Cerebras is None:
            raise ImportError("Cerebras SDK is not installed.")
            
        self.client = Cerebras(api_key=self.api_key)
        # Verify this model string matches Cerebras's current Llama 3.3 endpoint
        self.model_id = "gpt-oss-120b" 

    def generate_report(self, vision_data: Dict) -> str:
        # 1. Dynamically extract the exact counts sent to the frontend
        counts = vision_data.get('detailed_counts', {})
        total_parasites = vision_data.get('total_parasites', 0)
        
        parasitemia = "N/A"
        if 'parasitemia_calculation' in vision_data:
            parasitemia = vision_data['parasitemia_calculation'].get('value', 'N/A')

        # Format the dynamic counts into a readable list for the LLM
        counts_list = "\n".join([f"- {k}: {v}" for k, v in counts.items()])

        # 2. Objective, Data-Driven System Prompt
        system_prompt = (
            "You are MicroSmart, an expert autonomous diagnostic agent for Malaria at a Rwandan District Hospital. "
            "CRITICAL RULES: "
            "1. RELY STRICTLY ON THE PROVIDED DATA. Do not assume P. falciparum if the data shows P. vivax, P. ovale, or P. malariae. "
            "2. The vision model has high confidence for P. falciparum, but lower confidence for other species. If non-falciparum species are detected, note this uncertainty and advise manual confirmation. "
            "3. Format your response STRICTLY in Markdown. Use a clean Markdown table to summarize the cell counts and parasitemia. "
            "4. Provide concise, professional Rwandan National Guidelines treatment recommendations based *only* on the detected species."
        )

        user_prompt = f"""
        LABORATORY DATA:
        - Total Parasites Detected: {total_parasites}
        - Computed Parasitemia: {parasitemia}
        
        CELL BREAKDOWN:
        {counts_list}

        TASK:
        1. Create a Markdown table summarizing the Cell Breakdown.
        2. Final Diagnosis: State the detected species based purely on the data.
        3. Severity Classification: Write 'Severe' if parasitemia is greater than 2% or neurological signs are present.
        4. Clinical Recommendation.
        
        CRITICAL FORMATTING RULE: Do NOT use the `<` or `>` mathematical symbols in your text (write "less than" or "greater than"). These symbols crash the UI.
        """

        try:
            logger.info("Generating Clinical Report via Cerebras...")
            response = self.client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1, 
                max_tokens=1500 # Increased from 800 to prevent API token cutoffs
            )
            return response.choices[0].message.content
        
        except Exception as e:
            logger.error(f"Brain Agent Failure: {e}")
            return f"Error: Clinical reasoning engine offline. Details: {str(e)}"