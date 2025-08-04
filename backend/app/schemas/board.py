from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from .base import BaseSchema, TimestampSchema
from .task import TaskWithDetails

class BoardColumn(BaseSchema):
    id: str
    name: str
    order: int

class BoardBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class BoardCreate(BoardBase):
    team_id: uuid.UUID
    columns: Optional[List[BoardColumn]] = None

class BoardUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    columns: Optional[List[BoardColumn]] = None

class BoardInDB(BoardBase, TimestampSchema):
    id: uuid.UUID
    team_id: uuid.UUID
    columns: List[Dict[str, Any]]

class Board(BoardInDB):
    pass

class BoardWithTasks(Board):
    tasks: List[TaskWithDetails] = []
    
class BoardSummary(BaseSchema):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    task_count: int = 0
    team_id: uuid.UUID