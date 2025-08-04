from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import uuid

from ..database import get_db
from ..models import Task, Board, User, TeamMember
from ..schemas import (
    Task as TaskSchema, 
    TaskCreate, 
    TaskUpdate, 
    TaskWithDetails,
    TaskMove
)
from ..api.deps import get_current_active_user
from ..services.task_service import TaskService
from ..core.websocket import websocket_manager

router = APIRouter()

@router.get("/", response_model=List[TaskWithDetails])
async def get_tasks(
    board_id: Optional[uuid.UUID] = Query(None),
    assignee_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    sprint_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get tasks with filtering options"""
    
    query = db.query(Task).options(
        joinedload(Task.assignee),
        joinedload(Task.creator),
        joinedload(Task.board),
        joinedload(Task.subtasks),
        joinedload(Task.comments),
        joinedload(Task.attachments)
    )
    
    # Filter by user's team access
    query = query.join(Board).join(TeamMember).filter(
        TeamMember.user_id == current_user.id
    )
    
    if board_id:
        query = query.filter(Task.board_id == board_id)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    if status:
        query = query.filter(Task.status == status)
    if sprint_id:
        query = query.filter(Task.sprint_id == sprint_id)
    
    tasks = query.offset(offset).limit(limit).all()
    
    # Convert to schema with additional details
    result = []
    for task in tasks:
        task_dict = TaskWithDetails.model_validate(task).model_dump()
        task_dict["comments_count"] = len(task.comments)
        task_dict["attachments_count"] = len(task.attachments)
        result.append(TaskWithDetails(**task_dict))
    
    return result

@router.get("/{task_id}", response_model=TaskWithDetails)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific task by ID"""
    
    task = db.query(Task).options(
        joinedload(Task.assignee),
        joinedload(Task.creator),
        joinedload(Task.board),
        joinedload(Task.subtasks),
        joinedload(Task.comments),
        joinedload(Task.attachments)
    ).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check team access
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == task.board.team_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Access denied")
    
    task_dict = TaskWithDetails.model_validate(task).model_dump()
    task_dict["comments_count"] = len(task.comments)
    task_dict["attachments_count"] = len(task.attachments)
    
    return TaskWithDetails(**task_dict)

@router.post("/", response_model=TaskWithDetails)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new task"""
    
    # Verify board access
    board = db.query(Board).filter(Board.id == task_data.board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == board.team_id
    ).first()
    
    if not membership or membership.role.value == "viewer":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get next position in column
    max_position = db.query(Task).filter(
        Task.board_id == task_data.board_id,
        Task.column_id == task_data.column_id
    ).count()
    
    # Create task
    task = Task(
        **task_data.model_dump(exclude={"assignee_id"}),
        creator_id=current_user.id,
        position=max_position
    )
    
    if task_data.assignee_id:
        # Verify assignee is team member
        assignee_membership = db.query(TeamMember).filter(
            TeamMember.user_id == task_data.assignee_id,
            TeamMember.team_id == board.team_id
        ).first()
        if assignee_membership:
            task.assignee_id = task_data.assignee_id
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Load relationships for response
    task = db.query(Task).options(
        joinedload(Task.assignee),
        joinedload(Task.creator),
        joinedload(Task.board),
        joinedload(Task.subtasks)
    ).filter(Task.id == task.id).first()
    
    # Notify via WebSocket
    await websocket_manager.broadcast_to_board(
        board.id,
        {
            "type": "task_created",
            "task": TaskWithDetails.model_validate(task).model_dump()
        }
    )
    
    task_dict = TaskWithDetails.model_validate(task).model_dump()
    task_dict["comments_count"] = 0
    task_dict["attachments_count"] = 0
    
    return TaskWithDetails(**task_dict)

@router.put("/{task_id}", response_model=TaskWithDetails)
async def update_task(
    task_id: uuid.UUID,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a task"""
    
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check permissions
    board = db.query(Board).filter(Board.id == task.board_id).first()
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == board.team_id
    ).first()
    
    if not membership or membership.role.value == "viewer":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Update task fields
    update_data = task_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(task, field):
            setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    
    # Load relationships
    task = db.query(Task).options(
        joinedload(Task.assignee),
        joinedload(Task.creator),
        joinedload(Task.board),
        joinedload(Task.subtasks),
        joinedload(Task.comments),
        joinedload(Task.attachments)
    ).filter(Task.id == task.id).first()
    
    # Notify via WebSocket
    await websocket_manager.broadcast_to_board(
        board.id,
        {
            "type": "task_updated",
            "task": TaskWithDetails.model_validate(task).model_dump()
        }
    )
    
    task_dict = TaskWithDetails.model_validate(task).model_dump()
    task_dict["comments_count"] = len(task.comments)
    task_dict["attachments_count"] = len(task.attachments)
    
    return TaskWithDetails(**task_dict)

@router.post("/{task_id}/move", response_model=TaskWithDetails)
async def move_task(
    task_id: uuid.UUID,
    move_data: TaskMove,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Move a task to a different column/position"""
    
    task_service = TaskService(db)
    task = await task_service.move_task(task_id, move_data, current_user)
    
    # Notify via WebSocket
    board = db.query(Board).filter(Board.id == task.board_id).first()
    await websocket_manager.broadcast_to_board(
        board.id,
        {
            "type": "task_moved",
            "task": TaskWithDetails.model_validate(task).model_dump()
        }
    )
    
    return task

@router.delete("/{task_id}")
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a task"""
    
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check permissions
    board = db.query(Board).filter(Board.id == task.board_id).first()
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == board.team_id
    ).first()
    
    if not membership or membership.role.value == "viewer":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db.delete(task)
    db.commit()
    
    # Notify via WebSocket
    await websocket_manager.broadcast_to_board(
        board.id,
        {
            "type": "task_deleted",
            "task_id": str(task_id)
        }
    )
    
    return {"message": "Task deleted successfully"}
