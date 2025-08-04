# README.md
# Self-Hosted Project Management Tool

A comprehensive, self-hosted project management tool built with Next.js, FastAPI, and PostgreSQL. Features include Kanban boards, task management, sprint planning, team collaboration, and real-time updates.

## Features

### ✅ Phase 1 (MVP)
- **Task & Issue Management**: Create, assign, and track tasks with priorities, tags, and due dates
- **Kanban Boards**: Drag-and-drop interface with customizable columns
- **Real-time Updates**: WebSocket integration for live collaboration
- **Team Management**: Role-based access control (Admin, Editor, Viewer)
- **Authentication**: Google OAuth integration

### 🚧 Phase 2 (In Progress)
- **Sprint Management**: Plan and track sprints with velocity charts
- **Advanced Filtering**: Filter tasks by multiple criteria
- **File Attachments**: Upload and manage task attachments
- **Comments & Discussion**: Task-level commenting system

### 📋 Phase 3 (Planned)
- **Documentation Wiki**: Markdown-based internal documentation
- **Notifications**: In-app and email notifications
- **Slack Integration**: Task updates and notifications
- **Reporting**: Burndown charts and team metrics

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Real-time**: WebSocket + Redis
- **Authentication**: NextAuth.js + Google OAuth
- **State Management**: Zustand
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Google Cloud Console account (for OAuth)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-management-tool
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Configure Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Secret to `.env`

4. **Start the application**
   ```bash
   # Development mode
   make up-dev

   # Or production mode
   make up
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/docs

### Development Commands

```bash
# Start development environment
make up-dev

# View logs
make logs

# Run tests
make test

# Access database shell
make shell-db

# Create database migration
make migrate-create name="add_new_feature"

# Run migrations
make migrate

# Restart services
make restart

# Clean up everything
make clean
```

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │    │   FastAPI API   │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ - React Components │◄──►│ - REST Endpoints │◄──►│ - Task Data     │
│ - Zustand Store │    │ - WebSocket     │    │ - User Data     │
│ - Tailwind CSS  │    │ - Authentication│    │ - Team Data     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐             │
         │              │     Redis       │             │
         └──────────────►│                 │◄────────────┘
                        │ - Sessions      │
                        │ - Cache         │
                        │ - WebSocket     │
                        └─────────────────┘
```

## Project Structure

```
project-management-tool/
├── frontend/                    # Next.js application
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities and stores
│   └── hooks/                  # Custom React hooks
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── api/               # API routes
│   │   └── services/          # Business logic
│   └── alembic/               # Database migrations
├── docker-compose.yml         # Production setup
├── docker-compose.dev.yml     # Development setup
└── README.md
```

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

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Authentication  
SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Optional
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API and Google OAuth2 API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to your `.env` file

## Deployment

### Production Deployment

1. **Prepare production environment**
   ```bash
   # Copy and edit environment file
   cp .env.example .env.production
   # Edit with production values
   ```

2. **Deploy with Docker Compose**
   ```bash
   # Build and start
   docker-compose -f docker-compose.yml up -d

   # Run database migrations
   make migrate

   # Check status
   docker-compose ps
   ```

3. **SSL/Domain Setup**
   - Use nginx or Caddy as reverse proxy
   - Configure SSL certificates (Let's Encrypt recommended)
   - Update CORS origins and OAuth redirect URIs

### Cloud Deployment Options

- **DigitalOcean App Platform**: Deploy directly from Git
- **AWS**: Use ECS/Fargate with RDS and ElastiCache
- **Google Cloud**: Cloud Run with Cloud SQL and Memorystore
- **Self-hosted**: Any VPS with Docker support

## Development

### Adding New Features

1. **Backend (API endpoint)**
   ```bash
   # Create new model
   # Edit: backend/app/models/your_model.py
   
   # Create migration
   make migrate-create name="add_your_feature"
   
   # Create schema
   # Edit: backend/app/schemas/your_schema.py
   
   # Create API route
   # Edit: backend/app/api/your_route.py
   
   # Add to main router
   # Edit: backend/app/main.py
   ```

2. **Frontend (React component)**
   ```bash
   # Create component
   # Edit: frontend/components/your-feature/YourComponent.tsx
   
   # Add to store if needed
   # Edit: frontend/lib/store/useYourStore.ts
   
   # Create page/route
   # Edit: frontend/app/your-feature/page.tsx
   ```

3. **Database changes**
   ```bash
   # Always create migrations for schema changes
   make migrate-create name="descriptive_name"
   
   # Review generated migration
   # Edit: backend/alembic/versions/xxx_descriptive_name.py
   
   # Apply migration
   make migrate
   ```

### Testing

```bash
# Backend tests
make test

# With coverage
make test-coverage

# Frontend tests (add to package.json)
cd frontend && npm test
```

### Code Quality

```bash
# Backend linting
docker-compose exec backend black .
docker-compose exec backend flake8
docker-compose exec backend mypy .

# Frontend linting
cd frontend && npm run lint
cd frontend && npm run type-check
```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check logs
   make logs-backend
   
   # Reset database
   docker-compose down -v
   make up-dev
   ```

2. **WebSocket connection issues**
   ```bash
   # Check Redis
   docker-compose ps redis
   
   # Test Redis connection
   docker-compose exec redis redis-cli ping
   ```

3. **OAuth not working**
   - Verify Google OAuth credentials in `.env`
   - Check redirect URIs in Google Cloud Console
   - Ensure NEXTAUTH_URL matches your domain

4. **Frontend build errors**
   ```bash
   # Clear Next.js cache
   cd frontend && rm -rf .next
   
   # Reinstall dependencies
   cd frontend && rm -rf node_modules package-lock.json
   cd frontend && npm install
   ```

### Performance Optimization

1. **Database**
   - Add indexes for frequently queried fields
   - Use database connection pooling
   - Consider read replicas for large deployments

2. **Caching**
   - Redis for session storage and API caching
   - CDN for static assets
   - Browser caching headers

3. **Frontend**
   - Image optimization with Next.js
   - Code splitting and lazy loading
   - Service worker for offline support

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes and add tests
4. Run tests: `make test`
5. Commit changes: `git commit -m "Add your feature"`
6. Push to branch: `git push origin feature/your-feature`
7. Create Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check this README and API docs
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: [Your support email]

---

Built with ❤️ using modern web technologies. Perfect for teams who want full control over their project management data.