"""Payment Security Layer with Redis

This module provides security features for payment processing:
- Rate limiting to prevent abuse
- Idempotency keys to prevent duplicate payments
- Session validation to prevent replay attacks
- Payment intent caching
- Transaction locking
"""

import redis.asyncio as redis
import hashlib
import json
import time
from typing import Optional, Dict, Any
from datetime import timedelta
import os
import logging

logger = logging.getLogger(__name__)

class PaymentSecurityManager:
    """Manages payment security using Redis"""
    
    def __init__(self, redis_url: str = None):
        """Initialize Redis connection
        
        Args:
            redis_url: Redis connection URL (default: from environment or localhost)
        """
        self.redis_url = redis_url or os.environ.get('REDIS_URL', 'redis://localhost:6379')
        self.redis_client: Optional[redis.Redis] = None
        
    async def connect(self):
        """Establish Redis connection"""
        try:
            self.redis_client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            logger.info("Redis connection established for payment security")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis connection closed")
    
    # ============ Rate Limiting ============
    
    async def check_rate_limit(
        self,
        user_id: str,
        action: str = "payment",
        max_requests: int = 5,
        window_seconds: int = 60
    ) -> tuple[bool, int]:
        """Check if user has exceeded rate limit
        
        Args:
            user_id: User identifier
            action: Action type (payment, checkout, etc.)
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            
        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        key = f"rate_limit:{action}:{user_id}"
        
        try:
            # Get current count
            current = await self.redis_client.get(key)
            
            if current is None:
                # First request in window
                await self.redis_client.setex(key, window_seconds, "1")
                return True, max_requests - 1
            
            current_count = int(current)
            
            if current_count >= max_requests:
                # Rate limit exceeded
                ttl = await self.redis_client.ttl(key)
                logger.warning(f"Rate limit exceeded for user {user_id}, action {action}")
                return False, 0
            
            # Increment counter
            await self.redis_client.incr(key)
            return True, max_requests - current_count - 1
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Fail open - allow request if Redis is down
            return True, max_requests
    
    # ============ Idempotency Keys ============
    
    async def check_idempotency_key(
        self,
        idempotency_key: str,
        user_id: str,
        ttl_hours: int = 24
    ) -> Optional[Dict[str, Any]]:
        """Check if idempotency key exists and return cached response
        
        Args:
            idempotency_key: Unique key for this request
            user_id: User identifier
            ttl_hours: Time to live in hours
            
        Returns:
            Cached response if key exists, None otherwise
        """
        key = f"idempotency:{user_id}:{idempotency_key}"
        
        try:
            cached = await self.redis_client.get(key)
            if cached:
                logger.info(f"Idempotency key hit: {idempotency_key}")
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"Idempotency check failed: {e}")
            return None
    
    async def set_idempotency_response(
        self,
        idempotency_key: str,
        user_id: str,
        response: Dict[str, Any],
        ttl_hours: int = 24
    ):
        """Store response for idempotency key
        
        Args:
            idempotency_key: Unique key for this request
            user_id: User identifier
            response: Response to cache
            ttl_hours: Time to live in hours
        """
        key = f"idempotency:{user_id}:{idempotency_key}"
        
        try:
            await self.redis_client.setex(
                key,
                timedelta(hours=ttl_hours),
                json.dumps(response)
            )
            logger.info(f"Idempotency response cached: {idempotency_key}")
        except Exception as e:
            logger.error(f"Failed to cache idempotency response: {e}")
    
    # ============ Session Validation ============
    
    async def create_payment_session(
        self,
        session_id: str,
        user_id: str,
        amount: float,
        currency: str,
        cart_items: list,
        ttl_minutes: int = 30
    ) -> str:
        """Create secure payment session
        
        Args:
            session_id: Payment session ID
            user_id: User identifier
            amount: Payment amount
            currency: Currency code
            cart_items: List of cart items
            ttl_minutes: Time to live in minutes
            
        Returns:
            Session token for validation
        """
        key = f"payment_session:{session_id}"
        
        session_data = {
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "cart_items": cart_items,
            "created_at": time.time(),
            "status": "pending"
        }
        
        try:
            await self.redis_client.setex(
                key,
                timedelta(minutes=ttl_minutes),
                json.dumps(session_data)
            )
            
            # Generate session token (hash of session data)
            token = hashlib.sha256(
                f"{session_id}:{user_id}:{amount}:{time.time()}".encode()
            ).hexdigest()
            
            logger.info(f"Payment session created: {session_id}")
            return token
            
        except Exception as e:
            logger.error(f"Failed to create payment session: {e}")
            raise
    
    async def validate_payment_session(
        self,
        session_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Validate payment session
        
        Args:
            session_id: Payment session ID
            user_id: User identifier for verification
            
        Returns:
            Session data if valid, None otherwise
        """
        key = f"payment_session:{session_id}"
        
        try:
            cached = await self.redis_client.get(key)
            if not cached:
                logger.warning(f"Payment session not found: {session_id}")
                return None
            
            session_data = json.loads(cached)
            
            # Verify user owns this session
            if session_data.get("user_id") != user_id:
                logger.warning(f"User {user_id} attempted to access session for user {session_data.get('user_id')}")
                return None
            
            return session_data
            
        except Exception as e:
            logger.error(f"Session validation failed: {e}")
            return None
    
    async def update_payment_session_status(
        self,
        session_id: str,
        status: str,
        additional_data: Optional[Dict[str, Any]] = None
    ):
        """Update payment session status
        
        Args:
            session_id: Payment session ID
            status: New status (pending, paid, failed, cancelled)
            additional_data: Additional data to merge
        """
        key = f"payment_session:{session_id}"
        
        try:
            cached = await self.redis_client.get(key)
            if not cached:
                logger.warning(f"Cannot update non-existent session: {session_id}")
                return
            
            session_data = json.loads(cached)
            session_data["status"] = status
            session_data["updated_at"] = time.time()
            
            if additional_data:
                session_data.update(additional_data)
            
            # Extend TTL to 24 hours after completion
            ttl = timedelta(hours=24)
            await self.redis_client.setex(key, ttl, json.dumps(session_data))
            
            logger.info(f"Payment session updated: {session_id}, status: {status}")
            
        except Exception as e:
            logger.error(f"Failed to update session status: {e}")
    
    # ============ Transaction Locking ============
    
    async def acquire_payment_lock(
        self,
        user_id: str,
        timeout_seconds: int = 10
    ) -> bool:
        """Acquire lock for payment processing to prevent concurrent payments
        
        Args:
            user_id: User identifier
            timeout_seconds: Lock timeout
            
        Returns:
            True if lock acquired, False otherwise
        """
        key = f"payment_lock:{user_id}"
        
        try:
            # Try to set lock with NX (only if not exists)
            result = await self.redis_client.set(
                key,
                "locked",
                nx=True,
                ex=timeout_seconds
            )
            
            if result:
                logger.info(f"Payment lock acquired for user {user_id}")
                return True
            else:
                logger.warning(f"Payment lock already held for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to acquire payment lock: {e}")
            # Fail open - allow payment if Redis is down
            return True
    
    async def release_payment_lock(self, user_id: str):
        """Release payment lock
        
        Args:
            user_id: User identifier
        """
        key = f"payment_lock:{user_id}"
        
        try:
            await self.redis_client.delete(key)
            logger.info(f"Payment lock released for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to release payment lock: {e}")
    
    # ============ Payment Intent Caching ============
    
    async def cache_payment_intent(
        self,
        intent_id: str,
        data: Dict[str, Any],
        ttl_minutes: int = 30
    ):
        """Cache payment intent data
        
        Args:
            intent_id: Payment intent ID
            data: Intent data to cache
            ttl_minutes: Time to live in minutes
        """
        key = f"payment_intent:{intent_id}"
        
        try:
            await self.redis_client.setex(
                key,
                timedelta(minutes=ttl_minutes),
                json.dumps(data)
            )
            logger.info(f"Payment intent cached: {intent_id}")
        except Exception as e:
            logger.error(f"Failed to cache payment intent: {e}")
    
    async def get_cached_payment_intent(
        self,
        intent_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get cached payment intent
        
        Args:
            intent_id: Payment intent ID
            
        Returns:
            Cached intent data or None
        """
        key = f"payment_intent:{intent_id}"
        
        try:
            cached = await self.redis_client.get(key)
            if cached:
                logger.info(f"Payment intent cache hit: {intent_id}")
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"Failed to get cached payment intent: {e}")
            return None
    
    # ============ Webhook Replay Prevention ============
    
    async def check_webhook_processed(
        self,
        webhook_id: str,
        ttl_days: int = 7
    ) -> bool:
        """Check if webhook has already been processed
        
        Args:
            webhook_id: Unique webhook identifier
            ttl_days: Days to keep webhook record
            
        Returns:
            True if already processed, False otherwise
        """
        key = f"webhook_processed:{webhook_id}"
        
        try:
            exists = await self.redis_client.exists(key)
            return bool(exists)
        except Exception as e:
            logger.error(f"Failed to check webhook status: {e}")
            return False
    
    async def mark_webhook_processed(
        self,
        webhook_id: str,
        ttl_days: int = 7
    ):
        """Mark webhook as processed
        
        Args:
            webhook_id: Unique webhook identifier
            ttl_days: Days to keep webhook record
        """
        key = f"webhook_processed:{webhook_id}"
        
        try:
            await self.redis_client.setex(
                key,
                timedelta(days=ttl_days),
                "1"
            )
            logger.info(f"Webhook marked as processed: {webhook_id}")
        except Exception as e:
            logger.error(f"Failed to mark webhook as processed: {e}")


# Global instance
payment_security: Optional[PaymentSecurityManager] = None


def get_payment_security() -> PaymentSecurityManager:
    """Get payment security manager instance"""
    global payment_security
    if payment_security is None:
        payment_security = PaymentSecurityManager()
    return payment_security
