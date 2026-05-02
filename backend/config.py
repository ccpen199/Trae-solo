from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class Settings(BaseSettings):
    backend_port: int = int(os.getenv("BACKEND_PORT", "9172"))
    frontend_port: int = int(os.getenv("FRONTEND_PORT", "9173"))
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/app.sqlite")
    secret_key: str = os.getenv("SECRET_KEY", "payment-settlement-secret-key-2026")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    cors_origins: List[str] = ["http://localhost:9173"]
    callback_url: str = os.getenv("CALLBACK_URL", "http://localhost:9172/api/v1/payment/callback")
    
    class Config:
        extra = "ignore"

settings = Settings()
