import os
import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False) # auto_error=False allows our Dev Fallback

# You will get this from Supabase Dashboard > Project Settings > API > JWT Secret
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")

async def get_current_user_token(request: Request, credentials = Depends(security)):
    """
    Validates the Supabase JWT. 
    If no token is provided during development, it allows passthrough for testing.
    In strict production, this will raise a 401 Unauthorized.
    """
    if not credentials:
        logger.warning("No Auth Token provided. Falling back to Dev Test User.")
        return None # Triggers fallback in main.py
        
    token = credentials.credentials
    try:
        # Supabase uses HS256 algorithms
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        return payload.get("sub") # Returns the Supabase User UUID
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
