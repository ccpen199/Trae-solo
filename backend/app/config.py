from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    BACKEND_PORT: int = 9158
    FRONTEND_PORT: int = 9159
    DATABASE_URL: str = "sqlite:///./data/app.sqlite"
    SECRET_KEY: str = "lowcode-form-secret-key-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
