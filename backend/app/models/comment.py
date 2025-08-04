from sqlalchemy import Column, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Comment(Base, TimestampMixin):
    __tablename__ = "comments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    
    # References
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("User", back_populates="comments")