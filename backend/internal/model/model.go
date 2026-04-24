package model

import "time"

type Player struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Color    string `json:"color"`
	Initials string `json:"initials"`
}

type PlayerScore struct {
	PlayerID int64 `json:"playerId"`
	Points   int   `json:"points"`
}

type HistoryEntry struct {
	ID        int64     `json:"id"`
	Challenge string    `json:"challenge"`
	P1Pct     float64   `json:"p1Pct"`
	P2Pct     float64   `json:"p2Pct"`
	P1Pts     int       `json:"p1Pts"`
	P2Pts     int       `json:"p2Pts"`
	Result    string    `json:"result"`
	CreatedAt time.Time `json:"date"`
}

type State struct {
	Scores  []PlayerScore  `json:"scores"`
	History []HistoryEntry `json:"history"`
}

type LogRequest struct {
	ChallengeID int     `json:"challengeId"`
	P1Val       float64 `json:"p1Val"`
	P2Val       float64 `json:"p2Val"`
	P1Base      float64 `json:"p1Base"`
	P2Base      float64 `json:"p2Base"`
}

type WorkoutTag struct {
	Label string `json:"label"`
	Cls   string `json:"cls"`
}

type Workout struct {
	ID           int64        `json:"id"`
	Icon         string       `json:"icon"`
	Name         string       `json:"name"`
	GroupLabel   string       `json:"groupLabel"`
	Tags         []WorkoutTag `json:"tags"`
	Desc         string       `json:"desc"`
	Steps        []string     `json:"steps"`
	Sets         string       `json:"sets"`
	Unit         string       `json:"unit"`
	DefaultCount int          `json:"defaultCount"`
}

type DailyLog struct {
	ID          int64  `json:"id"`
	Date        string `json:"date"`
	PlayerID    int64  `json:"playerId"`
	WorkoutID   int64  `json:"workoutId"`
	WorkoutName string `json:"workoutName"`
	Count       int    `json:"count"`
	Unit        string `json:"unit"`
	CreatedAt   string `json:"createdAt"`
}

type DailyLogRequest struct {
	Date      string `json:"date"`
	PlayerID  int64  `json:"playerId"`
	WorkoutID int64  `json:"workoutId"`
	Count     int    `json:"count"`
}
