# Hilfe — Scheduling Visualizer (aktualisiert)

Diese Hilfeseite fasst alle relevanten Informationen zur Benutzung, Interpretation und Erweiterung der Scheduling Visualizer‑Webapp zusammen. Sie enthält Quickstart‑Anleitungen, UI‑Erklärungen, Parameter‑Beschreibungen, didaktische Aufgaben, Implementierungs‑Hinweise (Reproduzierbarkeit, Tests), eine geplante Kurz‑Tour, Barrierefreiheits‑Hinweise, Troubleshooting sowie Hinweise zu Starvation und SRTF.

---

## 1. Ziel der App

Die Scheduling Visualizer ist ein clientseitiges Lehrwerkzeug zur interaktiven Demonstration präemptiver Scheduling‑Algorithmen (Round Robin, SRTF, LCFS, Strict Priority, MLFQ). Ziel ist, Abläufe (Kontextwechsel, Preemption, Warteschlangen, Queue‑Levels) anschaulich sichtbar zu machen und quantitative Kennzahlen vergleichbar darzustellen. Die Simulation läuft vollständig im Browser; Szenarien werden in `localStorage` gespeichert.

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

- Lege mindestens 2 Prozesse an (ID, Ankunft, Rechenzeit, Priorität, Farbe).

4. Algorithmus anwenden:

- Öffne „Algorithmus anwenden“ → wähle z. B. Round Robin oder SRTF und setze die relevanten Parameter.
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
- - / − : Zoom (sofern aktiviert)

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
- Jeder Eintrag enthält Zeitstempel, Prozess und „reason" (z. B. "New arrival preempts P1").

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
- mlfqMode: "classic" (behalte verbleibendes Quantum) oder "simplified" (neues Level beginnt mit vollem Quantum).
- lcfsMode: bleibt aus Kompatibilitätsgründen im Datenmodell erhalten; LCFS ist immer präemptiv.
- sjfMode: bleibt aus Kompatibilitätsgründen im Datenmodell erhalten; `sjf` wird immer als SRTF präemptiv ausgeführt.
- tieBreak‑Strategien: strictPriorityTieBreak, lcfsTieBreak — beeinflussen Auswahl bei Gleichstand.

Empfehlung: Für Lehrdemos 3–5 Prozesse mit variablem arrival (0..n) und Rechenzeit 1..15; quantum 1–3; snapshotInterval 1–2.

---

## 5. Shortest Remaining Time First (SRTF) — Erklärung und Didaktik

SRTF wählt den Prozess mit der geringsten verbleibenden Ausführungszeit. Trifft ein kürzerer Prozess ein, wird der laufende Prozess präemptiert. Bei gleicher Restzeit entscheidet die frühere Ankunft, danach die Prozess-ID.

Didaktische Hinweise:

- SRTF minimiert durchschnittliche Wartezeit in vielen Szenarien, provoziert aber Starvation für lange Prozesse, wenn ständig kürzere Jobs ankommen.
- Verwende SRTF im Unterricht, um Trade‑offs zwischen Throughput, averageWaitingTime und Fairness zu demonstrieren. Vergleiche SRTF mit RR und MLFQ.

Empirische Aktivität:

- Erstelle ein Szenario mit vielen kurzlebigen Jobs, plus einen sehr langen Job. Vergleiche Runs mit SRTF, RR (q=1) und MLFQ — beobachte Starvation und Fairnessindex.

---

## 6. Starvation — Erkennung, Gründe und Gegenmaßnahmen

### Was ist Starvation?

Starvation tritt auf, wenn ein Prozess über sehr lange Zeit keinen CPU‑Zugriff erhält, typischerweise weil andere Prozesse kontinuierlich bevorzugt werden (z. B. SRTF oder Strict Priority ohne Aging).

### Erkennung in der App

- Hohe/steigende `waitingTime` oder `turnaroundTime` eines Prozesses im Vergleich zu anderen.
- `responseTime` bleibt sehr groß oder `startedAt` ist null für lange Zeit.
- Fairnessindex (Jain) nahe 0 → ungleiche Verteilung.
- Beobachte Event‑Log: wenn derselbe Prozess immer wieder preempted oder ständig hinten reingestellt wird.

### Didaktische Diskussion

- Diskutiere, warum SRTF zu Starvation führen kann (lange Jobs werden immer verschoben, wenn neue kurze Jobs ankommen).
- Zeige, wie MLFQ versucht, Starvation zu vermeiden (Demotion nach Quantum → lange Jobs wandern in niedrigere Levels, erhalten aber garantiert CPU, ggf. mit aging/boosts).

### Gegenmaßnahmen (Design‑/Experimentieroptionen)

- Aging: Erhöhe Priorität von wartenden Prozessen nach Zeit (nicht aktuell implementiert; Vorschlag als Erweiterung).
- Periodische Priority Boost: Gelegentliche Erhöhung aller Prozesse in niedrigen Levels (MLFQ Erweiterung).
- Kombiniere SRTF‑Einsätze mit Timeout oder maxWait thresholds.
- In Simulation: überwache waitingTime und löse optional Alarm/Annotation aus, wenn waitingTime > threshold (z. B. 5× durchschnittliche Rechenzeit).

