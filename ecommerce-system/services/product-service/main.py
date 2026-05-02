#!/usr/bin/env python3
"""
商品服务
商品、分类、SKU、搜索、筛选
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import mysql.connector
import redis
import time
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

from config.config import PORTS, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

app = FastAPI(
    title="Product Service",
    description="商品服务 - 商品、分类、搜索管理",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库连接
class Database:
    def __init__(self):
        self.conn = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        self.cursor = self.conn.cursor(dictionary=True)
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.conn.rollback()
        else:
            self.conn.commit()
        self.cursor.close()
        self.conn.close()

# Redis连接
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    db=1
)

# 数据模型
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    parent_id: Optional[int] = None
    sort_order: int = 0

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category_id: int
    price: float = Field(..., gt=0)
    stock: int = Field(..., ge=0)
    description: str
    images: List[str]
    status: int = 1  # 1: 上架, 0: 下架

class SKU(BaseModel):
    product_id: int
    attributes: dict
    price: float
    stock: int

# 初始化数据库表
@app.on_event("startup")
async def startup():
    with Database() as db:
        # 创建分类表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            parent_id INT,
            sort_order INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
        )''')
        
        # 创建商品表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            category_id INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            stock INT NOT NULL,
            description TEXT,
            images TEXT,
            status TINYINT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )''')
        
        # 创建SKU表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS skus (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            attributes TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            stock INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )''')
        
        # 创建属性表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS attributes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            values TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')

# 分类管理
@app.post("/api/categories")
async def create_category(category: CategoryBase):
    with Database() as db:
        db.cursor.execute(
            "INSERT INTO categories (name, parent_id, sort_order) VALUES (%s, %s, %s)",
            (category.name, category.parent_id, category.sort_order)
        )
        category_id = db.cursor.lastrowid
        return {"id": category_id, "name": category.name, "parent_id": category.parent_id}

@app.get("/api/categories")
async def get_categories(parent_id: Optional[int] = None):
    with Database() as db:
        if parent_id is not None:
            db.cursor.execute("SELECT * FROM categories WHERE parent_id = %s ORDER BY sort_order", (parent_id,))
        else:
            db.cursor.execute("SELECT * FROM categories ORDER BY sort_order")
        return db.cursor.fetchall()

# 商品管理
@app.post("/api/products")
async def create_product(product: ProductBase):
    with Database() as db:
        # 检查分类是否存在
        db.cursor.execute("SELECT * FROM categories WHERE id = %s", (product.category_id,))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=400, detail="分类不存在")
        
        # 创建商品
        images_str = ",".join(product.images)
        db.cursor.execute(
            "INSERT INTO products (name, category_id, price, stock, description, images, status) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (product.name, product.category_id, product.price, product.stock, product.description, images_str, product.status)
        )
        product_id = db.cursor.lastrowid
        
        # 缓存商品信息
        redis_client.setex(
            f"product:{product_id}",
            3600,
            f"{product.name}:{product.price}:{product.stock}:{product.status}"
        )
        
        return {"id": product_id, "name": product.name, "price": product.price}

@app.get("/api/products")
async def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    status: Optional[int] = None,
    keyword: Optional[str] = None
):
    with Database() as db:
        # 构建查询条件
        where_clauses = []
        params = []
        
        if category_id:
            where_clauses.append("category_id = %s")
            params.append(category_id)
        if min_price:
            where_clauses.append("price >= %s")
            params.append(min_price)
        if max_price:
            where_clauses.append("price <= %s")
            params.append(max_price)
        if status is not None:
            where_clauses.append("status = %s")
            params.append(status)
        if keyword:
            where_clauses.append("name LIKE %s OR description LIKE %s")
            params.extend([f"%{keyword}%", f"%{keyword}%"])
        
        # 构建SQL
        where_sql = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # 计算总数
        db.cursor.execute(f"SELECT COUNT(*) as total FROM products{where_sql}", params)
        total = db.cursor.fetchone()["total"]
        
        # 分页查询
        offset = (page - 1) * page_size
        db.cursor.execute(
            f"SELECT * FROM products{where_sql} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            params + [page_size, offset]
        )
        products = db.cursor.fetchall()
        
        return {
            "items": products,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

@app.get("/api/products/{product_id}")
async def get_product(product_id: int):
    # 尝试从缓存获取
    cached = redis_client.get(f"product:{product_id}")
    if cached:
        name, price, stock, status = cached.decode().split(":")
        return {
            "id": product_id,
            "name": name,
            "price": float(price),
            "stock": int(stock),
            "status": int(status)
        }
    
    # 从数据库获取
    with Database() as db:
        db.cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = db.cursor.fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="商品不存在")
        
        # 解析图片
        if product.get("images"):
            product["images"] = product["images"].split(",")
        
        # 缓存商品信息
        redis_client.setex(
            f"product:{product_id}",
            3600,
            f"{product['name']}:{product['price']}:{product['stock']}:{product['status']}"
        )
        
        return product

# SKU管理
@app.post("/api/skus")
async def create_sku(sku: SKU):
    import json
    with Database() as db:
        # 检查商品是否存在
        db.cursor.execute("SELECT * FROM products WHERE id = %s", (sku.product_id,))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=400, detail="商品不存在")
        
        # 创建SKU
        attributes_str = json.dumps(sku.attributes)
        db.cursor.execute(
            "INSERT INTO skus (product_id, attributes, price, stock) VALUES (%s, %s, %s, %s)",
            (sku.product_id, attributes_str, sku.price, sku.stock)
        )
        return {"id": db.cursor.lastrowid, "product_id": sku.product_id}

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "product-service", "timestamp": int(time.time())}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORTS["product"],
        reload=True
    )
