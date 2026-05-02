#!/usr/bin/env python3
"""
营销服务
秒杀、拼团、分销、满减
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
    title="Marketing Service",
    description="营销服务 - 秒杀、拼团、分销管理",
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
    db=4
)

# 数据模型
class SeckillActivity(BaseModel):
    name: str
    start_time: datetime
    end_time: datetime
    status: int = 1

class SeckillProduct(BaseModel):
    activity_id: int
    product_id: int
    seckill_price: float
    stock: int
    limit_per_user: int

class GroupBuyActivity(BaseModel):
    name: str
    start_time: datetime
    end_time: datetime
    min_people: int
    max_people: int
    status: int = 1

class GroupBuyProduct(BaseModel):
    activity_id: int
    product_id: int
    group_price: float
    origin_price: float

class DistributionCreate(BaseModel):
    product_id: int
    commission_rate: float  # 佣金比例
    min_order_amount: float

# 初始化数据库表
@app.on_event("startup")
async def startup():
    with Database() as db:
        # 秒杀活动表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS seckill_activities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            status TINYINT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')
        
        # 秒杀商品表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS seckill_products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            activity_id INT NOT NULL,
            product_id INT NOT NULL,
            seckill_price DECIMAL(10,2) NOT NULL,
            stock INT NOT NULL,
            sold INT DEFAULT 0,
            limit_per_user INT DEFAULT 1,
            FOREIGN KEY (activity_id) REFERENCES seckill_activities(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )''')
        
        # 拼团活动表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS group_buy_activities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            min_people INT NOT NULL,
            max_people INT NOT NULL,
            status TINYINT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')
        
        # 拼团商品表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS group_buy_products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            activity_id INT NOT NULL,
            product_id INT NOT NULL,
            group_price DECIMAL(10,2) NOT NULL,
            origin_price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (activity_id) REFERENCES group_buy_activities(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )''')
        
        # 拼团订单表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS group_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            group_id VARCHAR(32) NOT NULL,
            user_id INT NOT NULL,
            order_id INT NOT NULL,
            is_leader TINYINT DEFAULT 0,
            status VARCHAR(20) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')
        
        # 分销表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS distributions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            commission_rate DECIMAL(5,2) NOT NULL,
            min_order_amount DECIMAL(10,2) DEFAULT 0,
            status TINYINT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )''')
        
        # 分销订单表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS distribution_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            distributor_id INT NOT NULL,
            commission DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')

# 秒杀服务
@app.post("/api/seckill/activities")
async def create_seckill_activity(activity: SeckillActivity):
    with Database() as db:
        db.cursor.execute(
            "INSERT INTO seckill_activities (name, start_time, end_time, status) VALUES (%s, %s, %s, %s)",
            (activity.name, activity.start_time, activity.end_time, activity.status)
        )
        return {"id": db.cursor.lastrowid, "name": activity.name}

@app.post("/api/seckill/products")
async def add_seckill_product(product: SeckillProduct):
    with Database() as db:
        # 检查活动是否存在
        db.cursor.execute("SELECT * FROM seckill_activities WHERE id = %s", (product.activity_id,))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=404, detail="活动不存在")
        
        # 检查商品是否存在
        db.cursor.execute("SELECT * FROM products WHERE id = %s", (product.product_id,))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=404, detail="商品不存在")
        
        # 添加秒杀商品
        db.cursor.execute(
            "INSERT INTO seckill_products (activity_id, product_id, seckill_price, stock, limit_per_user) VALUES (%s, %s, %s, %s, %s)",
            (product.activity_id, product.product_id, product.seckill_price, product.stock, product.limit_per_user)
        )
        
        # 缓存秒杀商品信息
        redis_client.setex(
            f"seckill:product:{db.cursor.lastrowid}",
            3600,
            json.dumps({
                "product_id": product.product_id,
                "seckill_price": product.seckill_price,
                "stock": product.stock,
                "limit_per_user": product.limit_per_user
            })
        )
        
        return {"id": db.cursor.lastrowid, "product_id": product.product_id}

@app.post("/api/seckill/{activity_id}/buy")
async def seckill_buy(request: Request, activity_id: int, product_id: int, quantity: int = 1):
    user_id = request.state.user["user_id"]
    
    # 检查活动时间
    with Database() as db:
        db.cursor.execute("SELECT * FROM seckill_activities WHERE id = %s AND status = 1", (activity_id,))
        activity = db.cursor.fetchone()
        if not activity:
            raise HTTPException(status_code=404, detail="活动不存在或已结束")
        
        now = datetime.now()
        if now < activity["start_time"] or now > activity["end_time"]:
            raise HTTPException(status_code=400, detail="活动未开始或已结束")
        
        # 检查秒杀商品
        db.cursor.execute("SELECT * FROM seckill_products WHERE activity_id = %s AND product_id = %s", (activity_id, product_id))
        seckill_product = db.cursor.fetchone()
        if not seckill_product:
            raise HTTPException(status_code=404, detail="秒杀商品不存在")
        
        # 检查库存
        if seckill_product["stock"] - seckill_product["sold"] < quantity:
            raise HTTPException(status_code=400, detail="秒杀商品已抢完")
        
        # 检查用户购买限制
        db.cursor.execute(
            "SELECT COUNT(*) as count FROM orders WHERE user_id = %s AND product_id = %s AND created_at BETWEEN %s AND %s",
            (user_id, product_id, activity["start_time"], activity["end_time"])
        )
        if db.cursor.fetchone()["count"] >= seckill_product["limit_per_user"]:
            raise HTTPException(status_code=400, detail="超过购买限制")
        
        # 扣减库存（使用乐观锁）
        db.cursor.execute(
            "UPDATE seckill_products SET sold = sold + %s WHERE id = %s AND (stock - sold) >= %s",
            (quantity, seckill_product["id"], quantity)
        )
        
        if db.cursor.rowcount == 0:
            raise HTTPException(status_code=400, detail="秒杀失败，请重试")
        
        # 这里应该创建订单，简化处理
        return {"success": True, "message": "秒杀成功"}

# 拼团服务
@app.post("/api/group-buy/activities")
async def create_group_buy_activity(activity: GroupBuyActivity):
    with Database() as db:
        db.cursor.execute(
            "INSERT INTO group_buy_activities (name, start_time, end_time, min_people, max_people, status) VALUES (%s, %s, %s, %s, %s, %s)",
            (activity.name, activity.start_time, activity.end_time, activity.min_people, activity.max_people, activity.status)
        )
        return {"id": db.cursor.lastrowid, "name": activity.name}

@app.post("/api/group-buy/products")
async def add_group_buy_product(product: GroupBuyProduct):
    with Database() as db:
        # 检查活动是否存在
        db.cursor.execute("SELECT * FROM group_buy_activities WHERE id = %s", (product.activity_id,))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=404, detail="活动不存在")
        
        # 检查商品是否存在
        db.cursor.execute("SELECT * FROM products WHERE id = %s", (product.product_id,))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=404, detail="商品不存在")
        
        # 添加拼团商品
        db.cursor.execute(
            "INSERT INTO group_buy_products (activity_id, product_id, group_price, origin_price) VALUES (%s, %s, %s, %s)",
            (product.activity_id, product.product_id, product.group_price, product.origin_price)
        )
        
        return {"id": db.cursor.lastrowid, "product_id": product.product_id}

# 分销服务
@app.post("/api/distributions")
async def create_distribution(distribution: DistributionCreate):
    with Database() as db:
        # 检查商品是否存在
        db.cursor.execute("SELECT * FROM products WHERE id = %s", (distribution.product_id,))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=404, detail="商品不存在")
        
        # 创建分销
        db.cursor.execute(
            "INSERT INTO distributions (product_id, commission_rate, min_order_amount, status) VALUES (%s, %s, %s, 1)",
            (distribution.product_id, distribution.commission_rate, distribution.min_order_amount)
        )
        
        return {"id": db.cursor.lastrowid, "product_id": distribution.product_id}

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "marketing-service", "timestamp": int(time.time())}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORTS["marketing"],
        reload=True
    )
