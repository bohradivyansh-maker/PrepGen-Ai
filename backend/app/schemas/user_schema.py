from pydantic import BaseModel, Field, EmailStr
from typing import Optional
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


class User(BaseModel):
    """User model with MongoDB ObjectId."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    full_name: str
    hashed_password: Optional[str] = None
    google_id: Optional[str] = None
    picture: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "full_name": "John Doe"
            }
        }


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    email: EmailStr
    full_name: str
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "full_name": "John Doe",
                "password": "securepassword123"
            }
        }


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    email: Optional[str] = None


class SummaryResponse(BaseModel):
    """Response model for document summary."""
    summary: str
    source: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "summary": "This document discusses...",
                "source": "document.pdf"
            }
        }


class AskRequest(BaseModel):
    """Request model for asking a question about a document."""
    question: str

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the main topics discussed in this document?"
            }
        }


class AskResponse(BaseModel):
    """Response model for document Q&A."""
    question: str
    answer: str

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the main topics?",
                "answer": "The main topics are..."
            }
        }
