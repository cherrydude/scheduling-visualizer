# Hilfe — Scheduling Visualizer (komplette Version)

Diese Hilfeseite fasst alle relevanten Informationen zur Benutzung, Interpretation und Erweiterung der Scheduling Visualizer‑Webapp zusammen. Sie enthält Quickstart‑Anleitungen, UI‑Erklärungen, Parameter‑Beschreibungen, didaktische Aufgaben, Implementierungs‑Hinweise (Reproduzierbarkeit, Tests), eine geplante Kurz‑Tour, Barrierefreiheits‑Hinweise und Troubleshooting. Die Datei ist für Lehrende, Studierende sowie Prüfer gedacht.

---

## 1. Ziel der App
Die Scheduling Visualizer ist ein clientseitiges Lehrwerkzeug zur interaktiven Demonstration präemptiver Scheduling‑Algorithmen (Round Robin, LCFS, Strict Priority, MLFQ). Ziel ist, Abläufe (Kontextwechsel, Preemption, Warteschlangen, Queue‑Levels) anschaulich sichtbar zu machen und quantitative Kennzahlen vergleichbar darzustellen. Die Simulation läuft vollständig im Browser; Szenarien werden in `localStorage` gespeichert.

---

## 2. Schnellstart — In 2–3 Minuten erklärt
1. Lokaler Start (Entwicklung):
```bash
npm install
npm run dev
```
2. Öffne die App im Browser (Vite Dev URL).
3. Szenario erstellen:
   - Klick auf "+ Szenario" im Burger‑Menü oder nutze das Willkommens‑Modal.
   - Lege mindestens 2 Prozesse an (ID, Ankunft, Burst, Priorität, Farbe).
4. Algorithmus anwenden:
   - Öffne „Algorithmus anwenden“ → wähle z. B. Round Robin → setze Time Quantum.
   - Bestätige; der Run wird erzeugt und ist im Szenario gespeichert.
5. Abspielen:
   - Play/Pause in der Timeline (Leertaste) oder Buttons.
   - ← / → für Schritt‑Weise Navigation.
6. Vergleich:
   - Erzeuge mehrere Runs für dasselbe Szenario und wechsle in Multi‑View / Comparison Panel.

Kurzbefehle (Standard):
- Leertaste: Play / Pause
- ← / → : Schritt rückwärts / Schritt vorwärts
- R : Reset
- + / − : Zoom (sofern aktiviert)

---

## 3. UI‑Elemente und ihre Bedeutung

### Gantt / Timeline (Hauptbereich)
- Balken = CPU‑Ausführungssegmente pro Prozess.
- Farbe = Prozess‑ID; Segmenthöhe/Level zeigt MLFQ‑Queue‑Level an.
- Idle‑Segmente zeigen CPU‑Leerlauf.
- Interaktion: Klick auf Segment zeigt Details (Process ID, Zeitraum, Event‑Hinweis).

### Controls (unter/über der Timeline)
- Play / Pause, Seek, Loop, Step Back/Forward, Zoom.
- Loop aktiviert kontinuierliche Wiedergabe.

### Ready‑Queue / Stack (Side column)
- Zeigt wartende Prozesse an.
- LCFS = Stack (Last‑in‑first‑out), MLFQ = mehrere Levels (oberste Level = höhere Priorität).

### Event‑Log (Side column)
- Listet alle Zustandswechsel: arrival, dispatch, start, preempt, quantumExpired, finish, contextSwitch.
- Jeder Eintrag enthält Zeitstempel, Prozess und „reason“ (z. B. "New arrival preempts P1").

### Metrics / Kennzahlen
- averageWaitingTime, averageTurnaroundTime, averageResponseTime, cpuUtilization, idleShare, contextSwitches, preemptionCount, fairnessIndex (Jain).
- Nutze Kennzahlen für quantitative Vergleiche; nutze Timeline/Events zur Ursachenanalyse.

### Snapshots
- Simulation speichert periodische Snapshots (algorithmParams.snapshotInterval). Snapshots steuern Playback‑Genauigkeit.

---

