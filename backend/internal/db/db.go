package db

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/konradk/parallettes/internal/model"
	_ "modernc.org/sqlite"
)

type DB struct {
	conn *sql.DB
}

func Open(path string) (*DB, error) {
	conn, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	conn.SetMaxOpenConns(1)
	d := &DB{conn: conn}
	if err := d.migrate(); err != nil {
		return nil, err
	}
	return d, nil
}

func (d *DB) Close() error { return d.conn.Close() }

func (d *DB) migrate() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS scores (
			id  INTEGER PRIMARY KEY,
			him INTEGER NOT NULL DEFAULT 0,
			her INTEGER NOT NULL DEFAULT 0
		)`,
		`INSERT OR IGNORE INTO scores (id, him, her) VALUES (1, 0, 0)`,
		`CREATE TABLE IF NOT EXISTS history_entries (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			challenge  TEXT    NOT NULL,
			him_pct    REAL    NOT NULL,
			her_pct    REAL    NOT NULL,
			him_pts    INTEGER NOT NULL,
			her_pts    INTEGER NOT NULL,
			result     TEXT    NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS daily_logs (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			date       TEXT    NOT NULL,
			person     TEXT    NOT NULL DEFAULT 'him',
			action     TEXT    NOT NULL,
			count      INTEGER NOT NULL,
			unit       TEXT    NOT NULL DEFAULT 'reps',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
	}
	for _, stmt := range stmts {
		if _, err := d.conn.Exec(stmt); err != nil {
			return err
		}
	}
	// Migrate existing databases that predate the person column.
	if _, err := d.conn.Exec(`ALTER TABLE daily_logs ADD COLUMN person TEXT NOT NULL DEFAULT 'him'`); err != nil {
		if !strings.Contains(err.Error(), "duplicate column name") {
			return fmt.Errorf("migrate daily_logs.person: %w", err)
		}
	}
	return nil
}

func (d *DB) GetState() (model.State, error) {
	var s model.State

	row := d.conn.QueryRow(`SELECT him, her FROM scores WHERE id = 1`)
	if err := row.Scan(&s.Scores.Him, &s.Scores.Her); err != nil {
		return s, fmt.Errorf("get scores: %w", err)
	}

	rows, err := d.conn.Query(`
		SELECT id, challenge, him_pct, her_pct, him_pts, her_pts, result, created_at
		FROM history_entries ORDER BY id DESC
	`)
	if err != nil {
		return s, fmt.Errorf("get history: %w", err)
	}
	defer rows.Close()

	s.History = []model.HistoryEntry{}
	for rows.Next() {
		var e model.HistoryEntry
		var createdAt string
		if err := rows.Scan(&e.ID, &e.Challenge, &e.HimPct, &e.HerPct, &e.HimPts, &e.HerPts, &e.Result, &createdAt); err != nil {
			return s, fmt.Errorf("scan history row: %w", err)
		}
		e.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		s.History = append(s.History, e)
	}
	return s, rows.Err()
}

func (d *DB) LogEntry(entry model.HistoryEntry, score model.Score) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		`INSERT INTO history_entries (challenge, him_pct, her_pct, him_pts, her_pts, result) VALUES (?,?,?,?,?,?)`,
		entry.Challenge, entry.HimPct, entry.HerPct, entry.HimPts, entry.HerPts, entry.Result,
	)
	if err != nil {
		return fmt.Errorf("insert history: %w", err)
	}

	_, err = tx.Exec(`UPDATE scores SET him = ?, her = ? WHERE id = 1`, score.Him, score.Her)
	if err != nil {
		return fmt.Errorf("update scores: %w", err)
	}

	return tx.Commit()
}

func (d *DB) GetDailyLogs(date string) ([]model.DailyLog, error) {
	rows, err := d.conn.Query(
		`SELECT id, date, person, action, count, unit, created_at FROM daily_logs WHERE date = ? ORDER BY id DESC`,
		date,
	)
	if err != nil {
		return nil, fmt.Errorf("get daily logs: %w", err)
	}
	defer rows.Close()

	logs := []model.DailyLog{}
	for rows.Next() {
		var l model.DailyLog
		if err := rows.Scan(&l.ID, &l.Date, &l.Person, &l.Action, &l.Count, &l.Unit, &l.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan daily log: %w", err)
		}
		logs = append(logs, l)
	}
	return logs, rows.Err()
}

func (d *DB) AddDailyLog(req model.DailyLogRequest) (model.DailyLog, error) {
	res, err := d.conn.Exec(
		`INSERT INTO daily_logs (date, person, action, count, unit) VALUES (?, ?, ?, ?, ?)`,
		req.Date, req.Person, req.Action, req.Count, req.Unit,
	)
	if err != nil {
		return model.DailyLog{}, fmt.Errorf("insert daily log: %w", err)
	}
	id, _ := res.LastInsertId()

	var l model.DailyLog
	row := d.conn.QueryRow(`SELECT id, date, person, action, count, unit, created_at FROM daily_logs WHERE id = ?`, id)
	err = row.Scan(&l.ID, &l.Date, &l.Person, &l.Action, &l.Count, &l.Unit, &l.CreatedAt)
	return l, err
}

func (d *DB) DeleteDailyLog(id int64) error {
	_, err := d.conn.Exec(`DELETE FROM daily_logs WHERE id = ?`, id)
	return err
}

func (d *DB) Reset() error {
	for _, stmt := range []string{
		`DELETE FROM history_entries`,
		`UPDATE scores SET him = 0, her = 0 WHERE id = 1`,
	} {
		if _, err := d.conn.Exec(stmt); err != nil {
			return err
		}
	}
	return nil
}
