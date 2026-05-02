from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.database import engine, Base
from app.routes import auth, devices, alarms, prediction, billing, reports
from app import init_data

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("正在初始化数据库...")
    Base.metadata.create_all(bind=engine)
    logger.info("数据库初始化完成")
    
    logger.info("正在初始化示例数据...")
    init_data.initialize_data()
    logger.info("示例数据初始化完成")
    
    logger.info("智慧能源Web管理系统启动成功！")
    
    yield
    
    logger.info("系统正在关闭...")


app = FastAPI(
    title="智慧能源Web管理系统",
    description="嵌入IoT-Stream采集引擎、Power-Load预测引擎、Tariff-Model计费引擎、Energy-Audit审计引擎的能源管理平台",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"请求异常: {request.url} - {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "系统内部错误",
            "detail": str(exc)
        }
    )


app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(alarms.router)
app.include_router(prediction.router)
app.include_router(billing.router)
app.include_router(reports.router)


@app.get("/")
async def root():
    return {
        "name": "智慧能源Web管理系统",
        "version": "2.0.0",
        "status": "running",
        "engines": [
            "IoT-Stream 采集引擎",
            "Power-Load 预测引擎",
            "Tariff-Model 计费引擎",
            "Energy-Audit 审计引擎"
        ],
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": __import__('datetime').datetime.utcnow().isoformat()
    }