## 4. Parameter: Bedeutung und Empfehlung
- timeQuantum: Zeitscheibe für Round Robin; Basisquantum für MLFQ. Empfehlung für Demos: 1–3.
- snapshotInterval: Abstand (Ticks) zwischen gespeicherten Snapshots. Standard: 1. Größere Werte → weniger Speicher, gröbere Wiedergabe.
- queueLevels (MLFQ): Anzahl Stufen. App nutzt typ. 2–3. Mehr Stufen möglich, falls erweitert.
- mlfqMode: "classic" (behalte remaindering quantum) oder "simplified" (neues Level beginnt mit vollem Quantum).
- lcfsMode: "preemptive"/"nonPreemptive" — bestimmt ob neu ankommende Prozesse laufende unterbrechen.
- tieBreak‑Strategien: strictPriorityTieBreak, lcfsTieBreak — beeinflussen Auswahl bei Gleichstand.

Empfehlung: Für Lehrdemos 3–5 Prozesse mit variablem arrival (0..n) und Burst 1..15; quantum 1–3; snapshotInterval 1–2.

---

## 5. Wie liest man die Visualisierung — Interpretationshilfen
- Wer läuft gerade? → aktuelles Segment / currentProcessId im Snapshot.
- Warum preempted? → Event‑Log (reason gibt an: arrival / higher priority / quantum expired).
- Wo ist die Last? → CPU‑Auslastung vs Idle‑Share.
- Starvation prüfen: sehr hohe Turnaround/Waiting Time für einzelne Prozesse.

Beispiel: RR, quantum=1 zeigt viele contextSwitches (erwartet). Vergleiche mit RR, quantum=4 (weniger switches, längere response times).

Mini‑Checkliste (bei Analyse):
- Stimmen Startreihenfolge und Ankunftszeiten? 
- Welche Events erklären Preemption? 
- Gibt es Starvation oder starke Demotion in MLFQ?

---

## 6. Typische Workflows / Lehraktivitäten

### A) Schnellvergleich von Algorithmen
1. Erstelle ein Szenario (4 Prozesse, verschiedene Arrival/Burst).
2. Run A: Round Robin (quantum=2) — speichere Run.
3. Run B: Strict Priority — speichere Run.
4. Multi‑View vergleichen: Timeline, Event‑Log, Kennzahlen.

### B) Demonstration von Preemption (LCFS)
- Szenario: P1 burst=10, P2 arrival=2 burst=1.
- LCFS (preemptive): P2 sollte P1 preempten; Event‑Log zeigt preempt Event.

### C) MLFQ Experimente
- Beobachte Demotion bei Quantum‑Ablauf. Teste classic vs simplified.

---

## 7. Beispielaufgaben für Lehrveranstaltungen
1. Vergleiche RR (q=1) vs RR (q=4): Welche Effekte auf response und turnaround? Warum?
2. Strict Priority: Erzeuge Prozesse mit gleichen Prioritäten und vergleiche Tie‑Breaks.
3. MLFQ: Erstelle Szenario, das kurze Jobs bevorzugt; diskutiere Fairness und Durchsatz.

---

## 8. Reproduzierbarkeit, Export & Technikhinweise
- Seed: `createSeededScenarioProcesses(seed, count)` erzeugt deterministische Szenarien. Dokumentiere Seed in Versuchsprotokoll.
- Speicherung: Szenarien werden in `localStorage` abgelegt.
- Export/Import: Aktuell Copy/Paste aus Szenario‑Editor; Feature: JSON‑Export/Import kann ergänzt werden.
- maxTicks: Schutz vor Endlosschleifen. Standardwert: Summe der Bursts + maxArrival + 25. Bei Bedarf anpassen.

---

## 9. Interna: MLFQ & Implementierungsdetails (für Prüfende)
- queueLevels werden auf Minimum 2 normalisiert; default ist 3.
- quantumForLevel(base, level) = base * (level + 1) (lineare Skalierung).
- mlfqMode "classic": verbleibendes Quantum wird beibehalten (mlfqRemainingQuantum). "simplified": neues Level beginnt mit vollem Level‑Quantum.
- Strict Priority tieBreak: unterstützt 'fifo', 'arrivalTime', 'remainingTime', 'waitingTime', 'id'. Bei 'fifo'/'id' wird die vorhandene Reihenfolge genutzt.
- LCFS: Enqueue/Unshift / Pop‑Logik bildet Stack‑Verhalten ab; in preemptive Mode wird neu ankommender Prozess bevorzugt.

Dokumentiere diese Designentscheidungen in der Arbeit (warum lineare Quantum‑Skalierung, warum queueLevels begrenzt, etc.).

---

## 10. Tests & Validierung
Empfehlung: automatisierte Unit‑Tests (Vitest) für Determinismus & Basisszenarien:
- Tests die deterministischen Output für identische Inputs prüfen.
- Szenarien für: RR quantum expiry, LCFS preemption, Strict Priority tieBreak, MLFQ demotion.

