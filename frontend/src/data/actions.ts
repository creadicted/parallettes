export interface Action {
  name: string
  unit: string
  defaultCount: number
}

export const actions: Action[] = [
  { name: 'Push-ups',          unit: 'reps', defaultCount: 10 },
  { name: 'Dips',              unit: 'reps', defaultCount: 10 },
  { name: 'Pike Push-ups',     unit: 'reps', defaultCount: 8  },
  { name: 'Pass-Throughs',     unit: 'reps', defaultCount: 6  },
  { name: 'Support Hold',      unit: 'sec',  defaultCount: 20 },
  { name: 'Tuck Hold',         unit: 'sec',  defaultCount: 15 },
  { name: 'L-Sit Hold',        unit: 'sec',  defaultCount: 10 },
  { name: 'Planche Lean',      unit: 'sec',  defaultCount: 10 },
  { name: 'Handstand Hold',    unit: 'sec',  defaultCount: 15 },
  { name: 'Tuck Planche Hold', unit: 'sec',  defaultCount: 5  },
]
