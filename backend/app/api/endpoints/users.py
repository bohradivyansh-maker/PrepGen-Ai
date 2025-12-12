from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import get_current_user
from app.db.database import get_db, get_user_collection
from app.schemas.user_schema import User

router = APIRouter()


@router.get("/me", response_model=dict)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current authenticated user from JWT token
        
    Returns:
        dict: User information with _id converted to string
    """
    # Convert ObjectId to string for JSON serialization
    user_data = {
        "_id": str(current_user["_id"]),
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "picture": current_user.get("picture"),
        "google_id": current_user.get("google_id")
    }
    
    return user_data
