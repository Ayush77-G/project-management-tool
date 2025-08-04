import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient, Board, BoardWithTasks, TaskWithDetails, CreateTaskData, UpdateTaskData, MoveTaskData } from '../api';

interface BoardState {
  boards: Board[];
  currentBoard: BoardWithTasks | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchBoards: () => Promise<void>;
  fetchBoard: (id: string) => Promise<void>;
  createBoard: (data: any) => Promise<void>;
  updateBoard: (id: string, data: any) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  
  // Task actions
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  moveTask: (id: string, data: MoveTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Optimistic updates
  optimisticMoveTask: (taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => void;
  optimisticCreateTask: (task: Partial<TaskWithDetails>) => void;
  optimisticUpdateTask: (taskId: string, updates: Partial<TaskWithDetails>) => void;
  optimisticDeleteTask: (taskId: string) => void;
  
  // Utilities
  setError: (error: string | null) => void;
  clearBoard: () => void;
}

export const useBoardStore = create<BoardState>()(
  devtools(
    (set, get) => ({
      boards: [],
      currentBoard: null,
      loading: false,
      error: null,

      fetchBoards: async () => {
        set({ loading: true, error: null });
        try {
          const boards = await apiClient.getBoards();
          set({ boards, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      fetchBoard: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const board = await apiClient.getBoard(id);
          set({ currentBoard: board, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      createBoard: async (data) => {
        set({ loading: true, error: null });
        try {
          const board = await apiClient.createBoard(data);
          set((state) => ({ 
            boards: [...state.boards, board], 
            loading: false 
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      updateBoard: async (id: string, data) => {
        set({ loading: true, error: null });
        try {
          const board = await apiClient.updateBoard(id, data);
          set((state) => ({
            boards: state.boards.map(b => b.id === id ? board : b),
            currentBoard: state.currentBoard?.id === id ? { ...state.currentBoard, ...board } : state.currentBoard,
            loading: false
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      deleteBoard: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await apiClient.deleteBoard(id);
          set((state) => ({
            boards: state.boards.filter(b => b.id !== id),
            currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
            loading: false
          }));
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      createTask: async (data: CreateTaskData) => {
        try {
          const task = await apiClient.createTask(data);
          set((state) => ({
            currentBoard: state.currentBoard ? {
              ...state.currentBoard,
              tasks: [...state.currentBoard.tasks, task]
            } : null
          }));
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      updateTask: async (id: string, data: UpdateTaskData) => {
        try {
          const task = await apiClient.updateTask(id, data);
          set((state) => ({
            currentBoard: state.currentBoard ? {
              ...state.currentBoard,
              tasks: state.currentBoard.tasks.map(t => t.id === id ? task : t)
            } : null
          }));
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      moveTask: async (id: string, data: MoveTaskData) => {
        try {
          const task = await apiClient.moveTask(id, data);
          set((state) => ({
            currentBoard: state.currentBoard ? {
              ...state.currentBoard,
              tasks: state.currentBoard.tasks.map(t => t.id === id ? task : t)
            } : null
          }));
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      deleteTask: async (id: string) => {
        try {
          await apiClient.deleteTask(id);
          set((state) => ({
            currentBoard: state.currentBoard ? {
              ...state.currentBoard,
              tasks: state.currentBoard.tasks.filter(t => t.id !== id)
            } : null
          }));
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      // Optimistic updates for better UX
      optimisticMoveTask: (taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => {
        set((state) => {
          if (!state.currentBoard) return state;

          const tasks = [...state.currentBoard.tasks];
          const taskIndex = tasks.findIndex(t => t.id === taskId);
          if (taskIndex === -1) return state;

          const task = tasks[taskIndex];
          tasks.splice(taskIndex, 1);

          // Update task properties
          const updatedTask = { ...task, column_id: destColumnId, status: destColumnId };
          
          // Find insertion point
          const destTasks = tasks.filter(t => t.column_id === destColumnId);
          destTasks.splice(destIndex, 0, updatedTask);
          
          // Rebuild array
          const otherTasks = tasks.filter(t => t.column_id !== destColumnId);
          const newTasks = [...otherTasks, ...destTasks];

          return {
            ...state,
            currentBoard: {
              ...state.currentBoard,
              tasks: newTasks
            }
          };
        });
      },

      optimisticCreateTask: (task: Partial<TaskWithDetails>) => {
        set((state) => ({
          currentBoard: state.currentBoard ? {
            ...state.currentBoard,
            tasks: [...state.currentBoard.tasks, task as TaskWithDetails]
          } : null
        }));
      },

      optimisticUpdateTask: (taskId: string, updates: Partial<TaskWithDetails>) => {
        set((state) => ({
          currentBoard: state.currentBoard ? {
            ...state.currentBoard,
            tasks: state.currentBoard.tasks.map(t => 
              t.id === taskId ? { ...t, ...updates } : t
            )
          } : null
        }));
      },

      optimisticDeleteTask: (taskId: string) => {
        set((state) => ({
          currentBoard: state.currentBoard ? {
            ...state.currentBoard,
            tasks: state.currentBoard.tasks.filter(t => t.id !== taskId)
          } : null
        }));
      },

      setError: (error: string | null) => set({ error }),
      clearBoard: () => set({ currentBoard: null })
    }),
    {
      name: 'board-store'
    }
  )
);