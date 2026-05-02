from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List
import os


class Settings(BaseSettings):
    app_name: str = "社区服务协作系统"
    app_env: str = "development"
    backend_port: int = 110951
    frontend_port: int = 110952
    database_url: str = "sqlite+aiosqlite:///./data/app.sqlite"
    secret_key: str = "your-secret-key-change-in-production-11095"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origins(self) -> List[str]:
        return [
            f"http://localhost:{self.frontend_port}",
            f"http://127.0.0.1:{self.frontend_port}",
        ]

    @property
    def backend_url(self) -> str:
        return f"http://localhost:{self.backend_port}"

    @property
    def frontend_url(self) -> str:
        return f"http://localhost:{self.frontend_port}"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
