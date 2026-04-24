package service

import (
	"fmt"
	"math"
	"strings"

	"github.com/konradk/parallettes/internal/db"
	"github.com/konradk/parallettes/internal/model"
)

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

func (s *Service) DBPath() string { return s.db.Path() }

func (s *Service) GetPlayers() ([]model.Player, error) {
	return s.db.GetPlayers()
}

func (s *Service) UpdatePlayer(id int64, name, color, initials string) (model.Player, error) {
	return s.db.UpdatePlayer(id, name, color, initials)
}

func (s *Service) GetWorkouts() ([]model.Workout, error) {
	return s.db.GetWorkouts()
}

func (s *Service) CreateWorkout(w model.Workout) (model.Workout, error) {
	return s.db.CreateWorkout(w)
}

func (s *Service) UpdateWorkout(id int64, w model.Workout) (model.Workout, error) {
	return s.db.UpdateWorkout(id, w)
}

func (s *Service) DeleteWorkout(id int64) error {
	return s.db.DeleteWorkout(id)
}

func (s *Service) GetState() (model.State, error) {
	return s.db.GetState()
}

func (s *Service) Log(req model.LogRequest) (model.State, error) {
	var challenge struct{ ID int; Title, Unit string }
	for _, c := range challenges {
		if c.ID == req.ChallengeID {
			challenge = struct{ ID int; Title, Unit string }{c.ID, c.Title, c.Unit}
			break
		}
	}
	if challenge.ID == 0 {
		return model.State{}, fmt.Errorf("unknown challenge id %d", req.ChallengeID)
	}

	p1Pct, p2Pct, p1Pts, p2Pts, result := computeResult(
		challenge.Unit,
		req.P1Val, req.P2Val,
		req.P1Base, req.P2Base,
	)

	state, err := s.db.GetState()
	if err != nil {
		return model.State{}, err
	}

	newScores := make([]model.PlayerScore, len(state.Scores))
	for i, ps := range state.Scores {
		newScores[i] = ps
		switch ps.PlayerID {
		case 1:
			newScores[i].Points += p1Pts
		case 2:
			newScores[i].Points += p2Pts
		}
	}

	entry := model.HistoryEntry{
		Challenge: challenge.Title,
		P1Pct:     math.Round(p1Pct*10) / 10,
		P2Pct:     math.Round(p2Pct*10) / 10,
		P1Pts:     p1Pts,
		P2Pts:     p2Pts,
		Result:    result,
	}

	if err := s.db.LogEntry(entry, newScores); err != nil {
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

func (s *Service) GetMonthLogs(year, month int) (map[string][]int64, error) {
	return s.db.GetMonthLogs(year, month)
}

func (s *Service) Reset() (model.State, error) {
	if err := s.db.Reset(); err != nil {
		return model.State{}, err
	}
	return s.db.GetState()
}

func computeResult(unit string, p1Val, p2Val, p1Base, p2Base float64) (p1Pct, p2Pct float64, p1Pts, p2Pts int, result string) {
	p1Pct = (p1Val - p1Base) / p1Base * 100
	p2Pct = (p2Val - p2Base) / p2Base * 100

	if strings.Contains(unit, "lower") {
		p1Pct = (p1Base - p1Val) / p1Base * 100
		p2Pct = (p2Base - p2Val) / p2Base * 100
	}

	diff := math.Abs(p1Pct - p2Pct)
	switch {
	case diff <= 5:
		return p1Pct, p2Pct, 1, 1, "🤝 Tie!"
	case p1Pct > p2Pct:
		return p1Pct, p2Pct, 3, 0, "💙 Player 1 wins!"
	default:
		return p1Pct, p2Pct, 0, 3, "💗 Player 2 wins!"
	}
}
