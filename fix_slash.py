import os
import re

file_path = "frontend/src/hooks/useAnalysis.ts"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';", "const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\\/$/, '');")

with open(file_path, "w") as f:
    f.write(content)
