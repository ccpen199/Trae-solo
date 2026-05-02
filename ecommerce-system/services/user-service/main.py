#!/usr/bin/env python3
"""
用户服务
会员、积分、等级、行为记录
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import mysql.connector
import redis
import jwt
import hashlib
import time
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

from config.config import PORTS, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, JWT_SECRET, JWT_EXPIRY

app = FastAPI(
    title="User Service",
    description="用户服务 - 会员、积分、等级管理",
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
    db=0
)

# 数据模型
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    phone: Optional[str]
    level: int
    points: int
    created_at: datetime

class ChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

# 工具函数
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_jwt_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": time.time() + JWT_EXPIRY
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# 初始化数据库表
@app.on_event("startup")
async def startup():
    with Database() as db:
        # 创建用户表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            level INT DEFAULT 1,
            points INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )''')
        
        # 创建用户地址表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_addresses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            province VARCHAR(50) NOT NULL,
            city VARCHAR(50) NOT NULL,
            district VARCHAR(50) NOT NULL,
            detail VARCHAR(200) NOT NULL,
            is_default TINYINT DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )''')
        
        # 创建积分记录表
        db.cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_points_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            points INT NOT NULL,
            type VARCHAR(20) NOT NULL,
            remark VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )''')

# 注册接口
@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserRegister):
    with Database() as db:
        # 检查邮箱是否已存在
        db.cursor.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        if db.cursor.fetchone():
            raise HTTPException(status_code=400, detail="邮箱已被注册")
        
        # 创建用户
        hashed_pwd = hash_password(user.password)
        db.cursor.execute(
            "INSERT INTO users (username, email, password, phone) VALUES (%s, %s, %s, %s)",
            (user.username, user.email, hashed_pwd, user.phone)
        )
        user_id = db.cursor.lastrowid
        
        # 查询创建的用户
        db.cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user_data = db.cursor.fetchone()
        
        return UserResponse(**user_data)

# 登录接口
@app.post("/api/auth/login")
async def login(user: UserLogin):
    with Database() as db:
        # 查找用户
        db.cursor.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        user_data = db.cursor.fetchone()
        
        if not user_data:
            raise HTTPException(status_code=401, detail="邮箱或密码错误")
        
        # 验证密码
        if hash_password(user.password) != user_data["password"]:
            raise HTTPException(status_code=401, detail="邮箱或密码错误")
        
        # 生成JWT token
        token = create_jwt_token(user_data["id"], user_data["email"])
        
        # 缓存用户信息到Redis
        redis_client.setex(
            f"user:{user_data['id']}",
            3600,
            f"{user_data['id']}:{user_data['username']}:{user_data['level']}:{user_data['points']}"
        )
        
        return {
            "access_token": token,
            "token_type": "Bearer",
            "user": UserResponse(**user_data)
        }

# 获取用户信息
@app.get("/api/user/me", response_model=UserResponse)
async def get_current_user(request: Request):
    user_id = request.state.user["user_id"]
    
    # 尝试从Redis获取
    user_info = redis_client.get(f"user:{user_id}")
    if user_info:
        user_id, username, level, points = user_info.decode().split(":")
        return UserResponse(
            id=int(user_id),
            username=username,
            email=request.state.user["email"],
            phone=None,
            level=int(level),
            points=int(points),
            created_at=datetime.now()
        )
    
    # 从数据库获取
    with Database() as db:
        db.cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user_data = db.cursor.fetchone()
        if not user_data:
            raise HTTPException(status_code=404, detail="用户不存在")
        return UserResponse(**user_data)

# 刷新积分
@app.post("/api/user/points")
async def add_points(request: Request, points: int, type: str, remark: Optional[str] = None):
    user_id = request.state.user["user_id"]
    
    with Database() as db:
        # 更新用户积分
        db.cursor.execute(
            "UPDATE users SET points = points + %s WHERE id = %s",
            (points, user_id)
        )
        
        # 记录积分变动
        db.cursor.execute(
            "INSERT INTO user_points_log (user_id, points, type, remark) VALUES (%s, %s, %s, %s)",
            (user_id, points, type, remark)
        )
        
        # 更新Redis缓存
        db.cursor.execute("SELECT points, level FROM users WHERE id = %s", (user_id,))
        user_data = db.cursor.fetchone()
        redis_client.setex(
            f"user:{user_id}",
            3600,
            f"{user_id}:{request.state.user.get('username', '')}:{user_data['level']}:{user_data['points']}"
        )
        
        return {"success": True, "points": user_data["points"]}

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user-service", "timestamp": int(time.time())}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORTS["user"],
        reload=True
    )
