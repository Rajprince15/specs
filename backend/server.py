from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON, select, update, delete, func
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from payment_gateway import PaymentGatewayFactory, RazorpayGateway

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

# ============ SQLAlchemy Models ============

class Base(DeclarativeBase):
    pass

class UserDB(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(50))
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class ProductDB(Base):
    __tablename__ = "products"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    brand: Mapped[str] = mapped_column(String(255))
    price: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), index=True)
    frame_type: Mapped[str] = mapped_column(String(100))
    frame_shape: Mapped[str] = mapped_column(String(100))
    color: Mapped[str] = mapped_column(String(100))
    image_url: Mapped[str] = mapped_column(Text)
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
    items: Mapped[str] = mapped_column(Text)  # JSON string
    total_amount: Mapped[float] = mapped_column(Float)
    payment_status: Mapped[str] = mapped_column(String(50), default="pending")
    order_status: Mapped[str] = mapped_column(String(50), default="processing")
    shipping_address: Mapped[str] = mapped_column(Text)
    tracking_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    estimated_delivery: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
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

import json

# ============ Auth Routes ============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    async with async_session_maker() as session:
        # Check if user exists
        result = await session.execute(select(UserDB).where(UserDB.email == user_data.email))
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = pwd_context.hash(user_data.password)
        
        # Create user
        user = User(
            name=user_data.name,
            email=user_data.email,
            password=hashed_password,
            phone=user_data.phone,
            address=user_data.address,
            role="user"
        )
        
        db_user = UserDB(
            id=user.id,
            name=user.name,
            email=user.email,
            password=user.password,
            phone=user.phone,
            address=user.address,
            role=user.role,
            created_at=user.created_at
        )
        
        session.add(db_user)
        await session.commit()
        
        # Generate token
        token = create_token(user.id, user.email, user.role)
        
        return {
            "message": "Registration successful",
            "token": token,
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
        }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
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
async def get_user_profile(user_data: dict = Header(None, alias="Authorization")):
    current_user = await get_current_user(user_data)
    
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
    user_data: dict = Header(None, alias="Authorization")
):
    current_user = await get_current_user(user_data)
    
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
    user_data: dict = Header(None, alias="Authorization")
):
    current_user = await get_current_user(user_data)
    
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

# ============ Address Routes ============

@api_router.get("/user/addresses")
async def get_addresses(user_data: dict = Header(None, alias="Authorization")):
    current_user = await get_current_user(user_data)
    
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
    user_data: dict = Header(None, alias="Authorization")
):
    current_user = await get_current_user(user_data)
    
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
    user_data: dict = Header(None, alias="Authorization")
):
    current_user = await get_current_user(user_data)
    
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
    user_data: dict = Header(None, alias="Authorization")
):
    current_user = await get_current_user(user_data)
    
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
        
        return [
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

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    async with async_session_maker() as session:
        result = await session.execute(select(ProductDB).where(ProductDB.id == product_id))
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {
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
        
        return {"message": "Product deleted successfully"}

# ============ Cart Routes ============

@api_router.get("/cart")
async def get_cart(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        result = await session.execute(select(CartItemDB).where(CartItemDB.user_id == user['user_id']))
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
        
        return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    async with async_session_maker() as session:
        await session.execute(
            delete(CartItemDB).where(CartItemDB.user_id == user['user_id'])
        )
        await session.commit()
        
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

# ============ Database Initialization ============

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.on_event("startup")
async def startup_event():
    await init_db()
    logging.info("Database tables created successfully")

@app.on_event("shutdown")
async def shutdown_event():
    await engine.dispose()
    logging.info("Database connection closed")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
