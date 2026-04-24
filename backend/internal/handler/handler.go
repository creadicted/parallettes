package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/konradk/parallettes/internal/model"
	"github.com/konradk/parallettes/internal/service"
)

type Handler struct {
	svc *service.Service
}

func New(svc *service.Service) *Handler { return &Handler{svc: svc} }

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

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
