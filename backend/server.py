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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

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

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[Dict]
    total_amount: float
    payment_status: str = "pending"
    order_status: str = "processing"
    shipping_address: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CreateOrder(BaseModel):
    shipping_address: str

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

# ============ Product Routes ============

@api_router.get("/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None):
    async with async_session_maker() as session:
        query = select(ProductDB)
        
        if category:
            query = query.where(ProductDB.category == category)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (ProductDB.name.like(search_pattern)) | (ProductDB.brand.like(search_pattern))
            )
        
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
        # Check if item already in cart
        result = await session.execute(
            select(CartItemDB).where(
                (CartItemDB.user_id == user['user_id']) & 
                (CartItemDB.product_id == cart_data.product_id)
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update quantity
            existing.quantity += cart_data.quantity
            await session.commit()
            return {"message": "Cart updated successfully"}
        
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
            created_at=order.created_at
        )
        
        session.add(db_order)
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
                "created_at": o.created_at.isoformat() if o.created_at else None
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
            "created_at": order.created_at.isoformat() if order.created_at else None
        }

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
