package db

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/konradk/parallettes/internal/model"
	_ "modernc.org/sqlite"
)

type DB struct {
	conn *sql.DB
	path string
}

func Open(path string) (*DB, error) {
	conn, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	conn.SetMaxOpenConns(1)
	conn.SetMaxIdleConns(1)
	conn.SetConnMaxLifetime(0)
	if _, err := conn.Exec(`PRAGMA journal_mode=WAL`); err != nil {
		return nil, fmt.Errorf("set WAL mode: %w", err)
	}
	if _, err := conn.Exec(`PRAGMA busy_timeout=5000`); err != nil {
		return nil, fmt.Errorf("set busy_timeout: %w", err)
	}
	d := &DB{conn: conn, path: path}
	if err := d.migrate(); err != nil {
		return nil, err
	}
	return d, nil
}

func (d *DB) Close() error {
	d.conn.Exec(`PRAGMA wal_checkpoint(TRUNCATE)`)
	return d.conn.Close()
}
func (d *DB) Path() string { return d.path }

func (d *DB) migrate() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)`,
		`CREATE TABLE IF NOT EXISTS players (
			id       INTEGER PRIMARY KEY,
			name     TEXT NOT NULL,
			color    TEXT NOT NULL,
			initials TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS player_scores (
			player_id INTEGER PRIMARY KEY REFERENCES players(id),
			points    INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS history_entries (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			challenge  TEXT    NOT NULL,
			p1_pct     REAL    NOT NULL,
			p2_pct     REAL    NOT NULL,
			p1_pts     INTEGER NOT NULL,
			p2_pts     INTEGER NOT NULL,
			result     TEXT    NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS workouts (
			id            INTEGER PRIMARY KEY AUTOINCREMENT,
			icon          TEXT NOT NULL DEFAULT '',
			name          TEXT NOT NULL,
			group_label   TEXT NOT NULL DEFAULT '',
			tags          TEXT NOT NULL DEFAULT '[]',
			description   TEXT NOT NULL DEFAULT '',
			steps         TEXT NOT NULL DEFAULT '[]',
			sets          TEXT NOT NULL DEFAULT '',
			unit          TEXT NOT NULL DEFAULT 'reps',
			default_count INTEGER NOT NULL DEFAULT 10
		)`,
		`CREATE TABLE IF NOT EXISTS daily_logs (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			date       TEXT    NOT NULL,
			player_id  INTEGER NOT NULL DEFAULT 1 REFERENCES players(id),
			workout_id INTEGER REFERENCES workouts(id),
			count      INTEGER NOT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS challenges (
			id                INTEGER PRIMARY KEY AUTOINCREMENT,
			title             TEXT NOT NULL,
			type              TEXT NOT NULL,
			type_label        TEXT NOT NULL,
			description       TEXT NOT NULL DEFAULT '',
			him_note          TEXT NOT NULL DEFAULT '',
			her_note          TEXT NOT NULL DEFAULT '',
			win_rule          TEXT NOT NULL DEFAULT '',
			unit              TEXT NOT NULL DEFAULT '',
			duration_days     INTEGER NOT NULL DEFAULT 30,
			linked_workout_id INTEGER REFERENCES workouts(id)
		)`,
		`CREATE TABLE IF NOT EXISTS challenge_runs (
			id                INTEGER PRIMARY KEY AUTOINCREMENT,
			challenge_id      INTEGER NOT NULL REFERENCES challenges(id),
			start_date        TEXT NOT NULL,
			end_date          TEXT NOT NULL,
			linked_workout_id INTEGER REFERENCES workouts(id),
			status            TEXT NOT NULL DEFAULT 'active',
			created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
		`INSERT OR IGNORE INTO players (id, name, color, initials) VALUES (1, 'Him', '#3eb8ff', 'H')`,
		`INSERT OR IGNORE INTO players (id, name, color, initials) VALUES (2, 'Her', '#ff6b9d', 'H')`,
		`INSERT OR IGNORE INTO player_scores (player_id, points) VALUES (1, 0)`,
		`INSERT OR IGNORE INTO player_scores (player_id, points) VALUES (2, 0)`,
	}
	for _, stmt := range stmts {
		if _, err := d.conn.Exec(stmt); err != nil {
			return fmt.Errorf("schema: %w", err)
		}
	}

	var version int
	d.conn.QueryRow(`SELECT COALESCE(MAX(version), 0) FROM schema_version`).Scan(&version)
	if version < 1 {
		if _, err := d.conn.Exec(`INSERT OR REPLACE INTO schema_version (version) VALUES (1)`); err != nil {
			return err
		}
	}
	// Future migrations: if version < 2 { ...; INSERT OR REPLACE INTO schema_version VALUES (2) }

	if err := d.seedData(); err != nil {
		return err
	}
	return d.seedChallenges()
}

func (d *DB) seedData() error {
	var count int
	d.conn.QueryRow(`SELECT COUNT(*) FROM workouts`).Scan(&count)
	if count > 0 {
		return nil
	}

	type seedWorkout struct {
		Icon         string
		Name         string
		GroupLabel   string
		Tags         []model.WorkoutTag
		Desc         string
		Steps        []string
		Sets         string
		Unit         string
		DefaultCount int
	}

	beginner := "🌱 Anfänger — Grundlagen aufbauen"
	intermediate := "🔥 Fortgeschritten — Level up"
	advanced := "🚀 Experten — Partytricks"

	low := model.WorkoutTag{Label: "Low Short", Cls: "tag-low"}
	lowLong := model.WorkoutTag{Label: "Low Long", Cls: "tag-low"}
	highLong := model.WorkoutTag{Label: "High Long", Cls: "tag-high"}
	beg := model.WorkoutTag{Label: "Beginner", Cls: "tag-beginner"}
	inter := model.WorkoutTag{Label: "Intermediate", Cls: "tag-inter"}
	adv := model.WorkoutTag{Label: "Advanced", Cls: "tag-adv"}

	workouts := []seedWorkout{
		{
			Icon: "🤲", Name: "Elevated Push-Ups", GroupLabel: beginner,
			Tags:  []model.WorkoutTag{low, beg},
			Desc:  "Liegestütze auf Parallettes ermöglichen eine tiefere Bewegungsamplitude als auf dem Boden und bauen Brust, Schultern und Trizeps effektiver auf — auch bei wenigen Wiederholungen.",
			Steps: []string{"Beide kurzen Stangen schulterbreit aufstellen", "Stangen greifen, Arme gestreckt, Körper in Plankenposition", "Brust unter Stangenebene absenken (das ist der Bonus-Tiefgang!)", "Vollständig hochdrücken, Schultern nach unten ziehen", "Core anspannen — Hüfte nicht durchhängen lassen"},
			Sets:  "3 Sätze · 5–15 Wdh. · 90s Pause",
			Unit:  "reps", DefaultCount: 10,
		},
		{
			Icon: "🪑", Name: "Support Hold", GroupLabel: beginner,
			Tags:  []model.WorkoutTag{low, beg},
			Desc:  "Die Grundlage aller Parallette-Übungen. Den Körper vom Boden abzuheben trainiert gleichzeitig Handgelenk-, Schulter- und Core-Stabilität.",
			Steps: []string{"Stangen greifen und Körper nach oben drücken", "Arme vollständig gestreckt, Schultern aktiv nach unten", "Füße können anfangs leicht aufliegen — aufbauen bis zum vollständigen Hold", "So lange halten, wie die Form stimmt"},
			Sets:  "3–5 Holds · 10–30 Sekunden · 60s Pause",
			Unit:  "sec", DefaultCount: 20,
		},
		{
			Icon: "🦵", Name: "Tuck Hold", GroupLabel: beginner,
			Tags:  []model.WorkoutTag{low, beg},
			Desc:  "Das Tor zum L-Sit. Im Support Hold die Knie zur Brust ziehen. Trainiert gleichzeitig Hüftbeuger, Core und Schulter-Stabilität.",
			Steps: []string{"Im Support Hold auf den kurzen Stangen beginnen", "Knie zur Brust ziehen (Tuck-Position)", "Knie versuchen leicht über Stangenebene zu halten", "Position halten, gleichmäßig atmen"},
			Sets:  "3–5 Holds · 5–20 Sekunden · 90s Pause",
			Unit:  "sec", DefaultCount: 15,
		},
		{
			Icon: "🔽", Name: "Parallette Dips", GroupLabel: beginner,
			Tags:  []model.WorkoutTag{lowLong, beg},
			Desc:  "Die langen Stangen für Dips nutzen. Trizeps, Brust und vordere Schulter — die perfekte Ergänzung zu Liegestützen. Füße können anfangs auf dem Boden bleiben.",
			Steps: []string{"Zwischen den langen Stangen sitzen, Hände neben den Hüften", "In Support-Position drücken, Beine gestreckt oder gebeugt zur Unterstützung", "Langsam absenken bis Oberarme parallel zum Boden", "Vollständig hochdrücken — Ellbogen nicht aggressiv sperren"},
			Sets:  "3 Sätze · 5–12 Wdh. · 90s Pause",
			Unit:  "reps", DefaultCount: 10,
		},
		{
			Icon: "📐", Name: "L-Sit Hold", GroupLabel: intermediate,
			Tags:  []model.WorkoutTag{low, inter},
			Desc:  "Beine gestreckt, parallel zum Boden, im Support Hold. Eine der lohnendsten Calisthenics-Übungen — sieht einfach aus, erfordert aber enorme Core- und Hüftbeuger-Kraft.",
			Steps: []string{"Vom Tuck Hold aus ein Bein strecken, dann beide", "Zehen strecken, Beine zusammen und parallel zum Boden", "Schultern leicht vor den Händen hilft", "Zeit aufbauen — auch 3 Sekunden zählen"},
			Sets:  "4–6 Holds · 5–20 Sekunden · 2 Min Pause",
			Unit:  "sec", DefaultCount: 10,
		},
		{
			Icon: "🏔️", Name: "Pike Push-Ups", GroupLabel: intermediate,
			Tags:  []model.WorkoutTag{highLong, inter},
			Desc:  "Hände auf der hohen Stange, Füße auf dem Boden, Hüfte hoch — belastet die Schultern stark. Eine Vorstufe zum Handstand-Liegestütz.",
			Steps: []string{"Hände auf hohe Stange legen, Füße einlaufen bis Hüfte hoch ist", "Körper bildet ein umgekehrtes V", "Ellbogen beugen und Kopf zur Stange absenken", "Hochdrücken — Ellbogen nicht zu weit ausfächern"},
			Sets:  "3 Sätze · 6–12 Wdh. · 90s Pause",
			Unit:  "reps", DefaultCount: 8,
		},
		{
			Icon: "🦅", Name: "Planche Lean", GroupLabel: intermediate,
			Tags:  []model.WorkoutTag{low, inter},
			Desc:  "In Liegestütz-Position auf den Parallettes die Schultern über die Hände nach vorne lehnen. Baut die Streckarm-Kraft auf, die für fortgeschrittene Planche-Arbeit nötig ist.",
			Steps: []string{"In Liegestütz-Position auf kurzen Stangen beginnen, Arme gestreckt", "Schultern 1–4 cm über die Stangen nach vorne lehnen", "Körper steif halten — Gesäß und Core fest anspannen", "Halten, dann zurück zur Neutralposition"},
			Sets:  "4 Holds · 5–15 Sekunden · 2 Min Pause",
			Unit:  "sec", DefaultCount: 10,
		},
		{
			Icon: "🔁", Name: "Parallette Pass-Throughs", GroupLabel: intermediate,
			Tags:  []model.WorkoutTag{lowLong, inter},
			Desc:  "Eine fließende Bewegung — Support Hold, Beine durch die Stangen schwingen, zurück. Entwickelt gleichzeitig Hüftmobilität, Schulter-Stabilität und Koordination.",
			Steps: []string{"In vorderer Stützposition (Liegestütz) auf langen Stangen beginnen", "Beine durch die Stangen in hintere Stützposition schwingen (Blick nach oben)", "Kurz halten, dann zurück in vordere Stützposition schwingen", "Schwung kontrollieren — nicht einfach durchfallen lassen"},
			Sets:  "3 Sätze · 6–10 Pass-Throughs · 90s Pause",
			Unit:  "reps", DefaultCount: 6,
		},
		{
			Icon: "🤸", Name: "Handstand Hold", GroupLabel: advanced,
			Tags:  []model.WorkoutTag{low, adv},
			Desc:  "Parallettes für einen handgelenkschonenden Handstand nutzen. Der neutrale Griff reduziert die Handgelenk-Belastung deutlich und ermöglicht längere Zeit auf dem Kopf.",
			Steps: []string{"Kurze Stangen nahe an die Wand stellen", "In den Handstand hochkicken, Fersen an die Wand", "Fest durch die Stangen drücken, Schultern aktiv", "Wandkontakt schrittweise reduzieren"},
			Sets:  "4–6 Holds · 10–30 Sekunden · 2 Min Pause",
			Unit:  "sec", DefaultCount: 15,
		},
		{
			Icon: "💀", Name: "Tuck Planche Hold", GroupLabel: advanced,
			Tags:  []model.WorkoutTag{low, adv},
			Desc:  "Das Tor zur vollen Planche. Körper parallel zum Boden, nur von gestreckten Armen gehalten. Erfordert starke Schulterprotaktion und Streckarm-Kraft.",
			Steps: []string{"In Planche-Lean-Position beginnen", "Gewicht langsam nach vorne verlagern bis Zehen abheben", "Knie zur Brust ziehen, Hüfte über den Händen", "Position halten — auch 2 Sekunden sind ein Erfolg"},
			Sets:  "4–6 Holds · 2–10 Sekunden · 3 Min Pause",
			Unit:  "sec", DefaultCount: 5,
		},
	}

	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, w := range workouts {
		tagsJSON, _ := json.Marshal(w.Tags)
		stepsJSON, _ := json.Marshal(w.Steps)
		if _, err := tx.Exec(
			`INSERT INTO workouts (icon, name, group_label, tags, description, steps, sets, unit, default_count) VALUES (?,?,?,?,?,?,?,?,?)`,
			w.Icon, w.Name, w.GroupLabel, string(tagsJSON), w.Desc, string(stepsJSON), w.Sets, w.Unit, w.DefaultCount,
		); err != nil {
			return fmt.Errorf("seed workout %q: %w", w.Name, err)
		}
	}

	return tx.Commit()
}

// Players

func (d *DB) GetPlayers() ([]model.Player, error) {
	rows, err := d.conn.Query(`SELECT id, name, color, initials FROM players ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var players []model.Player
	for rows.Next() {
		var p model.Player
		if err := rows.Scan(&p.ID, &p.Name, &p.Color, &p.Initials); err != nil {
			return nil, err
		}
		players = append(players, p)
	}
	return players, rows.Err()
}

func (d *DB) UpdatePlayer(id int64, name, color, initials string) (model.Player, error) {
	_, err := d.conn.Exec(
		`UPDATE players SET name=?, color=?, initials=? WHERE id=?`,
		name, color, initials, id,
	)
	if err != nil {
		return model.Player{}, err
	}
	var p model.Player
	err = d.conn.QueryRow(`SELECT id, name, color, initials FROM players WHERE id=?`, id).
		Scan(&p.ID, &p.Name, &p.Color, &p.Initials)
	return p, err
}

// Workouts

const workoutCols = `id, icon, name, group_label, tags, description, steps, sets, unit, default_count`

func (d *DB) GetWorkouts() ([]model.Workout, error) {
	rows, err := d.conn.Query(`SELECT ` + workoutCols + ` FROM workouts ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	workouts := []model.Workout{}
	for rows.Next() {
		w, err := scanWorkout(rows.Scan)
		if err != nil {
			return nil, err
		}
		workouts = append(workouts, w)
	}
	return workouts, rows.Err()
}

func (d *DB) CreateWorkout(w model.Workout) (model.Workout, error) {
	tagsJSON, _ := json.Marshal(w.Tags)
	stepsJSON, _ := json.Marshal(w.Steps)
	res, err := d.conn.Exec(
		`INSERT INTO workouts (icon, name, group_label, tags, description, steps, sets, unit, default_count) VALUES (?,?,?,?,?,?,?,?,?)`,
		w.Icon, w.Name, w.GroupLabel, string(tagsJSON), w.Desc, string(stepsJSON), w.Sets, w.Unit, w.DefaultCount,
	)
	if err != nil {
		return model.Workout{}, err
	}
	id, _ := res.LastInsertId()
	return d.getWorkout(id)
}

func (d *DB) UpdateWorkout(id int64, w model.Workout) (model.Workout, error) {
	tagsJSON, _ := json.Marshal(w.Tags)
	stepsJSON, _ := json.Marshal(w.Steps)
	_, err := d.conn.Exec(
		`UPDATE workouts SET icon=?, name=?, group_label=?, tags=?, description=?, steps=?, sets=?, unit=?, default_count=? WHERE id=?`,
		w.Icon, w.Name, w.GroupLabel, string(tagsJSON), w.Desc, string(stepsJSON), w.Sets, w.Unit, w.DefaultCount, id,
	)
	if err != nil {
		return model.Workout{}, err
	}
	return d.getWorkout(id)
}

func (d *DB) DeleteWorkout(id int64) error {
	_, err := d.conn.Exec(`DELETE FROM workouts WHERE id=?`, id)
	return err
}

func (d *DB) getWorkout(id int64) (model.Workout, error) {
	row := d.conn.QueryRow(`SELECT `+workoutCols+` FROM workouts WHERE id=?`, id)
	return scanWorkout(row.Scan)
}

func scanWorkout(scan func(...any) error) (model.Workout, error) {
	var w model.Workout
	var tagsJSON, stepsJSON string
	if err := scan(&w.ID, &w.Icon, &w.Name, &w.GroupLabel, &tagsJSON, &w.Desc, &stepsJSON, &w.Sets, &w.Unit, &w.DefaultCount); err != nil {
		return w, err
	}
	json.Unmarshal([]byte(tagsJSON), &w.Tags)
	json.Unmarshal([]byte(stepsJSON), &w.Steps)
	if w.Tags == nil {
		w.Tags = []model.WorkoutTag{}
	}
	if w.Steps == nil {
		w.Steps = []string{}
	}
	return w, nil
}

// State (scores + history)

func (d *DB) GetState() (model.State, error) {
	var s model.State

	rows, err := d.conn.Query(`SELECT player_id, points FROM player_scores ORDER BY player_id`)
	if err != nil {
		return s, fmt.Errorf("get scores: %w", err)
	}
	defer rows.Close()
	s.Scores = []model.PlayerScore{}
	for rows.Next() {
		var ps model.PlayerScore
		if err := rows.Scan(&ps.PlayerID, &ps.Points); err != nil {
			return s, err
		}
		s.Scores = append(s.Scores, ps)
	}
	rows.Close()

	hrows, err := d.conn.Query(
		`SELECT id, challenge, p1_pct, p2_pct, p1_pts, p2_pts, result, created_at FROM history_entries ORDER BY id DESC`,
	)
	if err != nil {
		return s, fmt.Errorf("get history: %w", err)
	}
	defer hrows.Close()
	s.History = []model.HistoryEntry{}
	for hrows.Next() {
		var e model.HistoryEntry
		var createdAt string
		if err := hrows.Scan(&e.ID, &e.Challenge, &e.P1Pct, &e.P2Pct, &e.P1Pts, &e.P2Pts, &e.Result, &createdAt); err != nil {
			return s, err
		}
		e.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		s.History = append(s.History, e)
	}
	return s, hrows.Err()
}

func (d *DB) LogEntry(entry model.HistoryEntry, scores []model.PlayerScore) error {
	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(
		`INSERT INTO history_entries (challenge, p1_pct, p2_pct, p1_pts, p2_pts, result) VALUES (?,?,?,?,?,?)`,
		entry.Challenge, entry.P1Pct, entry.P2Pct, entry.P1Pts, entry.P2Pts, entry.Result,
	); err != nil {
		return err
	}

	for _, ps := range scores {
		if _, err := tx.Exec(
			`UPDATE player_scores SET points=? WHERE player_id=?`, ps.Points, ps.PlayerID,
		); err != nil {
			return err
		}
	}

	return tx.Commit()
}

// Daily logs

const dailyLogSelect = `
	SELECT dl.id, dl.date, dl.player_id, dl.workout_id,
	       COALESCE(w.name, ''), dl.count, COALESCE(w.unit, ''), dl.created_at
	FROM daily_logs dl
	LEFT JOIN workouts w ON dl.workout_id = w.id`

func (d *DB) GetDailyLogs(date string) ([]model.DailyLog, error) {
	rows, err := d.conn.Query(dailyLogSelect+` WHERE dl.date=? ORDER BY dl.id DESC`, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	logs := []model.DailyLog{}
	for rows.Next() {
		var l model.DailyLog
		if err := rows.Scan(&l.ID, &l.Date, &l.PlayerID, &l.WorkoutID, &l.WorkoutName, &l.Count, &l.Unit, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, rows.Err()
}

func (d *DB) AddDailyLog(req model.DailyLogRequest) (model.DailyLog, error) {
	res, err := d.conn.Exec(
		`INSERT INTO daily_logs (date, player_id, workout_id, count) VALUES (?,?,?,?)`,
		req.Date, req.PlayerID, req.WorkoutID, req.Count,
	)
	if err != nil {
		return model.DailyLog{}, err
	}
	id, _ := res.LastInsertId()
	var l model.DailyLog
	err = d.conn.QueryRow(
		dailyLogSelect+` WHERE dl.id=?`, id,
	).Scan(&l.ID, &l.Date, &l.PlayerID, &l.WorkoutID, &l.WorkoutName, &l.Count, &l.Unit, &l.CreatedAt)
	return l, err
}

func (d *DB) GetMonthLogs(year, month int) (map[string][]int64, error) {
	monthStr := fmt.Sprintf("%02d", month)
	rows, err := d.conn.Query(
		`SELECT DISTINCT date, player_id FROM daily_logs
		 WHERE strftime('%Y', date)=? AND strftime('%m', date)=?
		 ORDER BY date`,
		fmt.Sprintf("%d", year), monthStr,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := map[string][]int64{}
	for rows.Next() {
		var date string
		var playerID int64
		if err := rows.Scan(&date, &playerID); err != nil {
			return nil, err
		}
		result[date] = append(result[date], playerID)
	}
	return result, rows.Err()
}

func (d *DB) DeleteDailyLog(id int64) error {
	_, err := d.conn.Exec(`DELETE FROM daily_logs WHERE id=?`, id)
	return err
}

func (d *DB) Reset() error {
	for _, stmt := range []string{
		`DELETE FROM history_entries`,
		`UPDATE player_scores SET points=0`,
	} {
		if _, err := d.conn.Exec(stmt); err != nil {
			return err
		}
	}
	return nil
}

// Challenges

func (d *DB) seedChallenges() error {
	var count int
	d.conn.QueryRow(`SELECT COUNT(*) FROM challenges`).Scan(&count)
	if count > 0 {
		return nil
	}

	type seed struct {
		Title             string
		Type              string
		TypeLabel         string
		Desc              string
		HimNote           string
		HerNote           string
		WinRule           string
		Unit              string
		DurationDays      int
		LinkedWorkoutName string
	}

	seeds := []seed{
		{
			Title: "Liegestütz-Prozent-Rennen", Type: "improvement", TypeLabel: "% Verbesserung",
			Desc:    "Beide testen ihre maximalen Liegestütz-Wiederholungen an Tag 1 (Ausgangswert). Nach 4 Wochen Training erneut testen. Wer sich prozentual am meisten verbessert, gewinnt.",
			HimNote: "Ausgangswert ca. ~30 Wdh.", HerNote: "Ausgangswert ca. ~1–3 Wdh.",
			WinRule: "Gewinner = höchste % Verbesserung. (z.B. 1→4 Wdh. = +300% schlägt 30→38 = +27%)",
			Unit:    "Wdh.", DurationDays: 28, LinkedWorkoutName: "Elevated Push-Ups",
		},
		{
			Title: "L-Sit Überlebenskampf", Type: "endurance", TypeLabel: "Ausdauer",
			Desc:    "Maximalen L-Sit-Hold messen (oder Tuck Hold für Anfänger). Haltezeit wöchentlich mit dem eigenen Rekord vergleichen. Wöchentlicher Gewinner erhält den Punkt.",
			HimNote: "Voller L-Sit oder Planche-Lean-Version", HerNote: "Tuck Hold ist gültig — vollständig vergleichbar",
			WinRule: "Jede Woche: Wer den eigenen Rekord prozentual mehr übertrifft, gewinnt den Wochenpunkt.",
			Unit:    "Sekunden", DurationDays: 28, LinkedWorkoutName: "L-Sit Hold",
		},
		{
			Title: "30-Tage Liegestütz-Kalender", Type: "skill", TypeLabel: "Konstanz",
			Desc:    "Jeden Tag für 30 Tage eine bestimmte Anzahl Liegestütze absolvieren (an jede Person angepasst). Fertige Tage im gemeinsamen Kalender markieren. Wer mehr Tage schafft, gewinnt.",
			HimNote: "Ziel: 10 Wdh./Tag, jede Woche um 1 steigern", HerNote: "Ziel: 2 Wdh./Tag, jede Woche um 1 steigern",
			WinRule: "Wer nach 30 Tagen mehr Tage abgeschlossen hat, gewinnt. Gleichstand = Bonus-Runde.",
			Unit:    "Abgeschlossene Tage", DurationDays: 30, LinkedWorkoutName: "Elevated Push-Ups",
		},
		{
			Title: "Dip-Duell", Type: "improvement", TypeLabel: "% Verbesserung",
			Desc:    "Maximale Dips testen (mit Fußunterstützung für Anfänger erlaubt). Ausgangswert aufzeichnen. Nach 3 Wochen erneut testen.",
			HimNote: "Volle hängende Dips", HerNote: "Fußgestützte Dips an der niedrigen Stange — beide werden gezählt",
			WinRule: "Höchste % Verbesserung vom persönlichen Ausgangswert gewinnt.",
			Unit:    "Wdh.", DurationDays: 21, LinkedWorkoutName: "Parallette Dips",
		},
		{
			Title: "Der Planken-Showdown", Type: "endurance", TypeLabel: "Ausdauer",
			Desc:    "Maximaler Planken-Hold — aber auf den Parallettes (erhöht). Der neutrale Griff macht es schwerer als auf dem Boden. Beide halten gleichzeitig für extra Spannung.",
			HimNote: "Standard Parallette-Planke", HerNote: "Gleich — diese Übung ist von Natur aus fairer",
			WinRule: "Längste Haltezeit gewinnt. Bei weniger als 5 Sekunden Unterschied: Unentschieden, beide erhalten Punkte.",
			Unit:    "Sekunden", DurationDays: 7, LinkedWorkoutName: "Support Hold",
		},
		{
			Title: "Speed-Circuit-Sprint", Type: "speed", TypeLabel: "Schnelligkeit",
			Desc:    "5 Liegestütze + 5 Dips + 10s Support Hold so schnell wie möglich absolvieren. Jede Person in der eigenen Skalierung. Zeit wird mit dem persönlichen Ausgangswert verglichen.",
			HimNote: "Volle Wiederholungen, ohne Unterstützung", HerNote: "Skalierte Wdh. (z.B. 3+3 statt 5+5) — eigene Skalierung festlegen",
			WinRule: "Größte prozentuale Zeitverkürzung vom Ausgangswert gewinnt. Macht Spaß zuzuschauen!",
			Unit:    "Sekunden (weniger = besser)", DurationDays: 28,
		},
		{
			Title: "Wöchentlicher Skill-Unlock", Type: "skill", TypeLabel: "Technik",
			Desc:    "Jede Woche versuchen beide, eine neue Übung aus der Workout-Liste zu erlernen. Wer sie zuerst 5 Sekunden sauber hält, gewinnt die Woche.",
			HimNote: "Nächste schwierigere Übung über dem aktuellen Level anstreben", HerNote: "Gleiche Regel — Übung wird gemeinsam gewählt",
			WinRule: "Wer die Übung zuerst 5 saubere Sekunden hält, gewinnt 3 Punkte. Gleiche Woche = Unentschieden.",
			Unit:    "Übung erreicht (ja/nein)", DurationDays: 7,
		},
		{
			Title: "Paar-EMOM", Type: "endurance", TypeLabel: "Ausdauer",
			Desc:    "Every Minute On the Minute — Wiederholungen absolvieren, Rest der Minute erholen. Mit einer für beide machbaren Zahl starten. Jede Woche 1 Wdh. mehr. Wer am längsten durchhält, gewinnt.",
			HimNote: "Start mit 8 Wdh./Min.", HerNote: "Start mit 2 Wdh./Min. — steigert sich identisch in der Schwierigkeit",
			WinRule: "Wer zuletzt ohne Fehler durchhält, gewinnt. Wird über Wochen verfolgt.",
			Unit:    "Überlebte Runden", DurationDays: 28,
		},
	}

	tx, err := d.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, s := range seeds {
		if s.LinkedWorkoutName != "" {
			if _, err := tx.Exec(
				`INSERT INTO challenges (title, type, type_label, description, him_note, her_note, win_rule, unit, duration_days, linked_workout_id)
				 VALUES (?,?,?,?,?,?,?,?,?, (SELECT id FROM workouts WHERE name=?))`,
				s.Title, s.Type, s.TypeLabel, s.Desc, s.HimNote, s.HerNote, s.WinRule, s.Unit, s.DurationDays, s.LinkedWorkoutName,
			); err != nil {
				return fmt.Errorf("seed challenge %q: %w", s.Title, err)
			}
		} else {
			if _, err := tx.Exec(
				`INSERT INTO challenges (title, type, type_label, description, him_note, her_note, win_rule, unit, duration_days) VALUES (?,?,?,?,?,?,?,?,?)`,
				s.Title, s.Type, s.TypeLabel, s.Desc, s.HimNote, s.HerNote, s.WinRule, s.Unit, s.DurationDays,
			); err != nil {
				return fmt.Errorf("seed challenge %q: %w", s.Title, err)
			}
		}
	}
	return tx.Commit()
}

func (d *DB) GetChallengeByID(id int64) (*model.Challenge, error) {
	var c model.Challenge
	var linkedWorkoutID sql.NullInt64
	err := d.conn.QueryRow(
		`SELECT id, title, type, type_label, description, him_note, her_note, win_rule, unit, duration_days, linked_workout_id FROM challenges WHERE id=?`, id,
	).Scan(&c.ID, &c.Title, &c.Type, &c.TypeLabel, &c.Desc, &c.HimNote, &c.HerNote, &c.WinRule, &c.Unit, &c.DurationDays, &linkedWorkoutID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if linkedWorkoutID.Valid {
		lid := linkedWorkoutID.Int64
		c.LinkedWorkoutID = &lid
	}
	return &c, nil
}

func (d *DB) GetChallenges() ([]model.Challenge, error) {
	rows, err := d.conn.Query(
		`SELECT id, title, type, type_label, description, him_note, her_note, win_rule, unit, duration_days, linked_workout_id FROM challenges ORDER BY id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var cs []model.Challenge
	for rows.Next() {
		var c model.Challenge
		var linkedWorkoutID sql.NullInt64
		if err := rows.Scan(&c.ID, &c.Title, &c.Type, &c.TypeLabel, &c.Desc, &c.HimNote, &c.HerNote, &c.WinRule, &c.Unit, &c.DurationDays, &linkedWorkoutID); err != nil {
			return nil, err
		}
		if linkedWorkoutID.Valid {
			id := linkedWorkoutID.Int64
			c.LinkedWorkoutID = &id
		}
		cs = append(cs, c)
	}
	if cs == nil {
		cs = []model.Challenge{}
	}
	return cs, rows.Err()
}

const runSelect = `
	SELECT cr.id, cr.challenge_id, c.title, cr.start_date, cr.end_date, cr.linked_workout_id, cr.status
	FROM challenge_runs cr JOIN challenges c ON cr.challenge_id = c.id`

func scanRun(scan func(...any) error) (model.ChallengeRun, error) {
	var run model.ChallengeRun
	var linkedWorkoutID sql.NullInt64
	if err := scan(&run.ID, &run.ChallengeID, &run.ChallengeTitle, &run.StartDate, &run.EndDate, &linkedWorkoutID, &run.Status); err != nil {
		return run, err
	}
	if linkedWorkoutID.Valid {
		id := linkedWorkoutID.Int64
		run.LinkedWorkoutID = &id
	}
	return run, nil
}

func (d *DB) GetActiveRun() (*model.ChallengeRun, error) {
	row := d.conn.QueryRow(runSelect + ` WHERE cr.status = 'active' LIMIT 1`)
	run, err := scanRun(row.Scan)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &run, nil
}

func (d *DB) StartChallengeRun(challengeID int64, startDate, endDate string) (model.ChallengeRun, error) {
	tx, err := d.conn.Begin()
	if err != nil {
		return model.ChallengeRun{}, err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`UPDATE challenge_runs SET status='cancelled' WHERE status='active'`); err != nil {
		return model.ChallengeRun{}, err
	}

	res, err := tx.Exec(
		`INSERT INTO challenge_runs (challenge_id, start_date, end_date, linked_workout_id, status)
		 SELECT ?, ?, ?, linked_workout_id, 'active' FROM challenges WHERE id=?`,
		challengeID, startDate, endDate, challengeID,
	)
	if err != nil {
		return model.ChallengeRun{}, err
	}
	id, _ := res.LastInsertId()

	if err := tx.Commit(); err != nil {
		return model.ChallengeRun{}, err
	}

	row := d.conn.QueryRow(runSelect+` WHERE cr.id=?`, id)
	return scanRun(row.Scan)
}

func (d *DB) CompleteRun(id int64) error {
	_, err := d.conn.Exec(`UPDATE challenge_runs SET status='completed' WHERE id=?`, id)
	return err
}

func (d *DB) CancelRun(id int64) error {
	_, err := d.conn.Exec(`UPDATE challenge_runs SET status='cancelled' WHERE id=?`, id)
	return err
}

func (d *DB) GetMonthRuns(year, month int) ([]model.ChallengeRun, error) {
	monthStart := fmt.Sprintf("%04d-%02d-01", year, month)
	lastDay := time.Date(year, time.Month(month+1), 0, 0, 0, 0, 0, time.UTC).Day()
	monthEnd := fmt.Sprintf("%04d-%02d-%02d", year, month, lastDay)

	rows, err := d.conn.Query(
		runSelect+` WHERE cr.status != 'cancelled' AND cr.start_date <= ? AND cr.end_date >= ? ORDER BY cr.start_date`,
		monthEnd, monthStart,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var runs []model.ChallengeRun
	for rows.Next() {
		run, err := scanRun(rows.Scan)
		if err != nil {
			return nil, err
		}
		runs = append(runs, run)
	}
	if runs == nil {
		runs = []model.ChallengeRun{}
	}
	return runs, rows.Err()
}
