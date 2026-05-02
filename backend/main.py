from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import (
    auth_router,
    tasks_router,
    workers_router,
    experts_router,
    admin_router,
    statistics_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app import models
    from app.database import engine
    models.Base.metadata.create_all(bind=engine)

    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app.models import User, UserRole, Wallet
        from app.auth import get_password_hash

        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            admin = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                email="admin@example.com",
                real_name="管理员",
                role=UserRole.ADMIN,
                level=5,
                is_active=True
            )
            db.add(admin)
            db.flush()

            admin_wallet = Wallet(
                user_id=admin.id,
                balance=0.0,
                total_income=0.0,
                total_withdraw=0.0
            )
            db.add(admin_wallet)

        publisher = db.query(User).filter(User.username == "publisher").first()
        if not publisher:
            publisher = User(
                username="publisher",
                password_hash=get_password_hash("publisher123"),
                email="publisher@example.com",
                real_name="发布方测试",
                role=UserRole.PUBLISHER,
                level=3,
                is_active=True
            )
            db.add(publisher)
            db.flush()

            publisher_wallet = Wallet(
                user_id=publisher.id,
                balance=0.0,
                total_income=0.0,
                total_withdraw=0.0
            )
            db.add(publisher_wallet)

        worker = db.query(User).filter(User.username == "worker").first()
        if not worker:
            worker = User(
                username="worker",
                password_hash=get_password_hash("worker123"),
                email="worker@example.com",
                real_name="接单员测试",
                role=UserRole.WORKER,
                level=2,
                is_active=True
            )
            db.add(worker)
            db.flush()

            worker_wallet = Wallet(
                user_id=worker.id,
                balance=0.0,
                total_income=0.0,
                total_withdraw=0.0
            )
            db.add(worker_wallet)

        expert = db.query(User).filter(User.username == "expert").first()
        if not expert:
            expert = User(
                username="expert",
                password_hash=get_password_hash("expert123"),
                email="expert@example.com",
                real_name="专家测试",
                role=UserRole.EXPERT,
                level=4,
                is_active=True
            )
            db.add(expert)
            db.flush()

            expert_wallet = Wallet(
                user_id=expert.id,
                balance=0.0,
                total_income=0.0,
                total_withdraw=0.0
            )
            db.add(expert_wallet)

        db.commit()
    finally:
        db.close()

    yield


app = FastAPI(
    title="众包任务平台 API",
    description="分布式办公协同业务系统 - 众包任务平台",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "body": exc.body
        }
    )


@app.get("/")
async def root():
    return {
        "name": "众包任务平台 API",
        "version": "1.0.0",
        "docs": "/docs",
        "backend_port": settings.BACKEND_PORT,
        "frontend_port": settings.FRONTEND_PORT
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


app.include_router(auth_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(workers_router, prefix="/api")
app.include_router(experts_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(statistics_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.BACKEND_PORT,
        reload=True
    )
