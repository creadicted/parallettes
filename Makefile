.DEFAULT_GOAL := help
.PHONY: help install dev dev-backend dev-frontend build docker-up docker-down purge fmt lint test

help:
	@echo ""
	@echo "  make install       Install frontend dependencies"
	@echo "  make dev           Run backend + frontend concurrently (dev mode)"
	@echo "  make dev-backend   Run Go backend only  → :8787"
	@echo "  make dev-frontend  Run Vite frontend only → :5173"
	@echo "  make build         Build frontend and embed into backend/static"
	@echo "  make fmt           Format Go source files"
	@echo "  make lint          Run go vet on the backend"
	@echo "  make test          Run backend tests"
	@echo "  make docker-up     Build image and start with Docker Compose (fallback to prebuilt image) → :8080"
	@echo "  make docker-down   Stop Docker Compose"
	@echo "  make purge         Delete the database; next backend start reseeds it"
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
	docker compose up --build || (echo "Local build failed, falling back to ghcr.io/creadicted/parallettes:latest" && docker compose pull parallettes && docker compose up --no-build)

docker-down:
	docker compose down

fmt:
	cd backend && go fmt ./...

lint:
	cd backend && go vet ./...

test:
	cd backend && go test ./...

purge:
	rm -f backend/data/parallettes.db
	@echo "Database deleted. Run 'make dev-backend' to reseed."
