"""
Error tracking and monitoring with Sentry
"""
import os
import logging
from typing import Optional, Dict, Any
from functools import wraps

try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False

logger = logging.getLogger(__name__)


def initialize_sentry(
    dsn: Optional[str] = None,
    environment: str = 'development',
    release: Optional[str] = None,
    traces_sample_rate: float = 0.1,
) -> bool:
    """
    Initialize Sentry error tracking
    
    Args:
        dsn: Sentry DSN (Data Source Name)
        environment: Environment name (development, staging, production)
        release: Release version
        traces_sample_rate: Sampling rate for performance monitoring (0.0 to 1.0)
    
    Returns:
        True if initialized successfully, False otherwise
    """
    if not SENTRY_AVAILABLE:
        logger.warning("Sentry SDK not installed. Error tracking disabled.")
        return False
    
    dsn = dsn or os.getenv('SENTRY_DSN')
    if not dsn:
        logger.info("Sentry DSN not configured. Error tracking disabled.")
        return False
    
    try:
        # Configure logging integration
        logging_integration = LoggingIntegration(
            level=logging.INFO,  # Capture info and above as breadcrumbs
            event_level=logging.ERROR  # Send errors as events
        )
        
        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            release=release or os.getenv('APP_VERSION', 'unknown'),
            integrations=[
                FastApiIntegration(),
                RedisIntegration(),
                logging_integration,
            ],
            traces_sample_rate=traces_sample_rate,
            # Set send_default_pii to True if you want to send user data
            send_default_pii=False,
            # Filter out health check endpoints
            before_send=_before_send_filter,
        )
        
        logger.info(f"Sentry initialized successfully (environment: {environment})")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")
        return False


def _before_send_filter(event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Filter events before sending to Sentry
    
    Returns None to drop the event, or the modified event to send it
    """
    # Don't send health check errors
    if event.get('transaction') in ['/health', '/api/health']:
        return None
    
    # Don't send 404 errors for static files
    if event.get('request', {}).get('url', '').endswith(('.map', '.ico', '.png', '.jpg')):
        return None
    
    return event


def capture_exception(error: Exception, **context) -> Optional[str]:
    """
    Capture an exception and send to Sentry
    
    Args:
        error: The exception to capture
        **context: Additional context to attach
    
    Returns:
        Event ID if sent, None otherwise
    """
    if not SENTRY_AVAILABLE:
        return None
    
    try:
        with sentry_sdk.push_scope() as scope:
            # Add context
            for key, value in context.items():
                scope.set_extra(key, value)
            
            # Capture exception
            event_id = sentry_sdk.capture_exception(error)
            return event_id
    except Exception as e:
        logger.error(f"Failed to capture exception in Sentry: {e}")
        return None


def capture_message(message: str, level: str = 'info', **context) -> Optional[str]:
    """
    Capture a message and send to Sentry
    
    Args:
        message: The message to capture
        level: Severity level (debug, info, warning, error, fatal)
        **context: Additional context to attach
    
    Returns:
        Event ID if sent, None otherwise
    """
    if not SENTRY_AVAILABLE:
        return None
    
    try:
        with sentry_sdk.push_scope() as scope:
            # Add context
            for key, value in context.items():
                scope.set_extra(key, value)
            
            # Capture message
            event_id = sentry_sdk.capture_message(message, level=level)
            return event_id
    except Exception as e:
        logger.error(f"Failed to capture message in Sentry: {e}")
        return None


def set_user_context(user_id: str, email: Optional[str] = None, username: Optional[str] = None) -> None:
    """
    Set user context for Sentry events
    
    Args:
        user_id: User ID
        email: User email (optional)
        username: Username (optional)
    """
    if not SENTRY_AVAILABLE:
        return
    
    try:
        sentry_sdk.set_user({
            'id': user_id,
            'email': email,
            'username': username,
        })
    except Exception as e:
        logger.error(f"Failed to set user context in Sentry: {e}")


def clear_user_context() -> None:
    """
    Clear user context from Sentry
    """
    if not SENTRY_AVAILABLE:
        return
    
    try:
        sentry_sdk.set_user(None)
    except Exception as e:
        logger.error(f"Failed to clear user context in Sentry: {e}")


def track_error(func):
    """
    Decorator to automatically track errors in Sentry
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            capture_exception(e, function=func.__name__)
            raise
    
    return wrapper
