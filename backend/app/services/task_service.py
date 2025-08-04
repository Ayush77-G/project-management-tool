from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from fastapi import HTTPException
from typing import Optional
import uuid

from ..models import Task, Board, TeamMember, User
from ..schemas import TaskMove, TaskWithDetails

class TaskService:
    def __init__(self, db: Session):
        self.db = db
    
    async def move_task(
        self, 
        task_id: uuid.UUID, 
        move_data: TaskMove, 
        current_user: User
    ) -> TaskWithDetails:
        """Move a task to a different column and position"""
        
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Check permissions
        board = self.db.query(Board).filter(Board.id == task.board_id).first()
        membership = self.db.query(TeamMember).filter(
            TeamMember.user_id == current_user.id,
            TeamMember.team_id == board.team_id
        ).first()
        
        if not membership or membership.role.value == "viewer":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        old_column = task.column_id
        old_position = task.position
        target_board_id = move_data.board_id or task.board_id
        
        # If moving to different board, check access
        if move_data.board_id and move_data.board_id != task.board_id:
            target_board = self.db.query(Board).filter(Board.id == move_data.board_id).first()
            if not target_board:
                raise HTTPException(status_code=404, detail="Target board not found")
            
            target_membership = self.db.query(TeamMember).filter(
                TeamMember.user_id == current_user.id,
                TeamMember.team_id == target_board.team_id
            ).first()
            
            if not target_membership or target_membership.role.value == "viewer":
                raise HTTPException(status_code=403, detail="No access to target board")
        
        # Reorder tasks in old column (if column changed)
        if old_column != move_data.column_id or target_board_id != task.board_id:
            self.db.query(Task).filter(
                and_(
                    Task.board_id == task.board_id,
                    Task.column_id == old_column,
                    Task.position > old_position
                )
            ).update({Task.position: Task.position - 1})
        
        # Make space in new column
        self.db.query(Task).filter(
            and_(
                Task.board_id == target_board_id,
                Task.column_id == move_data.column_id,
                Task.position >= move_data.position
            )
        ).update({Task.position: Task.position + 1})
        
        # Update task
        task.column_id = move_data.column_id
        task.position = move_data.position
        task.board_id = target_board_id
        
        # Update status based on column
        status_mapping = {
            "todo": "todo",
            "in_progress": "in_progress", 
            "review": "review",
            "done": "done"
        }
        if move_data.column_id in status_mapping:
            task.status = status_mapping[move_data.column_id]
        
        self.db.commit()
        self.db.refresh(task)
        
        # Load full task with relationships
        task = self.db.query(Task).options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.board),
            joinedload(Task.subtasks),
            joinedload(Task.comments),
            joinedload(Task.attachments)
        ).filter(Task.id == task.id).first()
        
        task_dict = TaskWithDetails.model_validate(task).model_dump()
        task_dict["comments_count"] = len(task.comments)
        task_dict["attachments_count"] = len(task.attachments)
        
        return TaskWithDetails(**task_dict)