Beispieltest (Vitest):
```ts
import { describe, it, expect } from 'vitest';
import { simulateScenario } from '@/simulation';

it('deterministic for same input', () => {
  const s = { algorithm: 'roundRobin', algorithmParams: { timeQuantum: 1, snapshotInterval: 1 }, processes: [ { id:'P1', name:'P1', arrivalTime:0, burstTime:3, priority:1 }, { id:'P2', name:'P2', arrivalTime:1, burstTime:2, priority:1 } ] };
  const a = simulateScenario(s as any);
  const b = simulateScenario(s as any);
  expect(a.totalTime).toBe(b.totalTime);
  expect(JSON.stringify(a.segments)).toBe(JSON.stringify(b.segments));
});
```

Lege Test‑Fixtures mit erwarteten timelines an — das stärkt die Argumentation in der Abgabe.

---

## 11. Tour: Plan für eine interaktive Kurz‑Tour (4–6 Schritte)
Ziel: Nutzer*innen in 2–3 Minuten durch die Kernfunktionen führen und ein Beispiel‑Szenario abspielen.

### Steps (deutsch):
1. Begrüßung – Kurzer Überblick. CTA: Tour starten / Später.
2. Szenario‑Generator – Öffne Generator, zeige Prozessfeld, + Prozess hinzufügen.
3. Algorithmus anwenden – Öffne Algorithmus‑Modal, wähle Round Robin, setze Quantum.
4. Timeline & Wiedergabe – Zeige Play/Pause, Schrittsteuerung, Eventlog.
5. Kennzahlen & Vergleich – Zeige Metric‑Panel und Multi‑View für Vergleiche.
6. Abschluss – Tour beenden, Key saved to localStorage (scheduling-visualizer.tourSeen = 'true').

### Accessibility & Verhalten
- Fokus‑Trap, Tastatursteuerung (Tab, Enter, Esc), prefers‑reduced‑motion beachten.
- Speichere Abbruch/Beenden im localStorage.
- Mobile: Fallback zum zentralen Overlay bei kleinen Bildschirmen.

### Implementierungsoptionen
- Shepherd.js (empfohlen) — gute A11y und API.
- Eigenbau‑Composable — kleiner Footprint, mehr Kontrolle.

---

## 12. Barrierefreiheit & Shortcuts
- Shortcuts:
  - Leertaste: Play / Pause
  - ← / → : Schritt zurück / Schritt vor
  - R : Reset
- Accessibility‑Hinweise:
  - Alle interaktiven Elemente sind per Tastatur erreichbar.
  - prefers‑reduced‑motion wird respektiert.
  - ARIA‑Attribute: modals haben role="dialog" und aria‑labels; Gantt‑Segmente haben textuelle Beschreibungen.

---

## 13. Troubleshooting / FAQ
Q: Simulation endet vorzeitig?
- A: `maxTicks` ist Schutz gegen Endlosschleifen. Passe tickLimit oder Szenario an.

Q: Response Time = null?
- A: Response Time wird beim ersten Start (startedAt) gesetzt. Falls null, hat Prozess nie CPU bekommen.

Q: Unterschiedliche Ergebnisse bei gleichen Eingaben?
- A: Prüfe seed, algorithmParams, snapshotInterval. App ist deterministisch bei gleichen Eingaben.

Q: Szenarien teilen?
- A: Copy/Paste aus Szenario‑Editor; JSON‑Export/Import ist empfohlen und kann ergänzt werden.

---

## 14. Weiterführende Literatur & Repo‑Orte
- `bibliography_selected.bib` (Repo root) — zentrale Referenzen zur Didaktik & Scheduling.
- `preparation/Exposé – Scheduling-visualisierung.txt` — Exposé / Motivation.
- `src/simulation.ts` — Simulationslogik (MLFQ, RR, LCFS, Strict Priority).

---

## 15. Nächste Schritte / Vorschläge
- JSON‑Export/Import für Szenarien (für Lehrende / Abgabe). 
- Interaktive Kurz‑Tour (Shepherd.js) implementieren und verlinken im Willkommensmodal.
- Test‑Suite erweitern mit Fixtures & CI (Vitest + GitHub Actions).
- Optional: PDF/HTML‑Report‑Export von Runs (für Abgabe und Prüfung).

---

Wenn du möchtest, committe ich diese Datei als `docs/help.md` in das Repository. Soll ich das tun? Antworte mit „Ja, committe die Datei“ oder „Noch anpassen: <Beschreibung>".