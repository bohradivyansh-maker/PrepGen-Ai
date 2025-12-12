from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl
import httpx

from app.core.config import settings
from app.schemas.user_schema import SummaryResponse

router = APIRouter()

# AI Service URL
AI_SERVICE_URL = settings.AI_SERVICE_URL


class AIStatusResponse(BaseModel):
    """Response model for AI service status."""
    ai_service_status: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "ai_service_status": "online"
            }
        }


class YouTubeRequest(BaseModel):
    """Request model for YouTube video URL."""
    url: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
        }


@router.get("/health")
async def check_ai_service_status():
    """
    Check if Kalash's AI service is online and accessible.
    Makes a GET request to the /health endpoint.
    
    Returns:
        dict: AI service status (online or offline)
    """
    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            headers = {
                "ngrok-skip-browser-warning": "true",
                "User-Agent": "PrepGen-Backend/1.0"
            }
            
            # Make a GET request to Kalash's /health endpoint
            response = await client.get(
                f"{AI_SERVICE_URL}/health",
                headers=headers
            )
            
            # Check if response is successful (200-299 range)
            if response.status_code >= 200 and response.status_code < 300:
                return {"ai_service_status": "online"}
            
            # Server errors (500+) mean service is having issues
            if response.status_code >= 500:
                return {"ai_service_status": "offline"}
            
            # 404 or other client errors still mean the tunnel is reachable
            # but we'll consider it offline since the health endpoint should exist
            return {"ai_service_status": "offline"}
            
    except httpx.TimeoutException:
        return {"ai_service_status": "offline"}
    except httpx.ConnectError:
        return {"ai_service_status": "offline"}
    except Exception as e:
        return {"ai_service_status": "offline"}


@router.post("/youtube/summarize")
async def summarize_youtube(request: YouTubeRequest):
    """
    Summarize a YouTube video using the AI service.
    
    Args:
        request: YouTube video URL
        
    Returns:
        dict: Video summary
    """
    try:
        async with httpx.AsyncClient(timeout=None, follow_redirects=True) as client:
            headers = {
                "ngrok-skip-browser-warning": "true",
                "User-Agent": "PrepGen-Backend/1.0"
            }
            
            response = await client.post(
                f"{AI_SERVICE_URL}/summarize-youtube",
                json={"url": request.url},
                headers=headers
            )
            
            # Check for ngrok errors (BEFORE raise_for_status!)
            if response.status_code != 200:
                if "ngrok" in response.text.lower() or "<!DOCTYPE html>" in response.text:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="AI service is currently offline (ngrok tunnel not responding)"
                    )
                response.raise_for_status()  # Raise for other non-200 errors
            
            return response.json()
            
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to summarize YouTube video: {str(e)}"
        )
