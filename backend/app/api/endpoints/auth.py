from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.security import get_password_hash, create_access_token
from app.db.database import get_db, get_user_collection
from app.schemas.user_schema import User, UserCreate, Token

router = APIRouter()

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)


@router.get("/google/login")
async def google_login(request: Request):
    """
    Initiate Google OAuth2 login flow.
    
    Args:
        request: FastAPI request object
        
    Returns:
        RedirectResponse: Redirect to Google OAuth consent screen
    """
    redirect_uri = request.url_for('auth_via_google')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name='auth_via_google')
async def auth_via_google(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Handle Google OAuth2 callback and create/login user.
    
    Args:
        request: FastAPI request object
        db: Database instance
        
    Returns:
        RedirectResponse: Redirect to frontend with JWT token
    """
    try:
        # Get access token from Google
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get access token: {str(e)}"
        )
    
    # Get user info from token
    userinfo = token.get('userinfo')
    if not userinfo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user info from token"
        )
    
    email = userinfo.get('email')
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not found in user info"
        )
    
    # Check if user exists
    users_collection = get_user_collection(db)
    user = await users_collection.find_one({"email": email})
    
    if not user:
        # Create new user
        try:
            print(f"[DEBUG] Creating new user with email: {email}")
            print(f"[DEBUG] Google profile picture URL: {userinfo.get('picture')}")
            new_user = {
                "email": email,
                "full_name": userinfo.get('name', email.split('@')[0]),
                "google_id": userinfo.get('sub'),
                "picture": userinfo.get('picture'),
                # Fixed-hash placeholder for Google OAuth users (they never use password login)
                # Using a pre-known bcrypt hash of "x" to avoid hashing errors
                "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5oDh3cCVRDhpu"
            }
            
            result = await users_collection.insert_one(new_user)
            new_user['_id'] = result.inserted_id
            user = new_user
            print(f"[DEBUG] New user created successfully: {email}")
        except Exception as e:
            print(f"[ERROR] Failed to create new user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user account: {str(e)}"
            )
    else:
        # User exists, check if picture needs to be updated
        print(f"[DEBUG] Existing user logged in: {email}")
        print(f"[DEBUG] User has picture in DB: {user.get('picture') is not None}")
        print(f"[DEBUG] Google userinfo data: {userinfo}")
        
        # Update picture if it's missing or different (Google profile pics can change)
        google_picture = userinfo.get('picture')
        print(f"[DEBUG] Google picture URL: {google_picture}")
        
        if google_picture and user.get('picture') != google_picture:
            print(f"[DEBUG] Updating user picture from Google to: {google_picture}")
            await users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"picture": google_picture}}
            )
            user['picture'] = google_picture
        elif not google_picture:
            print(f"[DEBUG] Google did not provide a picture URL")
    
    # Create JWT access token
    access_token = create_access_token(data={"sub": email})
    
    # Redirect to frontend with token
    frontend_url = settings.FRONTEND_URL
    redirect_url = f"{frontend_url}?token={access_token}"
    
    return RedirectResponse(url=redirect_url)


@router.post("/register", response_model=Token)
async def register(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Register a new user with email and password.
    
    Args:
        user_data: User registration data
        db: Database instance
        
    Returns:
        Token: JWT access token
    """
    users_collection = get_user_collection(db)
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hashed_password
    }
    
    await users_collection.insert_one(new_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    
    return {"access_token": access_token, "token_type": "bearer"}
