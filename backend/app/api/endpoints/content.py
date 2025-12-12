from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status, Request, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
import os
import httpx
from bson import ObjectId
import asyncio
import ssl

from app.core.security import get_current_user
from app.db.database import get_db, get_content_collection
from app.core.config import settings
from app.schemas.content_schema import Content, ContentResponse
from app.schemas.quiz_schema import QuizResponse
from app.schemas.user_schema import SummaryResponse, AskRequest, AskResponse
from app.utils.file_manager import get_file_manager
from app.middleware.rate_limiter import limiter, get_rate_limit
from app.utils.markdown_formatter import enhance_summary_response

router = APIRouter()

# Upload directory configuration
UPLOAD_DIRECTORY = "./uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

# AI Service URL
AI_SERVICE_URL = settings.AI_SERVICE_URL

# Get file manager instance
file_manager = get_file_manager(UPLOAD_DIRECTORY)


def create_http_client():
    """
    Create an HTTP client with SSL verification disabled and connection pooling.
    This helps with unstable ngrok tunnels and SSL handshake issues.
    """
    # Disable SSL verification for ngrok tunnels
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    return httpx.AsyncClient(
        timeout=None,  # No timeout for large documents
        follow_redirects=True,
        verify=False,  # Disable SSL verification
        limits=httpx.Limits(
            max_keepalive_connections=5,
            max_connections=10,
            keepalive_expiry=30.0  # Keep connections alive for 30s
        )
    )


async def retry_request(request_func, max_retries=3, initial_delay=1.0):
    """
    Retry a request with exponential backoff.
    Handles SSL errors and connection drops.
    
    Args:
        request_func: Async function that makes the HTTP request
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds before first retry
        
    Returns:
        Response from successful request
        
    Raises:
        HTTPException: If all retries fail
    """
    last_error = None
    
    for attempt in range(max_retries):
        try:
            return await request_func()
        except (httpx.ConnectError, httpx.ReadError, ssl.SSLError) as e:
            last_error = e
            if attempt < max_retries - 1:
                delay = initial_delay * (2 ** attempt)  # Exponential backoff
                print(f"[RETRY] Attempt {attempt + 1} failed: {str(e)}")
                print(f"[RETRY] Waiting {delay}s before retry...")
                await asyncio.sleep(delay)
            else:
                print(f"[ERROR] All {max_retries} retry attempts failed")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"AI service connection failed after {max_retries} attempts: {str(e)}"
                )
        except Exception as e:
            # Don't retry on non-connection errors
            raise e
    
    # This shouldn't be reached, but just in case
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=f"Request failed: {str(last_error)}"
    )


