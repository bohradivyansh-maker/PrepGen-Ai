from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic models."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class AIQuizQuestion(BaseModel):
    """Model for a quiz question from the AI service."""
    question: str
    options: List[str]
    correct_answer: int
    explanation: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is the capital of France?",
                "options": ["London", "Berlin", "Paris", "Madrid"],
                "correct_answer": 2,
                "explanation": "Paris is the capital and largest city of France."
            }
        }


class QuizResponse(BaseModel):
    """Response model for quiz generation."""
    filename: str
    questions: List[AIQuizQuestion]

    class Config:
        json_schema_extra = {
            "example": {
                "filename": "study_notes.pdf",
                "questions": [
                    {
                        "question": "What is the capital of France?",
                        "options": ["London", "Berlin", "Paris", "Madrid"],
                        "correct_answer": 2,
                        "explanation": "Paris is the capital of France."
                    }
                ]
            }
        }


class QuizResultCreate(BaseModel):
    """Schema for creating a quiz result."""
    content_id: str
    score: int
    total_questions: int

    class Config:
        json_schema_extra = {
            "example": {
                "content_id": "507f1f77bcf86cd799439011",
                "score": 8,
                "total_questions": 10
            }
        }


class QuizResult(BaseModel):
    """Model for quiz result with full data."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    content_id: str
    score: int
    total_questions: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "content_id": "507f1f77bcf86cd799439011",
                "score": 8,
                "total_questions": 10,
                "created_at": "2024-01-01T12:00:00"
            }
        }
