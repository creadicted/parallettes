export interface Challenge {
  id: number
  title: string
  type: 'improvement' | 'endurance' | 'skill' | 'speed'
  typeLabel: string
  desc: string
  him: string
  her: string
  winRule: string
  unit: string
}

export const challenges: Challenge[] = [
  {
    id: 1,
    title: 'Push-Up Percentage Race',
    type: 'improvement',
    typeLabel: '% Improvement',
    desc: 'Both test your max push-up reps on Day 1 (baseline). After 4 weeks of training, retest. Whoever improves the most in percentage terms wins.',
    him: 'Baseline likely ~30 reps',
    her: 'Baseline likely ~1–3 reps',
    winRule: 'Winner = highest % improvement. (e.g. 1→4 reps = +300% beats 30→38 = +27%)',
    unit: 'reps',
  },
  {
    id: 2,
    title: 'L-Sit Survival',
    type: 'endurance',
    typeLabel: 'Endurance',
    desc: 'Time your maximum L-sit hold (or tuck hold for beginners). Compare your hold time to your own personal best each week. Weekly winner gets the point.',
    him: 'Full L-sit or planche lean version',
    her: 'Tuck hold is valid — fully comparable',
    winRule: "Each week: whoever beats their own previous record by a larger % wins that week's point.",
    unit: 'seconds',
  },
  {
    id: 3,
    title: '30-Day Push-Up Calendar',
    type: 'skill',
    typeLabel: 'Consistency',
    desc: 'Each day for 30 days, do a set number of push-ups (scaled to each person). Track completion on a shared calendar. Most days completed wins.',
    him: 'Target: 10 reps/day, scaling up by 1 each week',
    her: 'Target: 2 reps/day, scaling up by 1 each week',
    winRule: 'Most days completed at the end of 30 days wins. Tie = bonus challenge round.',
    unit: 'days completed',
  },
  {
    id: 4,
    title: 'Dip-Off',
    type: 'improvement',
    typeLabel: '% Improvement',
    desc: 'Test max dips (with foot assist allowed for beginners). Record baseline. Retest in 3 weeks.',
    him: 'Full hanging dips',
    her: 'Feet-assisted dips on low bar — both are counted',
    winRule: 'Highest % improvement from personal baseline wins.',
    unit: 'reps',
  },
  {
    id: 5,
    title: 'The Plank-Off',
    type: 'endurance',
    typeLabel: 'Endurance',
    desc: 'Max plank hold — but on the parallettes (elevated). Neutral grip makes it harder than floor. Both hold simultaneously for extra drama.',
    him: 'Standard parallette plank',
    her: 'Same — this one is inherently more equal',
    winRule: 'Longest hold wins. If within 5 seconds of each other, it\'s a tie and both earn points.',
    unit: 'seconds',
  },
  {
    id: 6,
    title: 'Speed Circuit Sprint',
    type: 'speed',
    typeLabel: 'Speed',
    desc: 'Complete 5 push-ups + 5 dips + 10s support hold as fast as possible. Each person does their scaled version. Time is compared to their own baseline time.',
    him: 'Full reps, unassisted',
    her: 'Scaled reps (e.g. 3+3 instead of 5+5) — set your own scale',
    winRule: 'Biggest % time reduction from baseline wins. Sprint it — this one is fun to watch.',
    unit: 'seconds (lower = better)',
  },
  {
    id: 7,
    title: 'Weekly Skill Unlock',
    type: 'skill',
    typeLabel: 'Skill',
    desc: 'Each week, both attempt to learn a new skill from the workout list (e.g. Week 1: tuck hold, Week 2: L-sit, Week 3: pike push-up). First to hold it for 5 seconds wins the week.',
    him: 'Target the next hardest skill above current level',
    her: 'Same rule — skill chosen jointly',
    winRule: 'First to nail the skill for 5 clean seconds wins 3 pts. If same week, it\'s a tie.',
    unit: 'skill achieved (yes/no)',
  },
  {
    id: 8,
    title: "Couple's EMOM",
    type: 'endurance',
    typeLabel: 'Endurance',
    desc: "Every Minute On the Minute — do your reps, rest the remainder. Start at a number you can both manage (him: 8 push-ups/min, her: 2 push-ups/min). Add 1 rep per week. Whoever survives longest wins.",
    him: 'Start at 8 reps/min',
    her: 'Start at 2 reps/min — scales identically in difficulty',
    winRule: 'Last person to survive without failing a round wins. Tracked over weeks.',
    unit: 'rounds survived',
  },
]
