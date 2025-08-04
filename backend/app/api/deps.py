from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import Optional
import uuid

from ..database import get_db
from ..models import User, TeamMember
from ..config import settings

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def check_team_permission(team_id: uuid.UUID, required_role: str = "viewer"):
    def _check_permission(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        membership = db.query(TeamMember).filter(
            TeamMember.user_id == current_user.id,
            TeamMember.team_id == team_id
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this team"
            )
        
        # Role hierarchy: admin > editor > viewer
        role_hierarchy = {"viewer": 0, "editor": 1, "admin": 2}
        
        if role_hierarchy.get(membership.role.value, 0) < role_hierarchy.get(required_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {required_role}"
            )
        
        return current_user
    
    return _check_permission