package service

import (
	"fmt"
	"math"
	"strings"

	"github.com/konradk/parallettes/internal/db"
	"github.com/konradk/parallettes/internal/model"
)

// challenges mirrors the static data from the frontend (id is 1-based).
var challenges = []struct {
	ID    int
	Title string
	Unit  string
}{
	{1, "Push-Up Percentage Race", "reps"},
	{2, "L-Sit Survival", "seconds"},
	{3, "30-Day Push-Up Calendar", "days completed"},
	{4, "Dip-Off", "reps"},
	{5, "The Plank-Off", "seconds"},
	{6, "Speed Circuit Sprint", "seconds (lower = better)"},
	{7, "Weekly Skill Unlock", "skill achieved (yes/no)"},
	{8, "Couple's EMOM", "rounds survived"},
}

type Service struct {
	db *db.DB
}

func New(db *db.DB) *Service { return &Service{db: db} }

func (s *Service) GetState() (model.State, error) {
	return s.db.GetState()
}

func (s *Service) Log(req model.LogRequest) (model.State, error) {
	var challenge struct{ ID int; Title, Unit string }
	for _, c := range challenges {
		if c.ID == req.ChallengeID {
			challenge.ID = c.ID
			challenge.Title = c.Title
			challenge.Unit = c.Unit
			break
		}
	}
	if challenge.ID == 0 {
		return model.State{}, fmt.Errorf("unknown challenge id %d", req.ChallengeID)
	}

	himPct, herPct, himPts, herPts, result := computeResult(
		challenge.Unit,
		req.HimVal, req.HerVal,
		req.HimBase, req.HerBase,
	)

	state, err := s.db.GetState()
	if err != nil {
		return model.State{}, err
	}

	newScore := model.Score{
		Him: state.Scores.Him + himPts,
		Her: state.Scores.Her + herPts,
	}

	entry := model.HistoryEntry{
		Challenge: challenge.Title,
		HimPct:    math.Round(himPct*10) / 10,
		HerPct:    math.Round(herPct*10) / 10,
		HimPts:    himPts,
		HerPts:    herPts,
		Result:    result,
	}

	if err := s.db.LogEntry(entry, newScore); err != nil {
		return model.State{}, err
	}

	return s.db.GetState()
}

func (s *Service) GetDailyLogs(date string) ([]model.DailyLog, error) {
	return s.db.GetDailyLogs(date)
}

func (s *Service) AddDailyLog(req model.DailyLogRequest) ([]model.DailyLog, error) {
	if _, err := s.db.AddDailyLog(req); err != nil {
		return nil, err
	}
	return s.db.GetDailyLogs(req.Date)
}

func (s *Service) DeleteDailyLog(id int64, date string) ([]model.DailyLog, error) {
	if err := s.db.DeleteDailyLog(id); err != nil {
		return nil, err
	}
	return s.db.GetDailyLogs(date)
}

func (s *Service) Reset() (model.State, error) {
	if err := s.db.Reset(); err != nil {
		return model.State{}, err
	}
	return s.db.GetState()
}

func computeResult(unit string, himVal, herVal, himBase, herBase float64) (himPct, herPct float64, himPts, herPts int, result string) {
	himPct = (himVal - himBase) / himBase * 100
	herPct = (herVal - herBase) / herBase * 100

	// time-based challenges: lower is better, so invert
	if strings.Contains(unit, "lower") {
		himPct = (himBase - himVal) / himBase * 100
		herPct = (herBase - herVal) / herBase * 100
	}

	diff := math.Abs(himPct - herPct)
	switch {
	case diff <= 5:
		return himPct, herPct, 1, 1, "🤝 Tie!"
	case himPct > herPct:
		return himPct, herPct, 3, 0, "💙 Him wins!"
	default:
		return himPct, herPct, 0, 3, "💗 Her wins!"
	}
}
