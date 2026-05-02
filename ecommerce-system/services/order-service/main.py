#!/usr/bin/env python3
"""
订单服务
购物车、订单管理、结算
"""

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import mysql.connector
import redis
import time
import json
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

from config.config import PORTS, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

app = FastAPI(
    title="Order Service",
    description="订单服务 - 购物车、订单管理",
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
    db=2
)

# 数据模型
class CartItem(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    sku_id: Optional[int] = None

class OrderCreate(BaseModel):
    items: List[CartItem]
    address_id: int
    payment_method: str
    coupon_id: Optional[int] = None
    remark: Optional[str] = None

class OrderItem(BaseModel):
    order_id: int
    product_id: int
    quantity: int
    price: float
    sku_id: Optional[int] = None

# 初始化数据库表
@app.on_event("startup")
async def startup():
    with Database() as db:
        # 创建购物车表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS carts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )''')
        
        # 创建购物车商品表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS cart_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cart_id INT NOT NULL,
            product_id INT NOT NULL,
            sku_id INT,
            quantity INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )''')
        
        # 创建订单表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_no VARCHAR(32) UNIQUE NOT NULL,
            user_id INT NOT NULL,
            address_id INT NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            actual_amount DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR(20) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            payment_time DATETIME,
            shipping_time DATETIME,
            completed_time DATETIME,
            remark VARCHAR(200),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )''')
        
        # 创建订单商品表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            sku_id INT,
            quantity INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )''')

# 生成订单号
def generate_order_no():
    return f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}{int(time.time() * 1000) % 1000}"

# 购物车管理
@app.post("/api/cart/items")
async def add_to_cart(request: Request, item: CartItem):
    user_id = request.state.user["user_id"]
    
    with Database() as db:
        # 获取或创建购物车
        db.cursor.execute("SELECT id FROM carts WHERE user_id = %s", (user_id,))
        cart = db.cursor.fetchone()
        if not cart:
            db.cursor.execute("INSERT INTO carts (user_id) VALUES (%s)", (user_id,))
            cart_id = db.cursor.lastrowid
        else:
            cart_id = cart["id"]
        
        # 检查商品是否存在
        db.cursor.execute("SELECT * FROM products WHERE id = %s AND stock >= %s", (item.product_id, item.quantity))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=400, detail="商品不存在或库存不足")
        
        # 检查购物车中是否已有该商品
        db.cursor.execute(
            "SELECT * FROM cart_items WHERE cart_id = %s AND product_id = %s AND sku_id = %s",
            (cart_id, item.product_id, item.sku_id)
        )
        existing_item = db.cursor.fetchone()
        
        if existing_item:
            # 更新数量
            new_quantity = existing_item["quantity"] + item.quantity
            db.cursor.execute(
                "UPDATE cart_items SET quantity = %s WHERE id = %s",
                (new_quantity, existing_item["id"])
            )
        else:
            # 添加新商品
            db.cursor.execute(
                "INSERT INTO cart_items (cart_id, product_id, sku_id, quantity) VALUES (%s, %s, %s, %s)",
                (cart_id, item.product_id, item.sku_id, item.quantity)
            )
        
        # 清除购物车缓存
        redis_client.delete(f"cart:{user_id}")
        
        return {"success": True, "message": "添加成功"}

@app.get("/api/cart")
async def get_cart(request: Request):
    user_id = request.state.user["user_id"]
    
    # 尝试从缓存获取
    cached = redis_client.get(f"cart:{user_id}")
    if cached:
        return json.loads(cached.decode())
    
    with Database() as db:
        # 获取购物车
        db.cursor.execute("SELECT id FROM carts WHERE user_id = %s", (user_id,))
        cart = db.cursor.fetchone()
        if not cart:
            return {"items": []}
        
        # 获取购物车商品
        db.cursor.execute('''
        SELECT ci.*, p.name, p.price, p.images 
        FROM cart_items ci 
        JOIN products p ON ci.product_id = p.id 
        WHERE ci.cart_id = %s
        ''', (cart["id"],))
        items = db.cursor.fetchall()
        
        # 解析图片
        for item in items:
            if item.get("images"):
                item["images"] = item["images"].split(",")
        
        cart_data = {"items": items}
        
        # 缓存购物车
        redis_client.setex(
            f"cart:{user_id}",
            3600,
            json.dumps(cart_data)
        )
        
        return cart_data

# 订单管理
@app.post("/api/orders")
async def create_order(request: Request, order: OrderCreate):
    user_id = request.state.user["user_id"]
    
    with Database() as db:
        # 计算总金额
        total_amount = 0
        order_items = []
        
        for item in order.items:
            # 检查商品
            db.cursor.execute("SELECT * FROM products WHERE id = %s", (item.product_id,))
            product = db.cursor.fetchone()
            if not product:
                raise HTTPException(status_code=400, detail=f"商品 {item.product_id} 不存在")
            if product["stock"] < item.quantity:
                raise HTTPException(status_code=400, detail=f"商品 {product['name']} 库存不足")
            
            # 计算金额
            item_amount = product["price"] * item.quantity
            total_amount += item_amount
            order_items.append({
                "product_id": item.product_id,
                "sku_id": item.sku_id,
                "quantity": item.quantity,
                "price": product["price"]
            })
        
        # 生成订单号
        order_no = generate_order_no()
        
        # 创建订单
        db.cursor.execute(
            "INSERT INTO orders (order_no, user_id, address_id, total_amount, actual_amount, payment_method, status, remark) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (order_no, user_id, order.address_id, total_amount, total_amount, order.payment_method, "pending", order.remark)
        )
        order_id = db.cursor.lastrowid
        
        # 添加订单商品
        for item in order_items:
            db.cursor.execute(
                "INSERT INTO order_items (order_id, product_id, sku_id, quantity, price) VALUES (%s, %s, %s, %s, %s)",
                (order_id, item["product_id"], item["sku_id"], item["quantity"], item["price"])
            )
        
        # 扣减库存
        for item in order_items:
            db.cursor.execute(
                "UPDATE products SET stock = stock - %s WHERE id = %s",
                (item["quantity"], item["product_id"])
            )
        
        # 清空购物车
        db.cursor.execute("SELECT id FROM carts WHERE user_id = %s", (user_id,))
        cart = db.cursor.fetchone()
        if cart:
            db.cursor.execute("DELETE FROM cart_items WHERE cart_id = %s", (cart["id"],))
            redis_client.delete(f"cart:{user_id}")
        
        return {"order_id": order_id, "order_no": order_no, "total_amount": total_amount}

@app.get("/api/orders")
async def get_orders(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None
):
    user_id = request.state.user["user_id"]
    
    with Database() as db:
        # 构建查询条件
        where_clauses = ["user_id = %s"]
        params = [user_id]
        
        if status:
            where_clauses.append("status = %s")
            params.append(status)
        
        where_sql = " WHERE " + " AND ".join(where_clauses)
        
        # 计算总数
        db.cursor.execute(f"SELECT COUNT(*) as total FROM orders{where_sql}", params)
        total = db.cursor.fetchone()["total"]
        
        # 分页查询
        offset = (page - 1) * page_size
        db.cursor.execute(
            f"SELECT * FROM orders{where_sql} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            params + [page_size, offset]
        )
        orders = db.cursor.fetchall()
        
        # 获取订单商品
        for order in orders:
            db.cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (order["id"],))
            order["items"] = db.cursor.fetchall()
        
        return {
            "items": orders,
            "total": total,
            "page": page,
            "page_size": page_size
        }

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "order-service", "timestamp": int(time.time())}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORTS["order"],
        reload=True
    )