### Beispielaufgabe zur Starvation

- Aufgabe: Erzeuge 1 langen Prozess (Rechenzeit=50) und 20 kurze Prozesse (Rechenzeit=1..3, zufällig ankommend). Vergleiche: SRTF, RR (q=1), MLFQ. Diskutiere, welcher Algorithmus Starvation zeigt und warum.

---

## 7. Wie liest man die Visualisierung — Interpretationshilfen

- Wer läuft gerade? → aktuelles Segment / currentProcessId im Snapshot.
- Warum preempted? → Event‑Log (reason gibt an: arrival / higher priority / quantum expired / shorter job arrived bei SRTF).
- Wo ist die Last? → CPU‑Auslastung vs Idle‑Share.
- Starvation prüfen: sehr hohe Turnaround/Waiting Time für einzelne Prozesse.

Beispiel: RR, quantum=1 zeigt viele contextSwitches (erwartet). SRTF kann sehr niedrige averageWaitingTime, aber hohe Starvation für lange Jobs verursachen.

Mini‑Checkliste (bei Analyse):

- Stimmen Startreihenfolge und Ankunftszeiten?
- Welche Events erklären Preemption?
- Gibt es Starvation oder starke Demotion in MLFQ?

---

## 8. Typische Workflows / Lehraktivitäten (inkl. SRTF & Starvation)

### A) Schnellvergleich von Algorithmen

1. Erstelle ein Szenario (4 Prozesse, verschiedene Arrival/Rechenzeit).
2. Run A: Round Robin (quantum=2) — speichere Run.
3. Run B: SRTF — speichere Run.
4. Multi‑View vergleichen: Timeline, Event‑Log, Kennzahlen.

### B) Demonstration von Starvation (SRTF)

- Szenario: 1 langer Prozess (Rechenzeit 50), viele kurze Prozesse (Rechenzeit 1–3) mit gestaffelten Ankünften.
- Beobachtung: Der lange Prozess erhält ggf. sehr spät CPU → hohes turnaround/ waiting → diskutieren (Affekt von SJF).

### C) MLFQ vs SRTF

- Zeige, wie MLFQ kürzere Jobs bevorzugt, aber durch Demotion/Aging faireren Zugang gewährleistet.

---

## 9. Reproduzierbarkeit, Export & Technikhinweise

- Seed: `createSeededScenarioProcesses(seed, count)` erzeugt deterministische Szenarien. Dokumentiere Seed in Versuchsprotokoll.
- Speicherung: Szenarien werden in `localStorage` abgelegt.
- Export/Import: Aktuell Copy/Paste aus Szenario‑Editor; Feature: JSON‑Export/Import kann ergänzt werden.
- maxTicks: Schutz vor Endlosschleifen. Standardwert: Summe der Rechenzeiten + maxArrival + 25. Bei Bedarf anpassen.

---

## 10. Interna: MLFQ, SRTF & Implementierungsdetails (für Prüfende)

- `isAlgorithmType` enthält jetzt: "roundRobin", "sjf", "lcfs", "strictPriority", "mlfq".
- `sjfMode` bleibt aus Kompatibilitätsgründen erhalten und ist immer "preemptive" (SRTF).
- queueLevels werden auf Minimum 2 normalisiert; default ist 3.
- `quantumForLevel(base, level) = base * (level + 1)` (lineare Skalierung).
- `mlfqMode` "classic": verbleibendes Quantum wird beibehalten (`mlfqRemainingQuantum`). "simplified": neues Level beginnt mit vollem Level‑Quantum.
- Strict Priority tieBreak: unterstützt 'fifo', 'arrivalTime', 'remainingTime', 'waitingTime', 'id'.
- LCFS: Enqueue/Unshift / Pop‑Logik bildet Stack‑Verhalten ab; in preemptive Mode wird neu ankommender Prozess bevorzugt.

Dokumentiere diese Designentscheidungen: warum lineare Quantum‑Skalierung gewählt wurde, warum queueLevels begrenzt sind, und wie SRTF arrivals gegen `remainingTime` prüft und bei strikt kürzerer Restlaufzeit präemptiert.

---

## 11. Tests & Validierung (inkl. SRTF)

Empfehlung: automatisierte Unit‑Tests (Vitest) für Determinismus & Basisszenarien:

- Tests die deterministischen Output für identische Inputs prüfen.
- Szenarien für: RR quantum expiry, LCFS preemption, Strict Priority tieBreak, MLFQ demotion, SRTF behavior.

Beispieltests (Vitest):

