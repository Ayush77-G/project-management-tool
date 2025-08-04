from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    avatar_url = Column(String)
    google_id = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    assigned_tasks = relationship("Task", back_populates="assignee")
    created_tasks = relationship("Task", foreign_keys="Task.creator_id", back_populates="creator")
    team_memberships = relationship("TeamMember", back_populates="user")
    comments = relationship("Comment", back_populates="author")