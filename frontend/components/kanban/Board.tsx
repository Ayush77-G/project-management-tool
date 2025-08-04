import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, MoreHorizontal, User, Calendar, Tag, AlertCircle, GripVertical } from 'lucide-react';

// Types
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  assignee?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  due_date?: string;
  tags: string[];
  comments_count: number;
  attachments_count: number;
}

interface BoardColumn {
  id: string;
  name: string;
  order: number;
}

interface Board {
  id: string;
  name: string;
  columns: BoardColumn[];
  tasks: Task[];
}

// Mock data for demo
const mockBoard: Board = {
  id: '1',
  name: 'Development Sprint',
  columns: [
    { id: 'todo', name: 'To Do', order: 0 },
    { id: 'in_progress', name: 'In Progress', order: 1 },
    { id: 'review', name: 'Review', order: 2 },
    { id: 'done', name: 'Done', order: 3 }
  ],
  tasks: [
    {
      id: '1',
      title: 'Implement user authentication',
      description: 'Add Google OAuth integration',
      priority: 'high',
      status: 'todo',
      assignee: { id: '1', name: 'John Doe', avatar_url: '/api/placeholder/32/32' },
      due_date: '2024-12-15',
      tags: ['backend', 'auth'],
      comments_count: 3,
      attachments_count: 1
    },
    {
      id: '2', 
      title: 'Design kanban board UI',
      priority: 'medium',
      status: 'in_progress',
      assignee: { id: '2', name: 'Jane Smith' },
      tags: ['frontend', 'ui'],
      comments_count: 1,
      attachments_count: 0
    },
    {
      id: '3',
      title: 'Setup database schema',
      priority: 'urgent',
      status: 'review', 
      due_date: '2024-12-10',
      tags: ['database'],
      comments_count: 0,
      attachments_count: 2
    },
    {
      id: '4',
      title: 'Write API documentation',
      priority: 'low',
      status: 'done',
      assignee: { id: '1', name: 'John Doe', avatar_url: '/api/placeholder/32/32' },
      tags: ['docs'],
      comments_count: 2,
      attachments_count: 0
    }
  ]
};

// Priority colors
const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800', 
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const priorityIcons = {
  urgent: AlertCircle
};

