from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import uuid
from .base import BaseSchema, TimestampSchema
from .task import TaskSummary

class SprintBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    goal: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=0)
    
    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class SprintCreate(SprintBase):
    team_id: uuid.UUID

class SprintUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    goal: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class SprintInDB(SprintBase, TimestampSchema):
    id: uuid.UUID
    team_id: uuid.UUID
    is_active: bool

class Sprint(SprintInDB):
    pass

class SprintWithTasks(Sprint):
    tasks: List[TaskSummary] = []
    completed_tasks: int = 0
    total_tasks: int = 0
    completed_hours: int = 0
    total_hours: int = 0

