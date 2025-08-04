from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Board(Base, TimestampMixin):
    __tablename__ = "boards"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    
    # Board configuration
    columns = Column(JSON, default=lambda: [
        {"id": "todo", "name": "To Do", "order": 0},
        {"id": "in_progress", "name": "In Progress", "order": 1},
        {"id": "review", "name": "Review", "order": 2},
        {"id": "done", "name": "Done", "order": 3}
    ])
    
    # Relationships
    team = relationship("Team", back_populates="boards")
    tasks = relationship("Task", back_populates="board")
