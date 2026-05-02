#!/usr/bin/env python3
"""
API Gateway 服务
统一入口，路由分发，鉴权
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn
from config.config import PORTS, SERVICE_URLS, JWT_SECRET
import jwt
import time

app = FastAPI(
    title="E-Commerce API Gateway",
    description="独立站电商系统API网关",
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

# 鉴权中间件
async def verify_token(request: Request, call_next):
    # 跳过登录和注册接口
    if request.url.path in ["/api/auth/login", "/api/auth/register"]:
        return await call_next(request)
    
    # 验证JWT token
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="未提供认证令牌")
    
    try:
        token = token.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        request.state.user = payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="令牌已过期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的令牌")
    
    return await call_next(request)

# 应用中间件
app.middleware("http")(verify_token)

# 服务路由映射
ROUTES = {
    "/api/user": SERVICE_URLS["user"],
    "/api/product": SERVICE_URLS["product"],
    "/api/order": SERVICE_URLS["order"],
    "/api/payment": SERVICE_URLS["payment"],
    "/api/marketing": SERVICE_URLS["marketing"],
    "/api/warehouse": SERVICE_URLS["warehouse"],
    "/api/notify": SERVICE_URLS["notify"],
    "/api/report": SERVICE_URLS["report"],
    "/api/cs": SERVICE_URLS["cs"]
}

# 代理请求
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(request: Request, path: str):
    # 构建目标URL
    target_url = None
    for prefix, service_url in ROUTES.items():
        if path.startswith(prefix.strip("/")):
            target_url = f"{service_url}/{path}"
            break
    
    if not target_url:
        raise HTTPException(status_code=404, detail="接口不存在")
    
    # 转发请求
    async with httpx.AsyncClient() as client:
        try:
            # 构建请求参数
            headers = dict(request.headers)
            # 移除Host头
            headers.pop("host", None)
            
            # 读取请求体
            body = None
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await request.body()
            
            # 发送请求
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=request.query_params
            )
            
            # 返回响应
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"服务调用失败: {str(e)}")

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "api-gateway", "timestamp": int(time.time())}

# 服务状态
@app.get("/status")
async def service_status():
    status = {}
    async with httpx.AsyncClient() as client:
        for name, url in SERVICE_URLS.items():
            try:
                response = await client.get(f"{url}/health", timeout=2.0)
                status[name] = response.json()
            except:
                status[name] = {"status": "unhealthy"}
    return status

if __name__ == "__main__":
    uvicorn.run(
        "gateway:app",
        host="0.0.0.0",
        port=PORTS["gateway"],
        reload=True
    )
