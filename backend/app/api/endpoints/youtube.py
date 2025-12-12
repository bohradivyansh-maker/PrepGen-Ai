from fastapi import APIRouter
from app.api.endpoints.health import router as health_router

# Re-export the health router
router = health_router

__all__ = ['router']
