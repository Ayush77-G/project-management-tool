// frontend/hooks/useTasks.ts
import { useState, useEffect, useCallback } from 'react';
import { useBoardStore } from '../lib/store/useBoardStore';
import { TaskWithDetails, CreateTaskData, UpdateTaskData, MoveTaskData } from '../lib/api';

export const useTasks = (boardId?: string) => {
  const {
    currentBoard,
    loading,
    error,
    fetchBoard,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    optimisticMoveTask,
    optimisticCreateTask,
    optimisticUpdateTask,
    optimisticDeleteTask
  } = useBoardStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch board data on mount or when boardId changes
  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard]);

  // Group tasks by column
  const tasksByColumn = currentBoard?.tasks.reduce((acc, task) => {
    if (!acc[task.column_id]) {
      acc[task.column_id] = [];
    }
    acc[task.column_id].push(task);
    return acc;
  }, {} as Record<string, TaskWithDetails[]>) || {};

  // Create task with optimistic update
  const handleCreateTask = useCallback(async (data: CreateTaskData) => {
    if (!boardId) return;

    setIsCreating(true);
    
    // Optimistic update
    const tempTask: Partial<TaskWithDetails> = {
      id: `temp_${Date.now()}`,
      ...data,
      comments_count: 0,
      attachments_count: 0,
      created_at: new Date().toISOString()
    };
    
    optimisticCreateTask(tempTask);

    try {
      await createTask(data);
    } catch (error) {
      // Rollback optimistic update
      optimisticDeleteTask(tempTask.id!);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [boardId, createTask, optimisticCreateTask, optimisticDeleteTask]);

  // Update task with optimistic update
  const handleUpdateTask = useCallback(async (taskId: string, data: UpdateTaskData) => {
    setIsUpdating(true);
    
    // Optimistic update
    optimisticUpdateTask(taskId, data);

    try {
      await updateTask(taskId, data);
    } catch (error) {
      // Rollback by refetching board
      if (boardId) fetchBoard(boardId);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [updateTask, optimisticUpdateTask, fetchBoard, boardId]);

  // Move task with optimistic update
  const handleMoveTask = useCallback(async (
    taskId: string, 
    sourceColumnId: string, 
    destColumnId: string, 
    destIndex: number
  ) => {
    // Optimistic update
    optimisticMoveTask(taskId, sourceColumnId, destColumnId, destIndex);

    try {
      await moveTask(taskId, {
        column_id: destColumnId,
        position: destIndex
      });
    } catch (error) {
      // Rollback by refetching board
      if (boardId) fetchBoard(boardId);
      throw error;
    }
  }, [moveTask, optimisticMoveTask, fetchBoard, boardId]);

  // Delete task with optimistic update
  const handleDeleteTask = useCallback(async (taskId: string) => {
    // Optimistic update
    optimisticDeleteTask(taskId);

    try {
      await deleteTask(taskId);
    } catch (error) {
      // Rollback by refetching board
      if (boardId) fetchBoard(boardId);
      throw error;
    }
  }, [deleteTask, optimisticDeleteTask, fetchBoard, boardId]);

  return {
    // Data
    board: currentBoard,
    tasks: currentBoard?.tasks || [],
    tasksByColumn,
    
    // State
    loading,
    error,
    isCreating,
    isUpdating,
    
    // Actions
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    moveTask: handleMoveTask,
    deleteTask: handleDeleteTask,
    
    // Utilities
    refreshBoard: () => boardId && fetchBoard(boardId)
  };
};