```ts
import { describe, it, expect } from "vitest";
import { simulateScenario } from "@/simulation";

it("deterministic for same input", () => {
  const s = {
    algorithm: "roundRobin",
    algorithmParams: { timeQuantum: 1, snapshotInterval: 1 },
    processes: [
      { id: "P1", name: "P1", arrivalTime: 0, burstTime: 3, priority: 1 },
      { id: "P2", name: "P2", arrivalTime: 1, burstTime: 2, priority: 1 },
    ],
  };
  const a = simulateScenario(s as any);
  const b = simulateScenario(s as any);
  expect(a.totalTime).toBe(b.totalTime);
  expect(JSON.stringify(a.segments)).toBe(JSON.stringify(b.segments));
});

it("SRTF should preempt longer job when shorter arrives", () => {
  const s = {
    algorithm: "sjf",
    algorithmParams: { sjfMode: "preemptive", snapshotInterval: 1 },
    processes: [
      { id: "P1", name: "P1", arrivalTime: 0, burstTime: 10, priority: 1 },
      { id: "P2", name: "P2", arrivalTime: 1, burstTime: 1, priority: 1 },
    ],
  };
  const run = simulateScenario(s as any);
  const preempt = run.events.some(
    (e) => e.type === "preempt" && e.processId === "P1",
  );
  expect(preempt).toBe(true);
});
```

Lege Test‑Fixtures mit erwarteten timelines an — das stärkt die Argumentation in der Abgabe.

---

## 12. Tour: Plan für eine interaktive Kurz‑Tour (4–6 Schritte)

Ziel: Nutzer\*innen in 2–3 Minuten durch die Kernfunktionen führen und ein Beispiel‑Szenario abspielen. Tour aktualisiert, damit SRTF & Hinweise zu Starvation sichtbar werden.

### Steps (deutsch):

1. Begrüßung – Kurzer Überblick. CTA: Tour starten / Später.
2. Szenario‑Generator – Öffne Generator, zeige Prozessfeld, + Prozess hinzufügen.
3. Algorithmus anwenden – Öffne Algorithmus‑Modal, wähle SRTF und Round Robin zum Vergleich.
4. Timeline & Wiedergabe – Zeige Play/Pause, Schrittsteuerung, Eventlog; hebe Preempt/quantumExpired Events hervor.
5. Starvation‑Check – Zeige wo im UI wartende Prozesse mit hoher waitingTime sichtbar sind, erkläre Fairnessindex und Vorschläge zur Gegensteuerung (Aging, Priority Boost).
6. Abschluss – Tour beenden, Key saved to localStorage (scheduling-visualizer.tourSeen = 'true').

### Accessibility & Verhalten

- Fokus‑Trap, Tastatursteuerung (Tab, Enter, Esc), prefers‑reduced‑motion beachten.
- Speichere Abbruch/Beenden im localStorage.
- Mobile: Fallback zum zentralen Overlay bei kleinen Bildschirmen.

---

## 13. Barrierefreiheit & Shortcuts

- Shortcuts:
  - Leertaste: Play / Pause
  - ← / → : Schritt zurück / Schritt vor
  - R : Reset
- Accessibility‑Hinweise:
  - Alle interaktiven Elemente sind per Tastatur erreichbar.
  - prefers‑reduced‑motion wird respektiert.
  - ARIA‑Attribute: modals haben role="dialog" und aria‑labels; Gantt‑Segmente haben textuelle Beschreibungen.

---

## 14. Troubleshooting / FAQ

Q: Simulation endet vorzeitig?

- A: `maxTicks` ist Schutz gegen Endlosschleifen. Passe tickLimit oder Szenario an.

Q: Response Time = null?

- A: Response Time wird beim ersten Start (startedAt) gesetzt. Falls null, hat Prozess nie CPU bekommen.

Q: Unterschiedliche Ergebnisse bei gleichen Eingaben?

- A: Prüfe seed, algorithmParams, snapshotInterval. App ist deterministisch bei gleichen Eingaben.

Q: Wie erkenne ich Starvation?

- A: Ein Prozess mit stetig wachsender waitingTime, ohne jemals CPU zu erhalten; sehr hoher turnaround im Vergleich zu anderen; Fairnessindex niedrig.

Q: Szenarien teilen?

- A: Copy/Paste aus Szenario‑Editor; JSON‑Export/Import ist empfohlen und kann ergänzt werden.

---

## 15. Weiterführende Literatur & Repo‑Orte

- `bibliography_selected.bib` (Repo root) — zentrale Referenzen zur Didaktik & Scheduling.
- `preparation/Exposé – Scheduling-visualisierung.txt` — Exposé / Motivation.
- `src/simulation.ts` — Simulationslogik (MLFQ, RR, LCFS, Strict Priority, SRTF).

---

## 16. Nächste Schritte / Vorschläge

- JSON‑Export/Import für Szenarien (für Lehrende / Abgabe).
- Interaktive Kurz‑Tour (Shepherd.js) implementieren und verlinken im Willkommensmodal.
- Test‑Suite erweitern mit Fixtures & CI (Vitest + GitHub Actions).
- Optional: PDF/HTML‑Report‑Export von Runs (für Abgabe und Prüfung).

---
