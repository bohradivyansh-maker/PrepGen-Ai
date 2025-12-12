from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings
from app.api.endpoints import auth, users, content, quiz, youtube, health
from app.middleware.rate_limiter import limiter, custom_rate_limit_handler
from slowapi.errors import RateLimitExceeded

app = FastAPI(
    title="PrepGen API",
    description="AI-Powered Personalized Learning Platform - Multi-User Safe",
    version="2.0.0"
)

# Rate limiting middleware (MUST be added before other routes)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)

# Session middleware for OAuth (MUST be before CORS)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie="session",
    max_age=3600,  # 1 hour session
    same_site="lax",  # Allow OAuth redirects
    https_only=False  # Set to True when deployed to Railway (HTTPS enabled)
)

# CORS configuration
# For production: Add your Vercel domain to allow_origins list
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",  # Next.js default
        "http://127.0.0.1:3000",
        "https://*.vercel.app",  # Allow all Vercel preview deployments
        "https://*.railway.app",  # Allow Railway domains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(content.router, prefix="/content", tags=["Content"])
app.include_router(quiz.router, prefix="/quiz", tags=["Quiz"])
app.include_router(youtube.router, prefix="/api", tags=["YouTube"])
app.include_router(health.router, tags=["Health"])


@app.get("/")
async def root():
    return {
        "message": "PrepGen API - AI-Powered Personalized Learning Platform",
        "version": "2.0.0",
        "status": "running",
        "features": {
            "multi_user": True,
            "rate_limiting": True,
            "data_isolation": True,
            "concurrent_safe": True
        },
        "docs": "/docs"
    }
