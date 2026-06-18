import json
import logging
from cerebras.cloud.sdk import Cerebras
from src.config import CEREBRAS_API_KEY, DISEASE_REGISTRY

logger = logging.getLogger(__name__)

class BrainAgent:
    def __init__(self):
        """
        Initializes the LLM client. 
        We use a deterministic, low-temperature setup for clinical accuracy.
        """
        if not CEREBRAS_API_KEY:
            logger.warning("CEREBRAS_API_KEY is missing. Clinical reporting will fail.")
            self.client = None
        else:
            self.client = Cerebras(api_key=CEREBRAS_API_KEY)
            
        # Using the Llama 3.1 70B model for high-tier clinical reasoning
        self.model = "gpt-oss-120b" 

    def generate_report(self, vision_data: dict) -> str:
        """
        Ingests the JSON output from the Vision Agent, applies the dynamic 
        clinical prompt based on the sample type, and generates a Markdown report.
        """
        if not self.client:
            return "Error: LLM API key not configured. Cannot generate clinical report."

        try:
            # 1. Extract the dynamic context injected by the Vision Agent
            sample_type = vision_data.get("diagnostic_context", "MALARIA").upper()
            predictions = vision_data.get("predictions", [])
            
            # 2. Fetch the strict clinical rules for this specific disease
            if sample_type not in DISEASE_REGISTRY:
                logger.warning(f"Unknown sample type '{sample_type}'. Defaulting to MALARIA.")
                sample_type = "MALARIA"
                
            system_prompt = DISEASE_REGISTRY[sample_type]["brain_system_prompt"]
            
            # 3. Pre-process the data to save tokens and improve LLM accuracy
            class_counts = {}
            for pred in predictions:
                cls_name = pred.get("class", "Unknown")
                class_counts[cls_name] = class_counts.get(cls_name, 0) + 1
            
            user_content = f"### Vision AI Telemetry ({sample_type})\n"
            user_content += f"Total objects detected: {len(predictions)}\n\n"
            
            user_content += "Aggregated Counts:\n"
            for cls_name, count in class_counts.items():
                user_content += f"- {cls_name}: {count}\n"
            
            # We pass the raw bounding boxes in case the LLM needs to assess spatial density
            user_content += "\nRaw Bounding Box Data:\n"
            user_content += json.dumps(predictions, indent=2)
            
            user_content += "\n\nTask: Generate a professional, structured clinical report based on these findings."

            # 4. Execute the inference
            logger.info(f"Generating clinical report for {sample_type} via Cerebras...")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.1, # Extremely low temperature to prevent medical hallucinations
                max_completion_tokens=1024
            )
            
            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Brain Agent inference failed: {e}")
            return f"Error generating clinical report: {str(e)}"
