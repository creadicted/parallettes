package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strconv"

	"github.com/konradk/parallettes/internal/model"
	"github.com/konradk/parallettes/internal/service"
)

type Handler struct {
	svc    *service.Service
	dbPath string
}

func New(svc *service.Service, dbPath string) *Handler {
	return &Handler{svc: svc, dbPath: dbPath}
}

// Players

func (h *Handler) GetPlayers(w http.ResponseWriter, r *http.Request) {
	players, err := h.svc.GetPlayers()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, players)
}

func (h *Handler) UpdatePlayer(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var req struct {
		Name     string `json:"name"`
		Color    string `json:"color"`
		Initials string `json:"initials"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	player, err := h.svc.UpdatePlayer(id, req.Name, req.Color, req.Initials)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, player)
}

// Workouts

func (h *Handler) GetWorkouts(w http.ResponseWriter, r *http.Request) {
	workouts, err := h.svc.GetWorkouts()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, workouts)
}

func (h *Handler) CreateWorkout(w http.ResponseWriter, r *http.Request) {
	var req model.Workout
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	workout, err := h.svc.CreateWorkout(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	writeJSON(w, workout)
}

func (h *Handler) UpdateWorkout(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var req model.Workout
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	workout, err := h.svc.UpdateWorkout(id, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, workout)
}

func (h *Handler) DeleteWorkout(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	if err := h.svc.DeleteWorkout(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// State

func (h *Handler) GetState(w http.ResponseWriter, r *http.Request) {
	state, err := h.svc.GetState()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, state)
}

func (h *Handler) LogResult(w http.ResponseWriter, r *http.Request) {
	var req model.LogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	state, err := h.svc.Log(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, state)
}

func (h *Handler) ResetState(w http.ResponseWriter, r *http.Request) {
	state, err := h.svc.Reset()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, state)
}

// Daily logs

func (h *Handler) GetDailyLogs(w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	if date == "" {
		http.Error(w, "date query param required (YYYY-MM-DD)", http.StatusBadRequest)
		return
	}
	logs, err := h.svc.GetDailyLogs(date)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, logs)
}

func (h *Handler) AddDailyLog(w http.ResponseWriter, r *http.Request) {
	var req model.DailyLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	logs, err := h.svc.AddDailyLog(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, logs)
}

func (h *Handler) DeleteDailyLog(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	date := r.URL.Query().Get("date")
	if date == "" {
		http.Error(w, "date query param required", http.StatusBadRequest)
		return
	}
	logs, err := h.svc.DeleteDailyLog(id, date)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, logs)
}

func (h *Handler) GetMonthLogs(w http.ResponseWriter, r *http.Request) {
	yearStr := r.URL.Query().Get("year")
	monthStr := r.URL.Query().Get("month")
	year, err1 := strconv.Atoi(yearStr)
	month, err2 := strconv.Atoi(monthStr)
	if err1 != nil || err2 != nil || month < 1 || month > 12 {
		http.Error(w, "year and month query params required", http.StatusBadRequest)
		return
	}
	result, err := h.svc.GetMonthLogs(year, month)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, result)
}

// Challenges

func (h *Handler) GetChallenges(w http.ResponseWriter, r *http.Request) {
	cs, err := h.svc.GetChallenges()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, cs)
}

func (h *Handler) GetActiveRun(w http.ResponseWriter, r *http.Request) {
	run, err := h.svc.GetActiveRun()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, run)
}

func (h *Handler) StartRun(w http.ResponseWriter, r *http.Request) {
	var req model.StartRunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	run, err := h.svc.StartRun(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	writeJSON(w, run)
}

func (h *Handler) CompleteRun(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	if err := h.svc.CompleteRun(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CancelRun(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	if err := h.svc.CancelRun(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) GetMonthChallengeRuns(w http.ResponseWriter, r *http.Request) {
	yearStr := r.URL.Query().Get("year")
	monthStr := r.URL.Query().Get("month")
	year, err1 := strconv.Atoi(yearStr)
	month, err2 := strconv.Atoi(monthStr)
	if err1 != nil || err2 != nil || month < 1 || month > 12 {
		http.Error(w, "year and month query params required", http.StatusBadRequest)
		return
	}
	runs, err := h.svc.GetMonthChallengeRuns(year, month)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, runs)
}

// DB export

func (h *Handler) ExportDB(w http.ResponseWriter, r *http.Request) {
	f, err := os.Open(h.dbPath)
	if err != nil {
		http.Error(w, "cannot open db", http.StatusInternalServerError)
		return
	}
	defer f.Close()
	w.Header().Set("Content-Disposition", `attachment; filename="parallettes.db"`)
	w.Header().Set("Content-Type", "application/octet-stream")
	io.Copy(w, f)
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
