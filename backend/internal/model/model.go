package model

import "time"

type Score struct {
	Him int `json:"him"`
	Her int `json:"her"`
}

type HistoryEntry struct {
	ID        int64     `json:"id"`
	Challenge string    `json:"challenge"`
	HimPct    float64   `json:"himPct"`
	HerPct    float64   `json:"herPct"`
	HimPts    int       `json:"himPts"`
	HerPts    int       `json:"herPts"`
	Result    string    `json:"result"`
	CreatedAt time.Time `json:"date"`
}

type State struct {
	Scores  Score          `json:"scores"`
	History []HistoryEntry `json:"history"`
}

type LogRequest struct {
	ChallengeID int     `json:"challengeId"`
	HimVal      float64 `json:"himVal"`
	HerVal      float64 `json:"herVal"`
	HimBase     float64 `json:"himBase"`
	HerBase     float64 `json:"herBase"`
}

type DailyLog struct {
	ID        int64  `json:"id"`
	Date      string `json:"date"`
	Person    string `json:"person"`
	Action    string `json:"action"`
	Count     int    `json:"count"`
	Unit      string `json:"unit"`
	CreatedAt string `json:"createdAt"`
}

type DailyLogRequest struct {
	Date   string `json:"date"`
	Person string `json:"person"`
	Action string `json:"action"`
	Count  int    `json:"count"`
	Unit   string `json:"unit"`
}
