from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime
from bson import ObjectId

from app.core.security import get_current_user
from app.db.database import get_db, get_quiz_results_collection
from app.schemas.quiz_schema import QuizResultCreate, QuizResult

router = APIRouter()


@router.post("/save")
async def save_quiz_result(
    quiz_data: QuizResultCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Save a quiz result for the current user.
    
    Args:
        quiz_data: Quiz result data
        current_user: Current authenticated user
        db: Database instance
        
    Returns:
        dict: Created quiz result
    """
    # Create quiz result document
    quiz_result = {
        "user_id": str(current_user["_id"]),
        "content_id": quiz_data.content_id,
        "score": quiz_data.score,
        "total_questions": quiz_data.total_questions,
        "created_at": datetime.utcnow()
    }
    
    # Insert into database
    quiz_results_collection = get_quiz_results_collection(db)
    result = await quiz_results_collection.insert_one(quiz_result)
    
    # Fetch the created document
    created_quiz = await quiz_results_collection.find_one({"_id": result.inserted_id})
    
    if not created_quiz:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve saved quiz result"
        )
    
    # Convert ObjectId to string
    created_quiz["_id"] = str(created_quiz["_id"])
    created_quiz["created_at"] = created_quiz["created_at"].isoformat()
    
    return created_quiz


@router.get("/results")
async def get_quiz_results(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get all quiz results for the current user.
    
    Args:
        current_user: Current authenticated user
        db: Database instance
        
    Returns:
        dict: List of quiz results
    """
    quiz_results_collection = get_quiz_results_collection(db)
    
    # Fetch all quiz results for current user, sorted by date (newest first)
    cursor = quiz_results_collection.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1)
    
    results = await cursor.to_list(length=None)
    
    # Convert ObjectId to string and format dates
    for result in results:
        result["_id"] = str(result["_id"])
        if "created_at" in result:
            result["created_at"] = result["created_at"].isoformat()
    
    return {"results": results}
