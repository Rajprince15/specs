"""
API Rate Limiting using SlowAPI
"""
import os
import logging
from typing import Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)


def get_user_id_or_ip(request: Request) -> str:
    """
    Get user ID from JWT token if authenticated, otherwise use IP address
    """
    # Try to get user ID from request state (set by auth middleware)
    if hasattr(request.state, 'user_id'):
        return f"user:{request.state.user_id}"
    
    # Try to get user ID from Authorization header
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            # Import here to avoid circular dependency
            from jose import jwt
            token = auth_header.split(' ')[1]
            payload = jwt.decode(
                token,
                os.getenv('JWT_SECRET', 'your-secret-key'),
                algorithms=['HS256']
            )
            user_id = payload.get('user_id')
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass
    
    # Fallback to IP address
    return f"ip:{get_remote_address(request)}"


def create_limiter(
    default_limit: str = "100/minute",
    storage_uri: Optional[str] = None,
) -> Limiter:
    """
    Create and configure rate limiter
    
    Args:
        default_limit: Default rate limit (e.g., "100/minute", "1000/hour", "10/second")
        storage_uri: Redis URI for distributed rate limiting (optional)
    
    Returns:
        Configured Limiter instance
    """
    # Use Redis if available, otherwise use in-memory storage
    if storage_uri is None:
        redis_url = os.getenv('REDIS_URL')
        if redis_url:
            storage_uri = redis_url.replace('redis://', 'redis://')
            logger.info(f"Using Redis for rate limiting: {storage_uri}")
        else:
            logger.warning("Redis not configured. Using in-memory rate limiting.")
    
    limiter = Limiter(
        key_func=get_user_id_or_ip,
        default_limits=[default_limit],
        storage_uri=storage_uri,
        # Strategy: fixed-window, fixed-window-elastic-expiry, or moving-window
        strategy="fixed-window",
        # Headers to include in response
        headers_enabled=True,
        # Retry-After header
        retry_after="http-date",
    )
    
    return limiter


def rate_limit_error_handler(request: Request, exc: RateLimitExceeded) -> HTTPException:
    """
    Custom error handler for rate limit exceeded
    """
    logger.warning(
        f"Rate limit exceeded",
        extra={
            'endpoint': request.url.path,
            'method': request.method,
            'identifier': get_user_id_or_ip(request),
        }
    )
    
    raise HTTPException(
        status_code=429,
        detail={
            'error': 'Rate limit exceeded',
            'message': 'Too many requests. Please try again later.',
            'retry_after': exc.retry_after if hasattr(exc, 'retry_after') else None,
        }
    )


# Common rate limit presets
RateLimit = {
    # Strict limits for authentication endpoints
    'auth': "5/minute",
    'login': "10/minute",
    'register': "5/minute",
    
    # Moderate limits for read operations
    'read': "100/minute",
    'search': "30/minute",
    
    # Stricter limits for write operations
    'write': "30/minute",
    'create': "20/minute",
    'update': "30/minute",
    'delete': "20/minute",
    
    # Very strict limits for payment operations
    'payment': "5/minute",
    'checkout': "3/minute",
    
    # Admin operations
    'admin': "50/minute",
    
    # Default
    'default': "100/minute",
}
