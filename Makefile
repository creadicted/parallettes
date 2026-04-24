.DEFAULT_GOAL := help
.PHONY: help install dev dev-backend dev-frontend build docker-up docker-down

help:
	@echo ""
	@echo "  make install       Install frontend dependencies"
	@echo "  make dev           Run backend + frontend concurrently (dev mode)"
	@echo "  make dev-backend   Run Go backend only  → :3000"
	@echo "  make dev-frontend  Run Vite frontend only → :5173"
	@echo "  make build         Build frontend and embed into backend/static"
	@echo "  make docker-up     Build image and start with Docker Compose → :8080"
	@echo "  make docker-down   Stop Docker Compose"
	@echo ""

install:
	cd frontend && npm install

dev:
	$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	cd backend && go run main.go

dev-frontend:
	cd frontend && npm run dev

build:
	cd frontend && npm run build
	rm -rf backend/static
	cp -r frontend/dist backend/static

docker-up:
	docker compose up --build

docker-down:
	docker compose down
