"""
Email service using SendGrid for transactional emails
"""
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import os
from typing import Optional, Dict, List
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending transactional emails via SendGrid"""
    
    def __init__(self):
        self.api_key = os.getenv('SENDGRID_API_KEY')
        self.from_email = os.getenv('SENDGRID_FROM_EMAIL')
        
        if not self.api_key or not self.from_email:
            logger.warning("SendGrid credentials not configured. Email sending will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
            self.client = SendGridAPIClient(self.api_key)
    
    def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """
        Internal method to send email via SendGrid
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            
        Returns:
            bool: True if email was sent successfully
        """
        if not self.enabled:
            logger.info(f"Email service disabled. Would have sent email to {to_email}")
            return False
        
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            response = self.client.send(message)
            
            if response.status_code in [200, 202]:
                logger.info(f"Email sent successfully to {to_email}: {subject}")
                return True
            else:
                logger.error(f"Failed to send email to {to_email}. Status: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False
    
    def send_welcome_email(self, user_name: str, user_email: str) -> bool:
        """
        Send welcome email to new user
        
        Args:
            user_name: Name of the new user
            user_email: Email address of the new user
            
        Returns:
            bool: True if email was sent successfully
        """
        subject = "Welcome to LensKart! 👓"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to LensKart! 👓</h1>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #667eea; margin-top: 0;">Hi {user_name}! 👋</h2>
                    
                    <p style="font-size: 16px; margin: 20px 0;">
                        Thank you for joining LensKart! We're excited to help you find the perfect eyewear.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #764ba2; margin-top: 0;">What's Next?</h3>
                        <ul style="line-height: 1.8;">
                            <li>🔍 Browse our extensive collection of eyewear</li>
                            <li>❤️ Add your favorites to your wishlist</li>
                            <li>🛒 Start shopping with exclusive deals</li>
                            <li>📦 Enjoy fast and secure delivery</li>
                        </ul>
                    </div>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                            Start Shopping
                        </a>
                    </p>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
                        If you have any questions, feel free to reach out to our support team.
                    </p>
                    
                    <p style="font-size: 14px; color: #666; text-align: center;">
                        Happy Shopping!<br>
                        <strong>The LensKart Team</strong>
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self._send_email(user_email, subject, html_content)
    
    def send_order_confirmation_email(
        self, 
        user_name: str, 
        user_email: str, 
        order_id: str, 
        items: List[Dict], 
        total_amount: float,
        shipping_address: str
    ) -> bool:
        """
        Send order confirmation email
        
        Args:
            user_name: Name of the customer
            user_email: Email address of the customer
            order_id: Order ID
            items: List of order items
            total_amount: Total order amount
            shipping_address: Shipping address
            
        Returns:
            bool: True if email was sent successfully
        """
        subject = f"Order Confirmation - #{order_id[:8]} 📦"
        
        # Build items HTML
        items_html = ""
        for item in items:
            items_html += f"""
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <strong>{item.get('name', 'N/A')}</strong><br>
                        <small style="color: #666;">{item.get('brand', 'N/A')}</small>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                        {item.get('quantity', 0)}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                        ${item.get('price', 0):.2f}
                    </td>
                </tr>
            """
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #667eea; margin-top: 0;">Thank you, {user_name}!</h2>
                    
                    <p style="font-size: 16px; margin: 20px 0;">
                        Your order has been confirmed and is being processed. We'll notify you once it ships!
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> #{order_id[:8]}</p>
                        <p style="margin: 0;"><strong>Total Amount:</strong> <span style="color: #667eea; font-size: 20px; font-weight: bold;">${total_amount:.2f}</span></p>
                    </div>
                    
                    <h3 style="color: #764ba2; margin-top: 30px;">Order Items</h3>
                    <table style="width: 100%; background: white; border-radius: 8px; overflow: hidden;">
                        <thead>
                            <tr style="background: #667eea; color: white;">
                                <th style="padding: 12px; text-align: left;">Item</th>
                                <th style="padding: 12px; text-align: center;">Qty</th>
                                <th style="padding: 12px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                    </table>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #764ba2; margin-top: 0;">Shipping Address</h3>
                        <p style="margin: 0; line-height: 1.6;">{shipping_address}</p>
                    </div>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                            Track Order
                        </a>
                    </p>
                    
                    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                        Questions? Contact our support team anytime.
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self._send_email(user_email, subject, html_content)
    
    def send_payment_receipt_email(
        self, 
        user_name: str, 
        user_email: str, 
        order_id: str, 
        amount: float,
        payment_method: str = "Card"
    ) -> bool:
        """
        Send payment receipt email
        
        Args:
            user_name: Name of the customer
            user_email: Email address of the customer
            order_id: Order ID
            amount: Payment amount
            payment_method: Payment method used
            
        Returns:
            bool: True if email was sent successfully
        """
        subject = f"Payment Receipt - Order #{order_id[:8]} 💳"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Payment Successful! ✅</h1>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #10b981; margin-top: 0;">Hi {user_name}!</h2>
                    
                    <p style="font-size: 16px; margin: 20px 0;">
                        Your payment has been successfully processed. This is your official receipt.
                    </p>
                    
                    <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding: 8px 0;"><strong>Order ID:</strong></td>
                                <td style="padding: 8px 0; text-align: right;">#{order_id[:8]}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                                <td style="padding: 8px 0; text-align: right;">{payment_method}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-top: 2px solid #10b981; padding-top: 15px;"><strong>Amount Paid:</strong></td>
                                <td style="padding: 8px 0; text-align: right; border-top: 2px solid #10b981; padding-top: 15px;">
                                    <span style="color: #10b981; font-size: 24px; font-weight: bold;">${amount:.2f}</span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; text-align: center;">
                            ✅ <strong>Payment Status:</strong> Completed<br>
                            📧 Keep this email for your records
                        </p>
                    </div>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                            View Order Details
                        </a>
                    </p>
                    
                    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                        Thank you for shopping with LensKart!
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self._send_email(user_email, subject, html_content)
    
    def send_shipping_notification_email(
        self, 
        user_name: str, 
        user_email: str, 
        order_id: str, 
        tracking_number: Optional[str] = None,
        estimated_delivery: Optional[str] = None
    ) -> bool:
        """
        Send shipping notification email
        
        Args:
            user_name: Name of the customer
            user_email: Email address of the customer
            order_id: Order ID
            tracking_number: Package tracking number
            estimated_delivery: Estimated delivery date
            
        Returns:
            bool: True if email was sent successfully
        """
        subject = f"Your Order is On The Way! 🚚 - Order #{order_id[:8]}"
        
        tracking_html = ""
        if tracking_number:
            tracking_html = f"""
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Tracking Number</p>
                    <p style="margin: 0; font-size: 20px; font-weight: bold; color: #667eea; letter-spacing: 1px;">
                        {tracking_number}
                    </p>
                </div>
            """
        
        delivery_html = ""
        if estimated_delivery:
            delivery_html = f"""
                <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0;">
                        📅 <strong>Estimated Delivery:</strong> {estimated_delivery}
                    </p>
                </div>
            """
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">On The Way! 🚚</h1>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #667eea; margin-top: 0;">Great News, {user_name}!</h2>
                    
                    <p style="font-size: 16px; margin: 20px 0;">
                        Your order <strong>#{order_id[:8]}</strong> has been shipped and is on its way to you!
                    </p>
                    
                    {tracking_html}
                    {delivery_html}
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #764ba2; margin-top: 0; text-align: center;">What's Next?</h3>
                        <ul style="line-height: 2; list-style: none; padding: 0;">
                            <li>📦 Your package is being processed by our shipping partner</li>
                            <li>🚚 You'll receive tracking updates via email</li>
                            <li>📬 Prepare to receive your order soon!</li>
                        </ul>
                    </div>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                            Track Your Package
                        </a>
                    </p>
                    
                    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                        Need help? Contact our support team anytime.
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self._send_email(user_email, subject, html_content)


# Create a singleton instance
email_service = EmailService()
