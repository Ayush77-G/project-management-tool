from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Sprint(Base, TimestampMixin):
    __tablename__ = "sprints"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Sprint timeline
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    
    # Sprint metadata
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    is_active = Column(Boolean, default=False)
    
    # Sprint goals and metrics
    goal = Column(Text)
    capacity = Column(Integer)  # Total estimated hours
    
    # Relationships
    team = relationship("Team")
    tasks = relationship("Task", back_populates="sprint")