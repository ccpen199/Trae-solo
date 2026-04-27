from pydantic_settings import BaseSettings
from typing import Optional
import uuid


class Settings(BaseSettings):
    PROJECT_NAME: str = "农产品溯源系统"
    VERSION: str = "0.1.0"
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./traceability.db"
    
    SECRET_KEY: str = str(uuid.uuid4())
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    GB2763_PESTICIDE_THRESHOLDS: dict = {
        "甲胺磷": 0.05,
        "克百威": 0.02,
        "氧乐果": 0.02,
        "水胺硫磷": 0.05,
        "毒死蜱": 0.5,
        "百菌清": 5.0,
        "多菌灵": 3.0,
        "吡虫啉": 0.5,
        "阿维菌素": 0.05,
    }
    
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
