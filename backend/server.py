from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

# ============ Models ============

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

# ============ Auth Routes ============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
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
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
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
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not pwd_context.verify(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'], user['role'])
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {"id": user['id'], "name": user['name'], "email": user['email'], "role": user['role']}
    }

# ============ Product Routes ============

@api_router.get("/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    if search:
        query['$or'] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products")
async def create_product(product_data: ProductCreate, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    
    return {"message": "Product created successfully", "product": product}

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product_data: ProductCreate, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": product_data.model_dump()}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated successfully"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}

# ============ Cart Routes ============

@api_router.get("/cart")
async def get_cart(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    cart_items = await db.cart.find({"user_id": user['user_id']}, {"_id": 0}).to_list(1000)
    
    # Fetch product details for each cart item
    for item in cart_items:
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        item['product'] = product
    
    return cart_items

@api_router.post("/cart")
async def add_to_cart(cart_data: AddToCart, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    # Check if item already in cart
    existing = await db.cart.find_one({"user_id": user['user_id'], "product_id": cart_data.product_id}, {"_id": 0})
    if existing:
        # Update quantity
        await db.cart.update_one(
            {"user_id": user['user_id'], "product_id": cart_data.product_id},
            {"$set": {"quantity": existing['quantity'] + cart_data.quantity}}
        )
        return {"message": "Cart updated successfully"}
    
    # Add new item
    cart_item = CartItem(user_id=user['user_id'], product_id=cart_data.product_id, quantity=cart_data.quantity)
    doc = cart_item.model_dump()
    doc['added_at'] = doc['added_at'].isoformat()
    await db.cart.insert_one(doc)
    
    return {"message": "Item added to cart"}

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    await db.cart.delete_one({"user_id": user['user_id'], "product_id": product_id})
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    await db.cart.delete_many({"user_id": user['user_id']})
    return {"message": "Cart cleared"}

# ============ Order Routes ============

@api_router.post("/orders")
async def create_order(order_data: CreateOrder, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    # Get cart items
    cart_items = await db.cart.find({"user_id": user['user_id']}, {"_id": 0}).to_list(1000)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total and prepare items
    total_amount = 0
    items = []
    for cart_item in cart_items:
        product = await db.products.find_one({"id": cart_item['product_id']}, {"_id": 0})
        if product:
            items.append({
                "product_id": product['id'],
                "name": product['name'],
                "price": product['price'],
                "quantity": cart_item['quantity']
            })
            total_amount += product['price'] * cart_item['quantity']
    
    # Create order
    order = Order(
        user_id=user['user_id'],
        items=items,
        total_amount=total_amount,
        shipping_address=order_data.shipping_address
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    
    return {"message": "Order created successfully", "order": order}

@api_router.get("/orders")
async def get_orders(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    if user['role'] == 'admin':
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    else:
        orders = await db.orders.find({"user_id": user['user_id']}, {"_id": 0}).to_list(1000)
    
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if user['role'] != 'admin' and order['user_id'] != user['user_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return order

# ============ Payment Routes ============

@api_router.post("/payment/checkout")
async def create_checkout(request: Request, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    # Get cart items
    cart_items = await db.cart.find({"user_id": user['user_id']}, {"_id": 0}).to_list(1000)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total
    total_amount = 0.0
    for cart_item in cart_items:
        product = await db.products.find_one({"id": cart_item['product_id']}, {"_id": 0})
        if product:
            total_amount += product['price'] * cart_item['quantity']
    
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
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction
    payment = PaymentTransaction(
        session_id=session.session_id,
        user_id=user['user_id'],
        amount=total_amount,
        currency="usd",
        payment_status="pending",
        status="initiated",
        metadata={"user_id": user['user_id']}
    )
    
    doc = payment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.payment_transactions.insert_one(doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    
    # Initialize Stripe
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Get checkout status
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment transaction
    existing_payment = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    
    if existing_payment:
        update_data = {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # If payment successful and not yet processed
        if checkout_status.payment_status == "paid" and existing_payment.get('payment_status') != 'paid':
            # Create order from cart
            cart_items = await db.cart.find({"user_id": user['user_id']}, {"_id": 0}).to_list(1000)
            
            items = []
            total_amount = 0.0
            for cart_item in cart_items:
                product = await db.products.find_one({"id": cart_item['product_id']}, {"_id": 0})
                if product:
                    items.append({
                        "product_id": product['id'],
                        "name": product['name'],
                        "price": product['price'],
                        "quantity": cart_item['quantity']
                    })
                    total_amount += product['price'] * cart_item['quantity']
            
            # Get user info for address
            user_info = await db.users.find_one({"id": user['user_id']}, {"_id": 0})
            
            order = Order(
                user_id=user['user_id'],
                items=items,
                total_amount=total_amount,
                payment_status="paid",
                order_status="confirmed",
                shipping_address=user_info.get('address', 'No address provided')
            )
            
            order_doc = order.model_dump()
            order_doc['created_at'] = order_doc['created_at'].isoformat()
            await db.orders.insert_one(order_doc)
            
            # Update payment with order_id
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"order_id": order.id}}
            )
            
            # Clear cart
            await db.cart.delete_many({"user_id": user['user_id']})
    
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
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"session_id": webhook_response.session_id},
            {"$set": {
                "payment_status": webhook_response.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ Admin Stats ============

@api_router.get("/admin/stats")
async def get_admin_stats(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({})
    
    # Calculate total revenue
    orders = await db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(order.get('total_amount', 0) for order in orders)
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_users": total_users,
        "total_revenue": total_revenue
    }

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()