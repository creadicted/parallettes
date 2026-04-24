const tips = [
  { icon: '🤝', title: 'Handgelenke aufwärmen', body: 'Parallette-Training belastet die Handgelenke ungewöhnlich stark. Nimm dir 3–5 Min für Kreisbewegungen, Liegestütze auf den Knöcheln und Handgelenk-Dehnungen vor jeder Einheit. Wer das überspringt, wird es bereuen.' },
  { icon: '📏', title: 'Griffbreite ist entscheidend', body: 'Für Liegestütze und L-Sits: Stangen etwa schulterbreit auseinander. Zu weit = Schulterbelastung. Zu eng = ungünstige Ellbogenposition. Finde dein optimales Maß in der ersten Einheit.' },
  { icon: '⏳', title: 'Halten schlägt Wiederholungen — zumindest am Anfang', body: 'Isometrische Halteübungen (Support Hold, Tuck Hold, L-Sit) bauen die neuromuskuläre Grundlage für Anfänger schneller auf als Wiederholungen. Nicht zu früh zu dynamischen Bewegungen wechseln.' },
  { icon: '📅', title: '2–3x pro Woche reicht', body: 'Parallette-Training ist intensiv für Gelenke und Sehnen. Erholungstage sind wichtig. Ein Rhythmus von 3 Tagen Training, 1 Tag Pause funktioniert gut. An denselben Tagen gemeinsam trainieren steigert die Motivation.' },
  { icon: '🎯', title: 'Zuerst Ausgangswerte festhalten', body: 'Vor dem Start der Challenges die Tag-1-Werte für jede Challenge aufschreiben — maximale Liegestütze, maximaler L-Sit-Hold usw. Der prozentuale Fortschritt ist die Grundlage für den fairen Vergleich.' },
  { icon: '💪', title: 'Empfohlene Anfänger-Routine', body: 'Woche 1–2: Support Holds (3×20s), Tuck Holds (3×10s), Liegestütze (3×5). Woche 3–4: Dips und L-Sit-Versuche hinzufügen. Woche 5+: Pike Push-Ups und Pass-Throughs einführen. Challenges können ab Woche 2 starten.' },
  { icon: '🏆', title: 'JEDEN Fortschritt feiern', body: 'Von 1 auf 3 Liegestütze = +200% Verbesserung. Von 30 auf 33 = nur +10%. Das relative Wertungssystem existiert genau deshalb, um das fair zu machen — vertrau darauf.' },
]

export default function TipsTab() {
  return (
    <>
      <div className="s-title">ERSTE SCHRITTE</div>
      <p className="s-sub">Zum ersten Mal auf Parallettes? Diese Tipps sparen dir Wochen an Frust.</p>
      {tips.map(t => (
        <div className="tip-card" key={t.title}>
          <div className="tip-icon">{t.icon}</div>
          <div className="tip-text">
            <h4>{t.title}</h4>
            <p>{t.body}</p>
          </div>
        </div>
      ))}
    </>
  )
}
