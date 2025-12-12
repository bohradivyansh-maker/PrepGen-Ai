from pydantic import BaseModel, Field
from typing import Optional
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


class Content(BaseModel):
    """Content model for uploaded files."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    filename: str
    content_type: str
    file_path: str
    summary: Optional[str] = None
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
                "filename": "study_notes.pdf",
                "content_type": "application/pdf",
                "file_path": "/uploads/abc123.pdf"
            }
        }


class ContentCreate(BaseModel):
    """Schema for creating content metadata."""
    filename: str
    content_type: str

    class Config:
        json_schema_extra = {
            "example": {
                "filename": "study_notes.pdf",
                "content_type": "application/pdf"
            }
        }


class ContentResponse(BaseModel):
    """Response model for content."""
    _id: str
    filename: str
    content_type: str
    created_at: str

    class Config:
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "filename": "study_notes.pdf",
                "content_type": "application/pdf",
                "created_at": "2024-01-01T12:00:00"
            }
        }
