from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid
from .base import BaseSchema, TimestampSchema
from ..models.user import UserRole

class UserBase(BaseSchema):
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    google_id: str

class UserUpdate(BaseSchema):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase, TimestampSchema):
    id: uuid.UUID
    google_id: str
    is_active: bool

class User(UserInDB):
    pass

class UserWithTeams(User):
    teams: List["TeamMembershipInfo"] = []

class TeamMembershipInfo(BaseSchema):
    team_id: uuid.UUID
    team_name: str
    role: UserRole