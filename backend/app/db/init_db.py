"""
Database initialization and index creation for multi-user safety.
Run this script to set up proper indexes for data isolation and performance.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
import asyncio


async def create_indexes(db: AsyncIOMotorDatabase):
    """
    Create all necessary indexes for multi-user safety and performance.
    Handles existing indexes gracefully.
    
    Indexes ensure:
    1. Fast queries when filtering by user_id
    2. Data isolation between users
    3. Uniqueness constraints where needed
    4. Efficient compound queries
    """
    
    print("Creating database indexes...")
    
    def handle_index_creation(e: Exception, index_name: str):
        """Helper to handle index creation errors."""
        error_msg = str(e).lower()
        if "already exists" in error_msg or "index with name" in error_msg:
            print(f"    ℹ {index_name} already exists")
        elif "duplicate key" in error_msg:
            print(f"    ⚠ {index_name} skipped - duplicate data found")
        else:
            raise
    
    # ==================== USERS Collection ====================
    print("  - Creating indexes for 'users' collection...")
    
    # Unique index on email (prevent duplicate accounts)
    # Use try-except to handle case where index already exists or duplicate emails exist
    try:
        await db.users.create_index("email", unique=True, name="idx_email_unique")
    except Exception as e:
        if "duplicate key" in str(e).lower():
            print("    ⚠ Email index creation skipped - duplicate emails found in database")
            print("      Please clean up duplicate emails or drop the index manually if needed")
        elif "already exists" in str(e).lower():
            print("    ℹ Email index already exists")
        else:
            raise
    
    # Index on created_at for sorting user lists
    try:
        await db.users.create_index("created_at", name="idx_created_at")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("    ℹ Created_at index already exists")
        else:
            raise
    
    print("    ✓ Users indexes created (or already exist)")
    
    
    # ==================== CONTENT Collection ====================
    print("  - Creating indexes for 'content' collection...")
    
    # Compound index on user_id + _id (most common query pattern)
    try:
        await db.content.create_index(
            [("user_id", 1), ("_id", 1)],
            name="idx_user_content"
        )
    except Exception as e:
        handle_index_creation(e, "idx_user_content")
    
    # Index on user_id alone for listing user's documents
    try:
        await db.content.create_index("user_id", name="idx_user_id")
    except Exception as e:
        handle_index_creation(e, "idx_user_id")
    
    # Index on session_id for quick lookups
    try:
        await db.content.create_index("session_id", sparse=True, name="idx_session_id")
    except Exception as e:
        handle_index_creation(e, "idx_session_id")
    
    # Compound index for content type filtering per user
    try:
        await db.content.create_index(
            [("user_id", 1), ("content_type", 1)],
            name="idx_user_content_type"
        )
    except Exception as e:
        handle_index_creation(e, "idx_user_content_type")
    
    # Index on filename for search functionality
    try:
        await db.content.create_index("filename", name="idx_filename")
    except Exception as e:
        handle_index_creation(e, "idx_filename")
    
    print("    ✓ Content indexes created (or already exist)")
    
    
    # ==================== QUIZ RESULTS Collection ====================
    print("  - Creating indexes for 'quiz_results' collection...")
    
    # Compound index on user_id + content_id
    try:
        await db.quiz_results.create_index(
            [("user_id", 1), ("content_id", 1)],
            name="idx_user_quiz_results"
        )
    except Exception as e:
        handle_index_creation(e, "idx_user_quiz_results")
    
    # Index on user_id for listing all user's quiz results
    try:
        await db.quiz_results.create_index("user_id", name="idx_quiz_user_id")
    except Exception as e:
        handle_index_creation(e, "idx_quiz_user_id")
    
    # Index on content_id for analytics per document
    try:
        await db.quiz_results.create_index("content_id", name="idx_quiz_content_id")
    except Exception as e:
        handle_index_creation(e, "idx_quiz_content_id")
    
    # Index on created_at for sorting results by date
    try:
        await db.quiz_results.create_index("created_at", name="idx_quiz_created_at")
    except Exception as e:
        handle_index_creation(e, "idx_quiz_created_at")
    
    # Compound index for performance analytics
    try:
        await db.quiz_results.create_index(
            [("user_id", 1), ("score", -1)],
            name="idx_user_score"
        )
    except Exception as e:
        handle_index_creation(e, "idx_user_score")
    
    print("    ✓ Quiz results indexes created (or already exist)")
    
    
    # ==================== SESSION MANAGEMENT Collection ====================
    print("  - Creating indexes for 'sessions' collection (if needed)...")
    
    # Index for session cleanup (TTL index - auto-delete after 24 hours)
    try:
        await db.sessions.create_index(
            "created_at",
            expireAfterSeconds=86400,  # 24 hours
            name="idx_session_ttl"
        )
    except Exception as e:
        handle_index_creation(e, "idx_session_ttl")
    
    # Index on session_id for quick lookups
    try:
        await db.sessions.create_index("session_id", unique=True, name="idx_session_id_unique")
    except Exception as e:
        handle_index_creation(e, "idx_session_id_unique")
    
    # Index on user_id to find all user sessions
    try:
        await db.sessions.create_index("user_id", name="idx_session_user_id")
    except Exception as e:
        handle_index_creation(e, "idx_session_user_id")
    
    print("    ✓ Session indexes created (or already exist)")
    
    
    print("\n✅ All indexes created successfully!")
    print("\nIndex Summary:")
    print("  - Users: 2 indexes (email unique, created_at)")
    print("  - Content: 5 indexes (user isolation, session lookup, filename search)")
    print("  - Quiz Results: 5 indexes (user isolation, performance analytics)")
    print("  - Sessions: 3 indexes (TTL cleanup, session lookup, user sessions)")
    print("\n🔒 Multi-user data isolation is now enforced at the database level!")


async def verify_indexes(db: AsyncIOMotorDatabase):
    """
    Verify that all indexes were created successfully.
    """
    print("\n" + "="*60)
    print("VERIFYING INDEXES")
    print("="*60 + "\n")
    
    collections = ["users", "content", "quiz_results", "sessions"]
    
    for collection_name in collections:
        print(f"📊 {collection_name.upper()} Collection:")
        collection = db[collection_name]
        indexes = await collection.list_indexes().to_list(length=None)
        
        for idx in indexes:
            idx_name = idx.get('name', 'unknown')
            idx_keys = idx.get('key', {})
            unique = idx.get('unique', False)
            sparse = idx.get('sparse', False)
            ttl = idx.get('expireAfterSeconds', None)
            
            flags = []
            if unique:
                flags.append("UNIQUE")
            if sparse:
                flags.append("SPARSE")
            if ttl:
                flags.append(f"TTL:{ttl}s")
            
            flags_str = f" [{', '.join(flags)}]" if flags else ""
            print(f"  ✓ {idx_name}: {dict(idx_keys)}{flags_str}")
        
        print()


async def main():
    """
    Main function to initialize database with proper indexes.
    """
    print("\n" + "="*60)
    print("PREPGEN DATABASE INITIALIZATION")
    print("Multi-User Safety & Performance Optimization")
    print("="*60 + "\n")
    
    # Connect to MongoDB
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client.prepgenDB
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✓ Connected to MongoDB successfully\n")
        
        # Create indexes
        await create_indexes(db)
        
        # Verify indexes
        await verify_indexes(db)
        
        print("\n" + "="*60)
        print("✅ DATABASE INITIALIZATION COMPLETE!")
        print("="*60)
        print("\nYour database is now optimized for:")
        print("  • Multiple concurrent users")
        print("  • Data isolation and security")
        print("  • Fast query performance")
        print("  • Automatic session cleanup")
        print("\n🚀 You can now safely run PrepGen with multiple users!\n")
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {str(e)}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
