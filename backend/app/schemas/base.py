from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
import uuid

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class TimestampSchema(BaseSchema):
    created_at: datetime
    updated_at: Optional[datetime] = None