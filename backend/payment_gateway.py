"""Payment Gateway Abstraction Layer

This module provides a unified interface for multiple payment gateways.
Currently supports: Stripe, Razorpay
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel
import os
import logging

logger = logging.getLogger(__name__)

# ============ Response Models ============

class CheckoutResponse(BaseModel):
    """Unified checkout session response"""
    session_id: str
    url: Optional[str] = None  # Redirect URL for Stripe
    amount: float
    currency: str
    gateway: str  # 'stripe' or 'razorpay'
    key_id: Optional[str] = None  # For Razorpay frontend integration

class PaymentStatusResponse(BaseModel):
    """Unified payment status response"""
    session_id: str
    payment_status: str  # 'pending', 'paid', 'failed', 'cancelled'
    status: str  # Detailed status from gateway
    amount_total: Optional[float] = None
    currency: Optional[str] = None

class WebhookResponse(BaseModel):
    """Unified webhook response"""
    session_id: str
    payment_status: str
    event_type: str

# ============ Abstract Base Class ============

class PaymentGateway(ABC):
    """Abstract base class for payment gateways"""
    
    def __init__(self, gateway_name: str):
        self.gateway_name = gateway_name
    
    @abstractmethod
    async def create_checkout_session(
        self,
        amount: float,
        currency: str,
        success_url: str,
        cancel_url: str,
        metadata: Dict[str, Any]
    ) -> CheckoutResponse:
        """Create a checkout session and return session details"""
        pass
    
    @abstractmethod
    async def get_payment_status(self, session_id: str) -> PaymentStatusResponse:
        """Get payment status by session ID"""
        pass
    
    @abstractmethod
    async def verify_webhook(self, body: bytes, signature: str) -> WebhookResponse:
        """Verify and process webhook"""
        pass

# ============ Stripe Gateway ============

class StripeGateway(PaymentGateway):
    """Stripe payment gateway implementation"""
    
    def __init__(self, api_key: str, webhook_url: str):
        super().__init__("stripe")
        from emergentintegrations.payments.stripe.checkout import (
            StripeCheckout,
            CheckoutSessionRequest
        )
        self.client = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        self.CheckoutSessionRequest = CheckoutSessionRequest
        self.api_key = api_key
        self.webhook_url = webhook_url
    
    async def create_checkout_session(
        self,
        amount: float,
        currency: str,
        success_url: str,
        cancel_url: str,
        metadata: Dict[str, Any]
    ) -> CheckoutResponse:
        """Create Stripe checkout session"""
        try:
            checkout_request = self.CheckoutSessionRequest(
                amount=amount,
                currency=currency,
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata
            )
            
            session_response = await self.client.create_checkout_session(checkout_request)
            
            return CheckoutResponse(
                session_id=session_response.session_id,
                url=session_response.url,
                amount=amount,
                currency=currency,
                gateway="stripe"
            )
        except Exception as e:
            logger.error(f"Stripe checkout session creation failed: {str(e)}")
            raise
    
    async def get_payment_status(self, session_id: str) -> PaymentStatusResponse:
        """Get Stripe payment status"""
        try:
            checkout_status = await self.client.get_checkout_status(session_id)
            
            return PaymentStatusResponse(
                session_id=session_id,
                payment_status=checkout_status.payment_status,
                status=checkout_status.status,
                amount_total=checkout_status.amount_total,
                currency=checkout_status.currency
            )
        except Exception as e:
            logger.error(f"Stripe status check failed: {str(e)}")
            raise
    
    async def verify_webhook(self, body: bytes, signature: str) -> WebhookResponse:
        """Verify Stripe webhook"""
        try:
            webhook_response = await self.client.handle_webhook(body, signature)
            
            return WebhookResponse(
                session_id=webhook_response.session_id,
                payment_status=webhook_response.payment_status,
                event_type=webhook_response.status
            )
        except Exception as e:
            logger.error(f"Stripe webhook verification failed: {str(e)}")
            raise

# ============ Razorpay Gateway ============

class RazorpayGateway(PaymentGateway):
    """Razorpay payment gateway implementation"""
    
    def __init__(self, key_id: str, key_secret: str):
        super().__init__("razorpay")
        try:
            import razorpay
            self.client = razorpay.Client(auth=(key_id, key_secret))
            self.key_id = key_id
            self.key_secret = key_secret
        except ImportError:
            raise ImportError("razorpay library not installed. Run: pip install razorpay")
    
    async def create_checkout_session(
        self,
        amount: float,
        currency: str,
        success_url: str,
        cancel_url: str,
        metadata: Dict[str, Any]
    ) -> CheckoutResponse:
        """Create Razorpay order"""
        try:
            # Convert amount to paise (or smallest currency unit)
            amount_in_paise = int(amount * 100)
            
            # Create Razorpay order
            order = self.client.order.create({
                "amount": amount_in_paise,
                "currency": currency.upper(),
                "payment_capture": 1,
                "notes": metadata
            })
            
            return CheckoutResponse(
                session_id=order['id'],
                url=None,  # Razorpay doesn't redirect, payment modal opens on frontend
                amount=amount,
                currency=currency,
                gateway="razorpay",
                key_id=self.key_id  # Frontend needs this
            )
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {str(e)}")
            raise
    
    async def get_payment_status(self, session_id: str) -> PaymentStatusResponse:
        """Get Razorpay payment status"""
        try:
            # Fetch order details
            order = self.client.order.fetch(session_id)
            
            # Map Razorpay status to our unified status
            status_map = {
                "created": "pending",
                "attempted": "pending",
                "paid": "paid"
            }
            
            payment_status = status_map.get(order.get('status', 'created'), 'pending')
            
            return PaymentStatusResponse(
                session_id=session_id,
                payment_status=payment_status,
                status=order.get('status', 'unknown'),
                amount_total=order.get('amount', 0) / 100,  # Convert from paise
                currency=order.get('currency', 'INR')
            )
        except Exception as e:
            logger.error(f"Razorpay status check failed: {str(e)}")
            raise
    
    async def verify_webhook(self, body: bytes, signature: str) -> WebhookResponse:
        """Verify Razorpay webhook"""
        try:
            import json
            
            # Parse webhook body
            webhook_data = json.loads(body.decode())
            
            # Verify signature using Razorpay utility
            webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')
            self.client.utility.verify_webhook_signature(
                body.decode(),
                signature,
                webhook_secret
            )
            
            # Extract event details
            event = webhook_data.get('event', '')
            payload = webhook_data.get('payload', {}).get('payment', {}).get('entity', {})
            
            # Map Razorpay events to our unified status
            event_status_map = {
                "payment.captured": "paid",
                "payment.failed": "failed",
                "payment.authorized": "pending"
            }
            
            payment_status = event_status_map.get(event, 'pending')
            
            return WebhookResponse(
                session_id=payload.get('order_id', ''),
                payment_status=payment_status,
                event_type=event
            )
        except Exception as e:
            logger.error(f"Razorpay webhook verification failed: {str(e)}")
            raise
    
    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> bool:
        """Verify payment signature (specific to Razorpay frontend flow)"""
        try:
            self.client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
            return True
        except Exception as e:
            logger.error(f"Razorpay signature verification failed: {str(e)}")
            return False

# ============ Payment Gateway Factory ============

class PaymentGatewayFactory:
    """Factory class to create payment gateway instances"""
    
    @staticmethod
    def create_gateway(gateway_type: str, **kwargs) -> PaymentGateway:
        """Create a payment gateway instance based on type
        
        Args:
            gateway_type: 'stripe' or 'razorpay'
            **kwargs: Gateway-specific configuration
        
        Returns:
            PaymentGateway instance
        
        Raises:
            ValueError: If gateway type is not supported
        """
        if gateway_type.lower() == "stripe":
            api_key = kwargs.get('api_key') or os.environ.get('STRIPE_API_KEY')
            webhook_url = kwargs.get('webhook_url') or f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe"
            
            if not api_key:
                raise ValueError("Stripe API key not provided")
            
            return StripeGateway(api_key=api_key, webhook_url=webhook_url)
        
        elif gateway_type.lower() == "razorpay":
            key_id = kwargs.get('key_id') or os.environ.get('RAZORPAY_KEY_ID')
            key_secret = kwargs.get('key_secret') or os.environ.get('RAZORPAY_KEY_SECRET')
            
            if not key_id or not key_secret:
                raise ValueError("Razorpay credentials not provided")
            
            return RazorpayGateway(key_id=key_id, key_secret=key_secret)
        
        else:
            raise ValueError(f"Unsupported gateway type: {gateway_type}. Supported: stripe, razorpay")
    
    @staticmethod
    def get_available_gateways() -> list:
        """Get list of available payment gateways based on environment variables"""
        gateways = []
        
        if os.environ.get('STRIPE_API_KEY'):
            gateways.append({
                'id': 'stripe',
                'name': 'Stripe',
                'description': 'International payments (Cards, Apple Pay, Google Pay)',
                'currencies': ['USD', 'EUR', 'GBP'],
                'enabled': True
            })
        
        if os.environ.get('RAZORPAY_KEY_ID') and os.environ.get('RAZORPAY_KEY_SECRET'):
            gateways.append({
                'id': 'razorpay',
                'name': 'Razorpay',
                'description': 'India payments (UPI, Cards, Wallets, NetBanking)',
                'currencies': ['INR'],
                'enabled': True
            })
        
        return gateways
