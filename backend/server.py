from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON, Enum, select, update, delete, func, or_
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from payment_gateway import PaymentGatewayFactory, RazorpayGateway
from email_service import email_service
from cache_service import get_cache_service
from logging_config import setup_logging, get_logger
from error_tracking import initialize_sentry, capture_exception, set_user_context
from rate_limiter import create_limiter, RateLimit, rate_limit_error_handler
from middleware import RequestTrackerMiddleware, ErrorHandlerMiddleware
from slowapi.errors import RateLimitExceeded

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MySQL connection
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '3001')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'specs')

# Create async engine for MySQL
DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"

# Admin credentials (Fixed for security)
ADMIN_EMAIL = "admin@lenskart.com"
ADMIN_PASSWORD = "Admin@123"

# Stripe setup
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create rate limiter (must be before route definitions)
limiter = create_limiter(default_limit=os.getenv('DEFAULT_RATE_LIMIT', '100/minute'))
app.state.limiter = limiter

# ============ SQLAlchemy Models ============

class Base(DeclarativeBase):
    pass

class UserDB(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(20))
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(Enum('user', 'admin', name='role_enum'), default="user")
    is_blocked: Mapped[int] = mapped_column(Integer, default=0)  # 0 for not blocked, 1 for blocked
    email_welcome: Mapped[int] = mapped_column(Integer, default=1)  # 1 for enabled, 0 for disabled
    email_order_confirmation: Mapped[int] = mapped_column(Integer, default=1)
    email_payment_receipt: Mapped[int] = mapped_column(Integer, default=1)
    email_shipping_notification: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class ProductDB(Base):
    __tablename__ = "products"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    brand: Mapped[str] = mapped_column(String(100))
    price: Mapped[float] = mapped_column(Float)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(Enum('men', 'women', 'kids', 'sunglasses', name='category_enum'), index=True)
    frame_type: Mapped[str] = mapped_column(Enum('full-rim', 'half-rim', 'rimless', name='frame_type_enum'))
    frame_shape: Mapped[str] = mapped_column(Enum('rectangular', 'round', 'cat-eye', 'aviator', 'wayfarer', 'square', 'oval', name='frame_shape_enum'))
    color: Mapped[str] = mapped_column(String(50))
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class CartItemDB(Base):
    __tablename__ = "cart"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    product_id: Mapped[str] = mapped_column(String(36))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class OrderDB(Base):
    __tablename__ = "orders"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    total_amount: Mapped[float] = mapped_column(Float)
    payment_status: Mapped[str] = mapped_column(Enum('pending', 'paid', 'failed', 'refunded', name='payment_status_enum'), default="pending")
    order_status: Mapped[str] = mapped_column(Enum('processing', 'confirmed', 'shipped', 'delivered', 'cancelled', name='order_status_enum'), default="processing")
    shipping_address: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class PaymentTransactionDB(Base):
    __tablename__ = "payment_transactions"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    order_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(10), default="usd")
    payment_status: Mapped[str] = mapped_column(String(50), default="pending")
    status: Mapped[str] = mapped_column(String(50), default="initiated")
    payment_metadata: Mapped[Optional[str]] = mapped_column("metadata", Text, nullable=True)  # JSON string
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class AddressDB(Base):
    __tablename__ = "addresses"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    label: Mapped[str] = mapped_column(String(50))  # Home, Work, Other
    full_address: Mapped[str] = mapped_column(Text)
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    zip_code: Mapped[str] = mapped_column(String(20))
    country: Mapped[str] = mapped_column(String(100), default="USA")
    is_default: Mapped[bool] = mapped_column(Integer, default=0)  # MySQL doesn't have bool, using Integer
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class ReviewDB(Base):
    __tablename__ = "reviews"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    product_id: Mapped[str] = mapped_column(String(36), index=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    user_name: Mapped[str] = mapped_column(String(255))
    rating: Mapped[int] = mapped_column(Integer)  # 1-5 stars
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class WishlistDB(Base):
    __tablename__ = "wishlist"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    product_id: Mapped[str] = mapped_column(String(36), index=True)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class ProductImageDB(Base):
    __tablename__ = "product_images"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    product_id: Mapped[str] = mapped_column(String(36), index=True)
    image_url: Mapped[str] = mapped_column(String(500))
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_primary: Mapped[bool] = mapped_column(Integer, default=0)  # MySQL doesn't have bool, using Integer
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class OrderTrackingDB(Base):
    __tablename__ = "order_tracking"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    order_id: Mapped[str] = mapped_column(String(36), index=True)
    status: Mapped[str] = mapped_column(String(50))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class RecentlyViewedDB(Base):
    __tablename__ = "recently_viewed"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    product_id: Mapped[str] = mapped_column(String(36), index=True)
    viewed_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class CouponDB(Base):
    __tablename__ = "coupons"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    discount_type: Mapped[str] = mapped_column(String(20))  # 'percentage' or 'fixed'
    discount_value: Mapped[float] = mapped_column(Float)
    min_purchase: Mapped[float] = mapped_column(Float, default=0)
    max_discount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # For percentage coupons
    usage_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # None = unlimited
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    valid_from: Mapped[datetime] = mapped_column(DateTime)
    valid_until: Mapped[datetime] = mapped_column(DateTime)
    is_active: Mapped[bool] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class SavedItemDB(Base):
    __tablename__ = "saved_items"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    product_id: Mapped[str] = mapped_column(String(36), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    saved_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

# ============ Pydantic Models ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password: str
    phone: str
    address: Optional[str] = None
    role: str = "user"
    email_welcome: bool = True
    email_order_confirmation: bool = True
    email_payment_receipt: bool = True
    email_shipping_notification: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    name: str
    phone: str
    address: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class EmailPreferences(BaseModel):
    email_welcome: bool = True
    email_order_confirmation: bool = True
    email_payment_receipt: bool = True
    email_shipping_notification: bool = True

class Address(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    label: str  # Home, Work, Other
    full_address: str
    city: str
    state: str
    zip_code: str
    country: str = "USA"
    is_default: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddressCreate(BaseModel):
    label: str
    full_address: str
    city: str
    state: str
    zip_code: str
    country: str = "USA"
    is_default: bool = False

class AddressUpdate(BaseModel):
    label: Optional[str] = None
    full_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    brand: str
    price: float
    description: str
    category: str  # men, women, kids, sunglasses
    frame_type: str  # full-rim, half-rim, rimless
    frame_shape: str  # rectangular, round, cat-eye, aviator, wayfarer
    color: str
    image_url: str
    stock: int = 100
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    brand: str
    price: float
    description: str
    category: str
    frame_type: str
    frame_shape: str
    color: str
    image_url: str
    stock: int = 100

class CartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    quantity: int = 1
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddToCart(BaseModel):
    product_id: str
    quantity: int = 1

class UpdateCartQuantity(BaseModel):
    quantity: int

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    user_name: str
    rating: int  # 1-5
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CreateReview(BaseModel):
    rating: int = Field(..., ge=1, le=5)  # Must be between 1-5
    comment: Optional[str] = None

class UpdateReview(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class Wishlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddToWishlist(BaseModel):
    product_id: str

class ProductImage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    image_url: str
    display_order: int = 0
    is_primary: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CreateProductImage(BaseModel):
    image_url: str
    display_order: int = 0
    is_primary: bool = False

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[Dict]
    total_amount: float
    payment_status: str = "pending"
    order_status: str = "processing"
    shipping_address: str
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CreateOrder(BaseModel):
    shipping_address: str

class UpdateOrderStatus(BaseModel):
    order_status: str
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    description: Optional[str] = None
    location: Optional[str] = None

class OrderTracking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    status: str
    description: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    order_id: Optional[str] = None
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"
    status: str = "initiated"
    metadata: Optional[Dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecentlyViewed(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    viewed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str  # 'percentage' or 'fixed'
    discount_value: float
    min_purchase: float = 0
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    used_count: int = 0
    valid_from: datetime
    valid_until: datetime
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CreateCoupon(BaseModel):
    code: str
    discount_type: str  # 'percentage' or 'fixed'
    discount_value: float
    min_purchase: float = 0
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    valid_from: datetime
    valid_until: datetime
    is_active: bool = True

class UpdateCoupon(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_purchase: Optional[float] = None
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None

class ValidateCouponRequest(BaseModel):
    code: str
    cart_total: float

class ValidateCouponResponse(BaseModel):
    valid: bool
    message: str
    discount_amount: float = 0
    final_amount: float = 0
    coupon: Optional[Coupon] = None

class SavedItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    quantity: int = 1
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ Helper Functions ============

def create_token(user_id: str, email: str, role: str):
    payload = {"user_id": user_id, "email": email, "role": role}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except:
        return None

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

async def get_db():
    async with async_session_maker() as session:
        yield session


# ============ Auth Routes ============

@api_router.post("/auth/register")
@limiter.limit(RateLimit['register'])
async def register(request: Request, response: Response, user_data: UserRegister):
    async with async_session_maker() as session:
        # Check if user exists
        result = await session.execute(select(UserDB).where(UserDB.email == user_data.email))
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = pwd_context.hash(user_data.password)
        
        # Generate user ID
        user_id = str(uuid.uuid4())
        
        # Create database user directly
        db_user = UserDB(
            id=user_id,
            name=user_data.name,
            email=user_data.email,
            password=hashed_password,
            phone=user_data.phone,
            address=user_data.address,
            role="user",
            is_blocked=0,
            email_welcome=1,
            email_order_confirmation=1,
            email_payment_receipt=1,
            email_shipping_notification=1,
            created_at=datetime.now(timezone.utc)
        )
        
        session.add(db_user)
        await session.commit()
        
        # Send welcome email (async in background)
        try:
            email_service.send_welcome_email(db_user.name, db_user.email)
        except Exception as e:
            # Log error but don't fail registration
            logging.error(f"Failed to send welcome email to {db_user.email}: {str(e)}")
        
        # Generate token
        token = create_token(db_user.id, db_user.email, db_user.role)
        
        return {
            "message": "Registration successful",
            "token": token,
            "user": {"id": db_user.id, "name": db_user.name, "email": db_user.email, "role": db_user.role}
        }

@api_router.post("/auth/login")
@limiter.limit(RateLimit['login'])
async def login(request: Request, response: Response, credentials: UserLogin):
    # Check for admin login
    if credentials.email == ADMIN_EMAIL:
        if credentials.password == ADMIN_PASSWORD:
            token = create_token("admin-id", ADMIN_EMAIL, "admin")
            return {
                "message": "Login successful",
                "token": token,
                "user": {"id": "admin-id", "name": "Admin", "email": ADMIN_EMAIL, "role": "admin"}
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Regular user login
    async with async_session_maker() as session:
        result = await session.execute(select(UserDB).where(UserDB.email == credentials.email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check if user is blocked
        if user.is_blocked == 1:
            raise HTTPException(status_code=403, detail="Your account has been blocked. Please contact support.")
        
        # Verify password
        if not pwd_context.verify(credentials.password, user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_token(user.id, user.email, user.role)
        
        return {
            "message": "Login successful",
            "token": token,
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
        }

# ============ User Profile Routes ============

@api_router.get("/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    async with async_session_maker() as session:
        result = await session.execute(select(UserDB).where(UserDB.id == current_user['user_id']))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "address": user.address,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }

@api_router.put("/user/profile")
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    
    async with async_session_maker() as session:
        result = await session.execute(select(UserDB).where(UserDB.id == current_user['user_id']))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update user fields
        user.name = profile_data.name
        user.phone = profile_data.phone
        user.address = profile_data.address
        
        await session.commit()
        
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address
            }
        }

@api_router.put("/user/password")
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user)
):
    
    async with async_session_maker() as session:
        result = await session.execute(select(UserDB).where(UserDB.id == current_user['user_id']))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify old password
        if not pwd_context.verify(password_data.old_password, user.password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Hash and update new password
        user.password = pwd_context.hash(password_data.new_password)
        
        await session.commit()
        
        return {"message": "Password changed successfully"}

# ============ Email Preferences Routes ============

@api_router.get("/user/email-preferences")
async def get_email_preferences(current_user: dict = Depends(get_current_user)):
    async with async_session_maker() as session:
        result = await session.execute(select(UserDB).where(UserDB.id == current_user['user_id']))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "email_welcome": bool(user.email_welcome),
            "email_order_confirmation": bool(user.email_order_confirmation),
            "email_payment_receipt": bool(user.email_payment_receipt),
            "email_shipping_notification": bool(user.email_shipping_notification)
        }

@api_router.put("/user/email-preferences")
async def update_email_preferences(
    preferences: EmailPreferences,
    current_user: dict = Depends(get_current_user)
):
    
    async with async_session_maker() as session:
        result = await session.execute(select(UserDB).where(UserDB.id == current_user['user_id']))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update email preferences
        user.email_welcome = 1 if preferences.email_welcome else 0
        user.email_order_confirmation = 1 if preferences.email_order_confirmation else 0
        user.email_payment_receipt = 1 if preferences.email_payment_receipt else 0
        user.email_shipping_notification = 1 if preferences.email_shipping_notification else 0
        
        await session.commit()
        
        return {
            "message": "Email preferences updated successfully",
            "preferences": {
                "email_welcome": preferences.email_welcome,
                "email_order_confirmation": preferences.email_order_confirmation,
                "email_payment_receipt": preferences.email_payment_receipt,
                "email_shipping_notification": preferences.email_shipping_notification
            }
        }

# ============ Address Routes ============

@api_router.get("/user/addresses")
async def get_addresses(current_user: dict = Depends(get_current_user)):
    async with async_session_maker() as session:
        result = await session.execute(
            select(AddressDB)
            .where(AddressDB.user_id == current_user['user_id'])
            .order_by(AddressDB.is_default.desc(), AddressDB.created_at.desc())
        )
        addresses = result.scalars().all()
        
        return [{
            "id": addr.id,
            "user_id": addr.user_id,
            "label": addr.label,
            "full_address": addr.full_address,
            "city": addr.city,
            "state": addr.state,
            "zip_code": addr.zip_code,
            "country": addr.country,
            "is_default": bool(addr.is_default),
            "created_at": addr.created_at.isoformat() if addr.created_at else None
        } for addr in addresses]

@api_router.post("/user/addresses")
async def create_address(
    address_data: AddressCreate,
    current_user: dict = Depends(get_current_user)
):
    
    async with async_session_maker() as session:
        # If this is set as default, unset all other defaults
        if address_data.is_default:
            await session.execute(
                update(AddressDB)
                .where(AddressDB.user_id == current_user['user_id'])
                .values(is_default=0)
            )
        
        new_address = AddressDB(
            id=str(uuid.uuid4()),
            user_id=current_user['user_id'],
            label=address_data.label,
            full_address=address_data.full_address,
            city=address_data.city,
            state=address_data.state,
            zip_code=address_data.zip_code,
            country=address_data.country,
            is_default=1 if address_data.is_default else 0,
            created_at=datetime.now(timezone.utc)
        )
        
        session.add(new_address)
        await session.commit()
        
        return {
            "message": "Address added successfully",
            "address": {
                "id": new_address.id,
                "label": new_address.label,
                "full_address": new_address.full_address,
                "city": new_address.city,
                "state": new_address.state,
                "zip_code": new_address.zip_code,
                "country": new_address.country,
                "is_default": bool(new_address.is_default)
            }
        }

@api_router.put("/user/addresses/{address_id}")
async def update_address(
    address_id: str,
    address_data: AddressUpdate,
    current_user: dict = Depends(get_current_user)
):
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(AddressDB)
            .where(AddressDB.id == address_id, AddressDB.user_id == current_user['user_id'])
        )
        address = result.scalar_one_or_none()
        
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        # If setting as default, unset all other defaults
        if address_data.is_default:
            await session.execute(
                update(AddressDB)
                .where(AddressDB.user_id == current_user['user_id'])
                .values(is_default=0)
            )
        
        # Update fields
        if address_data.label is not None:
            address.label = address_data.label
        if address_data.full_address is not None:
            address.full_address = address_data.full_address
        if address_data.city is not None:
            address.city = address_data.city
        if address_data.state is not None:
            address.state = address_data.state
        if address_data.zip_code is not None:
            address.zip_code = address_data.zip_code
        if address_data.country is not None:
            address.country = address_data.country
        if address_data.is_default is not None:
            address.is_default = 1 if address_data.is_default else 0
        
        await session.commit()
        
        return {
            "message": "Address updated successfully",
            "address": {
                "id": address.id,
                "label": address.label,
                "full_address": address.full_address,
                "city": address.city,
                "state": address.state,
                "zip_code": address.zip_code,
                "country": address.country,
                "is_default": bool(address.is_default)
            }
        }

@api_router.delete("/user/addresses/{address_id}")
async def delete_address(
    address_id: str,
    current_user: dict = Depends(get_current_user)
):
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(AddressDB)
            .where(AddressDB.id == address_id, AddressDB.user_id == current_user['user_id'])
        )
        address = result.scalar_one_or_none()
        
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        await session.execute(
            delete(AddressDB).where(AddressDB.id == address_id)
        )
        await session.commit()
        
        return {"message": "Address deleted successfully"}

# ============ Product Routes ============

@api_router.get("/products")
async def get_products(
    category: Optional[str] = None, 
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = None
):
    # Try cache first
    cache = get_cache_service()
    cache_filters = {
        "category": category,
        "search": search,
        "min_price": min_price,
        "max_price": max_price,
        "sort": sort
    }
    cached_products = await cache.get_products(cache_filters)
    if cached_products is not None:
        return cached_products
    
    async with async_session_maker() as session:
        query = select(ProductDB)
        
        # Category filter
        if category:
            query = query.where(ProductDB.category == category)
        
        # Search filter (name, brand, description)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (ProductDB.name.like(search_pattern)) | 
                (ProductDB.brand.like(search_pattern)) |
                (ProductDB.description.like(search_pattern))
            )
        
        # Price range filter
        if min_price is not None:
            query = query.where(ProductDB.price >= min_price)
        if max_price is not None:
            query = query.where(ProductDB.price <= max_price)
        
        # Sorting
        if sort:
            if sort == "price_asc":
                query = query.order_by(ProductDB.price.asc())
            elif sort == "price_desc":
                query = query.order_by(ProductDB.price.desc())
            elif sort == "name_asc":
                query = query.order_by(ProductDB.name.asc())
            elif sort == "name_desc":
                query = query.order_by(ProductDB.name.desc())
            elif sort == "newest":
                query = query.order_by(ProductDB.created_at.desc())
        else:
            # Default sorting by created_at descending
            query = query.order_by(ProductDB.created_at.desc())
        
        result = await session.execute(query)
        products = result.scalars().all()
        
        product_list = [
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "price": p.price,
                "description": p.description,
                "category": p.category,
                "frame_type": p.frame_type,
                "frame_shape": p.frame_shape,
                "color": p.color,
                "image_url": p.image_url,
                "stock": p.stock,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in products
        ]
        
        # Cache the results
        await cache.set_products(cache_filters, product_list, ttl_seconds=300)
        
        return product_list

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    # Try cache first
    cache = get_cache_service()
    cached_product = await cache.get_product(product_id)
    if cached_product is not None:
        return cached_product
    
    async with async_session_maker() as session:
        result = await session.execute(select(ProductDB).where(ProductDB.id == product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product_data = {
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "price": product.price,
            "description": product.description,
            "category": product.category,
            "frame_type": product.frame_type,
            "frame_shape": product.frame_shape,
            "color": product.color,
            "image_url": product.image_url,
            "stock": product.stock,
            "created_at": product.created_at.isoformat() if product.created_at else None
        }
        
        # Cache the product
        await cache.set_product(product_id, product_data, ttl_seconds=600)
        
        return product_data

@api_router.get("/search/suggestions")
async def get_search_suggestions(q: str = ""):
    """Get search suggestions for autocomplete"""
    if not q or len(q) < 2:
        return {
            "products": [],
            "brands": [],
            "categories": []
        }
    
    query = q.lower().strip()
    
    # Try cache first
    cache = get_cache_service()
    cached_suggestions = await cache.get_search_suggestions(query)
    if cached_suggestions is not None:
        return cached_suggestions
    
    async with async_session_maker() as session:
        # Search products by name, brand, or description
        product_result = await session.execute(
            select(ProductDB)
            .where(
                or_(
                    ProductDB.name.ilike(f"%{query}%"),
                    ProductDB.brand.ilike(f"%{query}%"),
                    ProductDB.description.ilike(f"%{query}%")
                )
            )
            .where(ProductDB.stock > 0)  # Only show in-stock products
            .limit(8)  # Limit to 8 product suggestions
        )
        products = product_result.scalars().all()
        
        # Get unique brands that match
        brand_result = await session.execute(
            select(ProductDB.brand)
            .where(ProductDB.brand.ilike(f"%{query}%"))
            .where(ProductDB.stock > 0)
            .distinct()
            .limit(5)
        )
        brands = [brand for brand in brand_result.scalars().all()]
        
        # Get matching categories
        all_categories = ['men', 'women', 'kids', 'sunglasses']
        matching_categories = [cat for cat in all_categories if query in cat.lower()]
        
        suggestions = {
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "brand": p.brand,
                    "price": float(p.price),
                    "image_url": p.image_url,
                    "category": p.category
                }
                for p in products
            ],
            "brands": brands,
            "categories": matching_categories
        }
        
        # Cache suggestions for 30 minutes
        await cache.set_search_suggestions(query, suggestions, ttl_seconds=1800)
        
        return suggestions

@api_router.post("/products")
async def create_product(product_data: ProductCreate, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        product = Product(**product_data.model_dump())
        
        db_product = ProductDB(
            id=product.id,
            name=product.name,
            brand=product.brand,
            price=product.price,
            description=product.description,
            category=product.category,
            frame_type=product.frame_type,
            frame_shape=product.frame_shape,
            color=product.color,
            image_url=product.image_url,
            stock=product.stock,
            created_at=product.created_at
        )
        
        session.add(db_product)
        await session.commit()
        
        # Invalidate product caches
        cache = get_cache_service()
        await cache.invalidate_products()
        
        return {"message": "Product created successfully", "product": product.model_dump()}

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product_data: ProductCreate, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        result = await session.execute(select(ProductDB).where(ProductDB.id == product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Update fields
        for key, value in product_data.model_dump().items():
            setattr(product, key, value)
        
        await session.commit()
        
        # Invalidate product caches
        cache = get_cache_service()
        await cache.invalidate_product(product_id)
        
        return {"message": "Product updated successfully"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        result = await session.execute(select(ProductDB).where(ProductDB.id == product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        await session.delete(product)
        await session.commit()
        
        # Invalidate product caches
        cache = get_cache_service()
        await cache.invalidate_product(product_id)
        
        return {"message": "Product deleted successfully"}

# ============ Cart Routes ============

@api_router.get("/cart")
async def get_cart(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    user_id = user['user_id']
    
    # Try cache first
    cache = get_cache_service()
    cached_cart = await cache.get_cart(user_id)
    if cached_cart is not None:
        return cached_cart
    
    async with async_session_maker() as session:
        result = await session.execute(select(CartItemDB).where(CartItemDB.user_id == user_id))
        cart_items = result.scalars().all()
        
        # Fetch product details for each cart item
        cart_with_products = []
        for item in cart_items:
            product_result = await session.execute(select(ProductDB).where(ProductDB.id == item.product_id))
            product = product_result.scalar_one_or_none()
            
            if product:
                cart_with_products.append({
                    "id": item.id,
                    "user_id": item.user_id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "added_at": item.added_at.isoformat() if item.added_at else None,
                    "product": {
                        "id": product.id,
                        "name": product.name,
                        "brand": product.brand,
                        "price": product.price,
                        "description": product.description,
                        "category": product.category,
                        "frame_type": product.frame_type,
                        "frame_shape": product.frame_shape,
                        "color": product.color,
                        "image_url": product.image_url,
                        "stock": product.stock
                    }
                })
        
        # Cache the cart
        await cache.set_cart(user_id, cart_with_products, ttl_seconds=600)
        
        return cart_with_products

@api_router.post("/cart")
async def add_to_cart(cart_data: AddToCart, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Check product stock first
        product_result = await session.execute(
            select(ProductDB).where(ProductDB.id == cart_data.product_id)
        )
        product = product_result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if item already in cart
        result = await session.execute(
            select(CartItemDB).where(
                (CartItemDB.user_id == user['user_id']) & 
                (CartItemDB.product_id == cart_data.product_id)
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Check if new quantity exceeds stock
            new_quantity = existing.quantity + cart_data.quantity
            if new_quantity > product.stock:
                raise HTTPException(
                    status_code=400,
                    detail=f"Only {product.stock} items available in stock"
                )
            # Update quantity
            existing.quantity = new_quantity
            await session.commit()
            
            # Invalidate cart cache
            cache = get_cache_service()
            await cache.invalidate_cart(user['user_id'])
            
            return {"message": "Cart updated successfully"}
        
        # Check stock for new item
        if cart_data.quantity > product.stock:
            raise HTTPException(
                status_code=400,
                detail=f"Only {product.stock} items available in stock"
            )
        
        # Add new item
        cart_item = CartItem(user_id=user['user_id'], product_id=cart_data.product_id, quantity=cart_data.quantity)
        
        db_cart_item = CartItemDB(
            id=cart_item.id,
            user_id=cart_item.user_id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            added_at=cart_item.added_at
        )
        
        session.add(db_cart_item)
        await session.commit()
        
        # Invalidate cart cache
        cache = get_cache_service()
        await cache.invalidate_cart(user['user_id'])
        
        return {"message": "Item added to cart"}

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(CartItemDB).where(
                (CartItemDB.user_id == user['user_id']) & 
                (CartItemDB.product_id == product_id)
            )
        )
        cart_item = result.scalar_one_or_none()
        
        if cart_item:
            await session.delete(cart_item)
            await session.commit()
            
            # Invalidate cart cache
            cache = get_cache_service()
            await cache.invalidate_cart(user['user_id'])
        
        return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        await session.execute(
            delete(CartItemDB).where(CartItemDB.user_id == user['user_id'])
        )
        await session.commit()
        
        # Invalidate cart cache
        cache = get_cache_service()
        await cache.invalidate_cart(user['user_id'])
        
        return {"message": "Cart cleared"}

@api_router.patch("/cart/{item_id}")
async def update_cart_quantity(item_id: str, quantity_data: UpdateCartQuantity, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    if quantity_data.quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")
    
    async with async_session_maker() as session:
        # Get cart item
        result = await session.execute(
            select(CartItemDB).where(
                (CartItemDB.id == item_id) & 
                (CartItemDB.user_id == user['user_id'])
            )
        )
        cart_item = result.scalar_one_or_none()
        
        if not cart_item:
            raise HTTPException(status_code=404, detail="Cart item not found")
        
        # Check product stock
        product_result = await session.execute(
            select(ProductDB).where(ProductDB.id == cart_item.product_id)
        )
        product = product_result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        if quantity_data.quantity > product.stock:
            raise HTTPException(
                status_code=400, 
                detail=f"Only {product.stock} items available in stock"
            )
        
        # Update quantity
        cart_item.quantity = quantity_data.quantity
        await session.commit()
        
        # Invalidate cart cache
        cache = get_cache_service()
        await cache.invalidate_cart(user['user_id'])
        
        return {
            "message": "Cart quantity updated successfully",
            "quantity": cart_item.quantity
        }

# ============ Order Routes ============

@api_router.post("/orders")
async def create_order(order_data: CreateOrder, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Get cart items
        result = await session.execute(select(CartItemDB).where(CartItemDB.user_id == user['user_id']))
        cart_items = result.scalars().all()
        
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        # Calculate total and prepare items
        total_amount = 0
        items = []
        for cart_item in cart_items:
            product_result = await session.execute(select(ProductDB).where(ProductDB.id == cart_item.product_id))
            product = product_result.scalar_one_or_none()
            
            if product:
                # Check stock availability
                if product.stock < cart_item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient stock for {product.name}. Only {product.stock} available"
                    )
                
                items.append({
                    "product_id": product.id,
                    "name": product.name,
                    "price": product.price,
                    "quantity": cart_item.quantity
                })
                total_amount += product.price * cart_item.quantity
        
        # Create order
        order = Order(
            user_id=user['user_id'],
            items=items,
            total_amount=total_amount,
            shipping_address=order_data.shipping_address
        )
        
        db_order = OrderDB(
            id=order.id,
            user_id=order.user_id,
            items=json.dumps(order.items),
            total_amount=order.total_amount,
            payment_status=order.payment_status,
            order_status=order.order_status,
            shipping_address=order.shipping_address,
            tracking_number=order.tracking_number,
            estimated_delivery=order.estimated_delivery,
            created_at=order.created_at,
            updated_at=order.updated_at
        )
        
        session.add(db_order)
        
        # Create initial tracking entry
        initial_tracking = OrderTracking(
            order_id=order.id,
            status="processing",
            description="Order has been placed and is being processed",
            location="Warehouse"
        )
        
        db_tracking = OrderTrackingDB(
            id=initial_tracking.id,
            order_id=initial_tracking.order_id,
            status=initial_tracking.status,
            description=initial_tracking.description,
            location=initial_tracking.location,
            created_at=initial_tracking.created_at
        )
        
        session.add(db_tracking)
        
        # Reduce stock for each product in the order
        for cart_item in cart_items:
            product_result = await session.execute(select(ProductDB).where(ProductDB.id == cart_item.product_id))
            product = product_result.scalar_one_or_none()
            if product:
                product.stock -= cart_item.quantity
        
        await session.commit()
        
        # Get user details for email
        user_result = await session.execute(select(UserDB).where(UserDB.id == user['user_id']))
        user_db = user_result.scalar_one_or_none()
        
        # Send order confirmation email
        if user_db and user_db.email_order_confirmation:
            try:
                # Prepare items for email with brand info
                email_items = []
                for item in items:
                    email_items.append({
                        'name': item['name'],
                        'brand': 'LensKart',  # or get from product if available
                        'quantity': item['quantity'],
                        'price': item['price']
                    })
                email_service.send_order_confirmation_email(
                    user_db.name,
                    user_db.email,
                    order.id,
                    email_items,
                    total_amount,
                    order_data.shipping_address
                )
            except Exception as e:
                logging.error(f"Failed to send order confirmation email: {str(e)}")
        
        return {"message": "Order created successfully", "order": order.model_dump()}

@api_router.get("/orders")
async def get_orders(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        if user['role'] == 'admin':
            result = await session.execute(select(OrderDB))
        else:
            result = await session.execute(select(OrderDB).where(OrderDB.user_id == user['user_id']))
        
        orders = result.scalars().all()
        
        return [
            {
                "id": o.id,
                "user_id": o.user_id,
                "items": json.loads(o.items) if isinstance(o.items, str) else o.items,
                "total_amount": o.total_amount,
                "payment_status": o.payment_status,
                "order_status": o.order_status,
                "shipping_address": o.shipping_address,
                "tracking_number": o.tracking_number,
                "estimated_delivery": o.estimated_delivery.isoformat() if o.estimated_delivery else None,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "updated_at": o.updated_at.isoformat() if o.updated_at else None
            }
            for o in orders
        ]

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        result = await session.execute(select(OrderDB).where(OrderDB.id == order_id))
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if user['role'] != 'admin' and order.user_id != user['user_id']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "id": order.id,
            "user_id": order.user_id,
            "items": json.loads(order.items) if isinstance(order.items, str) else order.items,
            "total_amount": order.total_amount,
            "payment_status": order.payment_status,
            "order_status": order.order_status,
            "shipping_address": order.shipping_address,
            "tracking_number": order.tracking_number,
            "estimated_delivery": order.estimated_delivery.isoformat() if order.estimated_delivery else None,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "updated_at": order.updated_at.isoformat() if order.updated_at else None
        }

@api_router.get("/orders/{order_id}/tracking")
async def get_order_tracking(order_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Verify order exists and user has access
        order_result = await session.execute(select(OrderDB).where(OrderDB.id == order_id))
        order = order_result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if user['role'] != 'admin' and order.user_id != user['user_id']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get tracking history
        tracking_result = await session.execute(
            select(OrderTrackingDB)
            .where(OrderTrackingDB.order_id == order_id)
            .order_by(OrderTrackingDB.created_at.asc())
        )
        tracking_history = tracking_result.scalars().all()
        
        return {
            "order_id": order.id,
            "current_status": order.order_status,
            "tracking_number": order.tracking_number,
            "estimated_delivery": order.estimated_delivery.isoformat() if order.estimated_delivery else None,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "updated_at": order.updated_at.isoformat() if order.updated_at else None,
            "tracking_history": [
                {
                    "id": t.id,
                    "status": t.status,
                    "description": t.description,
                    "location": t.location,
                    "created_at": t.created_at.isoformat() if t.created_at else None
                }
                for t in tracking_history
            ]
        }

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_data: UpdateOrderStatus, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    # Check if user is admin
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        # Get order
        result = await session.execute(select(OrderDB).where(OrderDB.id == order_id))
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update order status and tracking info
        order.order_status = status_data.order_status
        if status_data.tracking_number:
            order.tracking_number = status_data.tracking_number
        if status_data.estimated_delivery:
            order.estimated_delivery = status_data.estimated_delivery
        order.updated_at = datetime.now(timezone.utc)
        
        # Create tracking history entry
        tracking = OrderTracking(
            order_id=order_id,
            status=status_data.order_status,
            description=status_data.description,
            location=status_data.location
        )
        
        db_tracking = OrderTrackingDB(
            id=tracking.id,
            order_id=tracking.order_id,
            status=tracking.status,
            description=tracking.description,
            location=tracking.location,
            created_at=tracking.created_at
        )
        
        session.add(db_tracking)
        await session.commit()
        
        return {
            "message": "Order status updated successfully",
            "order": {
                "id": order.id,
                "order_status": order.order_status,
                "tracking_number": order.tracking_number,
                "estimated_delivery": order.estimated_delivery.isoformat() if order.estimated_delivery else None,
                "updated_at": order.updated_at.isoformat()
            }
        }

# ============ Review Routes ============

@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    async with async_session_maker() as session:
        result = await session.execute(
            select(ReviewDB)
            .where(ReviewDB.product_id == product_id)
            .order_by(ReviewDB.created_at.desc())
        )
        reviews = result.scalars().all()
        
        return [
            {
                "id": r.id,
                "product_id": r.product_id,
                "user_id": r.user_id,
                "user_name": r.user_name,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None
            }
            for r in reviews
        ]

@api_router.post("/products/{product_id}/reviews")
async def create_review(product_id: str, review_data: CreateReview, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Check if product exists
        product_result = await session.execute(select(ProductDB).where(ProductDB.id == product_id))
        product = product_result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if user already reviewed this product
        existing_review = await session.execute(
            select(ReviewDB).where(
                (ReviewDB.product_id == product_id) & 
                (ReviewDB.user_id == user['user_id'])
            )
        )
        if existing_review.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="You have already reviewed this product")
        
        # Get user details
        user_result = await session.execute(select(UserDB).where(UserDB.id == user['user_id']))
        user_data = user_result.scalar_one_or_none()
        
        # Create review
        review = Review(
            product_id=product_id,
            user_id=user['user_id'],
            user_name=user_data.name if user_data else "Anonymous",
            rating=review_data.rating,
            comment=review_data.comment
        )
        
        db_review = ReviewDB(
            id=review.id,
            product_id=review.product_id,
            user_id=review.user_id,
            user_name=review.user_name,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            updated_at=review.updated_at
        )
        
        session.add(db_review)
        await session.commit()
        
        return {
            "message": "Review created successfully",
            "review": {
                "id": review.id,
                "product_id": review.product_id,
                "user_id": review.user_id,
                "user_name": review.user_name,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at.isoformat(),
                "updated_at": review.updated_at.isoformat()
            }
        }

@api_router.put("/reviews/{review_id}")
async def update_review(review_id: str, review_data: UpdateReview, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(ReviewDB).where(
                (ReviewDB.id == review_id) & 
                (ReviewDB.user_id == user['user_id'])
            )
        )
        review = result.scalar_one_or_none()
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found or you don't have permission")
        
        review.rating = review_data.rating
        review.comment = review_data.comment
        review.updated_at = datetime.now(timezone.utc)
        
        await session.commit()
        
        return {
            "message": "Review updated successfully",
            "review": {
                "id": review.id,
                "rating": review.rating,
                "comment": review.comment,
                "updated_at": review.updated_at.isoformat()
            }
        }

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(ReviewDB).where(
                (ReviewDB.id == review_id) & 
                (ReviewDB.user_id == user['user_id'])
            )
        )
        review = result.scalar_one_or_none()
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found or you don't have permission")
        
        await session.execute(delete(ReviewDB).where(ReviewDB.id == review_id))
        await session.commit()
        
        return {"message": "Review deleted successfully"}

# ============ Wishlist Routes ============

@api_router.get("/wishlist")
async def get_wishlist(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Get wishlist items with product details
        result = await session.execute(
            select(WishlistDB, ProductDB)
            .join(ProductDB, WishlistDB.product_id == ProductDB.id)
            .where(WishlistDB.user_id == user['user_id'])
            .order_by(WishlistDB.added_at.desc())
        )
        wishlist_items = result.all()
        
        return [
            {
                "id": w.id,
                "product_id": w.product_id,
                "added_at": w.added_at.isoformat() if w.added_at else None,
                "product": {
                    "id": p.id,
                    "name": p.name,
                    "brand": p.brand,
                    "price": float(p.price),
                    "category": p.category,
                    "image_url": p.image_url,
                    "stock": p.stock
                }
            }
            for w, p in wishlist_items
        ]

@api_router.post("/wishlist")
async def add_to_wishlist(wishlist_data: AddToWishlist, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Check if product exists
        product_result = await session.execute(select(ProductDB).where(ProductDB.id == wishlist_data.product_id))
        product = product_result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if already in wishlist
        existing = await session.execute(
            select(WishlistDB).where(
                (WishlistDB.user_id == user['user_id']) & 
                (WishlistDB.product_id == wishlist_data.product_id)
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Product already in wishlist")
        
        # Add to wishlist
        wishlist = Wishlist(
            user_id=user['user_id'],
            product_id=wishlist_data.product_id
        )
        
        db_wishlist = WishlistDB(
            id=wishlist.id,
            user_id=wishlist.user_id,
            product_id=wishlist.product_id,
            added_at=wishlist.added_at
        )
        
        session.add(db_wishlist)
        await session.commit()
        
        return {
            "message": "Product added to wishlist",
            "wishlist_item": {
                "id": wishlist.id,
                "product_id": wishlist.product_id,
                "added_at": wishlist.added_at.isoformat()
            }
        }

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(WishlistDB).where(
                (WishlistDB.user_id == user['user_id']) & 
                (WishlistDB.product_id == product_id)
            )
        )
        wishlist_item = result.scalar_one_or_none()
        
        if not wishlist_item:
            raise HTTPException(status_code=404, detail="Product not in wishlist")
        
        await session.execute(
            delete(WishlistDB).where(
                (WishlistDB.user_id == user['user_id']) & 
                (WishlistDB.product_id == product_id)
            )
        )
        await session.commit()
        
        return {"message": "Product removed from wishlist"}

# ============ Product Images Routes ============

@api_router.get("/products/{product_id}/images")
async def get_product_images(product_id: str):
    async with async_session_maker() as session:
        # Check if product exists
        product_result = await session.execute(select(ProductDB).where(ProductDB.id == product_id))
        product = product_result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Get images
        result = await session.execute(
            select(ProductImageDB)
            .where(ProductImageDB.product_id == product_id)
            .order_by(ProductImageDB.display_order, ProductImageDB.created_at)
        )
        images = result.scalars().all()
        
        return [
            {
                "id": img.id,
                "product_id": img.product_id,
                "image_url": img.image_url,
                "display_order": img.display_order,
                "is_primary": bool(img.is_primary),
                "created_at": img.created_at.isoformat() if img.created_at else None
            }
            for img in images
        ]

@api_router.post("/products/{product_id}/images")
async def add_product_image(product_id: str, image_data: CreateProductImage, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    # Check if user is admin
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        # Check if product exists
        product_result = await session.execute(select(ProductDB).where(ProductDB.id == product_id))
        product = product_result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # If this is set as primary, unset other primary images
        if image_data.is_primary:
            await session.execute(
                update(ProductImageDB)
                .where(ProductImageDB.product_id == product_id)
                .values(is_primary=0)
            )
        
        # Create image
        product_image = ProductImage(
            product_id=product_id,
            image_url=image_data.image_url,
            display_order=image_data.display_order,
            is_primary=image_data.is_primary
        )
        
        db_image = ProductImageDB(
            id=product_image.id,
            product_id=product_image.product_id,
            image_url=product_image.image_url,
            display_order=product_image.display_order,
            is_primary=1 if product_image.is_primary else 0,
            created_at=product_image.created_at
        )
        
        session.add(db_image)
        await session.commit()
        
        return {
            "message": "Image added successfully",
            "image": {
                "id": product_image.id,
                "product_id": product_image.product_id,
                "image_url": product_image.image_url,
                "display_order": product_image.display_order,
                "is_primary": product_image.is_primary,
                "created_at": product_image.created_at.isoformat()
            }
        }

@api_router.delete("/products/{product_id}/images/{image_id}")
async def delete_product_image(product_id: str, image_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    # Check if user is admin
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(ProductImageDB).where(
                (ProductImageDB.id == image_id) & 
                (ProductImageDB.product_id == product_id)
            )
        )
        image = result.scalar_one_or_none()
        
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        await session.execute(
            delete(ProductImageDB).where(ProductImageDB.id == image_id)
        )
        await session.commit()
        
        return {"message": "Image deleted successfully"}

# ============ Payment Routes ============

@api_router.post("/payment/checkout")
@limiter.limit(RateLimit['checkout'])
async def create_checkout(request: Request, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Get cart items
        result = await session.execute(select(CartItemDB).where(CartItemDB.user_id == user['user_id']))
        cart_items = result.scalars().all()
        
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        # Calculate total
        total_amount = 0.0
        for cart_item in cart_items:
            product_result = await session.execute(select(ProductDB).where(ProductDB.id == cart_item.product_id))
            product = product_result.scalar_one_or_none()
            
            if product:
                total_amount += product.price * cart_item.quantity
        
        # Get origin from request
        body = await request.json()
        origin_url = body.get('origin_url', '')
        
        if not origin_url:
            raise HTTPException(status_code=400, detail="Origin URL is required")
        
        # Initialize Stripe
        host_url = origin_url
        webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create checkout session
        success_url = f"{host_url}/payment-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
        cancel_url = f"{host_url}/cart"
        
        checkout_request = CheckoutSessionRequest(
            amount=total_amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user['user_id']}
        )
        
        session_response = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction
        payment = PaymentTransaction(
            session_id=session_response.session_id,
            user_id=user['user_id'],
            amount=total_amount,
            currency="usd",
            payment_status="pending",
            status="initiated",
            metadata={"user_id": user['user_id']}
        )
        
        db_payment = PaymentTransactionDB(
            id=payment.id,
            session_id=payment.session_id,
            user_id=payment.user_id,
            order_id=payment.order_id,
            amount=payment.amount,
            currency=payment.currency,
            payment_status=payment.payment_status,
            status=payment.status,
            payment_metadata=json.dumps(payment.metadata) if payment.metadata else None,
            created_at=payment.created_at,
            updated_at=payment.updated_at
        )
        
        session.add(db_payment)
        await session.commit()
        
        return {"url": session_response.url, "session_id": session_response.session_id}

@api_router.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    # Initialize Stripe
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Get checkout status
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    
    async with async_session_maker() as session:
        # Get existing payment
        result = await session.execute(
            select(PaymentTransactionDB).where(PaymentTransactionDB.session_id == session_id)
        )
        existing_payment = result.scalar_one_or_none()
        
        if existing_payment:
            # Update payment transaction
            existing_payment.status = checkout_status.status
            existing_payment.payment_status = checkout_status.payment_status
            existing_payment.updated_at = datetime.now(timezone.utc)
            
            # If payment successful and not yet processed
            if checkout_status.payment_status == "paid" and existing_payment.payment_status != 'paid':
                # Create order from cart
                cart_result = await session.execute(
                    select(CartItemDB).where(CartItemDB.user_id == user['user_id'])
                )
                cart_items = cart_result.scalars().all()
                
                items = []
                total_amount = 0.0
                for cart_item in cart_items:
                    product_result = await session.execute(
                        select(ProductDB).where(ProductDB.id == cart_item.product_id)
                    )
                    product = product_result.scalar_one_or_none()
                    
                    if product:
                        items.append({
                            "product_id": product.id,
                            "name": product.name,
                            "price": product.price,
                            "quantity": cart_item.quantity
                        })
                        total_amount += product.price * cart_item.quantity
                
                # Get user info for address
                user_result = await session.execute(select(UserDB).where(UserDB.id == user['user_id']))
                user_info = user_result.scalar_one_or_none()
                
                order = Order(
                    user_id=user['user_id'],
                    items=items,
                    total_amount=total_amount,
                    payment_status="paid",
                    order_status="confirmed",
                    shipping_address=user_info.address if user_info and user_info.address else 'No address provided'
                )
                
                db_order = OrderDB(
                    id=order.id,
                    user_id=order.user_id,
                    items=json.dumps(order.items),
                    total_amount=order.total_amount,
                    payment_status=order.payment_status,
                    order_status=order.order_status,
                    shipping_address=order.shipping_address,
                    created_at=order.created_at
                )
                
                session.add(db_order)
                
                # Update payment with order_id
                existing_payment.order_id = order.id
                
                # Clear cart
                await session.execute(
                    delete(CartItemDB).where(CartItemDB.user_id == user['user_id'])
                )
                
                # Send payment receipt and order confirmation emails
                if user_info:
                    try:
                        # Send payment receipt email
                        if user_info.email_payment_receipt:
                            email_service.send_payment_receipt_email(
                                user_info.name,
                                user_info.email,
                                order.id,
                                total_amount,
                                "Stripe"
                            )
                        
                        # Send order confirmation email
                        if user_info.email_order_confirmation:
                            email_items = []
                            for item in items:
                                email_items.append({
                                    'name': item['name'],
                                    'brand': 'LensKart',
                                    'quantity': item['quantity'],
                                    'price': item['price']
                                })
                            email_service.send_order_confirmation_email(
                                user_info.name,
                                user_info.email,
                                order.id,
                                email_items,
                                total_amount,
                                order.shipping_address
                            )
                    except Exception as e:
                        logging.error(f"Failed to send payment/order emails: {str(e)}")
            
            await session.commit()
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "amount_total": checkout_status.amount_total,
        "currency": checkout_status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        async with async_session_maker() as session:
            # Update payment transaction
            result = await session.execute(
                select(PaymentTransactionDB).where(PaymentTransactionDB.session_id == webhook_response.session_id)
            )
            payment = result.scalar_one_or_none()
            
            if payment:
                payment.payment_status = webhook_response.payment_status
                payment.updated_at = datetime.now(timezone.utc)
                await session.commit()
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ Unified Payment Gateway Endpoints ============

@api_router.get("/payment/gateways")
async def get_available_gateways():
    """Get list of available payment gateways"""
    return PaymentGatewayFactory.get_available_gateways()

@api_router.post("/payment/razorpay/create-order")
async def create_razorpay_order(request: Request, authorization: str = Header(None)):
    """Create Razorpay order"""
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Get cart items
        result = await session.execute(
            select(CartItemDB).where(CartItemDB.user_id == user['user_id'])
        )
        cart_items = result.scalars().all()
        
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        # Calculate total amount
        total_amount = 0.0
        for cart_item in cart_items:
            product_result = await session.execute(
                select(ProductDB).where(ProductDB.id == cart_item.product_id)
            )
            product = product_result.scalar_one_or_none()
            if product:
                total_amount += product.price * cart_item.quantity
        
        # Get origin URL for callbacks
        body = await request.json()
        origin_url = body.get('origin_url', '')
        
        if not origin_url:
            raise HTTPException(status_code=400, detail="Origin URL is required")
        
        # Create payment gateway
        gateway = PaymentGatewayFactory.create_gateway("razorpay")
        
        # Create checkout session
        success_url = f"{origin_url}/payment-success?session_id={{{{SESSION_ID}}}}&gateway=razorpay"
        cancel_url = f"{origin_url}/cart"
        
        checkout_response = await gateway.create_checkout_session(
            amount=total_amount,
            currency="INR",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user['user_id']}
        )
        
        # Create payment transaction
        payment = PaymentTransaction(
            session_id=checkout_response.session_id,
            user_id=user['user_id'],
            amount=total_amount,
            currency="INR",
            payment_status="pending",
            status="initiated",
            metadata={"user_id": user['user_id'], "gateway": "razorpay"}
        )
        
        db_payment = PaymentTransactionDB(
            id=payment.id,
            session_id=payment.session_id,
            user_id=payment.user_id,
            order_id=payment.order_id,
            amount=payment.amount,
            currency=payment.currency,
            payment_status=payment.payment_status,
            status=payment.status,
            payment_metadata=json.dumps(payment.metadata) if payment.metadata else None,
            created_at=payment.created_at,
            updated_at=payment.updated_at
        )
        
        session.add(db_payment)
        await session.commit()
        
        return {
            "order_id": checkout_response.session_id,
            "amount": int(checkout_response.amount * 100),  # Convert to paise for frontend
            "currency": checkout_response.currency,
            "key_id": checkout_response.key_id,
            "gateway": "razorpay"
        }

@api_router.post("/payment/razorpay/verify")
async def verify_razorpay_payment(
    request: Request,
    authorization: str = Header(None)
):
    """Verify Razorpay payment and create order"""
    user = await get_current_user(authorization)
    
    body = await request.json()
    razorpay_payment_id = body.get('razorpay_payment_id')
    razorpay_order_id = body.get('razorpay_order_id')
    razorpay_signature = body.get('razorpay_signature')
    
    if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
        raise HTTPException(status_code=400, detail="Missing payment verification data")
    
    # Verify signature
    gateway = PaymentGatewayFactory.create_gateway("razorpay")
    if not isinstance(gateway, RazorpayGateway):
        raise HTTPException(status_code=500, detail="Invalid gateway type")
    
    is_valid = gateway.verify_payment_signature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    async with async_session_maker() as session:
        # Get cart items
        result = await session.execute(
            select(CartItemDB).where(CartItemDB.user_id == user['user_id'])
        )
        cart_items = result.scalars().all()
        
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        # Create order
        items = []
        total_amount = 0.0
        for cart_item in cart_items:
            product_result = await session.execute(
                select(ProductDB).where(ProductDB.id == cart_item.product_id)
            )
            product = product_result.scalar_one_or_none()
            
            if product:
                items.append({
                    "product_id": product.id,
                    "name": product.name,
                    "price": product.price,
                    "quantity": cart_item.quantity
                })
                total_amount += product.price * cart_item.quantity
        
        # Get user info for address
        user_result = await session.execute(select(UserDB).where(UserDB.id == user['user_id']))
        user_info = user_result.scalar_one_or_none()
        
        order = Order(
            user_id=user['user_id'],
            items=items,
            total_amount=total_amount,
            payment_status="paid",
            order_status="confirmed",
            shipping_address=user_info.address if user_info and user_info.address else 'No address provided'
        )
        
        db_order = OrderDB(
            id=order.id,
            user_id=order.user_id,
            items=json.dumps(order.items),
            total_amount=order.total_amount,
            payment_status=order.payment_status,
            order_status=order.order_status,
            shipping_address=order.shipping_address,
            created_at=order.created_at
        )
        
        session.add(db_order)
        
        # Update payment transaction
        payment_result = await session.execute(
            select(PaymentTransactionDB).where(PaymentTransactionDB.session_id == razorpay_order_id)
        )
        existing_payment = payment_result.scalar_one_or_none()
        
        if existing_payment:
            existing_payment.payment_status = "completed"
            existing_payment.status = "completed"
            existing_payment.order_id = order.id
            existing_payment.updated_at = datetime.now(timezone.utc)
        
        # Clear cart
        await session.execute(
            delete(CartItemDB).where(CartItemDB.user_id == user['user_id'])
        )
        
        await session.commit()
        
        return {
            "status": "success",
            "order_id": order.id,
            "message": "Payment verified and order created successfully"
        }

@api_router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook events"""
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")
    
    try:
        # Create gateway and verify webhook
        gateway = PaymentGatewayFactory.create_gateway("razorpay")
        webhook_response = await gateway.verify_webhook(body, signature)
        
        async with async_session_maker() as session:
            # Update payment transaction
            result = await session.execute(
                select(PaymentTransactionDB).where(
                    PaymentTransactionDB.session_id == webhook_response.session_id
                )
            )
            payment = result.scalar_one_or_none()
            
            if payment:
                payment.payment_status = webhook_response.payment_status
                payment.updated_at = datetime.now(timezone.utc)
                await session.commit()
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Razorpay webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# ============ Recently Viewed & Recommendations ============

@api_router.get("/user/recently-viewed")
async def get_recently_viewed(
    limit: int = 10,
    authorization: str = Header(None)
):
    """Get user's recently viewed products"""
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Get recently viewed products with product details
        result = await session.execute(
            select(RecentlyViewedDB, ProductDB)
            .join(ProductDB, RecentlyViewedDB.product_id == ProductDB.id)
            .where(RecentlyViewedDB.user_id == user['user_id'])
            .order_by(RecentlyViewedDB.viewed_at.desc())
            .limit(limit)
        )
        rows = result.all()
        
        return [
            {
                "id": row[1].id,
                "name": row[1].name,
                "brand": row[1].brand,
                "price": float(row[1].price),
                "description": row[1].description,
                "category": row[1].category,
                "frame_type": row[1].frame_type,
                "frame_shape": row[1].frame_shape,
                "color": row[1].color,
                "image_url": row[1].image_url,
                "stock": row[1].stock,
                "viewed_at": row[0].viewed_at.isoformat() if row[0].viewed_at else None
            }
            for row in rows
        ]

@api_router.post("/user/recently-viewed/{product_id}")
async def add_recently_viewed(
    product_id: str,
    authorization: str = Header(None)
):
    """Track product view"""
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Check if product exists
        result = await session.execute(select(ProductDB).where(ProductDB.id == product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if already viewed recently
        result = await session.execute(
            select(RecentlyViewedDB).where(
                RecentlyViewedDB.user_id == user['user_id'],
                RecentlyViewedDB.product_id == product_id
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update viewed_at timestamp
            existing.viewed_at = datetime.now(timezone.utc)
        else:
            # Add new entry
            new_view = RecentlyViewedDB(
                id=str(uuid.uuid4()),
                user_id=user['user_id'],
                product_id=product_id,
                viewed_at=datetime.now(timezone.utc)
            )
            session.add(new_view)
        
        await session.commit()
        
        return {"message": "Product view tracked"}

@api_router.get("/products/recommended")
async def get_recommended_products(
    limit: int = 8,
    authorization: str = Header(None)
):
    """Get recommended products based on user's recently viewed items"""
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Get user's recently viewed products to understand preferences
        result = await session.execute(
            select(RecentlyViewedDB, ProductDB)
            .join(ProductDB, RecentlyViewedDB.product_id == ProductDB.id)
            .where(RecentlyViewedDB.user_id == user['user_id'])
            .order_by(RecentlyViewedDB.viewed_at.desc())
            .limit(5)
        )
        recently_viewed = result.all()
        
        if not recently_viewed:
            # No viewing history, return popular products (highest stock or newest)
            result = await session.execute(
                select(ProductDB)
                .where(ProductDB.stock > 0)
                .order_by(ProductDB.created_at.desc())
                .limit(limit)
            )
            products = result.scalars().all()
        else:
            # Get categories and brands from recently viewed
            categories = set()
            brands = set()
            viewed_ids = set()
            
            for view, product in recently_viewed:
                categories.add(product.category)
                brands.add(product.brand)
                viewed_ids.add(product.id)
            
            # Find products with matching category or brand (excluding already viewed)
            result = await session.execute(
                select(ProductDB)
                .where(
                    ProductDB.stock > 0,
                    ProductDB.id.notin_(viewed_ids),
                    or_(
                        ProductDB.category.in_(categories),
                        ProductDB.brand.in_(brands)
                    )
                )
                .order_by(ProductDB.created_at.desc())
                .limit(limit)
            )
            products = result.scalars().all()
        
        return [
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "price": float(p.price),
                "description": p.description,
                "category": p.category,
                "frame_type": p.frame_type,
                "frame_shape": p.frame_shape,
                "color": p.color,
                "image_url": p.image_url,
                "stock": p.stock
            }
            for p in products
        ]

@api_router.get("/products/{product_id}/related")
async def get_related_products(
    product_id: str,
    limit: int = 4
):
    """Get related products based on category and brand"""
    async with async_session_maker() as session:
        # Get the current product
        result = await session.execute(select(ProductDB).where(ProductDB.id == product_id))
        current_product = result.scalar_one_or_none()
        
        if not current_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Find related products (same category or brand, excluding current product)
        result = await session.execute(
            select(ProductDB)
            .where(
                ProductDB.stock > 0,
                ProductDB.id != product_id,
                or_(
                    ProductDB.category == current_product.category,
                    ProductDB.brand == current_product.brand
                )
            )
            .order_by(ProductDB.created_at.desc())
            .limit(limit)
        )
        products = result.scalars().all()
        
        return [
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "price": float(p.price),
                "description": p.description,
                "category": p.category,
                "frame_type": p.frame_type,
                "frame_shape": p.frame_shape,
                "color": p.color,
                "image_url": p.image_url,
                "stock": p.stock
            }
            for p in products
        ]

# ============ Admin Stats ============

@api_router.get("/admin/stats")
async def get_admin_stats(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        # Count products
        product_count = await session.execute(select(func.count(ProductDB.id)))
        total_products = product_count.scalar()
        
        # Count orders
        order_count = await session.execute(select(func.count(OrderDB.id)))
        total_orders = order_count.scalar()
        
        # Count users
        user_count = await session.execute(select(func.count(UserDB.id)))
        total_users = user_count.scalar()
        
        # Calculate total revenue
        revenue_result = await session.execute(
            select(func.sum(OrderDB.total_amount)).where(OrderDB.payment_status == "paid")
        )
        total_revenue = revenue_result.scalar() or 0
        
        return {
            "total_products": total_products,
            "total_orders": total_orders,
            "total_users": total_users,
            "total_revenue": float(total_revenue)
        }

# ============ Coupon Routes ============

@api_router.post("/coupons/validate", response_model=ValidateCouponResponse)
async def validate_coupon(request: ValidateCouponRequest, authorization: str = Header(None)):
    """Validate a coupon code and calculate discount"""
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Find the coupon by code
        result = await session.execute(
            select(CouponDB).where(CouponDB.code == request.code.upper())
        )
        coupon = result.scalar_one_or_none()
        
        if not coupon:
            return ValidateCouponResponse(
                valid=False,
                message="Invalid coupon code",
                discount_amount=0,
                final_amount=request.cart_total
            )
        
        # Check if coupon is active
        if not coupon.is_active:
            return ValidateCouponResponse(
                valid=False,
                message="This coupon is no longer active",
                discount_amount=0,
                final_amount=request.cart_total
            )
        
        # Check validity dates
        now = datetime.now(timezone.utc)
        if now < coupon.valid_from:
            return ValidateCouponResponse(
                valid=False,
                message="This coupon is not yet valid",
                discount_amount=0,
                final_amount=request.cart_total
            )
        
        if now > coupon.valid_until:
            return ValidateCouponResponse(
                valid=False,
                message="This coupon has expired",
                discount_amount=0,
                final_amount=request.cart_total
            )
        
        # Check usage limit
        if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
            return ValidateCouponResponse(
                valid=False,
                message="This coupon has reached its usage limit",
                discount_amount=0,
                final_amount=request.cart_total
            )
        
        # Check minimum purchase
        if request.cart_total < coupon.min_purchase:
            return ValidateCouponResponse(
                valid=False,
                message=f"Minimum purchase of ${coupon.min_purchase:.2f} required",
                discount_amount=0,
                final_amount=request.cart_total
            )
        
        # Calculate discount
        discount_amount = 0
        if coupon.discount_type == "percentage":
            discount_amount = (request.cart_total * coupon.discount_value) / 100
            # Apply max discount if specified
            if coupon.max_discount and discount_amount > coupon.max_discount:
                discount_amount = coupon.max_discount
        elif coupon.discount_type == "fixed":
            discount_amount = coupon.discount_value
            # Don't let discount exceed cart total
            if discount_amount > request.cart_total:
                discount_amount = request.cart_total
        
        final_amount = max(0, request.cart_total - discount_amount)
        
        return ValidateCouponResponse(
            valid=True,
            message="Coupon applied successfully!",
            discount_amount=discount_amount,
            final_amount=final_amount,
            coupon=Coupon(
                id=coupon.id,
                code=coupon.code,
                discount_type=coupon.discount_type,
                discount_value=coupon.discount_value,
                min_purchase=coupon.min_purchase,
                max_discount=coupon.max_discount,
                usage_limit=coupon.usage_limit,
                used_count=coupon.used_count,
                valid_from=coupon.valid_from,
                valid_until=coupon.valid_until,
                is_active=bool(coupon.is_active),
                created_at=coupon.created_at
            )
        )

@api_router.post("/orders/apply-coupon")
async def apply_coupon_to_order(order_id: str, coupon_code: str, authorization: str = Header(None)):
    """Apply a coupon to an existing order (before payment)"""
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Get the order
        result = await session.execute(
            select(OrderDB).where(OrderDB.id == order_id, OrderDB.user_id == user['user_id'])
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.payment_status != "pending":
            raise HTTPException(status_code=400, detail="Cannot apply coupon to paid orders")
        
        # Validate coupon
        validate_req = ValidateCouponRequest(code=coupon_code, cart_total=order.total_amount)
        validation = await validate_coupon(validate_req, authorization)
        
        if not validation.valid:
            raise HTTPException(status_code=400, detail=validation.message)
        
        # Update order total
        order.total_amount = validation.final_amount
        await session.commit()
        
        # Increment coupon usage
        if validation.coupon:
            coupon_result = await session.execute(
                select(CouponDB).where(CouponDB.id == validation.coupon.id)
            )
            coupon_db = coupon_result.scalar_one_or_none()
            if coupon_db:
                coupon_db.used_count += 1
                await session.commit()
        
        return {
            "message": "Coupon applied successfully",
            "original_amount": order.total_amount + validation.discount_amount,
            "discount_amount": validation.discount_amount,
            "final_amount": validation.final_amount
        }

# ============ Admin Coupon Management ============

@api_router.get("/admin/coupons")
async def get_all_coupons(authorization: str = Header(None)):
    """Get all coupons (admin only)"""
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(CouponDB).order_by(CouponDB.created_at.desc())
        )
        coupons = result.scalars().all()
        
        return [
            {
                "id": c.id,
                "code": c.code,
                "discount_type": c.discount_type,
                "discount_value": float(c.discount_value),
                "min_purchase": float(c.min_purchase),
                "max_discount": float(c.max_discount) if c.max_discount else None,
                "usage_limit": c.usage_limit,
                "used_count": c.used_count,
                "valid_from": c.valid_from.isoformat(),
                "valid_until": c.valid_until.isoformat(),
                "is_active": bool(c.is_active),
                "created_at": c.created_at.isoformat()
            }
            for c in coupons
        ]

@api_router.post("/admin/coupons")
async def create_coupon(coupon: CreateCoupon, authorization: str = Header(None)):
    """Create a new coupon (admin only)"""
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        # Check if coupon code already exists
        existing = await session.execute(
            select(CouponDB).where(CouponDB.code == coupon.code.upper())
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Coupon code already exists")
        
        # Create new coupon
        new_coupon = CouponDB(
            id=str(uuid.uuid4()),
            code=coupon.code.upper(),
            discount_type=coupon.discount_type,
            discount_value=coupon.discount_value,
            min_purchase=coupon.min_purchase,
            max_discount=coupon.max_discount,
            usage_limit=coupon.usage_limit,
            used_count=0,
            valid_from=coupon.valid_from,
            valid_until=coupon.valid_until,
            is_active=coupon.is_active
        )
        
        session.add(new_coupon)
        await session.commit()
        
        return {
            "id": new_coupon.id,
            "code": new_coupon.code,
            "message": "Coupon created successfully"
        }

@api_router.put("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon_update: UpdateCoupon, authorization: str = Header(None)):
    """Update a coupon (admin only)"""
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(CouponDB).where(CouponDB.id == coupon_id)
        )
        coupon = result.scalar_one_or_none()
        
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")
        
        # Update fields
        if coupon_update.code is not None:
            coupon.code = coupon_update.code.upper()
        if coupon_update.discount_type is not None:
            coupon.discount_type = coupon_update.discount_type
        if coupon_update.discount_value is not None:
            coupon.discount_value = coupon_update.discount_value
        if coupon_update.min_purchase is not None:
            coupon.min_purchase = coupon_update.min_purchase
        if coupon_update.max_discount is not None:
            coupon.max_discount = coupon_update.max_discount
        if coupon_update.usage_limit is not None:
            coupon.usage_limit = coupon_update.usage_limit
        if coupon_update.valid_from is not None:
            coupon.valid_from = coupon_update.valid_from
        if coupon_update.valid_until is not None:
            coupon.valid_until = coupon_update.valid_until
        if coupon_update.is_active is not None:
            coupon.is_active = coupon_update.is_active
        
        await session.commit()
        
        return {"message": "Coupon updated successfully"}

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, authorization: str = Header(None)):
    """Delete a coupon (admin only)"""
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(CouponDB).where(CouponDB.id == coupon_id)
        )
        coupon = result.scalar_one_or_none()
        
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")
        
        await session.delete(coupon)
        await session.commit()
        
        return {"message": "Coupon deleted successfully"}

# ============ Saved Items Routes ============

@api_router.get("/saved-items")
async def get_saved_items(authorization: str = Header(None)):
    """Get user's saved items"""
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(SavedItemDB, ProductDB)
            .join(ProductDB, SavedItemDB.product_id == ProductDB.id)
            .where(SavedItemDB.user_id == user['user_id'])
            .order_by(SavedItemDB.saved_at.desc())
        )
        saved_items = result.all()
        
        return [
            {
                "id": item.SavedItemDB.id,
                "product": {
                    "id": item.ProductDB.id,
                    "name": item.ProductDB.name,
                    "brand": item.ProductDB.brand,
                    "price": float(item.ProductDB.price),
                    "description": item.ProductDB.description,
                    "category": item.ProductDB.category,
                    "frame_type": item.ProductDB.frame_type,
                    "frame_shape": item.ProductDB.frame_shape,
                    "color": item.ProductDB.color,
                    "image_url": item.ProductDB.image_url,
                    "stock": item.ProductDB.stock
                },
                "quantity": item.SavedItemDB.quantity,
                "saved_at": item.SavedItemDB.saved_at.isoformat()
            }
            for item in saved_items
        ]

@api_router.post("/cart/{cart_item_id}/save")
async def save_cart_item(cart_item_id: str, authorization: str = Header(None)):
    """Move a cart item to saved items"""
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Get cart item
        result = await session.execute(
            select(CartItemDB).where(
                CartItemDB.id == cart_item_id,
                CartItemDB.user_id == user['user_id']
            )
        )
        cart_item = result.scalar_one_or_none()
        
        if not cart_item:
            raise HTTPException(status_code=404, detail="Cart item not found")
        
        # Check if already saved
        existing = await session.execute(
            select(SavedItemDB).where(
                SavedItemDB.user_id == user['user_id'],
                SavedItemDB.product_id == cart_item.product_id
            )
        )
        if existing.scalar_one_or_none():
            # Just remove from cart
            await session.delete(cart_item)
            await session.commit()
            return {"message": "Item already in saved items. Removed from cart."}
        
        # Create saved item
        saved_item = SavedItemDB(
            id=str(uuid.uuid4()),
            user_id=user['user_id'],
            product_id=cart_item.product_id,
            quantity=cart_item.quantity
        )
        
        session.add(saved_item)
        
        # Remove from cart
        await session.delete(cart_item)
        
        await session.commit()
        
        return {"message": "Item moved to saved items"}

@api_router.post("/saved-items/{saved_item_id}/move-to-cart")
async def move_saved_item_to_cart(saved_item_id: str, authorization: str = Header(None)):
    """Move a saved item to cart"""
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        # Get saved item
        result = await session.execute(
            select(SavedItemDB).where(
                SavedItemDB.id == saved_item_id,
                SavedItemDB.user_id == user['user_id']
            )
        )
        saved_item = result.scalar_one_or_none()
        
        if not saved_item:
            raise HTTPException(status_code=404, detail="Saved item not found")
        
        # Check product stock
        product_result = await session.execute(
            select(ProductDB).where(ProductDB.id == saved_item.product_id)
        )
        product = product_result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        if product.stock < saved_item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {product.stock} items in stock"
            )
        
        # Check if already in cart
        existing_cart = await session.execute(
            select(CartItemDB).where(
                CartItemDB.user_id == user['user_id'],
                CartItemDB.product_id == saved_item.product_id
            )
        )
        cart_item = existing_cart.scalar_one_or_none()
        
        if cart_item:
            # Update quantity
            cart_item.quantity += saved_item.quantity
        else:
            # Create cart item
            cart_item = CartItemDB(
                id=str(uuid.uuid4()),
                user_id=user['user_id'],
                product_id=saved_item.product_id,
                quantity=saved_item.quantity
            )
            session.add(cart_item)
        
        # Remove from saved items
        await session.delete(saved_item)
        
        await session.commit()
        
        return {"message": "Item moved to cart"}

@api_router.delete("/saved-items/{saved_item_id}")
async def delete_saved_item(saved_item_id: str, authorization: str = Header(None)):
    """Delete a saved item"""
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(SavedItemDB).where(
                SavedItemDB.id == saved_item_id,
                SavedItemDB.user_id == user['user_id']
            )
        )
        saved_item = result.scalar_one_or_none()
        
        if not saved_item:
            raise HTTPException(status_code=404, detail="Saved item not found")
        
        await session.delete(saved_item)
        await session.commit()
        
        return {"message": "Saved item deleted"}

# ============ Admin Analytics ============

@api_router.get("/admin/analytics/sales")
async def get_sales_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: str = Header(None)
):
    """Get sales analytics (admin only)"""
    user = await get_current_user(authorization)
    
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        # Build date filter
        query = select(OrderDB)
        
        if start_date:
            query = query.where(OrderDB.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.where(OrderDB.created_at <= datetime.fromisoformat(end_date))
        
        result = await session.execute(query)
        orders = result.scalars().all()
        
        # Calculate daily sales
        daily_sales = {}
        for order in orders:
            date_key = order.created_at.strftime('%Y-%m-%d')
            if date_key not in daily_sales:
                daily_sales[date_key] = {
                    'date': date_key,
                    'total_orders': 0,
                    'total_revenue': 0.0,
                    'order_ids': []
                }
            daily_sales[date_key]['total_orders'] += 1
            daily_sales[date_key]['total_revenue'] += float(order.total_amount)
            daily_sales[date_key]['order_ids'].append(order.id)
        
        # Convert to list and sort by date
        sales_data = sorted(daily_sales.values(), key=lambda x: x['date'])
        
        # Calculate summary statistics
        total_orders = len(orders)
        total_revenue = sum(float(order.total_amount) for order in orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        return {
            "summary": {
                "total_orders": total_orders,
                "total_revenue": round(total_revenue, 2),
                "average_order_value": round(avg_order_value, 2)
            },
            "daily_sales": sales_data
        }

@api_router.get("/admin/analytics/top-products")
async def get_top_products(
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: str = Header(None)
):
    """Get top selling products (admin only)"""
    user = await get_current_user(authorization)
    
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        # Build date filter for orders
        query = select(OrderDB)
        
        if start_date:
            query = query.where(OrderDB.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.where(OrderDB.created_at <= datetime.fromisoformat(end_date))
        
        result = await session.execute(query)
        orders = result.scalars().all()
        order_ids = [order.id for order in orders]
        
        # Get order items for these orders
        if order_ids:
            order_items_result = await session.execute(
                select(OrderItemDB).where(OrderItemDB.order_id.in_(order_ids))
            )
            order_items = order_items_result.scalars().all()
        else:
            order_items = []
        
        # Aggregate by product
        product_sales = {}
        for item in order_items:
            if item.product_id not in product_sales:
                product_sales[item.product_id] = {
                    'product_id': item.product_id,
                    'quantity_sold': 0,
                    'total_revenue': 0.0
                }
            product_sales[item.product_id]['quantity_sold'] += item.quantity
            product_sales[item.product_id]['total_revenue'] += float(item.price * item.quantity)
        
        # Get product details
        top_products = []
        for product_id, sales_data in product_sales.items():
            product_result = await session.execute(
                select(ProductDB).where(ProductDB.id == product_id)
            )
            product = product_result.scalar_one_or_none()
            
            if product:
                top_products.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'brand': product.brand,
                    'category': product.category,
                    'price': float(product.price),
                    'image_url': product.image_url,
                    'quantity_sold': sales_data['quantity_sold'],
                    'total_revenue': round(sales_data['total_revenue'], 2)
                })
        
        # Sort by quantity sold and limit
        top_products.sort(key=lambda x: x['quantity_sold'], reverse=True)
        
        return {"top_products": top_products[:limit]}

@api_router.get("/admin/analytics/revenue")
async def get_revenue_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: str = Header(None)
):
    """Get revenue breakdown by category, payment status, etc. (admin only)"""
    user = await get_current_user(authorization)
    
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        # Build date filter
        query = select(OrderDB)
        
        if start_date:
            query = query.where(OrderDB.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.where(OrderDB.created_at <= datetime.fromisoformat(end_date))
        
        result = await session.execute(query)
        orders = result.scalars().all()
        order_ids = [order.id for order in orders]
        
        # Revenue by payment status
        revenue_by_status = {}
        for order in orders:
            status = order.payment_status
            if status not in revenue_by_status:
                revenue_by_status[status] = 0.0
            revenue_by_status[status] += float(order.total_amount)
        
        # Revenue by category
        revenue_by_category = {}
        if order_ids:
            order_items_result = await session.execute(
                select(OrderItemDB).where(OrderItemDB.order_id.in_(order_ids))
            )
            order_items = order_items_result.scalars().all()
            
            for item in order_items:
                # Get product category
                product_result = await session.execute(
                    select(ProductDB).where(ProductDB.id == item.product_id)
                )
                product = product_result.scalar_one_or_none()
                
                if product:
                    category = product.category
                    if category not in revenue_by_category:
                        revenue_by_category[category] = 0.0
                    revenue_by_category[category] += float(item.price * item.quantity)
        
        # Revenue by order status
        revenue_by_order_status = {}
        for order in orders:
            status = order.order_status
            if status not in revenue_by_order_status:
                revenue_by_order_status[status] = 0.0
            revenue_by_order_status[status] += float(order.total_amount)
        
        # Convert to list format for easier frontend consumption
        category_breakdown = [
            {"category": k, "revenue": round(v, 2)}
            for k, v in revenue_by_category.items()
        ]
        
        payment_status_breakdown = [
            {"status": k, "revenue": round(v, 2)}
            for k, v in revenue_by_status.items()
        ]
        
        order_status_breakdown = [
            {"status": k, "revenue": round(v, 2)}
            for k, v in revenue_by_order_status.items()
        ]
        
        return {
            "revenue_by_category": category_breakdown,
            "revenue_by_payment_status": payment_status_breakdown,
            "revenue_by_order_status": order_status_breakdown
        }

# ============ Admin Inventory Management ============

@api_router.get("/admin/inventory/alerts")
async def get_inventory_alerts(authorization: str = Header(None)):
    """Get low stock alerts (admin only)"""
    user = await get_current_user(authorization)
    
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        # Get low stock threshold from environment or use default (10)
        low_stock_threshold = int(os.environ.get('LOW_STOCK_THRESHOLD', '10'))
        
        # Get products with low stock
        result = await session.execute(
            select(ProductDB).where(ProductDB.stock <= low_stock_threshold).order_by(ProductDB.stock)
        )
        products = result.scalars().all()
        
        alerts = []
        for product in products:
            alert_level = "critical" if product.stock == 0 else "warning" if product.stock <= low_stock_threshold / 2 else "low"
            alerts.append({
                "product_id": product.id,
                "product_name": product.name,
                "brand": product.brand,
                "category": product.category,
                "current_stock": product.stock,
                "alert_level": alert_level,
                "image_url": product.image_url
            })
        
        return {
            "low_stock_threshold": low_stock_threshold,
            "total_alerts": len(alerts),
            "alerts": alerts
        }

@api_router.put("/admin/inventory/threshold")
async def update_stock_threshold(
    threshold: int,
    authorization: str = Header(None)
):
    """Update low stock threshold (admin only)"""
    user = await get_current_user(authorization)
    
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if threshold < 0:
        raise HTTPException(status_code=400, detail="Threshold must be non-negative")
    
    # In a production app, this would be stored in a settings table
    # For now, we'll return success and the value can be set via environment variable
    return {
        "message": "Threshold updated successfully",
        "threshold": threshold,
        "note": "Set LOW_STOCK_THRESHOLD environment variable to persist this setting"
    }

class BulkStockUpdate(BaseModel):
    product_id: str
    stock: int

@api_router.put("/admin/inventory/bulk-update")
async def bulk_update_stock(
    updates: List[BulkStockUpdate],
    authorization: str = Header(None)
):
    """Bulk update product stock (admin only)"""
    user = await get_current_user(authorization)
    
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        updated_products = []
        
        for update_item in updates:
            if update_item.stock < 0:
                raise HTTPException(status_code=400, detail=f"Stock cannot be negative for product {update_item.product_id}")
            
            result = await session.execute(
                select(ProductDB).where(ProductDB.id == update_item.product_id)
            )
            product = result.scalar_one_or_none()
            
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {update_item.product_id} not found")
            
            old_stock = product.stock
            product.stock = update_item.stock
            
            updated_products.append({
                "product_id": product.id,
                "product_name": product.name,
                "old_stock": old_stock,
                "new_stock": product.stock
            })
        
        await session.commit()
        
        return {
            "message": f"Successfully updated stock for {len(updated_products)} products",
            "updated_products": updated_products
        }

# ============ Admin User Management APIs ============

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None

@api_router.get("/admin/users")
async def get_all_users(
    authorization: str = Header(None),
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Get all users with pagination and search (admin only)"""
    user = await get_current_user(authorization)
    
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        # Build query
        query = select(UserDB)
        
        # Apply search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    UserDB.name.ilike(search_pattern),
                    UserDB.email.ilike(search_pattern),
                    UserDB.phone.ilike(search_pattern)
                )
            )
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await session.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit).order_by(UserDB.created_at.desc())
        
        result = await session.execute(query)
        users = result.scalars().all()
        
        users_list = [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "phone": u.phone,
                "address": u.address,
                "role": u.role,
                "is_blocked": bool(u.is_blocked),
                "created_at": u.created_at.isoformat()
            }
            for u in users
        ]
        
        return {
            "users": users_list,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }

@api_router.get("/admin/users/{user_id}")
async def get_user_details(
    user_id: str,
    authorization: str = Header(None)
):
    """Get detailed user information including order history (admin only)"""
    admin = await get_current_user(authorization)
    
    if admin['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        # Get user details
        user_result = await session.execute(
            select(UserDB).where(UserDB.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's orders with total spent
        orders_result = await session.execute(
            select(OrderDB).where(OrderDB.user_id == user_id).order_by(OrderDB.created_at.desc())
        )
        orders = orders_result.scalars().all()
        
        # Get cart items count
        cart_result = await session.execute(
            select(func.count()).select_from(CartDB).where(CartDB.user_id == user_id)
        )
        cart_count = cart_result.scalar()
        
        # Get wishlist items count
        wishlist_result = await session.execute(
            select(func.count()).select_from(WishlistDB).where(WishlistDB.user_id == user_id)
        )
        wishlist_count = wishlist_result.scalar()
        
        # Get reviews count
        reviews_result = await session.execute(
            select(func.count()).select_from(ReviewDB).where(ReviewDB.user_id == user_id)
        )
        reviews_count = reviews_result.scalar()
        
        # Calculate total spent
        total_spent = sum(order.total_amount for order in orders if order.payment_status == 'paid')
        
        orders_list = [
            {
                "id": order.id,
                "total_amount": float(order.total_amount),
                "order_status": order.order_status,
                "payment_status": order.payment_status,
                "created_at": order.created_at.isoformat()
            }
            for order in orders
        ]
        
        return {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address,
                "role": user.role,
                "is_blocked": bool(user.is_blocked),
                "created_at": user.created_at.isoformat()
            },
            "statistics": {
                "total_orders": len(orders),
                "total_spent": float(total_spent),
                "cart_items": cart_count,
                "wishlist_items": wishlist_count,
                "reviews_count": reviews_count
            },
            "recent_orders": orders_list[:10]  # Last 10 orders
        }

@api_router.put("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: UpdateUserRequest,
    authorization: str = Header(None)
):
    """Update user information (admin only)"""
    admin = await get_current_user(authorization)
    
    if admin['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(UserDB).where(UserDB.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update fields if provided
        if update_data.name is not None:
            user.name = update_data.name
        if update_data.phone is not None:
            user.phone = update_data.phone
        if update_data.address is not None:
            user.address = update_data.address
        if update_data.role is not None and update_data.role in ['user', 'admin']:
            user.role = update_data.role
        
        await session.commit()
        
        return {
            "message": "User updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address,
                "role": user.role,
                "is_blocked": bool(user.is_blocked)
            }
        }

@api_router.put("/admin/users/{user_id}/block")
async def block_unblock_user(
    user_id: str,
    authorization: str = Header(None)
):
    """Block or unblock a user (admin only)"""
    admin = await get_current_user(authorization)
    
    if admin['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    async with async_session_maker() as session:
        result = await session.execute(
            select(UserDB).where(UserDB.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent blocking admin users
        if user.role == 'admin':
            raise HTTPException(status_code=400, detail="Cannot block admin users")
        
        # Toggle block status
        user.is_blocked = 1 if user.is_blocked == 0 else 0
        
        await session.commit()
        
        status = "blocked" if user.is_blocked == 1 else "unblocked"
        
        return {
            "message": f"User {status} successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "is_blocked": bool(user.is_blocked)
            }
        }

# ============ Database Initialization ============

async def init_db():
    """Initialize database with enhanced logging"""
    try:
        logger.info("=" * 70)
        logger.info("[STARTUP] DATABASE INITIALIZATION")
        logger.info("=" * 70)
        
        # Test database connection
        logger.info("[DATABASE] Connecting to MySQL database...")
        logger.info(f"   Host: {DB_HOST}")
        logger.info(f"   Port: {DB_PORT}")
        logger.info(f"   Database: {DB_NAME}")
        logger.info(f"   User: {DB_USER}")
        
        async with engine.begin() as conn:
            # Test connection
            result = await conn.execute(select(func.version()))
            version = result.scalar()
            logger.info("[SUCCESS] Database connection successful!")
            logger.info(f"   MySQL Version: {version}")
            
            # Create tables
            logger.info("[DATABASE] Creating/verifying database tables...")
            await conn.run_sync(Base.metadata.create_all)
            
            logger.info("[SUCCESS] Database tables created/verified successfully!")
            logger.info("   Available tables: users, products, cart, orders, addresses, reviews, wishlist, etc.")
            
    except Exception as e:
        logger.error("=" * 70)
        logger.error("[FAILED] DATABASE INITIALIZATION FAILED!")
        logger.error("=" * 70)
        logger.error(f"Error Type: {type(e).__name__}")
        logger.error(f"Error Message: {str(e)}")
        logger.error("Please check:")
        logger.error("  1. MySQL server is running")
        logger.error(f"  2. Database '{DB_NAME}' exists")
        logger.error(f"  3. User '{DB_USER}' has proper permissions")
        logger.error(f"  4. Connection details in .env are correct")
        logger.error("=" * 70)
        raise

@app.on_event("startup")
async def startup_event():
    """Application startup with enhanced logging"""
    try:
        logger.info("")
        logger.info("=" * 70)
        logger.info("[STARTUP] LENSKART E-COMMERCE BACKEND STARTING UP")
        logger.info("=" * 70)
        logger.info("")
        
        # Initialize database
        await init_db()
        logger.info("")
        
        # Initialize Redis cache
        try:
            logger.info("[CACHE] Initializing Redis cache...")
            cache = get_cache_service()
            await cache.connect()
            logger.info("[SUCCESS] Redis cache initialized successfully!")
        except Exception as e:
            logger.warning(f"[WARNING] Redis cache initialization failed: {str(e)}")
            logger.warning("   Application will continue without caching")
        
        logger.info("")
        logger.info("=" * 70)
        logger.info("[SUCCESS] BACKEND SERVER IS NOW RUNNING!")
        logger.info("=" * 70)
        logger.info(f"[INFO] Server URL: http://0.0.0.0:8001")
        logger.info(f"[INFO] API Documentation: http://0.0.0.0:8001/docs")
        logger.info(f"[INFO] API Prefix: /api")
        logger.info(f"[INFO] Admin Credentials: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        logger.info("=" * 70)
        logger.info("")
        
    except Exception as e:
        logger.error("")
        logger.error("=" * 70)
        logger.error("[FAILED] BACKEND STARTUP FAILED!")
        logger.error("=" * 70)
        logger.error(f"Error: {str(e)}")
        logger.error("=" * 70)
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown with enhanced logging"""
    try:
        logger.info("")
        logger.info("=" * 70)
        logger.info("[SHUTDOWN] SHUTTING DOWN LENSKART BACKEND SERVER")
        logger.info("=" * 70)
        
        # Close database connection
        logger.info("[DATABASE] Closing database connection...")
        await engine.dispose()
        logger.info("[SUCCESS] Database connection closed")
        
        # Close Redis cache connection
        try:
            logger.info("[CACHE] Closing Redis cache connection...")
            cache = get_cache_service()
            await cache.disconnect()
            logger.info("[SUCCESS] Redis cache connection closed")
        except Exception as e:
            logger.warning(f"[WARNING] Redis cache closure warning: {str(e)}")
        
        logger.info("=" * 70)
        logger.info("[SUCCESS] BACKEND SERVER STOPPED SUCCESSFULLY")
        logger.info("=" * 70)
        logger.info("")
        
    except Exception as e:
        logger.error(f"[FAILED] Error during shutdown: {str(e)}")
        raise

# Configure structured logging (JSON format in production)
json_logging = os.getenv('JSON_LOGGING', 'false').lower() == 'true'
log_level = os.getenv('LOG_LEVEL', 'INFO')
setup_logging(log_level=log_level, json_format=json_logging)
logger = get_logger(__name__)

# Initialize Sentry error tracking (if configured)
sentry_dsn = os.getenv('SENTRY_DSN')
if sentry_dsn:
    initialize_sentry(
        dsn=sentry_dsn,
        environment=os.getenv('ENVIRONMENT', 'development'),
        traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
    )
    logger.info("Sentry error tracking initialized")
else:
    logger.info("Sentry DSN not configured - error tracking disabled")

# Add exception handler for rate limiting (limiter already created above)
app.add_exception_handler(RateLimitExceeded, rate_limit_error_handler)

# Include the router in the main app
app.include_router(api_router)

# Add middleware (order matters - first added is outermost)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(RequestTrackerMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

logger = logging.getLogger(__name__)
