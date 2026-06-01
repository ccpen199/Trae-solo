from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    port: int = int(os.getenv("PORT", 48411))
    database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/app.sqlite")
    secret_key: str = os.getenv("SECRET_KEY", "51credit-manager-secret-key-2024")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:48412")


settings = Settings()
