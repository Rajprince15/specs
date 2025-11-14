"""
Custom middleware for request tracking and error handling
"""
import time
import uuid
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class RequestTrackerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track requests and add request ID
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Add request ID to response headers
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Add headers
            response.headers['X-Request-ID'] = request_id
            response.headers['X-Process-Time'] = f"{duration_ms:.2f}ms"
            
            # Log request
            logger.info(
                f"{request.method} {request.url.path}",
                extra={
                    'request_id': request_id,
                    'method': request.method,
                    'endpoint': request.url.path,
                    'status_code': response.status_code,
                    'duration_ms': round(duration_ms, 2),
                    'user_agent': request.headers.get('user-agent', 'unknown'),
                }
            )
            
            return response
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    'request_id': request_id,
                    'method': request.method,
                    'endpoint': request.url.path,
                    'duration_ms': round(duration_ms, 2),
                    'error': str(e),
                },
                exc_info=True
            )
            raise


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle errors and return consistent error responses
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except Exception as e:
            # Log error
            logger.error(
                f"Unhandled error: {str(e)}",
                extra={
                    'request_id': getattr(request.state, 'request_id', 'unknown'),
                    'method': request.method,
                    'endpoint': request.url.path,
                },
                exc_info=True
            )
            
            # Return error response
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=500,
                content={
                    'error': 'Internal server error',
                    'message': 'An unexpected error occurred. Please try again later.',
                    'request_id': getattr(request.state, 'request_id', 'unknown'),
                }
            )
