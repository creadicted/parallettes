package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

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

	svc := service.New(database)
	h := handler.New(svc, dbPath)

	staticSub, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatalf("sub static fs: %v", err)
	}

	mux := http.NewServeMux()

	// Players
	mux.HandleFunc("GET /api/players", h.GetPlayers)
	mux.HandleFunc("PUT /api/players/{id}", h.UpdatePlayer)

	// Workouts
	mux.HandleFunc("GET /api/workouts", h.GetWorkouts)
	mux.HandleFunc("POST /api/workouts", h.CreateWorkout)
	mux.HandleFunc("PUT /api/workouts/{id}", h.UpdateWorkout)
	mux.HandleFunc("DELETE /api/workouts/{id}", h.DeleteWorkout)

	// Daily logs (month before date to avoid routing ambiguity)
	mux.HandleFunc("GET /api/daily/month", h.GetMonthLogs)
	mux.HandleFunc("GET /api/daily", h.GetDailyLogs)
	mux.HandleFunc("POST /api/daily", h.AddDailyLog)
	mux.HandleFunc("DELETE /api/daily/{id}", h.DeleteDailyLog)

	// Challenges
	mux.HandleFunc("GET /api/challenges", h.GetChallenges)
	mux.HandleFunc("GET /api/challenges/active", h.GetActiveRun)
	mux.HandleFunc("GET /api/challenges/month", h.GetMonthChallengeRuns)
	mux.HandleFunc("POST /api/challenges/runs", h.StartRun)
	mux.HandleFunc("PUT /api/challenges/runs/{id}/complete", h.CompleteRun)
	mux.HandleFunc("DELETE /api/challenges/runs/{id}", h.CancelRun)

	// State / tracker
	mux.HandleFunc("GET /api/state", h.GetState)
	mux.HandleFunc("POST /api/log", h.LogResult)
	mux.HandleFunc("DELETE /api/state", h.ResetState)

	// DB export
	mux.HandleFunc("GET /api/db/export", h.ExportDB)

	mux.Handle("/", http.FileServer(http.FS(staticSub)))

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-quit
		if err := database.Close(); err != nil {
			log.Printf("db close: %v", err)
		}
		os.Exit(0)
	}()

	log.Printf("listening on :%s", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
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
