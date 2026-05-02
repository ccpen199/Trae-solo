from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
from app.routers import (
    health_router,
    batch_router,
    farming_router,
    quality_router,
    flow_router,
    consumer_router,
    recall_router,
    compensation_router,
    acceptance_router,
)
import socket


def find_available_port(start_port: int = 8099, end_port: int = 8199) -> int:
    """查找可用端口"""
    for port in range(start_port, end_port + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    return start_port


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="农产品溯源系统 - 从产地到消费端的闭环追踪",
        lifespan=lifespan,
    )
    
    app.include_router(health_router, prefix="/api", tags=["健康检查"])
    app.include_router(batch_router, prefix="/api/batches", tags=["批次管理"])
    app.include_router(farming_router, prefix="/api/farming", tags=["农事作业"])
    app.include_router(quality_router, prefix="/api/quality", tags=["质检管理"])
    app.include_router(flow_router, prefix="/api/flow", tags=["流通管理"])
    app.include_router(consumer_router, prefix="/api/consumer", tags=["消费者端"])
    app.include_router(recall_router, prefix="/api/recall", tags=["召回管理"])
    app.include_router(compensation_router, prefix="/api/compensation", tags=["失败补偿"])
    app.include_router(acceptance_router, prefix="/api/acceptance", tags=["验收口径"])
    
    return app


app = create_app()
DEFAULT_PORT = 8099
PORT_RANGE_START = 8099
PORT_RANGE_END = 8199


def main():
    import uvicorn
    port = find_available_port(PORT_RANGE_START, PORT_RANGE_END)
    print(f"Using backend port {port}")
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)


if __name__ == "__main__":
    main()