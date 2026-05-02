from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import init_db
from app.routers import auth, activities, registrations, shifts, attendances, users, admin


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("正在初始化数据库...")
    await init_db()
    logger.info("数据库初始化完成")

    logger.info("正在插入初始化数据...")
    await init_sample_data()
    logger.info("初始化数据插入完成")

    logger.info(f"服务启动完成，端口: {settings.backend_port}")
    yield
    logger.info("服务关闭中...")


async def init_sample_data():
    """
    插入示例数据用于演示
    
    包含：
    - 示例技能标签
    - 示例用户（各角色各一个）
    - 示例勋章
    """
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.core.database import async_session_maker
    from app.core.security import get_password_hash
    from app.models.models import (
        User, Skill, Badge, BadgeTier,
        UserRole,
    )
    from sqlalchemy import select

    async with async_session_maker() as session:
        skills = [
            {"name": "急救知识", "description": "具备基本急救和应急处理能力", "category": "医疗"},
            {"name": "心理咨询", "description": "具备心理咨询和沟通能力", "category": "心理"},
            {"name": "教学辅导", "description": "具备教学和辅导经验", "category": "教育"},
            {"name": "环境清洁", "description": "具备环境清洁和维护能力", "category": "环保"},
            {"name": "志愿服务经验", "description": "有丰富的志愿服务经验", "category": "综合"},
            {"name": "技术支持", "description": "具备IT技术支持能力", "category": "技术"},
            {"name": "活动组织", "description": "具备活动组织和协调能力", "category": "组织"},
            {"name": "语言翻译", "description": "具备外语翻译能力", "category": "语言"},
        ]

        for skill_data in skills:
            existing = await session.execute(
                select(Skill).where(Skill.name == skill_data["name"])
            )
            if not existing.scalar_one_or_none():
                skill = Skill(**skill_data)
                session.add(skill)

        badges = [
            {
                "name": "初心志愿者",
                "description": "首次参与志愿服务",
                "tier": BadgeTier.BRONZE,
                "requirement_type": "activity_count",
                "requirement_value": 1,
            },
            {
                "name": "热心服务者",
                "description": "累计服务满10小时",
                "tier": BadgeTier.BRONZE,
                "requirement_type": "total_hours",
                "requirement_value": 10,
            },
            {
                "name": "社区守护人",
                "description": "累计服务满50小时",
                "tier": BadgeTier.SILVER,
                "requirement_type": "total_hours",
                "requirement_value": 50,
            },
            {
                "name": "先锋志愿者",
                "description": "累计服务满100小时",
                "tier": BadgeTier.GOLD,
                "requirement_type": "total_hours",
                "requirement_value": 100,
            },
            {
                "name": "荣誉志愿者",
                "description": "诚信分达到150分",
                "tier": BadgeTier.GOLD,
                "requirement_type": "credit_score",
                "requirement_value": 150,
            },
            {
                "name": "终身志愿者",
                "description": "累计服务满500小时",
                "tier": BadgeTier.PLATINUM,
                "requirement_type": "total_hours",
                "requirement_value": 500,
            },
        ]

        for badge_data in badges:
            existing = await session.execute(
                select(Badge).where(Badge.name == badge_data["name"])
            )
            if not existing.scalar_one_or_none():
                badge = Badge(**badge_data)
                session.add(badge)

        sample_users = [
            {
                "username": "volunteer1",
                "email": "volunteer1@example.com",
                "phone": "13800138001",
                "full_name": "张志愿",
                "password": "123456",
                "role": UserRole.VOLUNTEER,
            },
            {
                "username": "organizer1",
                "email": "organizer1@example.com",
                "phone": "13800138002",
                "full_name": "李组织者",
                "password": "123456",
                "role": UserRole.ORGANIZER,
            },
            {
                "username": "admin1",
                "email": "admin1@example.com",
                "phone": "13800138003",
                "full_name": "王管理员",
                "password": "123456",
                "role": UserRole.ADMIN,
            },
            {
                "username": "reviewer1",
                "email": "reviewer1@example.com",
                "phone": "13800138004",
                "full_name": "赵评审员",
                "password": "123456",
                "role": UserRole.REVIEWER,
            },
        ]

        for user_data in sample_users:
            existing = await session.execute(
                select(User).where(User.username == user_data["username"])
            )
            if not existing.scalar_one_or_none():
                password = user_data.pop("password")
                user = User(
                    **user_data,
                    hashed_password=get_password_hash(password),
                )
                session.add(user)

        await session.commit()


app = FastAPI(
    title=settings.app_name,
    description="社区服务协作系统 - 志愿者管理平台",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "请求参数验证失败",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"未处理的异常: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "服务器内部错误，请稍后重试",
        },
    )


app.include_router(auth.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(registrations.router, prefix="/api")
app.include_router(shifts.router, prefix="/api")
app.include_router(attendances.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running",
        "docs": f"{settings.backend_url}/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
