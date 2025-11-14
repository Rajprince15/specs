"""
Structured JSON logging configuration
"""
import logging
import json
import sys
from datetime import datetime
from typing import Any, Dict


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record as JSON
        """
        log_data: Dict[str, Any] = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': self.formatException(record.exc_info)
            }
        
        # Add extra fields if present
        if hasattr(record, 'extra_data'):
            log_data['extra'] = record.extra_data
        
        # Add user context if present
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        
        # Add request context if present
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        
        if hasattr(record, 'endpoint'):
            log_data['endpoint'] = record.endpoint
        
        if hasattr(record, 'method'):
            log_data['method'] = record.method
        
        if hasattr(record, 'status_code'):
            log_data['status_code'] = record.status_code
        
        if hasattr(record, 'duration_ms'):
            log_data['duration_ms'] = record.duration_ms
        
        return json.dumps(log_data)


def setup_logging(log_level: str = 'INFO', json_format: bool = True) -> None:
    """
    Setup application logging with JSON format
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: Use JSON formatter if True, else use standard format
    """
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    
    # Set formatter
    if json_format:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    root_logger.handlers = [handler]
    
    # Reduce noise from noisy libraries
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('httpcore').setLevel(logging.WARNING)


class LoggerAdapter(logging.LoggerAdapter):
    """
    Custom logger adapter for adding context to log records
    """
    
    def process(self, msg, kwargs):
        """
        Add context from self.extra to log record
        """
        if 'extra' not in kwargs:
            kwargs['extra'] = {}
        
        # Add all context from adapter to record
        for key, value in self.extra.items():
            kwargs['extra'][key] = value
        
        return msg, kwargs


def get_logger(name: str, **context) -> LoggerAdapter:
    """
    Get a logger with optional context
    
    Args:
        name: Logger name (usually __name__)
        **context: Additional context to include in all log messages
    
    Returns:
        LoggerAdapter instance
    """
    logger = logging.getLogger(name)
    return LoggerAdapter(logger, context)
