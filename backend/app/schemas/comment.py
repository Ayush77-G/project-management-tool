# backend/app/schemas/comment.py
from pydantic import BaseModel, Field
from typing import Optional
import uuid
from .base import BaseSchema, TimestampSchema
from .user import User

class CommentBase(BaseSchema):
    content: str = Field(..., min_length=1)

class CommentCreate(CommentBase):
    task_id: uuid.UUID

class CommentUpdate(BaseSchema):
    content: str = Field(..., min_length=1)

class CommentInDB(CommentBase, TimestampSchema):
    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID

class Comment(CommentInDB):
    pass

class CommentWithAuthor(Comment):
    author: User