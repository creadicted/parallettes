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
    title: 'Liegestütz-Prozent-Rennen',
    type: 'improvement',
    typeLabel: '% Verbesserung',
    desc: 'Beide testen ihre maximalen Liegestütz-Wiederholungen an Tag 1 (Ausgangswert). Nach 4 Wochen Training erneut testen. Wer sich prozentual am meisten verbessert, gewinnt.',
    him: 'Ausgangswert ca. ~30 Wdh.',
    her: 'Ausgangswert ca. ~1–3 Wdh.',
    winRule: 'Gewinner = höchste % Verbesserung. (z.B. 1→4 Wdh. = +300% schlägt 30→38 = +27%)',
    unit: 'Wdh.',
  },
  {
    id: 2,
    title: 'L-Sit Überlebenskampf',
    type: 'endurance',
    typeLabel: 'Ausdauer',
    desc: 'Maximalen L-Sit-Hold messen (oder Tuck Hold für Anfänger). Haltezeit wöchentlich mit dem eigenen Rekord vergleichen. Wöchentlicher Gewinner erhält den Punkt.',
    him: 'Voller L-Sit oder Planche-Lean-Version',
    her: 'Tuck Hold ist gültig — vollständig vergleichbar',
    winRule: 'Jede Woche: Wer den eigenen Rekord prozentual mehr übertrifft, gewinnt den Wochenpunkt.',
    unit: 'Sekunden',
  },
  {
    id: 3,
    title: '30-Tage Liegestütz-Kalender',
    type: 'skill',
    typeLabel: 'Konstanz',
    desc: 'Jeden Tag für 30 Tage eine bestimmte Anzahl Liegestütze absolvieren (an jede Person angepasst). Fertige Tage im gemeinsamen Kalender markieren. Wer mehr Tage schafft, gewinnt.',
    him: 'Ziel: 10 Wdh./Tag, jede Woche um 1 steigern',
    her: 'Ziel: 2 Wdh./Tag, jede Woche um 1 steigern',
    winRule: 'Wer nach 30 Tagen mehr Tage abgeschlossen hat, gewinnt. Gleichstand = Bonus-Runde.',
    unit: 'Abgeschlossene Tage',
  },
  {
    id: 4,
    title: 'Dip-Duell',
    type: 'improvement',
    typeLabel: '% Verbesserung',
    desc: 'Maximale Dips testen (mit Fußunterstützung für Anfänger erlaubt). Ausgangswert aufzeichnen. Nach 3 Wochen erneut testen.',
    him: 'Volle hängende Dips',
    her: 'Fußgestützte Dips an der niedrigen Stange — beide werden gezählt',
    winRule: 'Höchste % Verbesserung vom persönlichen Ausgangswert gewinnt.',
    unit: 'Wdh.',
  },
  {
    id: 5,
    title: 'Der Planken-Showdown',
    type: 'endurance',
    typeLabel: 'Ausdauer',
    desc: 'Maximaler Planken-Hold — aber auf den Parallettes (erhöht). Der neutrale Griff macht es schwerer als auf dem Boden. Beide halten gleichzeitig für extra Spannung.',
    him: 'Standard Parallette-Planke',
    her: 'Gleich — diese Übung ist von Natur aus fairer',
    winRule: 'Längste Haltezeit gewinnt. Bei weniger als 5 Sekunden Unterschied: Unentschieden, beide erhalten Punkte.',
    unit: 'Sekunden',
  },
  {
    id: 6,
    title: 'Speed-Circuit-Sprint',
    type: 'speed',
    typeLabel: 'Schnelligkeit',
    desc: '5 Liegestütze + 5 Dips + 10s Support Hold so schnell wie möglich absolvieren. Jede Person in der eigenen Skalierung. Zeit wird mit dem persönlichen Ausgangswert verglichen.',
    him: 'Volle Wiederholungen, ohne Unterstützung',
    her: 'Skalierte Wdh. (z.B. 3+3 statt 5+5) — eigene Skalierung festlegen',
    winRule: 'Größte prozentuale Zeitverkürzung vom Ausgangswert gewinnt. Macht Spaß zuzuschauen!',
    unit: 'Sekunden (weniger = besser)',
  },
  {
    id: 7,
    title: 'Wöchentlicher Skill-Unlock',
    type: 'skill',
    typeLabel: 'Technik',
    desc: 'Jede Woche versuchen beide, eine neue Übung aus der Workout-Liste zu erlernen (z.B. Woche 1: Tuck Hold, Woche 2: L-Sit, Woche 3: Pike Push-Up). Wer sie zuerst 5 Sekunden sauber hält, gewinnt die Woche.',
    him: 'Nächste schwierigere Übung über dem aktuellen Level anstreben',
    her: 'Gleiche Regel — Übung wird gemeinsam gewählt',
    winRule: 'Wer die Übung zuerst 5 saubere Sekunden hält, gewinnt 3 Punkte. Gleiche Woche = Unentschieden.',
    unit: 'Übung erreicht (ja/nein)',
  },
  {
    id: 8,
    title: 'Paar-EMOM',
    type: 'endurance',
    typeLabel: 'Ausdauer',
    desc: 'Every Minute On the Minute — Wiederholungen absolvieren, Rest der Minute erholen. Mit einer für beide machbaren Zahl starten (Er: 8 Liegestütze/Min., Sie: 2 Liegestütze/Min.). Jede Woche 1 Wdh. mehr. Wer am längsten durchhält, gewinnt.',
    him: 'Start mit 8 Wdh./Min.',
    her: 'Start mit 2 Wdh./Min. — steigert sich identisch in der Schwierigkeit',
    winRule: 'Wer zuletzt ohne Fehler durchhält, gewinnt. Wird über Wochen verfolgt.',
    unit: 'Überlebte Runden',
  },
]
