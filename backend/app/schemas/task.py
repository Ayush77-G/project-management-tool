from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from .base import BaseSchema, TimestampSchema
from .user import User
from ..models.task import TaskStatus, TaskPriority, TaskType

class TaskBase(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    task_type: TaskType = TaskType.TASK
    due_date: Optional[datetime] = None
    estimated_hours: Optional[int] = Field(None, ge=0)
    tags: List[str] = Field(default_factory=list)

class TaskCreate(TaskBase):
    board_id: uuid.UUID
    assignee_id: Optional[uuid.UUID] = None
    parent_task_id: Optional[uuid.UUID] = None
    column_id: str = "todo"

class TaskUpdate(BaseSchema):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    task_type: Optional[TaskType] = None
    assignee_id: Optional[uuid.UUID] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[int] = Field(None, ge=0)
    actual_hours: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    column_id: Optional[str] = None
    position: Optional[int] = None
    sprint_id: Optional[uuid.UUID] = None

class TaskMove(BaseSchema):
    column_id: str
    position: int
    board_id: Optional[uuid.UUID] = None  # For moving between boards

class TaskInDB(TaskBase, TimestampSchema):
    id: uuid.UUID
    status: TaskStatus
    creator_id: uuid.UUID
    board_id: uuid.UUID
    assignee_id: Optional[uuid.UUID] = None
    sprint_id: Optional[uuid.UUID] = None
    column_id: str
    position: int
    parent_task_id: Optional[uuid.UUID] = None
    actual_hours: Optional[int] = None

class Task(TaskInDB):
    pass

class TaskWithDetails(Task):
    assignee: Optional[User] = None
    creator: User
    subtasks: List["TaskSummary"] = []
    comments_count: int = 0
    attachments_count: int = 0

class TaskSummary(BaseSchema):
    id: uuid.UUID
    title: str
    status: TaskStatus
    priority: TaskPriority
    assignee_id: Optional[uuid.UUID] = None
    due_date: Optional[datetime] = None
