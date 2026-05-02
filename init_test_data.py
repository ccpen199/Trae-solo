from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy import select
import asyncio
import uuid
from datetime import datetime
from app.models.base import Base
from app.models.user import User, UserRole
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)

async def init_test_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(engine) as session:
        result = await session.execute(select(User).where(User.username == "test_farmer"))
        if result.scalar_one_or_none() is None:
            farmer = User(
                uid="farmer_123",
                username="test_farmer",
                password_hash="hashed_password_placeholder",
                real_name="测试农户",
                phone="13800138000",
                role=UserRole.FARMER,
                organization="测试农场"
            )
            session.add(farmer)
            await session.commit()
            print("测试用户创建成功")
        else:
            print("测试用户已存在")
        
        result = await session.execute(select(User).where(User.username == "test_inspector"))
        if result.scalar_one_or_none() is None:
            inspector = User(
                uid="inspector_001",
                username="test_inspector",
                password_hash="hashed_password_placeholder",
                real_name="测试检测员",
                phone="13900139000",
                role=UserRole.QUALITY_INSPECTOR,
                organization="检测中心"
            )
            session.add(inspector)
            await session.commit()
            print("检测员用户创建成功")
        else:
            print("检测员用户已存在")

if __name__ == "__main__":
    asyncio.run(init_test_data())