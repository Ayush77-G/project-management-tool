from sqlalchemy import Column, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin
from .user import UserRole
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Team(Base, TimestampMixin):
    __tablename__ = "teams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    
    # Relationships
    members = relationship("TeamMember", back_populates="team")
    boards = relationship("Board", back_populates="team")

class TeamMember(Base, TimestampMixin):
    __tablename__ = "team_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EDITOR)
    
    # Relationships
    user = relationship("User", back_populates="team_memberships")
    team = relationship("Team", back_populates="members")