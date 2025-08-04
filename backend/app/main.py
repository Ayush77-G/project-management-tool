from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.orm import Session
import uvicorn

from .database import engine, get_db
from .models import Base
from .api import auth, users, boards, tasks, teams, sprints
from .core.websocket import websocket_manager
from .config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Project Management API",
    description="A comprehensive project management tool API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# WebSocket endpoint
@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket, token: str):
    await websocket_manager.connect(websocket, token)

# API Routes
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(boards.router, prefix="/api/boards", tags=["boards"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(sprints.router, prefix="/api/sprints", tags=["sprints"])

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)