// Task Card Component
const TaskCard: React.FC<{ 
  task: Task; 
  index: number; 
  onDragStart: (taskId: string, sourceColumn: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}> = ({ task, index, onDragStart, onDragEnd, isDragging }) => {
  const [draggedOver, setDraggedOver] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const PriorityIcon = priorityIcons[task.priority as keyof typeof priorityIcons];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.setData('application/json', JSON.stringify({
      taskId: task.id,
      sourceColumn: task.status,
      sourceIndex: index
    }));
    onDragStart(task.id, task.status);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    onDragEnd();
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-white rounded-lg border shadow-sm p-4 mb-3 cursor-move hover:shadow-md transition-all duration-200 ${
        isDragging ? 'opacity-50 transform rotate-2 scale-105 shadow-lg' : ''
      } ${draggedOver ? 'ring-2 ring-blue-300' : ''}`}
    >
      {/* Drag Handle */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1">
          <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">
            {task.title}
          </h3>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Task Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          {/* Priority */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {PriorityIcon && <PriorityIcon className="w-3 h-3 mr-1" />}
            {task.priority}
          </span>

          {/* Due Date */}
          {task.due_date && (
            <span className={`inline-flex items-center text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Assignee Avatar */}
          {task.assignee && (
            <div className="flex items-center">
              {task.assignee.avatar_url ? (
                <img
                  src={task.assignee.avatar_url}
                  alt={task.assignee.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-600" />
                </div>
              )}
            </div>
          )}

          {/* Comments/Attachments Count */}
          <div className="flex items-center space-x-1 text-gray-400">
            {task.comments_count > 0 && (
              <span className="text-xs">{task.comments_count} 💬</span>
            )}
            {task.attachments_count > 0 && (
              <span className="text-xs">{task.attachments_count} 📎</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Board Column Component
const BoardColumn: React.FC<{
  column: BoardColumn;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onTaskDrop: (taskId: string, sourceColumn: string, targetColumn: string, targetIndex: number) => void;
  draggedTaskId: string | null;
  onDragStart: (taskId: string, sourceColumn: string) => void;
  onDragEnd: () => void;
}> = ({ column, tasks, onAddTask, onTaskDrop, draggedTaskId, onDragStart, onDragEnd }) => {
  const [dragOver, setDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
    
    // Calculate drop position based on mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const cardHeight = 120; // Approximate card height
    const index = Math.floor(y / cardHeight);
    setDragOverIndex(Math.min(index, tasks.length));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set dragOver to false if we're actually leaving the column
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false);
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setDragOverIndex(null);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const { taskId, sourceColumn } = dragData;
      
      if (taskId && sourceColumn) {
        const dropIndex = dragOverIndex ?? tasks.length;
        onTaskDrop(taskId, sourceColumn, column.id, dropIndex);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-screen w-80 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="font-semibold text-gray-800">{column.name}</h2>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <Plus className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Droppable Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`min-h-full relative ${
          dragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''
        }`}
      >
        {/* Drop Indicator */}
        {dragOver && dragOverIndex !== null && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-blue-400 z-10"
            style={{ top: `${dragOverIndex * 120}px` }}
          />
        )}

        {/* Tasks */}
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggedTaskId === task.id}
          />
        ))}

        {/* Empty State */}
        {tasks.length === 0 && !dragOver && (
          <div className="text-center text-gray-400 mt-8">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs">Drag tasks here or click + to add</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Create Task Modal Component
const CreateTaskModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  onCreateTask: (task: Partial<Task>) => void;
}> = ({ isOpen, onClose, columnId, onCreateTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [tags, setTags] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    const newTask = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: columnId,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      comments_count: 0,
      attachments_count: 0
    };

    onCreateTask(newTask);
    
    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setTags('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tags separated by commas"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Kanban Board Component
const KanbanBoard: React.FC = () => {
  const [board, setBoard] = useState<Board>(mockBoard);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string>('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Group tasks by column
  const tasksByColumn = board.tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort tasks by position within each column
  Object.keys(tasksByColumn).forEach(columnId => {
    tasksByColumn[columnId].sort((a, b) => {
      // For demo purposes, we'll sort by creation order
      return new Date(a.id).getTime() - new Date(b.id).getTime();
    });
  });

  // Handle drag start
  const handleDragStart = useCallback((taskId: string, sourceColumn: string) => {
    setDraggedTaskId(taskId);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
  }, []);

  // Handle task drop
  const handleTaskDrop = useCallback((
    taskId: string, 
    sourceColumn: string, 
    targetColumn: string, 
    targetIndex: number
  ) => {
    if (sourceColumn === targetColumn) {
      // Reordering within same column
      setBoard(prevBoard => {
        const newTasks = [...prevBoard.tasks];
        const taskIndex = newTasks.findIndex(task => task.id === taskId);
        const task = newTasks[taskIndex];
        
        // Remove from current position
        newTasks.splice(taskIndex, 1);
        
        // Calculate new position in column
        const columnTasks = newTasks.filter(t => t.status === targetColumn);
        const insertIndex = newTasks.findIndex(t => t.status === targetColumn);
        const finalIndex = insertIndex + targetIndex;
        
        // Insert at new position
        newTasks.splice(finalIndex, 0, task);
        
        return {
          ...prevBoard,
          tasks: newTasks
        };
      });
    } else {
      // Moving between columns
      setBoard(prevBoard => {
        const newTasks = [...prevBoard.tasks];
        const taskIndex = newTasks.findIndex(task => task.id === taskId);
        const task = { ...newTasks[taskIndex] };
        
        // Update task status and column
        task.status = targetColumn;
        
        // Remove from current position
        newTasks.splice(taskIndex, 1);
        
        // Find insertion point in target column
        const targetColumnTasks = newTasks.filter(t => t.status === targetColumn);
        if (targetIndex >= targetColumnTasks.length) {
          // Add to end
          newTasks.push(task);
        } else {
          // Insert at specific position
          const insertIndex = newTasks.findIndex(t => t.status === targetColumn);
          newTasks.splice(insertIndex + targetIndex, 0, task);
        }
        
        return {
          ...prevBoard,
          tasks: newTasks
        };
      });
    }

    // Here you would typically make an API call to update the task position
    console.log('Task moved:', { 
      taskId, 
      from: sourceColumn, 
      to: targetColumn, 
      index: targetIndex 
    });
  }, []);

  // Handle add task
  const handleAddTask = (columnId: string) => {
    setCreateTaskColumnId(columnId);
    setIsCreateModalOpen(true);
  };

  // Handle create task
  const handleCreateTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now().toString(), // In real app, this would come from API
      title: taskData.title!,
      description: taskData.description,
      priority: taskData.priority!,
      status: createTaskColumnId,
      tags: taskData.tags || [],
      comments_count: 0,
      attachments_count: 0
    };

    setBoard(prevBoard => ({
      ...prevBoard,
      tasks: [...prevBoard.tasks, newTask]
    }));

    // Here you would make an API call to create the task
    console.log('Task created:', newTask);
  };

  return (
    <div className="h-screen bg-gray-100">
      {/* Board Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
            <p className="text-gray-600 mt-1">
              {board.tasks.length} tasks across {board.columns.length} columns
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => handleAddTask('todo')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex space-x-6 h-full">
          {board.columns
            .sort((a, b) => a.order - b.order)
            .map(column => (
              <BoardColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id] || []}
                onAddTask={handleAddTask}
                onTaskDrop={handleTaskDrop}
                draggedTaskId={draggedTaskId}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        columnId={createTaskColumnId}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
};

export default KanbanBoard;