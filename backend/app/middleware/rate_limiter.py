"""
Rate limiting middleware for multi-user safety and fair resource allocation.
Prevents abuse and ensures all users get fair access to AI services.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request
from typing import Callable


def get_user_identifier(request: Request) -> str:
    """
    Get unique identifier for rate limiting.
    Uses user_id if authenticated, otherwise falls back to IP address.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Unique identifier for the user
    """
    # Try to get user from request state (set by auth middleware)
    if hasattr(request.state, 'user') and request.state.user:
        user_id = str(request.state.user.get('_id', ''))
        if user_id:
            return f"user:{user_id}"
    
    # Fall back to IP address for unauthenticated requests
    return f"ip:{get_remote_address(request)}"


# Create limiter instance
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["200/minute", "2000/hour", "10000/day"],
    storage_uri="memory://",  # Use memory storage (consider Redis for production)
    strategy="fixed-window",
    headers_enabled=True  # Add rate limit info to response headers
)


# Specific rate limits for different endpoint types
RATE_LIMITS = {
    # Authentication endpoints - prevent brute force
    "auth": "10/minute",
    
    # File upload - expensive operation
    "upload": "20/hour",
    
    # AI service endpoints - expensive operations
    "summarize": "30/hour",
    "quiz": "30/hour",
    "ask": "100/hour",
    
    # General API endpoints
    "api": "100/minute",
    
    # Health check - allow frequent checks
    "health": "60/minute"
}


def get_rate_limit(endpoint_type: str) -> str:
    """
    Get rate limit string for a specific endpoint type.
    
    Args:
        endpoint_type: Type of endpoint (auth, upload, summarize, etc.)
        
    Returns:
        str: Rate limit string (e.g., "10/minute")
    """
    return RATE_LIMITS.get(endpoint_type, "100/minute")


# Custom rate limit exceeded handler
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors.
    Provides user-friendly error messages.
    
    Args:
        request: FastAPI request
        exc: RateLimitExceeded exception
        
    Returns:
        JSONResponse: Error response with retry information
    """
    from fastapi.responses import JSONResponse
    
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please slow down and try again later.",
            "detail": str(exc.detail),
            "retry_after": exc.detail.split("Retry after ")[1] if "Retry after" in exc.detail else "1 minute"
        },
        headers={
            "Retry-After": "60"  # Suggest retry after 60 seconds
        }
    )
