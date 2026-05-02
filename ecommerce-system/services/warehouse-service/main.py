#!/usr/bin/env python3
"""
仓储服务
库存、物流、退货逆向
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

from config.config import PORTS, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, LOGISTICS_CONFIG

app = FastAPI(
    title="Warehouse Service",
    description="仓储服务 - 库存、物流、退货管理",
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
    db=5
)

# 数据模型
class WarehouseCreate(BaseModel):
    name: str
    address: str
    contact: str
    phone: str

class InventoryAdjust(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int  # 正数增加，负数减少
    reason: str

class ShipmentCreate(BaseModel):
    order_id: int
    warehouse_id: int
    logistics_company: str
    tracking_number: str

class ReturnOrderCreate(BaseModel):
    order_id: int
    reason: str
    refund_amount: float
    images: List[str]

# 初始化数据库表
@app.on_event("startup")
async def startup():
    with Database() as db:
        # 仓库表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS warehouses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            address VARCHAR(200) NOT NULL,
            contact VARCHAR(50) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')
        
        # 库存表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            warehouse_id INT NOT NULL,
            quantity INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
            UNIQUE KEY (product_id, warehouse_id)
        )''')
        
        # 库存变动表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            warehouse_id INT NOT NULL,
            quantity INT NOT NULL,
            reason VARCHAR(100),
            operator VARCHAR(50),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
        )''')
        
        # 发货表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS shipments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            warehouse_id INT NOT NULL,
            logistics_company VARCHAR(50) NOT NULL,
            tracking_number VARCHAR(100) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
        )''')
        
        # 退货表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS return_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            user_id INT NOT NULL,
            reason VARCHAR(200) NOT NULL,
            refund_amount DECIMAL(10,2) NOT NULL,
            images TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            processed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )''')

# 仓库管理
@app.post("/api/warehouses")
async def create_warehouse(warehouse: WarehouseCreate):
    with Database() as db:
        db.cursor.execute(
            "INSERT INTO warehouses (name, address, contact, phone) VALUES (%s, %s, %s, %s)",
            (warehouse.name, warehouse.address, warehouse.contact, warehouse.phone)
        )
        return {"id": db.cursor.lastrowid, "name": warehouse.name}

@app.get("/api/warehouses")
async def get_warehouses():
    with Database() as db:
        db.cursor.execute("SELECT * FROM warehouses")
        return db.cursor.fetchall()

# 库存管理
@app.post("/api/inventory/adjust")
async def adjust_inventory(adjust: InventoryAdjust):
    with Database() as db:
        # 检查仓库是否存在
        db.cursor.execute("SELECT * FROM warehouses WHERE id = %s", (adjust.warehouse_id,))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=404, detail="仓库不存在")
        
        # 检查商品是否存在
        db.cursor.execute("SELECT * FROM products WHERE id = %s", (adjust.product_id,))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=404, detail="商品不存在")
        
        # 检查并更新库存
        db.cursor.execute(
            "SELECT * FROM inventory WHERE product_id = %s AND warehouse_id = %s",
            (adjust.product_id, adjust.warehouse_id)
        )
        inventory = db.cursor.fetchone()
        
        if inventory:
            # 更新库存
            new_quantity = inventory["quantity"] + adjust.quantity
            if new_quantity < 0:
                raise HTTPException(status_code=400, detail="库存不足")
            db.cursor.execute(
                "UPDATE inventory SET quantity = %s WHERE id = %s",
                (new_quantity, inventory["id"])
            )
        else:
            # 创建库存记录
            if adjust.quantity < 0:
                raise HTTPException(status_code=400, detail="库存不足")
            db.cursor.execute(
                "INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (%s, %s, %s)",
                (adjust.product_id, adjust.warehouse_id, adjust.quantity)
            )
        
        # 记录库存变动
        db.cursor.execute(
            "INSERT INTO inventory_logs (product_id, warehouse_id, quantity, reason, operator) VALUES (%s, %s, %s, %s, %s)",
            (adjust.product_id, adjust.warehouse_id, adjust.quantity, adjust.reason, "system")
        )
        
        # 清除库存缓存
        redis_client.delete(f"inventory:{adjust.product_id}:{adjust.warehouse_id}")
        
        return {"success": True, "message": "库存调整成功"}

@app.get("/api/inventory")
async def get_inventory(
    product_id: Optional[int] = None,
    warehouse_id: Optional[int] = None
):
    with Database() as db:
        where_clauses = []
        params = []
        
        if product_id:
            where_clauses.append("product_id = %s")
            params.append(product_id)
        if warehouse_id:
            where_clauses.append("warehouse_id = %s")
            params.append(warehouse_id)
        
        where_sql = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        db.cursor.execute(f"SELECT * FROM inventory{where_sql}", params)
        return db.cursor.fetchall()

# 发货管理
@app.post("/api/shipments")
async def create_shipment(shipment: ShipmentCreate):
    with Database() as db:
        # 检查订单是否存在
        db.cursor.execute("SELECT * FROM orders WHERE id = %s", (shipment.order_id,))
        order = db.cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        if order["status"] != "paid":
            raise HTTPException(status_code=400, detail="订单状态不正确")
        
        # 检查仓库是否存在
        db.cursor.execute("SELECT * FROM warehouses WHERE id = %s", (shipment.warehouse_id,))
        if not db.cursor.fetchone():
            raise HTTPException(status_code=404, detail="仓库不存在")
        
        # 创建发货记录
        db.cursor.execute(
            "INSERT INTO shipments (order_id, warehouse_id, logistics_company, tracking_number, status) VALUES (%s, %s, %s, %s, %s)",
            (shipment.order_id, shipment.warehouse_id, shipment.logistics_company, shipment.tracking_number, "shipped")
        )
        
        # 更新订单状态
        db.cursor.execute(
            "UPDATE orders SET status = %s, shipping_time = NOW() WHERE id = %s",
            ("shipped", shipment.order_id)
        )
        
        return {"id": db.cursor.lastrowid, "order_id": shipment.order_id, "tracking_number": shipment.tracking_number}

# 退货管理
@app.post("/api/returns")
async def create_return_order(request: Request, return_order: ReturnOrderCreate):
    user_id = request.state.user["user_id"]
    
    with Database() as db:
        # 检查订单是否存在
        db.cursor.execute("SELECT * FROM orders WHERE id = %s AND user_id = %s", (return_order.order_id, user_id))
        order = db.cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        if order["status"] not in ["shipped", "completed"]:
            raise HTTPException(status_code=400, detail="订单状态不支持退货")
        
        # 检查是否已有退货申请
        db.cursor.execute("SELECT * FROM return_orders WHERE order_id = %s AND status != 'cancelled'", (return_order.order_id,))
        if db.cursor.fetchone():
            raise HTTPException(status_code=400, detail="已有退货申请")
        
        # 创建退货订单
        images_str = ",".join(return_order.images) if return_order.images else ""
        db.cursor.execute(
            "INSERT INTO return_orders (order_id, user_id, reason, refund_amount, images, status) VALUES (%s, %s, %s, %s, %s, %s)",
            (return_order.order_id, user_id, return_order.reason, return_order.refund_amount, images_str, "pending")
        )
        
        return {"id": db.cursor.lastrowid, "order_id": return_order.order_id}

@app.put("/api/returns/{return_id}/process")
async def process_return(return_id: int, status: str, note: Optional[str] = None):
    with Database() as db:
        # 检查退货单是否存在
        db.cursor.execute("SELECT * FROM return_orders WHERE id = %s", (return_id,))
        return_order = db.cursor.fetchone()
        if not return_order:
            raise HTTPException(status_code=404, detail="退货单不存在")
        
        # 更新退货状态
        db.cursor.execute(
            "UPDATE return_orders SET status = %s, processed_at = NOW() WHERE id = %s",
            (status, return_id)
        )
        
        # 如果退货成功，更新订单状态和库存
        if status == "approved":
            # 更新订单状态
            db.cursor.execute(
                "UPDATE orders SET status = %s WHERE id = %s",
                ("refunded", return_order["order_id"])
            )
            
            # 恢复库存
            db.cursor.execute(
                "SELECT * FROM order_items WHERE order_id = %s",
                (return_order["order_id"],)
            )
            items = db.cursor.fetchall()
            for item in items:
                # 查找库存记录
                db.cursor.execute(
                    "SELECT * FROM inventory WHERE product_id = %s",
                    (item["product_id"],)
                )
                inventory = db.cursor.fetchone()
                if inventory:
                    db.cursor.execute(
                        "UPDATE inventory SET quantity = quantity + %s WHERE id = %s",
                        (item["quantity"], inventory["id"])
                    )
        
        return {"success": True, "message": "处理成功"}

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "warehouse-service", "timestamp": int(time.time())}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORTS["warehouse"],
        reload=True
    )
