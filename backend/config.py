from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class Settings(BaseSettings):
    FRONTEND_PORT: int = int(os.getenv('FRONTEND_PORT', '43371'))
    BACKEND_PORT: int = int(os.getenv('BACKEND_PORT', '53371'))
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'sqlite:///./data/app.sqlite')
    API_BASE_URL: str = os.getenv('API_BASE_URL', 'http://127.0.0.1:53371')
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'ai-knowledge-base-secret-key-2024')
    ALGORITHM: str = os.getenv('ALGORITHM', 'HS256')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))
    
    class Config:
        case_sensitive = True

settings = Settings()
