package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/konradk/parallettes/internal/db"
	"github.com/konradk/parallettes/internal/handler"
	"github.com/konradk/parallettes/internal/service"
)

//go:embed static
var staticFiles embed.FS

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/parallettes.db"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8787"
	}

	if err := os.MkdirAll(dbPath[:lastSlash(dbPath)], 0755); err != nil {
		log.Fatalf("create db dir: %v", err)
	}

	database, err := db.Open(dbPath)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer database.Close()

	svc := service.New(database)
	h := handler.New(svc)

	staticSub, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatalf("sub static fs: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/state", h.GetState)
	mux.HandleFunc("POST /api/log", h.LogResult)
	mux.HandleFunc("DELETE /api/state", h.ResetState)
	mux.HandleFunc("GET /api/daily", h.GetDailyLogs)
	mux.HandleFunc("POST /api/daily", h.AddDailyLog)
	mux.HandleFunc("DELETE /api/daily/{id}", h.DeleteDailyLog)
	mux.Handle("/", http.FileServer(http.FS(staticSub)))

	log.Printf("listening on :%s", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func lastSlash(s string) int {
	for i := len(s) - 1; i >= 0; i-- {
		if s[i] == '/' || s[i] == '\\' {
			return i
		}
	}
	return 0
}
