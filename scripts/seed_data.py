import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

# Sample product data
products = [
    {
        "id": "prod-001",
        "name": "Classic Aviator Sunglasses",
        "brand": "RayBan",
        "price": 149.99,
        "description": "Timeless aviator design with premium UV protection and durable metal frame.",
        "category": "sunglasses",
        "frame_type": "full-rim",
        "frame_shape": "aviator",
        "color": "Gold",
        "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80",
        "stock": 50,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "prod-002",
        "name": "Modern Rectangular Frames",
        "brand": "Oakley",
        "price": 199.99,
        "description": "Contemporary rectangular design perfect for professional settings.",
        "category": "men",
        "frame_type": "full-rim",
        "frame_shape": "rectangular",
        "color": "Black",
        "image_url": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500&q=80",
        "stock": 75,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "prod-003",
        "name": "Cat-Eye Fashion Glasses",
        "brand": "Vogue",
        "price": 129.99,
        "description": "Elegant cat-eye frames that add a touch of sophistication to any outfit.",
        "category": "women",
        "frame_type": "full-rim",
        "frame_shape": "cat-eye",
        "color": "Tortoise",
        "image_url": "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500&q=80",
        "stock": 60,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "prod-004",
        "name": "Round Retro Spectacles",
        "brand": "Warby Parker",
        "price": 95.00,
        "description": "Vintage-inspired round frames for a classic, intellectual look.",
        "category": "men",
        "frame_type": "full-rim",
        "frame_shape": "round",
        "color": "Brown",
        "image_url": "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=500&q=80",
        "stock": 40,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "prod-005",
        "name": "Kids Colorful Frames",
        "brand": "Disney",
        "price": 79.99,
        "description": "Durable and fun frames designed specifically for children.",
        "category": "kids",
        "frame_type": "full-rim",
        "frame_shape": "rectangular",
        "color": "Blue",
        "image_url": "https://images.unsplash.com/photo-1583631892930-be6f90c36e25?w=500&q=80",
        "stock": 100,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "prod-006",
        "name": "Sports Performance Glasses",
        "brand": "Nike",
        "price": 179.99,
        "description": "High-performance eyewear designed for active lifestyles.",
        "category": "men",
        "frame_type": "half-rim",
        "frame_shape": "rectangular",
        "color": "Red",
        "image_url": "https://images.unsplash.com/photo-1577803645773-f96470509666?w=500&q=80",
        "stock": 45,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "prod-007",
        "name": "Elegant Rimless Frames",
        "brand": "Silhouette",
        "price": 249.99,
        "description": "Ultra-lightweight rimless design for maximum comfort and minimal visibility.",
        "category": "women",
        "frame_type": "rimless",
        "frame_shape": "rectangular",
        "color": "Clear",
        "image_url": "https://images.unsplash.com/photo-1560343787-b90cb337028e?w=500&q=80",
        "stock": 30,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "prod-008",
        "name": "Wayfarer Classic",
        "brand": "RayBan",
        "price": 169.99,
        "description": "Iconic wayfarer style that never goes out of fashion.",
        "category": "sunglasses",
        "frame_type": "full-rim",
        "frame_shape": "wayfarer",
        "color": "Black",
        "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80",
        "stock": 80,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "prod-009",
        "name": "Oversized Fashion Frames",
        "brand": "Gucci",
        "price": 299.99,
        "description": "Bold oversized frames for a statement fashion look.",
        "category": "women",
        "frame_type": "full-rim",
        "frame_shape": "cat-eye",
        "color": "Red",
        "image_url": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=500&q=80",
        "stock": 25,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "prod-010",
        "name": "Minimalist Metal Frames",
        "brand": "Oliver Peoples",
        "price": 219.99,
        "description": "Sleek minimalist design with premium metal construction.",
        "category": "men",
        "frame_type": "half-rim",
        "frame_shape": "round",
        "color": "Silver",
        "image_url": "https://images.unsplash.com/photo-1542601098-3adb3b8c9e7d?w=500&q=80",
        "stock": 55,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

async def seed_database():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Clear existing products
    await db.products.delete_many({})
    
    # Insert sample products
    await db.products.insert_many(products)
    
    print(f"Successfully seeded {len(products)} products to the database!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
