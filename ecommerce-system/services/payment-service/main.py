#!/usr/bin/env python3
"""
支付服务
支付、退款、优惠券引擎
"""

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import mysql.connector
import redis
import time
import json
import hashlib
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

from config.config import PORTS, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, PAYMENT_CONFIG

app = FastAPI(
    title="Payment Service",
    description="支付服务 - 支付、退款、优惠券管理",
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
    db=3
)

# 数据模型
class PaymentCreate(BaseModel):
    order_id: int
    amount: float
    payment_method: str
    return_url: Optional[str] = None

class CouponCreate(BaseModel):
    name: str
    type: str  # discount, fixed, free_shipping
    value: float
    min_spend: float = 0
    start_time: datetime
    end_time: datetime
    max_usage: int = 1000
    status: int = 1

class CouponApply(BaseModel):
    order_id: int
    coupon_code: str

# 初始化数据库表
@app.on_event("startup")
async def startup():
    with Database() as db:
        # 创建支付表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            payment_no VARCHAR(32) UNIQUE NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR(20) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            transaction_id VARCHAR(100),
            callback_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )''')
        
        # 创建退款表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS refunds (
            id INT AUTO_INCREMENT PRIMARY KEY,
            payment_id INT NOT NULL,
            refund_no VARCHAR(32) UNIQUE NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            reason VARCHAR(200),
            status VARCHAR(20) DEFAULT 'pending',
            transaction_id VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
        )''')
        
        # 创建优惠券表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS coupons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(50) NOT NULL,
            type VARCHAR(20) NOT NULL,
            value DECIMAL(10,2) NOT NULL,
            min_spend DECIMAL(10,2) DEFAULT 0,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            max_usage INT DEFAULT 1000,
            used_count INT DEFAULT 0,
            status TINYINT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')
        
        # 创建用户优惠券表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_coupons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            coupon_id INT NOT NULL,
            is_used TINYINT DEFAULT 0,
            used_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
        )''')

# 工具函数
def generate_payment_no():
    return f"PAY{datetime.now().strftime('%Y%m%d%H%M%S')}{int(time.time() * 1000) % 1000}"

def generate_refund_no():
    return f"REF{datetime.now().strftime('%Y%m%d%H%M%S')}{int(time.time() * 1000) % 1000}"

def generate_coupon_code():
    return hashlib.md5(str(time.time()).encode()).hexdigest()[:12].upper()

# 优惠券引擎
class CouponEngine:
    @staticmethod
    def validate_coupon(coupon_code: str, user_id: int, order_amount: float) -> dict:
        with Database() as db:
            # 查找优惠券
            db.cursor.execute("SELECT * FROM coupons WHERE code = %s AND status = 1", (coupon_code,))
            coupon = db.cursor.fetchone()
            
            if not coupon:
                raise HTTPException(status_code=400, detail="优惠券不存在或已失效")
            
            # 检查有效期
            now = datetime.now()
            if now < coupon["start_time"] or now > coupon["end_time"]:
                raise HTTPException(status_code=400, detail="优惠券已过期或未开始")
            
            # 检查使用次数
            if coupon["used_count"] >= coupon["max_usage"]:
                raise HTTPException(status_code=400, detail="优惠券已被使用完")
            
            # 检查最低消费
            if order_amount < coupon["min_spend"]:
                raise HTTPException(status_code=400, detail=f"订单金额未达到最低消费 {coupon['min_spend']} 元")
            
            # 检查用户是否已使用
            db.cursor.execute("SELECT * FROM user_coupons WHERE user_id = %s AND coupon_id = %s AND is_used = 1", (user_id, coupon["id"]))
            if db.cursor.fetchone():
                raise HTTPException(status_code=400, detail="您已使用过该优惠券")
            
            # 计算优惠金额
            discount = 0
            if coupon["type"] == "fixed":
                discount = min(coupon["value"], order_amount)
            elif coupon["type"] == "discount":
                discount = order_amount * (coupon["value"] / 100)
            elif coupon["type"] == "free_shipping":
                discount = 10  # 假设运费10元
            
            return {
                "coupon_id": coupon["id"],
                "discount": round(discount, 2),
                "type": coupon["type"]
            }
    
    @staticmethod
    def apply_coupon(order_id: int, user_id: int, coupon_code: str):
        with Database() as db:
            # 查找订单
            db.cursor.execute("SELECT * FROM orders WHERE id = %s AND user_id = %s", (order_id, user_id))
            order = db.cursor.fetchone()
            if not order:
                raise HTTPException(status_code=404, detail="订单不存在")
            
            # 验证优惠券
            coupon_info = CouponEngine.validate_coupon(coupon_code, user_id, order["total_amount"])
            
            # 更新订单金额
            new_amount = order["total_amount"] - coupon_info["discount"]
            db.cursor.execute(
                "UPDATE orders SET actual_amount = %s WHERE id = %s",
                (max(new_amount, 0), order_id)
            )
            
            # 记录用户优惠券使用
            db.cursor.execute(
                "INSERT INTO user_coupons (user_id, coupon_id, is_used, used_at) VALUES (%s, %s, 1, NOW())",
                (user_id, coupon_info["coupon_id"])
            )
            
            # 更新优惠券使用次数
            db.cursor.execute(
                "UPDATE coupons SET used_count = used_count + 1 WHERE id = %s",
                (coupon_info["coupon_id"],)
            )
            
            return {"success": True, "discount": coupon_info["discount"]}

# 支付服务
@app.post("/api/payments")
async def create_payment(payment: PaymentCreate):
    with Database() as db:
        # 检查订单
        db.cursor.execute("SELECT * FROM orders WHERE id = %s", (payment.order_id,))
        order = db.cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        if order["status"] != "pending":
            raise HTTPException(status_code=400, detail="订单状态不正确")
        
        # 生成支付单号
        payment_no = generate_payment_no()
        
        # 创建支付记录
        db.cursor.execute(
            "INSERT INTO payments (order_id, payment_no, amount, payment_method, status) VALUES (%s, %s, %s, %s, %s)",
            (payment.order_id, payment_no, payment.amount, payment.payment_method, "pending")
        )
        payment_id = db.cursor.lastrowid
        
        # 模拟支付链接（实际应该调用支付平台API）
        pay_url = f"/api/payments/{payment_id}/pay?method={payment.payment_method}"
        
        return {
            "payment_id": payment_id,
            "payment_no": payment_no,
            "pay_url": pay_url,
            "amount": payment.amount
        }

# 支付回调
@app.post("/api/payments/callback/{payment_no}")
async def payment_callback(payment_no: str, request: Request):
    callback_data = await request.json()
    
    with Database() as db:
        # 查找支付记录
        db.cursor.execute("SELECT * FROM payments WHERE payment_no = %s", (payment_no,))
        payment = db.cursor.fetchone()
        if not payment:
            raise HTTPException(status_code=404, detail="支付记录不存在")
        
        if payment["status"] == "success":
            return {"code": "SUCCESS", "message": "订单已支付"}
        
        # 验证回调数据（实际应该根据支付平台的验证规则）
        # 这里简化处理
        
        # 更新支付状态
        db.cursor.execute(
            "UPDATE payments SET status = %s, transaction_id = %s, callback_data = %s, updated_at = NOW() WHERE id = %s",
            ("success", callback_data.get("transaction_id"), json.dumps(callback_data), payment["id"])
        )
        
        # 更新订单状态
        db.cursor.execute(
            "UPDATE orders SET status = %s, payment_time = NOW() WHERE id = %s",
            ("paid", payment["order_id"])
        )
        
        # 发送通知（实际应该通过消息队列）
        print(f"订单 {payment['order_id']} 支付成功")
        
        return {"code": "SUCCESS", "message": "回调处理成功"}

# 优惠券管理
@app.post("/api/coupons")
async def create_coupon(coupon: CouponCreate):
    code = generate_coupon_code()
    
    with Database() as db:
        db.cursor.execute(
            "INSERT INTO coupons (code, name, type, value, min_spend, start_time, end_time, max_usage, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (code, coupon.name, coupon.type, coupon.value, coupon.min_spend, coupon.start_time, coupon.end_time, coupon.max_usage, coupon.status)
        )
        return {"id": db.cursor.lastrowid, "code": code, "name": coupon.name}

@app.post("/api/coupons/apply")
async def apply_coupon(request: Request, apply: CouponApply):
    user_id = request.state.user["user_id"]
    return CouponEngine.apply_coupon(apply.order_id, user_id, apply.coupon_code)

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "payment-service", "timestamp": int(time.time())}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORTS["payment"],
        reload=True
    )
