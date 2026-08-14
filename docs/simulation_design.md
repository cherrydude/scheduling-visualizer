# Simulation design — model, parameters, and metrics

Kurzüberblick

- Unterstützte Algorithmen: `roundRobin`, `lcfs`, `strictPriority`, `mlfq`.
- Ziel: deterministische, reproducebare diskrete‑Ereignis‑Simulation für Scheduler‑Visualisierung.

Konfiguration / Eingabe

- `timeQuantum` (number): Basis‑Zeitscheibe für RR / MLFQ (integer ≥1).
- `snapshotInterval` (number): Intervall (Ticks) für Snapshots (default 1).
- `queueLevels` (number): Anzahl MLFQ‑Queues (min 2, default 3).
- `mlfqMode` ("classic" | "simplified"): Classic speichert verbleibende Quantum‑Restwerte.
- `strictPriorityTieBreak` ("fifo"|"arrivalTime"|"remainingTime"|"waitingTime"|"id"): Entscheidung bei gleicher Priorität.
- `lcfsMode` ("preemptive"|"nonpreemptive"): Verhalten bei neuen Ankünften.

MLFQ Details

- `quantumForLevel(baseQuantum, level) = max(1, baseQuantum * (level + 1))` (lineare Skalierung).
- Classic Mode: `mlfqRemainingQuantum` pro Prozess wird erhalten, bei Preemption wiederverwendet.
- On quantum expiry (remainingQuantum ≤ 0) wird Prozess in niedrigere Queue demoted und `quantumExpired` Event erzeugt.

Tie‑Break Verhalten (Strict Priority)

- `fifo`/`id`: ursprüngliche Reihenfolge bleibt erhalten (score = +∞).
- `arrivalTime`: kleinere `arrivalTime` gewinnt.
- `remainingTime`: kleinere `remainingTime` gewinnt (nützlich für SJF‑ähnliche Auswahl).
- `waitingTime`: Prozess mit längerem Warten gewinnt.

Snapshot / Events / API

- Snapshots enthalten: `time`, `currentProcessId`, `currentProcessName`, `readyQueue` (names), `readyQueueLevels`, `metrics` (siehe unten), `lastEvent`.
- Events: `arrival`, `dispatch`, `start`, `finish`, `preempt`, `quantumExpired`, `contextSwitch`.
- Hinweis: Nutze `process.id` für robuste Tests; Snapshots enthalten aktuell `readyQueue` als Namen — überlege `readyQueueIds` hinzuzufügen.

Metriken (Implementation)

- `averageWaitingTime`: Mittelwert über abgeschlossene Prozesse (waitingTime).
- `averageTurnaroundTime`: Mittelwert über abgeschlossene Prozesse (turnaroundTime).
- `averageResponseTime`: Mittelwert über Prozesse mit definiertem `responseTime` (nur numeric values werden berücksichtigt).
- `cpuUtilization`: `busyTicks / totalTime` (0 wenn totalTime == 0).
- `preemptionCount`: Anzahl `preempt` + `quantumExpired` Events.
- `fairnessIndex`: Jain's fairness über `executedTime` (nur ausgeführte Zeit >0).

Reproduzierbarkeit

- Szenarien können mit `createSeededScenarioProcesses(seed, count)` deterministisch erzeugt werden.
- Dokumentiere in der Arbeit wie Seeds gewählt und reproduziert werden.

Grenzfälle & Performance

- `maxTicks` schützt vor Endlosschleifen (Summe Bursts + maxArrival + 25).
- Bei grossen Szenarien (50+ Prozesse): erhöhe `snapshotInterval` oder implementiere Snapshot‑Coalescing, um Memory/Performance zu schonen.

Empfehlungen vor Abgabe

- Führe unit‑tests für jede Algorithmusklasse (RR, LCFS, StrictPriority, MLFQ). Beispiele unter `tests/`.
- Ergänze Snapshot‑IDs (readyQueueIds) für reproduzierbare Tests.
- Beschreibe in der Arbeit die Wahl der MLFQ‑Parametrisierung und Tie‑Break‑Strategien.
