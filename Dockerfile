# Stage 1: build the React frontend
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: build the Go binary (with frontend embedded)
FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
COPY --from=frontend /app/dist ./static
RUN go build -o parallettes ./main.go

# Stage 3: minimal runtime image
FROM alpine:latest
WORKDIR /app
COPY --from=backend /app/parallettes .
EXPOSE 3000
CMD ["./parallettes"]
