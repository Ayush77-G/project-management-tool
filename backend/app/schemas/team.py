from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from .base import BaseSchema, TimestampSchema
from .user import User, UserRole

class TeamBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None

class TeamMemberAdd(BaseSchema):
    user_email: str
    role: UserRole = UserRole.EDITOR

class TeamMemberUpdate(BaseSchema):
    role: UserRole

class TeamMemberInfo(BaseSchema):
    id: uuid.UUID
    user: User
    role: UserRole
    joined_at: datetime

class TeamInDB(TeamBase, TimestampSchema):
    id: uuid.UUID

class Team(TeamInDB):
    pass

class TeamWithMembers(Team):
    members: List[TeamMemberInfo] = []
    member_count: int = 0

class TeamSummary(BaseSchema):
    id: uuid.UUID
    name: str
    member_count: int = 0
    board_count: int = 0