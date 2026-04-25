package db

import (
	"testing"
)

func newTestDB(t *testing.T) *DB {
	t.Helper()
	d, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open test db: %v", err)
	}
	t.Cleanup(func() { d.Close() })
	return d
}

func TestMigrate_SeedsWorkoutsAndChallenges(t *testing.T) {
	d := newTestDB(t)

	workouts, err := d.GetWorkouts()
	if err != nil {
		t.Fatalf("GetWorkouts: %v", err)
	}
	if len(workouts) == 0 {
		t.Error("expected workouts to be seeded, got none")
	}

	challenges, err := d.GetChallenges()
	if err != nil {
		t.Fatalf("GetChallenges: %v", err)
	}
	if len(challenges) != 8 {
		t.Errorf("expected 8 challenges, got %d", len(challenges))
	}
}

func TestMigrate_LinkedWorkoutIDs(t *testing.T) {
	d := newTestDB(t)

	challenges, _ := d.GetChallenges()
	linked := map[string]bool{}
	for _, c := range challenges {
		if c.LinkedWorkoutID != nil {
			linked[c.Title] = true
		}
	}

	wantLinked := []string{
		"Liegestütz-Prozent-Rennen",
		"30-Tage Liegestütz-Kalender",
		"L-Sit Überlebenskampf",
		"Dip-Duell",
		"Der Planken-Showdown",
	}
	for _, title := range wantLinked {
		if !linked[title] {
			t.Errorf("challenge %q should have a linked workout but does not", title)
		}
	}
}

func TestGetActiveRun_NoneByDefault(t *testing.T) {
	d := newTestDB(t)

	run, err := d.GetActiveRun()
	if err != nil {
		t.Fatalf("GetActiveRun: %v", err)
	}
	if run != nil {
		t.Errorf("expected nil active run, got %+v", run)
	}
}

func TestStartChallengeRun_CancelsExisting(t *testing.T) {
	d := newTestDB(t)

	first, err := d.StartChallengeRun(1, "2026-01-01", "2026-01-28")
	if err != nil {
		t.Fatalf("StartChallengeRun (first): %v", err)
	}
	if first.Status != "active" {
		t.Errorf("first run status: got %q, want %q", first.Status, "active")
	}

	second, err := d.StartChallengeRun(2, "2026-02-01", "2026-02-28")
	if err != nil {
		t.Fatalf("StartChallengeRun (second): %v", err)
	}
	if second.Status != "active" {
		t.Errorf("second run status: got %q, want %q", second.Status, "active")
	}

	active, err := d.GetActiveRun()
	if err != nil {
		t.Fatalf("GetActiveRun: %v", err)
	}
	if active == nil {
		t.Fatal("expected an active run after second start")
	}
	if active.ID != second.ID {
		t.Errorf("active run ID: got %d, want %d", active.ID, second.ID)
	}
}

func TestCompleteRun(t *testing.T) {
	d := newTestDB(t)

	run, _ := d.StartChallengeRun(1, "2026-01-01", "2026-01-28")
	if err := d.CompleteRun(run.ID); err != nil {
		t.Fatalf("CompleteRun: %v", err)
	}

	active, _ := d.GetActiveRun()
	if active != nil {
		t.Errorf("expected no active run after completion, got %+v", active)
	}
}

func TestCancelRun(t *testing.T) {
	d := newTestDB(t)

	run, _ := d.StartChallengeRun(1, "2026-01-01", "2026-01-28")
	if err := d.CancelRun(run.ID); err != nil {
		t.Fatalf("CancelRun: %v", err)
	}

	active, _ := d.GetActiveRun()
	if active != nil {
		t.Errorf("expected no active run after cancel, got %+v", active)
	}
}

func TestGetMonthRuns_ExcludesCancelled(t *testing.T) {
	d := newTestDB(t)

	run, _ := d.StartChallengeRun(1, "2026-04-01", "2026-04-30")
	d.CancelRun(run.ID)

	runs, err := d.GetMonthRuns(2026, 4)
	if err != nil {
		t.Fatalf("GetMonthRuns: %v", err)
	}
	if len(runs) != 0 {
		t.Errorf("expected cancelled run excluded from month runs, got %d", len(runs))
	}
}

func TestGetMonthRuns_IncludesOverlapping(t *testing.T) {
	d := newTestDB(t)

	// Run spanning two months — should appear in both
	d.StartChallengeRun(1, "2026-03-20", "2026-04-20")

	aprilRuns, _ := d.GetMonthRuns(2026, 4)
	if len(aprilRuns) != 1 {
		t.Errorf("expected 1 run in April, got %d", len(aprilRuns))
	}

	marchRuns, _ := d.GetMonthRuns(2026, 3)
	if len(marchRuns) != 1 {
		t.Errorf("expected 1 run in March, got %d", len(marchRuns))
	}
}

func TestGetChallengeByID_UnknownReturnsNil(t *testing.T) {
	d := newTestDB(t)

	c, err := d.GetChallengeByID(9999)
	if err != nil {
		t.Fatalf("GetChallengeByID: %v", err)
	}
	if c != nil {
		t.Errorf("expected nil for unknown ID, got %+v", c)
	}
}
