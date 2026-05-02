from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "政务办事预约系统"
    app_version: str = "1.0.0"
    environment: str = "development"

    backend_port: int = 110921
    frontend_port: int = 110922

    database_url: str = "sqlite:///./data/app.sqlite"

    secret_key: str = "xm-11092-secret-key-2024"
    access_token_expire_minutes: int = 1440

    cors_origins: List[str] = ["http://localhost:110922", "http://127.0.0.1:110922"]

    service_standard_enabled: bool = True
    doc_ocr_enabled: bool = True
    time_slot_enabled: bool = True
    satisfaction_index_enabled: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
