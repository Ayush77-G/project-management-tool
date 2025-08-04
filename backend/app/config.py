from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/projectdb"
    
    # Authentication
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # File storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Redis (for caching and websockets)
    REDIS_URL: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"

settings = Settings()