.PHONY: help build up down logs shell test clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@egrep '^(.+)\:\ ##\ (.+)' $(MAKEFILE_LIST) | column -t -c 2 -s ':#'

build: ## Build all services
	docker-compose build

up: ## Start all services
	docker-compose up -d

up-dev: ## Start all services in development mode
	docker-compose -f docker-compose.dev.yml up -d

down: ## Stop all services
	docker-compose down

down-dev: ## Stop development services
	docker-compose -f docker-compose.dev.yml down

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

shell-backend: ## Open shell in backend container
	docker-compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U projectuser -d projectdb

test: ## Run backend tests
	docker-compose exec backend pytest

test-coverage: ## Run tests with coverage
	docker-compose exec backend pytest --cov=app --cov-report=html

migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

migrate-create: ## Create new migration (usage: make migrate-create name="migration_name")
	docker-compose exec backend alembic revision --autogenerate -m "$(name)"

seed: ## Seed database with sample data
	docker-compose exec backend python -m app.seed_data

clean: ## Clean up containers, volumes, and images
	docker-compose down -v
	docker system prune -af

restart: ## Restart all services
	docker-compose restart

restart-backend: ## Restart backend service
	docker-compose restart backend

restart-frontend: ## Restart frontend service
	docker-compose restart frontend

install: ## Install dependencies and setup project
	@echo "Setting up project..."
	@cp .env.example .env
	@echo "Please edit .env file with your configuration"
	@echo "Then run: make up-dev"