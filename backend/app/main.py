from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db, SessionLocal
from app.routers import auth, forms, submissions, common
from app.routers.auth import init_default_users


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    
    db = SessionLocal()
    try:
        init_default_users(db)
    finally:
        db.close()
    
    yield


app = FastAPI(
    title="低代码表单系统 API",
    description="低代码表单系统后端服务，包含建模引擎、DSL引擎、状态机、规则引擎等核心功能",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"http://localhost:{settings.FRONTEND_PORT}",
        f"http://127.0.0.1:{settings.FRONTEND_PORT}",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(forms.router)
app.include_router(submissions.router)
app.include_router(common.router)


@app.get("/")
def root():
    return {
        "name": "低代码表单系统",
        "version": "1.0.0",
        "status": "running",
        "api_docs": "/docs",
        "port": settings.BACKEND_PORT
    }
