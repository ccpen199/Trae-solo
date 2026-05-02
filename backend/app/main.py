from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.config import get_settings
from app.database import init_db, async_session_maker
from app.auth import init_test_users
from app.engines import service_standard_engine
from app.routers import auth, service_items, cases, reservations, audits, evaluations, admin, window

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.app_name} v{settings.app_version}...")
    print(f"Environment: {settings.environment}")
    print(f"Backend Port: {settings.backend_port}")
    print(f"Frontend Port: {settings.frontend_port}")

    os.makedirs("./data", exist_ok=True)
    os.makedirs("./uploads", exist_ok=True)

    await init_db()

    async with async_session_maker() as db:
        await service_standard_engine.init_default_items(db)
        await init_test_users(db)

    print("Database initialized with default data.")
    print(f"Server running at: http://localhost:{settings.backend_port}")

    yield

    print("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="政务办事预约系统 - 支持全链路可追溯的政务服务平台",
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


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
        },
    )


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/info")
async def api_info():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "engines": {
            "service_standard": settings.service_standard_enabled,
            "doc_ocr": settings.doc_ocr_enabled,
            "time_slot": settings.time_slot_enabled,
            "satisfaction_index": settings.satisfaction_index_enabled,
        },
        "test_users": {
            "citizen": "citizen1 / 123456",
            "auditor": "auditor1 / 123456",
            "window_staff": "window1 / 123456",
            "admin": "admin1 / 123456",
        },
    }


app.include_router(auth.router, prefix="/api")
app.include_router(service_items.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(reservations.router, prefix="/api")
app.include_router(audits.router, prefix="/api")
app.include_router(evaluations.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(window.router, prefix="/api")
