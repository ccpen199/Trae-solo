from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.database import get_session
from app.config import settings
from app.schemas import ApiResponse

router = APIRouter(prefix="/health", tags=["健康检查"])


@router.get("/")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@router.get("/db")
async def db_health_check(session: AsyncSession = Depends(get_session)):
    try:
        await session.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }


@router.get("/info")
async def service_info():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "description": "农产品溯源系统",
        "features": {
            "role_perspectives": [
                "产地端 (Farmer)",
                "质检端 (Quality Inspector)",
                "流通端 (Warehouse/Logistics)",
                "消费端 (Consumer)",
                "管理员 (Admin)",
            ],
            "core_components": [
                "状态机 (State Machine)",
                "规则引擎 (Rule Engine)",
                "失败补偿 (Compensation)",
                "验收口径 (Acceptance Criteria)",
            ],
            "business_modules": [
                "批次管理",
                "农事作业",
                "质量检测",
                "流通追踪",
                "消费查询",
                "质量召回",
            ],
        },
    }
