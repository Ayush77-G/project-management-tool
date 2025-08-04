from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import DeclarativeBase
import uuid
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
