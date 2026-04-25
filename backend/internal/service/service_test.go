package service

import "testing"

func TestComputeResult(t *testing.T) {
	tests := []struct {
		name              string
		unit              string
		p1Val, p2Val      float64
		p1Base, p2Base    float64
		wantP1Pts         int
		wantP2Pts         int
		wantResult        string
	}{
		{
			name:       "p1 wins by large margin",
			unit:       "reps",
			p1Val:      40, p1Base: 20, // +100%
			p2Val:      22, p2Base: 20, // +10%
			wantP1Pts:  3, wantP2Pts: 0, wantResult: "💙 Player 1 wins!",
		},
		{
			name:       "p2 wins by large margin",
			unit:       "reps",
			p1Val:      22, p1Base: 20, // +10%
			p2Val:      40, p2Base: 20, // +100%
			wantP1Pts:  0, wantP2Pts: 3, wantResult: "💗 Player 2 wins!",
		},
		{
			name:       "tie — difference exactly 5%",
			unit:       "reps",
			p1Val:      21, p1Base: 20, // +5%
			p2Val:      20, p2Base: 20, // +0%
			wantP1Pts:  1, wantP2Pts: 1, wantResult: "🤝 Tie!",
		},
		{
			name:       "tie — identical improvement",
			unit:       "reps",
			p1Val:      24, p1Base: 20, // +20%
			p2Val:      12, p2Base: 10, // +20%
			wantP1Pts:  1, wantP2Pts: 1, wantResult: "🤝 Tie!",
		},
		{
			name:       "lower-is-better — p1 wins by improving (lowering) more",
			unit:       "seconds (lower = better)",
			p1Val:      80, p1Base: 100, // -20% → +20% after inversion
			p2Val:      95, p2Base: 100, // -5%  → +5%
			wantP1Pts:  3, wantP2Pts: 0, wantResult: "💙 Player 1 wins!",
		},
		{
			name:       "lower-is-better — tie",
			unit:       "seconds (lower = better)",
			p1Val:      95, p1Base: 100, // -5%
			p2Val:      95, p2Base: 100, // -5%
			wantP1Pts:  1, wantP2Pts: 1, wantResult: "🤝 Tie!",
		},
		{
			name:       "small absolute difference still a tie if within 5%",
			unit:       "reps",
			p1Val:      21, p1Base: 20, // +5%
			p2Val:      21, p2Base: 21, // +0%
			wantP1Pts:  1, wantP2Pts: 1, wantResult: "🤝 Tie!",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, p1Pts, p2Pts, result := computeResult(tt.unit, tt.p1Val, tt.p2Val, tt.p1Base, tt.p2Base)
			if p1Pts != tt.wantP1Pts || p2Pts != tt.wantP2Pts {
				t.Errorf("pts: got (%d, %d), want (%d, %d)", p1Pts, p2Pts, tt.wantP1Pts, tt.wantP2Pts)
			}
			if result != tt.wantResult {
				t.Errorf("result: got %q, want %q", result, tt.wantResult)
			}
		})
	}
}
