import os
import markdown
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import logging

logger = logging.getLogger(__name__)

def generate_clinical_pdf(session_data: dict, output_filepath: str) -> str:
    """
    Takes dynamic session data, compiles it into the HTML template using Jinja2,
    and renders it to a PDF file using WeasyPrint.
    """
    try:
        # 1. Setup Jinja2 Environment pointing to our templates folder
        template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template('report.html')

        # 2. Convert Brain Agent Markdown to HTML
        raw_markdown = session_data.get("clinical_report", "No report generated.")
        html_report_content = markdown.markdown(raw_markdown)

        # 3. Inject data into the template
        rendered_html = template.render(
            session_id=session_data.get("session_id", "N/A"),
            facility_name=session_data.get("facility_name", "Unknown Facility"),
            user_email=session_data.get("user_email", "Unknown User"),
            date=session_data.get("date", "N/A"),
            sample_type=session_data.get("sample_type", "N/A"),
            status=session_data.get("status", "COMPLETED"),
            object_count=session_data.get("object_count", 0),
            html_report=html_report_content
        )

        # 4. Convert HTML string to PDF
        HTML(string=rendered_html).write_pdf(output_filepath)
        logger.info(f"PDF successfully generated at {output_filepath}")
        
        return output_filepath

    except Exception as e:
        logger.error(f"Failed to generate PDF: {e}")
        raise RuntimeError(f"PDF Generation Error: {e}")