async def activate_document_on_ai_server(content_id: str, db: AsyncIOMotorDatabase):
    """
    Upload document to AI server to activate it for processing.
    Returns the session_id from the AI service.
    
    Args:
        content_id: MongoDB document ID
        db: Database instance
        
    Returns:
        str: session_id from AI service
        
    Raises:
        HTTPException: If document not found or AI service unavailable
    """
    # Fetch document metadata
    content_collection = get_content_collection(db)
    content = await content_collection.find_one({"_id": ObjectId(content_id)})
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if we already have a session_id stored
    # NOTE: Temporarily disabled session caching due to Kalash's AI service errors
    # Re-enable this after Kalash fixes the "cannot pickle 'coroutine' object" bug
    # if "session_id" in content:
    #     print(f"[DEBUG] Using cached session_id: {content['session_id']}")
    #     return content["session_id"]
    
    print(f"[DEBUG] No cached session_id, uploading file fresh...")
    
    # Construct file path
    file_path = os.path.join(UPLOAD_DIRECTORY, content_id)
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server"
        )
    
    # Upload to AI service with retry logic
    try:
        print(f"[DEBUG] Uploading file to AI service: {content['filename']}")
        print(f"[DEBUG] AI Service URL: {AI_SERVICE_URL}/upload")
        print(f"[DEBUG] File size: {os.path.getsize(file_path)} bytes")
        
        async def upload_request():
            async with create_http_client() as client:
                with open(file_path, "rb") as f:
                    files = {"file": (content["filename"], f, content["content_type"])}
                    
                    # Add headers for ngrok - required to bypass browser warning
                    headers = {
                        "ngrok-skip-browser-warning": "true",
                        "User-Agent": "PrepGen-Backend/1.0"
                    }
                    
                    response = await client.post(
                        f"{AI_SERVICE_URL}/upload",
                        files=files,
                        headers=headers
                    )
                    
                    print(f"[DEBUG] Upload response status: {response.status_code}")
                    print(f"[DEBUG] Upload response body: {response.text[:500]}")
                    
                    # Check if we got an ngrok error page (BEFORE raise_for_status!)
                    if response.status_code != 200:
                        if "ngrok" in response.text.lower() or "<!DOCTYPE html>" in response.text:
                            raise HTTPException(
                                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                detail="AI service is currently offline (ngrok tunnel not responding)"
                            )
                        response.raise_for_status()  # Raise for other non-200 errors
                    
                    return response
        
        response = await retry_request(upload_request)
        ai_response = response.json()
        
        # Extract session_id from response
        session_id = ai_response.get("session_id")
        if not session_id:
            print(f"[ERROR] No session_id in AI response: {ai_response}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service did not return session_id"
            )
        
        print(f"[DEBUG] Received session_id: {session_id}")
        
        # Store session_id in database for future use
        await content_collection.update_one(
            {"_id": ObjectId(content_id)},
            {"$set": {"session_id": session_id}}
        )
        
        return session_id
                
    except httpx.HTTPError as e:
        print(f"[ERROR] HTTP error during file upload: {str(e)}")
        print(f"[ERROR] Error type: {type(e).__name__}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"[ERROR] Response status: {e.response.status_code}")
            print(f"[ERROR] Response text: {e.response.text[:500]}")
        else:
            print(f"[ERROR] No response received - connection failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable: {str(e)}"
        )
    except Exception as e:
        print(f"[ERROR] Unexpected error during file upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate document: {str(e)}"
        )


@router.post("/upload")
@limiter.limit(get_rate_limit("upload"))
async def upload_file(
    request: Request,
    response: Response,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Upload a study material file (PDF, DOCX, PPTX).
    Thread-safe with proper locking for concurrent uploads.
    
    Args:
        file: Uploaded file
        current_user: Current authenticated user
        db: Database instance
        
    Returns:
        dict: Created content metadata
    """
    # Validate file type
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                     "application/vnd.openxmlformats-officedocument.presentationml.presentation"]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF, DOCX, and PPTX files are allowed."
        )
    
    # Validate file size (max 50MB)
    if file.size and file.size > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 50MB limit"
        )
    
    # Create content metadata
    content_metadata = {
        "user_id": str(current_user["_id"]),
        "filename": file.filename,
        "content_type": file.content_type
    }
    
    # Insert metadata into database (atomic operation)
    content_collection = get_content_collection(db)
    result = await content_collection.insert_one(content_metadata)
    content_id = str(result.inserted_id)
    
    # Save physical file using thread-safe file manager
    try:
        file_path, file_size = await file_manager.save_upload_file_sync(file, content_id)
        
        # Update metadata with file size
        await content_collection.update_one(
            {"_id": result.inserted_id},
            {"$set": {"file_size": file_size}}
        )
        
    except FileExistsError:
        # This should never happen with ObjectId-based naming, but handle it
        await content_collection.delete_one({"_id": result.inserted_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File ID collision detected. Please try again."
        )
    except Exception as e:
        # Rollback: delete metadata if file save fails
        await content_collection.delete_one({"_id": result.inserted_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Return created content
    content_metadata["_id"] = content_id
    content_metadata["file_size"] = file_size
    content_metadata["created_at"] = result.inserted_id.generation_time.isoformat()
    
    return content_metadata


@router.get("/")
async def get_all_content(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get all content uploaded by the current user.
    
    Args:
        current_user: Current authenticated user
        db: Database instance
        
    Returns:
        dict: List of content items
    """
    content_collection = get_content_collection(db)
    
    # Fetch all content for current user
    cursor = content_collection.find({"user_id": str(current_user["_id"])})
    content_list = await cursor.to_list(length=None)
    
    # Convert ObjectId to string
    for content in content_list:
        content["_id"] = str(content["_id"])
        # Add created_at if not present
        if "created_at" not in content:
            content["created_at"] = ObjectId(content["_id"]).generation_time.isoformat()
    
    return {"content": content_list}


@router.post("/{content_id}/summarize")
@limiter.limit(get_rate_limit("summarize"))
async def summarize_content(
    request: Request,
    response: Response,
    content_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Generate a summary of the document using AI.
    Rate-limited and queued to ensure fair resource allocation across users.
    Requests are processed sequentially to prevent loss.
    
    Args:
        content_id: Content ID
        current_user: Current authenticated user
        db: Database instance
        
    Returns:
        dict: Summary response
    """
    # Verify content belongs to user (CRITICAL for multi-user safety)
    content_collection = get_content_collection(db)
    content = await content_collection.find_one({
        "_id": ObjectId(content_id),
        "user_id": str(current_user["_id"])
    })
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found or access denied"
        )
    
    # Activate document on AI server and get session_id
    session_id = await activate_document_on_ai_server(content_id, db)
    
    print(f"[DEBUG] Requesting summary with session_id: {session_id}")
    
    # Call AI service for summary - no timeout for large documents, with retry on SSL errors
    try:
        async def summary_request():
            async with create_http_client() as client:
                headers = {
                    "ngrok-skip-browser-warning": "true",
                    "User-Agent": "PrepGen-Backend/1.0"
                }
                
                resp = await client.post(
                    f"{AI_SERVICE_URL}/summarize",
                    json={"session_id": session_id},
                    headers=headers
                )
                
                print(f"[DEBUG] Summary response status: {resp.status_code}")
                print(f"[DEBUG] Summary response body: {resp.text[:500]}")
                
                # Check for ngrok errors (BEFORE raise_for_status!)
                if resp.status_code != 200:
                    if "ngrok" in resp.text.lower() or "<!DOCTYPE html>" in resp.text:
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="AI service is currently offline (ngrok tunnel not responding)"
                        )
                    resp.raise_for_status()  # Raise for other non-200 errors
                
                return resp
        
        response = await retry_request(summary_request)
        summary_data = response.json()
        
        # Enhance markdown formatting before returning to frontend
        enhanced_summary = enhance_summary_response(summary_data)
        
        return enhanced_summary
    except httpx.HTTPError as e:
        print(f"[ERROR] HTTP error during summary: {str(e)}")
        print(f"[ERROR] Response: {e.response.text if hasattr(e, 'response') else 'No response'}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable: {str(e)}"
        )
    except Exception as e:
        print(f"[ERROR] Unexpected error during summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )


@router.post("/{content_id}/quiz")
@limiter.limit(get_rate_limit("quiz"))
async def generate_quiz(
    request: Request,
    response: Response,
    content_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Generate quiz questions from the document using AI.
    Rate-limited and queued to ensure fair resource allocation across users.
    Requests are processed sequentially to prevent loss.
    
    Args:
        content_id: Content ID
        current_user: Current authenticated user
        db: Database instance
        
    Returns:
        dict: Quiz questions
    """
    # Verify content belongs to user (CRITICAL for multi-user safety)
    content_collection = get_content_collection(db)
    content = await content_collection.find_one({
        "_id": ObjectId(content_id),
        "user_id": str(current_user["_id"])
    })
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found or access denied"
        )
    
    # Activate document on AI server and get session_id
    session_id = await activate_document_on_ai_server(content_id, db)
    
    print(f"[DEBUG] Requesting quiz with session_id: {session_id}")
    
    # Call AI service for quiz - no timeout (quiz generation can take several minutes), with retry on SSL errors
    try:
        async def quiz_request():
            async with create_http_client() as client:
                # Add ngrok headers to skip browser warning page
                headers = {
                    "ngrok-skip-browser-warning": "true",
                    "User-Agent": "PrepGen-Backend/1.0"
                }
                
                resp = await client.post(
                    f"{AI_SERVICE_URL}/quiz",
                    json={"session_id": session_id},
                    headers=headers
                )
                
                # Log the response for debugging
                print(f"[DEBUG] Quiz response status: {resp.status_code}")
                print(f"[DEBUG] Quiz response body: {resp.text[:500]}")  # First 500 chars
                
                # Check for ngrok errors (BEFORE raise_for_status!)
                if resp.status_code != 200:
                    if "ngrok" in resp.text.lower() or "<!DOCTYPE html>" in resp.text:
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="AI service is currently offline (ngrok tunnel not responding)"
                        )
                    resp.raise_for_status()  # Raise for other non-200 errors
                
                return resp
        
        response = await retry_request(quiz_request)
        ai_response = response.json()
        
        # Transform response format from Kalash's API to frontend format
        if "quiz" in ai_response:
            quiz_questions = ai_response["quiz"]
            transformed_questions = []
            
            for q in quiz_questions:
                # Find the index of the correct answer
                correct_answer_index = 0
                if "correct_answer" in q and "options" in q:
                    try:
                        correct_answer_index = q["options"].index(q["correct_answer"])
                    except ValueError:
                        # If exact match not found, try case-insensitive match
                        correct_answer_lower = q["correct_answer"].lower().strip()
                        for i, opt in enumerate(q["options"]):
                            if opt.lower().strip() == correct_answer_lower:
                                correct_answer_index = i
                                break
                
                transformed_questions.append({
                    "question": q.get("question", ""),
                    "options": q.get("options", []),
                    "correct_answer": correct_answer_index,
                    "explanation": q.get("explanation", "")
                })
            
            return {"questions": transformed_questions}
        else:
            return ai_response
    except httpx.HTTPError as e:
        print(f"[ERROR] HTTP error during quiz generation: {str(e)}")
        print(f"[ERROR] Error type: {type(e).__name__}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"[ERROR] Response status: {e.response.status_code}")
            print(f"[ERROR] Response text: {e.response.text[:500]}")
        else:
            print(f"[ERROR] No response received - connection failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable: {str(e)}"
        )
    except Exception as e:
        print(f"[ERROR] Unexpected error during quiz generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(e)}"
        )


@router.post("/{content_id}/ask")
@limiter.limit(get_rate_limit("ask"))
async def ask_question(
    request: Request,
    response: Response,
    content_id: str,
    request_body: AskRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Ask a question about the document using AI.
    Rate-limited and queued to ensure fair resource allocation across users.
    
    Args:
        content_id: Content ID
        request_body: Question request
        current_user: Current authenticated user
        db: Database instance
        
    Returns:
        dict: Answer response
    """
    # Verify content belongs to user (CRITICAL for multi-user safety)
    content_collection = get_content_collection(db)
    content = await content_collection.find_one({
        "_id": ObjectId(content_id),
        "user_id": str(current_user["_id"])
    })
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found or access denied"
        )
    
    # Activate document on AI server and get session_id
    session_id = await activate_document_on_ai_server(content_id, db)
    
    # Call AI service for question answering - no timeout for large documents, with retry on SSL errors
    try:
        async def ask_request():
            async with create_http_client() as client:
                headers = {
                    "ngrok-skip-browser-warning": "true",
                    "User-Agent": "PrepGen-Backend/1.0"
                }
                
                resp = await client.post(
                    f"{AI_SERVICE_URL}/ask",
                    json={
                        "session_id": session_id,
                        "question": request_body.question
                    },
                    headers=headers
                )
                
                # Check for ngrok errors (BEFORE raise_for_status!)
                if resp.status_code != 200:
                    if "ngrok" in resp.text.lower() or "<!DOCTYPE html>" in resp.text:
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="AI service is currently offline (ngrok tunnel not responding)"
                        )
                    resp.raise_for_status()  # Raise for other non-200 errors
                
                return resp
        
        response = await retry_request(ask_request)
        return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get answer: {str(e)}"
        )


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Delete a content item and its associated file.
    Thread-safe file deletion with proper error handling.
    
    Args:
        content_id: Content ID
        current_user: Current authenticated user
        db: Database instance
    """
    # Verify content belongs to user (CRITICAL for multi-user safety)
    content_collection = get_content_collection(db)
    content = await content_collection.find_one({
        "_id": ObjectId(content_id),
        "user_id": str(current_user["_id"])
    })
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found or access denied"
        )
    
    # Delete from database first (safer to have orphaned file than orphaned metadata)
    delete_result = await content_collection.delete_one({
        "_id": ObjectId(content_id),
        "user_id": str(current_user["_id"])  # Double-check user ownership
    })
    
    if delete_result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete content"
        )
    
    # Delete physical file using thread-safe file manager
    try:
        await file_manager.delete_file(content_id)
    except Exception as e:
        # Log error but don't fail the request since metadata is already deleted
        print(f"Warning: Failed to delete file {content_id}: {str(e)}")
    
    return None
