from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from app.core.config import settings


# Initialize MongoDB client
client: AsyncIOMotorClient = AsyncIOMotorClient(settings.DATABASE_URL)

# Get database instance
database: AsyncIOMotorDatabase = client.prepgenDB


async def get_db() -> AsyncIOMotorDatabase:
    """
    Dependency function to get the database instance.
    
    Returns:
        AsyncIOMotorDatabase: The database instance
    """
    return database


def get_user_collection(db: AsyncIOMotorDatabase) -> AsyncIOMotorCollection:
    """
    Get the users collection.
    
    Args:
        db: Database instance
        
    Returns:
        AsyncIOMotorCollection: Users collection
    """
    return db.users


def get_content_collection(db: AsyncIOMotorDatabase) -> AsyncIOMotorCollection:
    """
    Get the content collection.
    
    Args:
        db: Database instance
        
    Returns:
        AsyncIOMotorCollection: Content collection
    """
    return db.content


def get_quiz_results_collection(db: AsyncIOMotorDatabase) -> AsyncIOMotorCollection:
    """
    Get the quiz results collection.
    
    Args:
        db: Database instance
        
    Returns:
        AsyncIOMotorCollection: Quiz results collection
    """
    return db.quiz_results
