from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
import enum

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    BLOCKED = "blocked"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskType(str, enum.Enum):
    TASK = "task"
    BUG = "bug"
    FEATURE = "feature"
    STORY = "story"

class Task(Base, TimestampMixin):
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text)
    
    # Task metadata
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    task_type = Column(Enum(TaskType), default=TaskType.TASK)
    
    # Assignement and tracking
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id"), nullable=False)
    sprint_id = Column(UUID(as_uuid=True), ForeignKey("sprints.id"))
    
    # Task details
    due_date = Column(DateTime(timezone=True))
    estimated_hours = Column(Integer)
    actual_hours = Column(Integer)
    tags = Column(ARRAY(String), default=list)
    
    # Board position
    column_id = Column(String, default="todo")
    position = Column(Integer, default=0)
    
    # Hierarchy
    parent_task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"))
    
    # Relationships
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tasks")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tasks")
    board = relationship("Board", back_populates="tasks")
    sprint = relationship("Sprint", back_populates="tasks")
    parent_task = relationship("Task", remote_side=[id])
    subtasks = relationship("Task")
    comments = relationship("Comment", back_populates="task")
    attachments = relationship("Attachment", back_populates="task")