// frontend/lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Auth methods
  async login(token: string): Promise<User> {
    const response = await this.post<User>('/api/auth/login', { token });
    localStorage.setItem('access_token', token);
    return response;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }

  async getCurrentUser(): Promise<User> {
    return this.get<User>('/api/auth/me');
  }

  // Board methods
  async getBoards(): Promise<Board[]> {
    return this.get<Board[]>('/api/boards');
  }

  async getBoard(id: string): Promise<BoardWithTasks> {
    return this.get<BoardWithTasks>(`/api/boards/${id}`);
  }

  async createBoard(data: CreateBoardData): Promise<Board> {
    return this.post<Board>('/api/boards', data);
  }

  async updateBoard(id: string, data: UpdateBoardData): Promise<Board> {
    return this.put<Board>(`/api/boards/${id}`, data);
  }

  async deleteBoard(id: string): Promise<void> {
    return this.delete(`/api/boards/${id}`);
  }

  // Task methods
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.board_id) params.append('board_id', filters.board_id);
    if (filters?.assignee_id) params.append('assignee_id', filters.assignee_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.sprint_id) params.append('sprint_id', filters.sprint_id);
    
    return this.get<Task[]>(`/api/tasks?${params.toString()}`);
  }

  async getTask(id: string): Promise<TaskWithDetails> {
    return this.get<TaskWithDetails>(`/api/tasks/${id}`);
  }

  async createTask(data: CreateTaskData): Promise<TaskWithDetails> {
    return this.post<TaskWithDetails>('/api/tasks', data);
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<TaskWithDetails> {
    return this.put<TaskWithDetails>(`/api/tasks/${id}`, data);
  }

  async moveTask(id: string, data: MoveTaskData): Promise<TaskWithDetails> {
    return this.post<TaskWithDetails>(`/api/tasks/${id}/move`, data);
  }

  async deleteTask(id: string): Promise<void> {
    return this.delete(`/api/tasks/${id}`);
  }

  // Team methods
  async getTeams(): Promise<Team[]> {
    return this.get<Team[]>('/api/teams');
  }

  async getTeam(id: string): Promise<TeamWithMembers> {
    return this.get<TeamWithMembers>(`/api/teams/${id}`);
  }

  async createTeam(data: CreateTeamData): Promise<Team> {
    return this.post<Team>('/api/teams', data);
  }

  async updateTeam(id: string, data: UpdateTeamData): Promise<Team> {
    return this.put<Team>(`/api/teams/${id}`, data);
  }

  async addTeamMember(teamId: string, data: AddTeamMemberData): Promise<void> {
    return this.post(`/api/teams/${teamId}/members`, data);
  }

  async updateTeamMember(teamId: string, userId: string, data: UpdateTeamMemberData): Promise<void> {
    return this.put(`/api/teams/${teamId}/members/${userId}`, data);
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    return this.delete(`/api/teams/${teamId}/members/${userId}`);
  }

  // Sprint methods
  async getSprints(teamId?: string): Promise<Sprint[]> {
    const params = teamId ? `?team_id=${teamId}` : '';
    return this.get<Sprint[]>(`/api/sprints${params}`);
  }

  async getSprint(id: string): Promise<SprintWithTasks> {
    return this.get<SprintWithTasks>(`/api/sprints/${id}`);
  }

  async createSprint(data: CreateSprintData): Promise<Sprint> {
    return this.post<Sprint>('/api/sprints', data);
  }

  async updateSprint(id: string, data: UpdateSprintData): Promise<Sprint> {
    return this.put<Sprint>(`/api/sprints/${id}`, data);
  }

  async deleteSprint(id: string): Promise<void> {
    return this.delete(`/api/sprints/${id}`);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Type definitions
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface TeamWithMembers extends Team {
  members: TeamMemberInfo[];
  member_count: number;
}

export interface TeamMemberInfo {
  id: string;
  user: User;
  role: 'admin' | 'editor' | 'viewer';
  joined_at: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  team_id: string;
  columns: BoardColumn[];
  created_at: string;
  updated_at?: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  order: number;
}

export interface BoardWithTasks extends Board {
  tasks: TaskWithDetails[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  task_type: 'task' | 'bug' | 'feature' | 'story';
  creator_id: string;
  board_id: string;
  assignee_id?: string;
  sprint_id?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags: string[];
  column_id: string;
  position: number;
  parent_task_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface TaskWithDetails extends Task {
  assignee?: User;
  creator: User;
  subtasks: TaskSummary[];
  comments_count: number;
  attachments_count: number;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id?: string;
  due_date?: string;
}

export interface Sprint {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  team_id: string;
  is_active: boolean;
  goal?: string;
  capacity?: number;
  created_at: string;
  updated_at?: string;
}

export interface SprintWithTasks extends Sprint {
  tasks: TaskSummary[];
  completed_tasks: number;
  total_tasks: number;
  completed_hours: number;
  total_hours: number;
}

// Request/Response types
export interface CreateBoardData {
  name: string;
  description?: string;
  team_id: string;
  columns?: BoardColumn[];
}

export interface UpdateBoardData {
  name?: string;
  description?: string;
  columns?: BoardColumn[];
}

export interface TaskFilters {
  board_id?: string;
  assignee_id?: string;
  status?: string;
  sprint_id?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  task_type?: 'task' | 'bug' | 'feature' | 'story';
  board_id: string;
  assignee_id?: string;
  parent_task_id?: string;
  due_date?: string;
  estimated_hours?: number;
  tags?: string[];
  column_id?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  task_type?: 'task' | 'bug' | 'feature' | 'story';
  assignee_id?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  column_id?: string;
  position?: number;
  sprint_id?: string;
}

export interface MoveTaskData {
  column_id: string;
  position: number;
  board_id?: string;
}

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
}

export interface AddTeamMemberData {
  user_email: string;
  role?: 'admin' | 'editor' | 'viewer';
}

export interface UpdateTeamMemberData {
  role: 'admin' | 'editor' | 'viewer';
}

export interface CreateSprintData {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  team_id: string;
  goal?: string;
  capacity?: number;
}

export interface UpdateSprintData {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  goal?: string;
  capacity?: number;
  is_active?: boolean;
}