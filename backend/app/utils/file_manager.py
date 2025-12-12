"""
Thread-safe file manager for handling concurrent file operations.
Prevents race conditions when multiple users upload/delete files simultaneously.
"""

import os
import asyncio
import aiofiles
import hashlib
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
from datetime import datetime


class FileManager:
    """
    Manages file operations with proper locking to prevent race conditions.
    Ensures data safety during concurrent multi-user access.
    """
    
    def __init__(self, upload_directory: str):
        """
        Initialize file manager with upload directory.
        
        Args:
            upload_directory: Base directory for file uploads
        """
        self.upload_directory = Path(upload_directory)
        self.upload_directory.mkdir(parents=True, exist_ok=True)
        
        # Lock for each file (identified by content_id)
        self._file_locks = {}
        self._locks_lock = asyncio.Lock()  # Lock for the locks dict itself
    
    
    async def _get_file_lock(self, file_id: str) -> asyncio.Lock:
        """
        Get or create a lock for a specific file.
        
        Args:
            file_id: Unique identifier for the file
            
        Returns:
            asyncio.Lock: Lock object for the file
        """
        async with self._locks_lock:
            if file_id not in self._file_locks:
                self._file_locks[file_id] = asyncio.Lock()
            return self._file_locks[file_id]
    
    
    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to prevent path traversal attacks.
        
        Args:
            filename: Original filename
            
        Returns:
            str: Sanitized filename
        """
        # Remove any path separators
        filename = os.path.basename(filename)
        
        # Remove any potentially dangerous characters
        dangerous_chars = ['..', '/', '\\', '\x00']
        for char in dangerous_chars:
            filename = filename.replace(char, '_')
        
        return filename
    
    
    def get_file_path(self, content_id: str) -> Path:
        """
        Get the full path for a file.
        
        Args:
            content_id: Content ID (used as filename)
            
        Returns:
            Path: Full file path
        """
        # Validate content_id to prevent path traversal
        if '..' in content_id or '/' in content_id or '\\' in content_id:
            raise ValueError("Invalid content_id: contains path traversal characters")
        
        return self.upload_directory / content_id
    
    
    async def save_upload_file(
        self,
        file: UploadFile,
        content_id: str
    ) -> tuple[str, int]:
        """
        Safely save an uploaded file with locking.
        
        Args:
            file: Uploaded file object
            content_id: Unique content ID for the file
            
        Returns:
            tuple[str, int]: (file_path, file_size)
            
        Raises:
            Exception: If file save fails
        """
        file_lock = await self._get_file_lock(content_id)
        
        async with file_lock:
            file_path = self.get_file_path(content_id)
            
            # Ensure file doesn't already exist
            if file_path.exists():
                raise FileExistsError(f"File {content_id} already exists")
            
            # Write file atomically using temporary file
            temp_path = file_path.with_suffix('.tmp')
            file_size = 0
            
            try:
                # Read and write in chunks to handle large files
                async with aiofiles.open(temp_path, 'wb') as f:
                    while chunk := await file.read(1024 * 1024):  # 1MB chunks
                        await f.write(chunk)
                        file_size += len(chunk)
                
                # Atomic rename (replaces if exists on most systems)
                temp_path.rename(file_path)
                
                return str(file_path), file_size
                
            except Exception as e:
                # Cleanup on failure
                if temp_path.exists():
                    temp_path.unlink()
                raise Exception(f"Failed to save file: {str(e)}")
    
    
    async def save_upload_file_sync(
        self,
        file: UploadFile,
        content_id: str
    ) -> tuple[str, int]:
        """
        Save uploaded file using synchronous operations (for compatibility).
        Still uses locking for safety.
        
        Args:
            file: Uploaded file object
            content_id: Unique content ID
            
        Returns:
            tuple[str, int]: (file_path, file_size)
        """
        file_lock = await self._get_file_lock(content_id)
        
        async with file_lock:
            file_path = self.get_file_path(content_id)
            
            if file_path.exists():
                raise FileExistsError(f"File {content_id} already exists")
            
            temp_path = file_path.with_suffix('.tmp')
            file_size = 0
            
            try:
                with open(temp_path, 'wb') as f:
                    # Reset file pointer
                    await file.seek(0)
                    
                    # Read in chunks
                    while chunk := await file.read(1024 * 1024):
                        f.write(chunk)
                        file_size += len(chunk)
                
                # Atomic rename
                os.replace(str(temp_path), str(file_path))
                
                return str(file_path), file_size
                
            except Exception as e:
                if temp_path.exists():
                    temp_path.unlink()
                raise Exception(f"Failed to save file: {str(e)}")
    
    
    async def delete_file(self, content_id: str) -> bool:
        """
        Safely delete a file with locking.
        
        Args:
            content_id: Content ID
            
        Returns:
            bool: True if deleted, False if file didn't exist
        """
        file_lock = await self._get_file_lock(content_id)
        
        async with file_lock:
            file_path = self.get_file_path(content_id)
            
            if not file_path.exists():
                return False
            
            try:
                file_path.unlink()
                return True
            except Exception as e:
                raise Exception(f"Failed to delete file: {str(e)}")
    
    
    async def file_exists(self, content_id: str) -> bool:
        """
        Check if a file exists.
        
        Args:
            content_id: Content ID
            
        Returns:
            bool: True if file exists
        """
        file_path = self.get_file_path(content_id)
        return file_path.exists()
    
    
    async def get_file_size(self, content_id: str) -> Optional[int]:
        """
        Get file size in bytes.
        
        Args:
            content_id: Content ID
            
        Returns:
            Optional[int]: File size or None if doesn't exist
        """
        file_path = self.get_file_path(content_id)
        
        if not file_path.exists():
            return None
        
        return file_path.stat().st_size
    
    
    async def calculate_file_hash(self, content_id: str) -> Optional[str]:
        """
        Calculate SHA-256 hash of file for integrity verification.
        
        Args:
            content_id: Content ID
            
        Returns:
            Optional[str]: SHA-256 hash or None if file doesn't exist
        """
        file_path = self.get_file_path(content_id)
        
        if not file_path.exists():
            return None
        
        sha256_hash = hashlib.sha256()
        
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(8192):
                sha256_hash.update(chunk)
        
        return sha256_hash.hexdigest()
    
    
    async def cleanup_locks(self):
        """
        Clean up unused file locks to prevent memory leaks.
        Should be called periodically.
        """
        async with self._locks_lock:
            # Remove locks that are not currently acquired
            to_remove = []
            for file_id, lock in self._file_locks.items():
                if not lock.locked():
                    to_remove.append(file_id)
            
            for file_id in to_remove:
                del self._file_locks[file_id]


# Global file manager instance
_file_manager: Optional[FileManager] = None


def get_file_manager(upload_directory: str = "./uploads") -> FileManager:
    """
    Get the global file manager instance.
    
    Args:
        upload_directory: Upload directory path
        
    Returns:
        FileManager: Global file manager instance
    """
    global _file_manager
    
    if _file_manager is None:
        _file_manager = FileManager(upload_directory)
    
    return _file_manager
