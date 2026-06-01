from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from src.config import settings, engine, Base
from src.routes import (
    auth_router,
    bill_router,
    message_router,
    wealth_router,
    loan_router,
    user_router,
    admin_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="51信用卡管家 API",
    description="51信用卡管家后端接口文档",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:48412",
        "http://127.0.0.1:48412",
        "http://localhost:48413",
        "http://127.0.0.1:48413"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(bill_router, prefix="/api")
app.include_router(message_router, prefix="/api")
app.include_router(wealth_router, prefix="/api")
app.include_router(loan_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"success": True, "message": "Service is running", "data": {"version": "1.0.0"}}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level="info"
    )
