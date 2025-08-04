## API Documentation

The API is automatically documented using FastAPI's built-in OpenAPI support. Once the backend is running, visit:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Key Endpoints

```
Authentication:
POST   /api/auth/login          # Login with Google OAuth
GET    /api/auth/me             # Get current user
POST   /api/auth/logout         # Logout

Teams:
GET    /api/teams               # List user's teams
POST   /api/teams               # Create team
GET    /api/teams/{id}          # Get team details
PUT    /api/teams/{id}          # Update team
DELETE /api/teams/{id}          # Delete team

Boards:
GET    /api/boards              # List team's boards
POST   /api/boards              # Create board
GET    /api/boards/{id}         # Get board with tasks
PUT    /api/boards/{id}         # Update board
DELETE /api/boards/{id}         # Delete board

Tasks:
GET    /api/tasks               # List tasks (with filters)
POST   /api/tasks               # Create task
GET    /api/tasks/{id}          # Get task details
PUT    /api/tasks/{id}          # Update task
POST   /api/tasks/{id}/move     # Move task (drag & drop)
DELETE /api/tasks/{id}          # Delete task

Sprints:
GET    /api/sprints             # List sprints
POST   /api/sprints             # Create sprint
GET    /api/sprints/{id}        # Get sprint with tasks
PUT    /api/sprints/{id}        # Update sprint
DELETE /api/sprints/{id}        # Delete sprint
```

## Database Schema

### Core Tables

```sql
-- Users and authentication
users (id, email, name, avatar_url, google_id, is_active, created_at, updated_at)

-- Team management
teams (id, name, description, created_at, updated_at)
team_members (id, user_id, team_id, role, created_at, updated_at)

-- Board and task management
boards (id, name, description, team_id, columns, created_at, updated_at)
tasks (id, title, description, status, priority, task_type, creator_id, 
       board_id, assignee_id, sprint_id, due_date, estimated_hours, 
       actual_hours, tags, column_id, position, parent_task_id, 
       created_at, updated_at)

-- Sprint management
sprints (id, name, description, start_date, end_date, team_id, 
         is_active, goal, capacity, created_at, updated_at)

-- Comments and attachments
comments (id, content, task_id, author_id, created_at, updated_at)
attachments (id, filename, original_filename, file_path, file_size, 
            mime_type, task_id, uploaded_by_id, created_at, updated_at)
```
