"""
Request Queue Manager for AI Service
Ensures all requests to Kalash's AI service are queued and processed sequentially
to prevent lost requests during concurrent access.
"""

import asyncio
from typing import Dict, Callable, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AIRequestQueue:
    """
    Manages queued requests to the AI service to prevent concurrent access issues.
    Ensures all requests are processed in order without loss.
    """
    
    def __init__(self):
        self._queues: Dict[str, asyncio.Queue] = {}  # One queue per user
        self._workers: Dict[str, asyncio.Task] = {}  # One worker per user
        self._lock = asyncio.Lock()
    
    async def _worker(self, user_id: str):
        """
        Worker that processes queued requests for a specific user.
        
        Args:
            user_id: User identifier
        """
        queue = self._queues[user_id]
        
        while True:
            try:
                # Get next request from queue
                request_data = await queue.get()
                
                if request_data is None:  # Shutdown signal
                    break
                
                callback = request_data['callback']
                args = request_data['args']
                kwargs = request_data['kwargs']
                result_future = request_data['future']
                
                logger.info(f"Processing AI request for user {user_id}")
                
                try:
                    # Execute the actual AI service call
                    result = await callback(*args, **kwargs)
                    result_future.set_result(result)
                    logger.info(f"AI request completed for user {user_id}")
                    
                except Exception as e:
                    logger.error(f"AI request failed for user {user_id}: {str(e)}")
                    result_future.set_exception(e)
                
                finally:
                    queue.task_done()
                    
            except Exception as e:
                logger.error(f"Worker error for user {user_id}: {str(e)}")
    
    async def enqueue_request(
        self,
        user_id: str,
        callback: Callable,
        *args,
        **kwargs
    ) -> Any:
        """
        Enqueue an AI service request for processing.
        
        Args:
            user_id: User identifier
            callback: Async function to execute
            *args: Positional arguments for callback
            **kwargs: Keyword arguments for callback
            
        Returns:
            Result from the callback function
        """
        async with self._lock:
            # Create queue and worker if they don't exist for this user
            if user_id not in self._queues:
                self._queues[user_id] = asyncio.Queue()
                self._workers[user_id] = asyncio.create_task(self._worker(user_id))
                logger.info(f"Created request queue for user {user_id}")
        
        # Create a future to hold the result
        result_future = asyncio.Future()
        
        # Add request to queue
        await self._queues[user_id].put({
            'callback': callback,
            'args': args,
            'kwargs': kwargs,
            'future': result_future,
            'timestamp': datetime.now()
        })
        
        logger.info(f"Queued AI request for user {user_id}, queue size: {self._queues[user_id].qsize()}")
        
        # Wait for result
        return await result_future
    
    async def get_queue_size(self, user_id: str) -> int:
        """Get the current queue size for a user."""
        if user_id not in self._queues:
            return 0
        return self._queues[user_id].qsize()
    
    async def shutdown(self):
        """Shutdown all workers gracefully."""
        async with self._lock:
            for user_id, queue in self._queues.items():
                await queue.put(None)  # Shutdown signal
            
            # Wait for all workers to finish
            if self._workers:
                await asyncio.gather(*self._workers.values(), return_exceptions=True)
            
            self._queues.clear()
            self._workers.clear()
            logger.info("Request queue manager shutdown complete")


# Global queue manager instance
_queue_manager: Optional[AIRequestQueue] = None


def get_queue_manager() -> AIRequestQueue:
    """Get the global queue manager instance."""
    global _queue_manager
    if _queue_manager is None:
        _queue_manager = AIRequestQueue()
    return _queue_manager
