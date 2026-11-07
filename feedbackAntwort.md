# Vorbereitung auf die mündliche Prüfung

Dieses Dokument beantwortet das erhaltene Feedback und ordnet die Antworten an der konkreten Implementierung des Scheduling-Visualizers ein.

## 1. Was muss ich in der Prüfung zeigen?

Ich muss nicht jede einzelne Codezeile auswendig kennen. Ich muss die zentralen Entscheidungen erklären können:

1. Welche Daten kommen in die Simulation?
2. Wie wird daraus ein `SimulationRun` erzeugt?
3. Wie wird pro Tick entschieden, welcher Prozess läuft?
4. Wie werden Präemptionen und Quantumabläufe behandelt?
5. Wie gelangen die Ergebnisse in Gantt-, Stack- und Kennzahlenansicht?
6. Wie wird geprüft, dass die Ergebnisse korrekt und stabil sind?

Die wichtigste Erklärungskette lautet:

```text
Scenario + Run-Konfiguration
        |
        v
simulateScenario()
        |
        v
SimulationRun
        |
        +--> events
        +--> snapshots
        +--> segments
        +--> finalMetrics
        +--> processStates
```

Die Oberfläche berechnet den Scheduler nicht selbst. Sie zeigt die vom Simulationskern erzeugten Ergebnisse an und navigiert über Snapshots durch den bereits berechneten Ablauf.

## 2. Zentrale Dateien und Verantwortlichkeiten

| Datei oder Bereich                        | Aufgabe                                              |
| ----------------------------------------- | ---------------------------------------------------- |
| `src/types.ts`                            | Gemeinsame TypeScript-Typen und Datenverträge        |
| `src/simulation.ts`                       | Normalisierung, Scheduling-Logik und Ergebnisbildung |
| `src/AppShell.vue`                        | Koordination der Ansichten und Benutzerinteraktion   |
| `src/components/Gantt.vue`                | SVG-Darstellung der Zeitsegmente                     |
| `src/components/GanttWithGsap.vue`        | Playback-Anbindung und Darstellungseffekte           |
| `src/components/StackList.vue`            | Queue- und Prozessstatusdarstellung                  |
| `src/composables/useScenarioWorkspace.ts` | Szenarien, Runs und lokale Persistenz                |
| `src/composables/usePlayback.ts`          | Start, Pause, Schrittsteuerung und Seek              |
| `tests/simulation*.ts`                    | Tests des Simulationskerns                           |
| `tests/workspace.test.ts`                 | Tests der Szenario- und Run-Verwaltung               |

## 3. Was ist ein Interface?

Ein Interface beschreibt in TypeScript die erwartete Form eines Objekts. Es definiert also, welche Eigenschaften vorhanden sein müssen und welche Typen diese Eigenschaften besitzen. Es erzeugt zur Laufzeit keinen JavaScript-Code.

Beispiel aus `src/types.ts`:

```ts
export interface ProcessInput {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color: string;
  group?: string;
}
```

Ein gültiges `ProcessInput`-Objekt muss `id`, `name`, `arrivalTime`, `burstTime`, `priority` und `color` besitzen. `group` ist optional, weil es mit `?` gekennzeichnet ist.

Ein Interface ist kein Validator für Daten aus dem Browser oder aus JSON. Es hilft dem TypeScript-Compiler bei der statischen Prüfung. Externe Daten müssen zusätzlich zur Laufzeit geprüft und normalisiert werden. Das geschieht in `normalizeScenarioInput()`.

### Interface versus Type

In diesem Projekt werden beide Formen verwendet:

```ts
type AlgorithmType = "roundRobin" | "lcfs" | "strictPriority" | "mlfq" | "sjf";
```

Ein `type` eignet sich hier gut für eine Union fester Zeichenketten. Ein `interface` beschreibt dagegen die Struktur eines Objekts. Beides sind TypeScript-Konstrukte und werden beim Kompilieren entfernt.

### Gute mündliche Antwort

> Ein Interface ist ein statischer Vertrag für die Struktur eines Objekts. Es hilft bei Autovervollständigung und Compile-Time-Prüfung, validiert aber keine Laufzeitdaten. Deshalb kombiniere ich Interfaces mit Laufzeitprüfungen, zum Beispiel in der Normalisierung des Szenarios.

## 4. Exception Handling in TypeScript

JavaScript und TypeScript verwenden für Ausnahmen `try`, `catch` und optional `finally`:

```ts
try {
  const value = JSON.parse(input);
  useScenario(value);
} catch (error) {
  showImportError(error);
}
```

TypeScript prüft nicht, ob eine Funktion tatsächlich eine Exception wirft. Eine Funktion kann also weiterhin zur Laufzeit einen Fehler erzeugen, auch wenn ihre Typen korrekt sind.

Seit modernen TypeScript-Versionen ist der Wert im `catch` standardmäßig `unknown`. Deshalb sollte ich ihn nicht ungeprüft als `Error` behandeln:

```ts
function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
```

### Wo wird Fehlerbehandlung im Projekt verwendet?

In `src/components/StackList.vue` wird beim Auflösen von CSS-Farbvariablen über `getComputedStyle()` ein Fehler abgefangen:

```ts
try {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    variableName,
  );
  if (value) {
    hex = value.trim();
  }
} catch (error) {
  // Fallback: Der Wert wird anschließend wie ein normaler Farbwert verarbeitet.
}
```

Das ist sinnvoll, weil DOM-Zugriffe oder das Parsen eines unerwarteten Farbwerts zur Laufzeit scheitern können. Die Darstellung fällt dann auf eine Standardfarbe zurück.

### Was macht dieses Projekt zusätzlich?

Der Simulationskern verwendet an vielen Stellen defensive Normalisierung statt Exceptions:

```ts
function clampPositiveInteger(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}
```

Die Funktion akzeptiert unbekannte Eingaben, versucht sie in eine Zahl umzuwandeln und verwendet bei ungültigen Werten einen definierten Fallback. Für Benutzereingaben ist das hier angemessen, weil ungültige Szenariowerte nicht zwangsläufig einen Programmabbruch auslösen sollen.

### Unterschied: Exception Handling und Validierung

- **Validierung:** Ist ein Wert gültig? Beispiel: Ist `timeQuantum` eine endliche positive Zahl?
- **Exception Handling:** Was passiert, wenn eine Operation unerwartet fehlschlägt? Beispiel: `JSON.parse()` oder ein DOM-Zugriff.
- **Fallback:** Welcher definierte Ersatzwert wird verwendet?

### Gute mündliche Antwort

> TypeScript verhindert nicht alle Laufzeitfehler. Es prüft Typen statisch, aber externe Eingaben und DOM-Operationen müssen zusätzlich zur Laufzeit abgesichert werden. In meinem Projekt verwende ich bei Eingabedaten Normalisierung mit Fallbacks und bei potenziell fehlschlagenden Operationen `try/catch`. Im `catch` behandle ich den Fehler als `unknown` und prüfe ihn mit `instanceof Error`.

## 5. Pseudocode von Seite 35: Wo ist das im Code?

Das Pseudocode-Listing auf Seite 35 beschreibt den Ablauf von `simulateScenario()` in `src/simulation.ts`. Es ist eine Abstraktion und keine wörtliche Kopie der Implementierung.

| Pseudocode                                 | Konkreter Code                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Eingaben normalisieren                     | `normalizeScenarioInput(scenario)`                                                                                  |
| Laufzeitprozesse erzeugen                  | `createRuntime(simulationScenario.processes)`                                                                       |
| Zeit und Ergebnisstrukturen initialisieren | Variablen `time`, `events`, `snapshots`, `segments`, `readyQueue` in `simulateScenario()`                           |
| Eingetroffene Prozesse aufnehmen           | `enqueueArrivals(time)`                                                                                             |
| Leerlauf behandeln                         | `if (!currentProcess && readyQueue.length === 0)`                                                                   |
| Nächsten Prozess auswählen                 | `dispatchProcess(...)`                                                                                              |
| Präemption prüfen                          | `preemptCurrentProcess(...)`, `shouldPreemptSjf(...)`, `shouldPreemptStrictPriority(...)`, `shouldPreemptMlfq(...)` |
| Einen Tick ausführen                       | `busyTicks += 1`, `executedTime += 1`, `remainingTime -= 1`                                                         |
| Quantum aktualisieren                      | `remainingQuantum -= 1` und MLFQ-Quantum-Zustand                                                                    |
| Snapshot erzeugen                          | `maybeSnapshot(false)` und `createSnapshot(...)`                                                                    |
| Prozess abschließen                        | `finalizeProcess(currentProcess, time)`                                                                             |
| Segment speichern                          | `pushSegment(time)`                                                                                                 |
| Zeit erhöhen                               | `time += 1`                                                                                                         |
| Ergebnis zurückgeben                       | Rückgabeobjekt am Ende von `simulateScenario()`                                                                     |

### Ablauf in verständlicher Reihenfolge

1. Das Szenario wird normalisiert.
2. Aus jedem Eingabeprozess wird ein Laufzeitprozess mit Restzeit und Status erzeugt.
3. Prozesse mit erreichter Ankunftszeit werden in die Ready Queue aufgenommen.
4. Falls kein Prozess läuft, wählt `dispatchProcess()` einen Prozess entsprechend dem Verfahren.
5. Der aktive Prozess erhält genau einen Tick CPU-Zeit.
6. Restzeit, ausgeführte Zeit, Quantum und Simulationszeit werden aktualisiert.
7. Neue Ankünfte und mögliche Präemptionen werden verarbeitet.
8. Bei Abschluss, Quantumablauf oder Präemption wird ein Segment gespeichert und ein Ereignis erzeugt.
9. Ein Snapshot speichert den Zustand für die spätere Wiedergabe.
10. Nach Abschluss aller Prozesse wird `SimulationRun` zurückgegeben.

### Wichtiges Detail für die Prüfung

Die Reihenfolge innerhalb eines Ticks ist fachlich relevant. Im aktuellen Code wird nach der Ausführung eines Ticks die Zeit erhöht, anschließend werden neue Ankünfte verarbeitet und danach Präemptionen geprüft. Dadurch kann eine Ankunft bei einem bestimmten Zeitpunkt die nächste Auswahlentscheidung beeinflussen.

### Gute mündliche Antwort

> Das Listing auf Seite 35 ist bewusst vereinfachter Pseudocode. Die konkrete Umsetzung liegt in `simulateScenario()`. Die Auswahl wird an `dispatchProcess()` delegiert, die Ankunftsverarbeitung an `enqueueArrivals()`, Präemptionen an `preemptCurrentProcess()` und die Snapshots an `maybeSnapshot()`. Das Listing beschreibt also den Kontrollfluss, während die Hilfsfunktionen die einzelnen Verantwortlichkeiten kapseln.

## 6. Die wichtigsten Scheduling-Konzepte

### Präemptives Scheduling

Bei präemptivem Scheduling darf der aktuell laufende Prozess vor seinem Abschluss unterbrochen werden. Die CPU wird anschließend einem anderen bereiten Prozess zugeteilt.

Beispiele im Projekt:

- Round Robin: Quantum läuft ab.
- LCFS: Ein neuer Prozess kommt an und verdrängt den laufenden Prozess.
- Strict Priority: Ein Prozess mit höherer Priorität kommt an.
- MLFQ: Ein Prozess verbraucht sein Quantum oder eine höhere Queue wird verfügbar.

### Ready Queue

Die Ready Queue enthält Prozesse, die bereits angekommen sind, noch nicht fertig sind und auf CPU-Zeit warten. Die konkrete Struktur und Auswahl hängen vom Algorithmus ab:

- Round Robin: FIFO, also vorne entnehmen und hinten wieder einreihen.
- LCFS: Stack-Verhalten, also zuletzt eingetroffenen Prozess bevorzugen.
- Strict Priority: Prozess mit kleinstem Prioritätswert bevorzugen.
- MLFQ: Höhere Queue-Level werden zuerst bedient.

### Dispatch

Dispatch bedeutet, dass ein ausgewählter bereiter Prozess den Zustand `running` erhält. Dabei werden unter anderem `startedAt`, `responseTime` und ein Dispatch-Ereignis gesetzt.

### Präemption

Bei einer Präemption wird der laufende Prozess nicht abgeschlossen. Sein Zustand und seine Restzeit bleiben erhalten. Er wird wieder in die Ready Queue eingeordnet und ein anderer Prozess kann laufen.

### Quantum

Ein Quantum ist das maximale Zeitfenster, das ein Prozess bei einem Verfahren wie Round Robin oder MLFQ am Stück erhalten darf. Wird es verbraucht und ist der Prozess noch nicht fertig, wird er unterbrochen.

### MLFQ

MLFQ besitzt mehrere Queue-Level. Neue Prozesse starten in L1. Nach Verbrauch ihres Quantums können sie in ein niedriger priorisiertes Level verschoben werden. Ein Prozess mit längerer bisheriger CPU-Nutzung wird dadurch weniger bevorzugt als ein neuer Prozess in einer höheren Queue.

Im Code wird L1 als `queueLevel: 0` gespeichert. Die Anzeige `L1` entsteht erst in der Oberfläche durch `level + 1`.

### Kontextwechsel

Ein Kontextwechsel wird in diesem Projekt als Kennzahl erfasst, wenn von einem Prozess auf einen anderen gewechselt wird. Die reale Dauer des Kontextwechsels wird nicht als zusätzliche CPU-Zeit modelliert. Das ist eine bewusste Abstraktion des Simulationsmodells.

## 7. Was ist ein Snapshot?

Ein Snapshot ist ein gespeicherter Zustand der Simulation zu einem bestimmten Zeitpunkt. Er enthält beispielsweise:

- aktuellen Zeitpunkt,
- aktuell laufenden Prozess,
- Ready Queue,
- Queue-Level und Quantuminformationen bei MLFQ,
- letztes Ereignis,
- bis dahin berechnete Kennzahlen.

Die Wiedergabe berechnet die Simulation nicht erneut. Sie wählt nur unterschiedliche Snapshots aus. Deshalb sind Start, Pause, Zurück, Vor und Seek unabhängig von der eigentlichen Scheduling-Berechnung.

## 8. Tests erklären können

Ein Test prüft eine erwartete Eigenschaft des Programms mit einer kontrollierten Eingabe.

Beispiel aus `tests/simulation.more.spec.ts`:

```ts
const run = simulateScenario({
  algorithm: "mlfq",
  algorithmParams: {
    timeQuantum: 1,
    queueLevels: 3,
    snapshotInterval: 1,
    mlfqMode: "classic",
  },
  processes: [
    {
      id: "P1",
      name: "P1",
      arrivalTime: 0,
      burstTime: 4,
      priority: 1,
      color: "",
    },
    {
      id: "P12",
      name: "P12",
      arrivalTime: 12,
      burstTime: 1,
      priority: 1,
      color: "",
    },
  ],
});

expect(run.segments.find((segment) => segment.processId === "P12")).toEqual(
  expect.objectContaining({ queueLevel: 0 }),
);
```

Dieser Test prüft die fachliche Regel, dass ein spät eintreffender neuer Prozess in MLFQ trotzdem in L1 startet. Intern entspricht L1 dem Wert `queueLevel: 0`.

### Testarten im Projekt

- **Unit-nahe Simulationstests:** Auswahlregeln, Präemptionen und Metriken.
- **Ergebnisstrukturtests:** Segmentgrenzen, Reihenfolge und Snapshot-Zeitpunkte.
- **Workspace-Tests:** Szenarioverwaltung und Erzeugung von Simulationsszenarien.
- **Accessibility-Tests:** Dialoge, semantische Struktur und ausgewählte UI-Eigenschaften.
- **Runtime-/Real-Accessibility-Tests:** Prüfung im Browser beziehungsweise mit Accessibility-Werkzeugen.

### Warum sind Tests wichtig?

Tests geben reproduzierbare Antworten auf konkrete fachliche Fragen. Der Test für P12 schützt beispielsweise vor einer Regression, bei der ein neuer Prozess fälschlich das Queue-Level eines vorherigen Prozesses übernimmt.

## 9. Testabdeckung erklären können

Code Coverage misst, welche Teile des Codes während eines Testlaufs ausgeführt wurden. Typische Kennzahlen sind:

- **Statements:** Anteil ausgeführter Anweisungen.
- **Branches:** Anteil ausgeführter Verzweigungswege, zum Beispiel beide Seiten eines `if`.
- **Functions:** Anteil aufgerufener Funktionen.
- **Lines:** Anteil ausgeführter Quelltextzeilen.

Coverage ist kein Beweis für Fehlerfreiheit. Ein ausgeführter Codepfad kann fachlich trotzdem falsch sein. Umgekehrt kann ungetesteter Code korrekt sein. Coverage zeigt deshalb vor allem, wo Tests fehlen könnten.

Ausgeführt wird die Testsuite mit:

```bash
npm test
```

Coverage wird erzeugt mit:

```bash
npm run test:coverage
```

Der Build wird geprüft mit:

```bash
npm run build
```

### Wichtige Korrektur für die Arbeit

In der vorliegenden Textfassung steht, dass zehn Testdateien mit 35 Tests ausgeführt wurden. Der zuletzt dokumentierte normale Testlauf meldete jedoch 9 Testdateien und 34 Tests. Vor einer erneuten Abgabe muss daher ein aktueller Coverage-Lauf ausgeführt und die Zahlen in Kapitel 6 angepasst werden. Nicht geschätzt oder aus einem alten Lauf übernommen werden, sondern aus dem tatsächlich reproduzierten Kommando.

### Gute mündliche Antwort

> Coverage zeigt, welche Codebereiche durch Tests ausgeführt wurden. Statements und Lines messen ausgeführten Code, Branches messen ausgeführte Entscheidungswege und Functions messen aufgerufene Funktionen. Coverage ist ein Hinweis auf Testumfang, aber kein Beweis für Korrektheit. Deshalb kombiniere ich sie mit fachlichen Assertions, Strukturtests und manuellen Accessibility-Prüfungen.

## 10. TypeScript-Konzepte, die ich erklären können sollte

### Statische Typisierung

TypeScript erweitert JavaScript um statische Typen. Fehler wie die Übergabe eines Strings an eine Funktion, die eine Zahl erwartet, können bereits beim Entwickeln gefunden werden. Zur Laufzeit läuft am Ende JavaScript.

### Union Type

```ts
type EventType = "arrival" | "dispatch" | "start" | "preempt";
```

Nur die aufgeführten Zeichenketten sind erlaubt. Dadurch werden Tippfehler bei Ereignistypen früh erkannt.

### Optionales Property

```ts
group?: string;
```

Die Eigenschaft kann fehlen. Beim Zugriff muss berücksichtigt werden, dass der Wert `undefined` sein kann.

### Type Guard

```ts
function isAlgorithmType(value: unknown): value is AlgorithmType {
  return value === "roundRobin" || value === "lcfs";
}
```

Die Funktion prüft zur Laufzeit einen unbekannten Wert und teilt TypeScript mit, dass der Wert nach erfolgreicher Prüfung als `AlgorithmType` behandelt werden darf.

### `unknown` versus `any`

- `unknown` zwingt dazu, einen Wert vor der Verwendung zu prüfen.
- `any` schaltet die Typprüfung für diesen Wert praktisch aus.

Für externe oder unsichere Daten ist `unknown` sicherer.

### `null` und `undefined`

`null` wird im Projekt verwendet, wenn ein Zustand bewusst nicht vorhanden ist, zum Beispiel `currentProcessId: null`, wenn kein Prozess läuft. `undefined` bedeutet häufig, dass eine optionale Eigenschaft nicht gesetzt wurde.

### `map`, `filter`, `reduce`

- `map` transformiert jedes Element.
- `filter` behält Elemente bei, die eine Bedingung erfüllen.
- `reduce` fasst mehrere Elemente zu einem Wert zusammen.

Beispiel aus der Metrikberechnung:

```ts
const completedProcesses = processes.filter(
  (process) => process.finishedAt !== null,
);

const averageTurnaroundTime = completedProcesses.length
  ? completedProcesses.reduce(
      (sum, process) => sum + process.turnaroundTime,
      0,
    ) / completedProcesses.length
  : null;
```

## 11. Präsentationsplan für die nächste Prüfung

### Folie 1: Problem und Ziel

- Scheduling ist zeitlich und bei Präemptionen schwer nachzuvollziehen.
- Ziel ist ein interaktiver, deterministischer Visualizer.
- Vier Hauptverfahren: Round Robin, LCFS, Strict Priority und MLFQ.

### Folie 2: Datenfluss

```text
Szenario
  -> Run-Konfiguration
  -> simulateScenario()
  -> SimulationRun
  -> Gantt / Stack / Kennzahlen / Playback
```

### Folie 3: Zentrales Datenmodell

`ProcessInput` beschreibt Eingaben. `ProcessRuntime` ergänzt Laufzeitdaten. `SimulationRun` bündelt Ereignisse, Snapshots, Segmente und Metriken.

### Folie 4: Ein Tick

1. Ankünfte aufnehmen.
2. Auswahl und mögliche Präemption prüfen.
3. Prozess dispatchen.
4. Einen Tick ausführen.
5. Restzeit und Quantum aktualisieren.
6. Ereignisse, Segment und Snapshot speichern.
7. Abschluss behandeln.

### Folie 5: Ein konkretes Codebeispiel

Zeige `dispatchProcess()` und erkläre die Auswahl:

```ts
const nextCurrent =
  algorithm === "mlfq"
    ? readyQueue.shift()
    : algorithm === "strictPriority"
      ? selectStrictPriorityProcess(readyQueue, time, tieBreak)
      : algorithm === "lcfs"
        ? readyQueue.pop()
        : readyQueue.shift();
```

Dann erklären:

- `shift()` nimmt den ältesten Eintrag.
- `pop()` nimmt den zuletzt eingetragenen Eintrag.
- MLFQ und Strict Priority besitzen zusätzliche Auswahlregeln.

### Folie 6: Fehlerbehandlung

Zeige den Unterschied zwischen:

- statischer Typprüfung durch TypeScript,
- Laufzeitvalidierung durch `normalizeScenarioInput()`,
- `try/catch` bei potenziell fehlschlagenden Operationen.

### Folie 7: Test und Coverage

Zeige einen Testfall und erkläre:

- Eingabe,
- erwartetes Verhalten,
- Assertion,
- Grenzen von Coverage.

### Folie 8: Grenzen

- diskrete Single-Core-Abstraktion,
- keine reale Kontextwechselzeit,
- keine I/O-Blockierung oder Mehrkernsimulation,
- keine empirische Lernwirksamkeitsstudie,
- UI-Coverage geringer als Kernlogik-Coverage.

## 12. Mögliche Prüfungsfragen mit Kurzantworten

### Warum ist `queueLevel: 0` die Anzeige L1?

Die Implementierung verwendet nullbasierte Indizes. `0` ist das erste Element. Für die menschliche Darstellung wird `level + 1` ausgegeben, also `L1`.

### Warum werden Snapshots gespeichert?

Damit die Wiedergabe vorwärts, rückwärts und per Seek möglich ist, ohne den Scheduler erneut auszuführen.

### Warum gibt es sowohl Events als auch Snapshots?

Events beschreiben, was passiert ist. Snapshots beschreiben den vollständigen Zustand zu einem Zeitpunkt. Beide Perspektiven werden für Erklärung und Playback benötigt.

### Warum wird ein Prozess bei einer Präemption nicht neu erzeugt?

Seine Restzeit und bisherigen Laufzeitdaten müssen erhalten bleiben. Daher wird dasselbe Laufzeitobjekt wieder in die Ready Queue eingeordnet.

### Warum ist die Simulation deterministisch?

Bei identischen Eingabedaten, Parametern und Auswahlregeln werden Prozesse mit festen Vergleichsregeln ausgewählt. Es gibt keine zufällige Auswahl im Simulationsablauf.

### Was ist der Unterschied zwischen Wartezeit und Durchlaufzeit?

Durchlaufzeit ist `Fertigstellungszeit - Ankunftszeit`. Wartezeit ist die Durchlaufzeit abzüglich der tatsächlich benötigten CPU-Zeit.

### Was ist ein Fallback?

Ein definierter Ersatzwert für ungültige oder fehlende Eingaben, zum Beispiel Quantum `2`, wenn kein gültiger Wert geliefert wird.

### Warum ist ein kleiner Prioritätswert bei Strict Priority höher priorisiert?

Das ist die im Modell festgelegte Konvention. Sie wird in der Auswahlregel durch den Vergleich `candidate.priority < best.priority` umgesetzt.

## 13. Lernstrategie

1. `src/types.ts` laut erklären: Jede Schnittstelle und jedes optionale Feld.
2. `simulateScenario()` ohne Datei erklären: Initialisierung, Schleife, Ergebnis.
3. Einen Prozess durch zwei bis drei Ticks verfolgen.
4. Je Verfahren einen Präemptionsfall zeichnen.
5. Einen Test vollständig erklären: Input, Erwartung, Assertion.
6. Einen Coverage-Bericht lesen und Statements, Branches, Functions und Lines unterscheiden.
7. Die Grenzen der Arbeit offen nennen.
8. Antworten laut in eigenen Worten üben, nicht nur auswendig lesen.

## 14. Kernantwort für die nächste Prüfung

> Meine Anwendung trennt Eingabemodell, Simulationskern und Darstellung. Die Szenario- und Run-Daten werden normalisiert und an `simulateScenario()` übergeben. Die Funktion verarbeitet den Ablauf tick-basiert, nimmt Ankünfte auf, wählt abhängig vom Verfahren einen Prozess, prüft Präemptionen, führt einen Tick aus und erzeugt Ereignisse, Segmente und Snapshots. Das Ergebnis ist ein `SimulationRun`, den die Oberfläche für Gantt, Stack, Kennzahlen und Playback verwendet. TypeScript beschreibt die Datenverträge statisch; externe Daten werden zusätzlich zur Laufzeit validiert. Die Tests prüfen algorithmische Eigenschaften und Ergebnisinvarianten. Coverage beschreibt den Testumfang, beweist aber nicht allein die Fehlerfreiheit. Die bewussten Grenzen sind die diskrete Lehrsimulation, fehlende reale Kontextwechselkosten, die Beschränkung auf die betrachteten Verfahren und die nicht empirisch untersuchte Lernwirksamkeit.

## 15. Erkannte Ungenauigkeiten zwischen Arbeit und Code

Die Arbeit und das Pseudocode-Listing müssen klar als konzeptionelle Beschreibung gekennzeichnet werden. Einige Formulierungen sind jedoch genauer zu korrigieren, weil sie bei einer Code-Nachfrage sonst den Eindruck erwecken, die genannten Funktionen oder die genannte Reihenfolge existierten exakt so im Repository.

### 15.1 Pseudocode verwendet keine echten Funktionsnamen

Im Listing stehen unter anderem:

```text
addArrivedProcessesToReadyState()
selectNextProcess(...)
preemptionRequired(...)
executeCurrentProcessForOneTick()
updateRemainingTimeAndMetrics()
updateQuantumState()
createEventsAndTimelineSegments()
createSnapshotIfRequired()
advanceSimulationTime()
```

Diese Funktionen existieren nicht mit diesen Namen. Sie sind Sammelbezeichnungen für Codeblöcke und Hilfsfunktionen in `src/simulation.ts`.

Die tatsächlichen Zuordnungen sind:

| Begriff im Listing                  | Tatsächliche Umsetzung                                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addArrivedProcessesToReadyState()` | `enqueueArrivals(atTime)`                                                                                                                             |
| `selectNextProcess(...)`            | `dispatchProcess(...)`; abhängig vom Verfahren zusätzlich `selectStrictPriorityProcess(...)` oder `selectSjfProcess(...)`                             |
| `preemptionRequired(...)`           | `shouldPreemptSjf(...)`, `shouldPreemptStrictPriority(...)`, `shouldPreemptMlfq(...)` sowie die LCFS-/Round-Robin-Bedingungen in `simulateScenario()` |
| `executeCurrentProcessForOneTick()` | die Anweisungen für `busyTicks`, `executedTime`, `remainingTime` und `time` in `simulateScenario()`                                                   |
| `updateRemainingTimeAndMetrics()`   | Laufzeitwerte werden direkt aktualisiert; Metriken werden anschließend durch `createMetrics(...)` berechnet                                           |
| `updateQuantumState()`              | `remainingQuantum -= 1` und die MLFQ-Zuweisung zu `mlfqRemainingQuantum`                                                                              |
| `createEventsAndTimelineSegments()` | mehrere Stellen mit `events.push(...)`, `pushSegment(...)` und `pushIdleSegment(...)`                                                                 |
| `createSnapshotIfRequired()`        | `maybeSnapshot(force)` und `createSnapshot(...)`                                                                                                      |
| `advanceSimulationTime()`           | `time += 1`                                                                                                                                           |

### 15.2 Die Reihenfolge im Listing ist nicht exakt die Code-Reihenfolge

Das Listing beschreibt den fachlichen Ablauf, aber die konkrete Implementierung verarbeitet einen Tick differenzierter:

1. Zu Beginn werden bereits eingetroffene Prozesse mit `enqueueArrivals(time)` aufgenommen.
2. Falls kein Prozess läuft, wird mit `dispatchProcess(...)` ausgewählt.
3. Der laufende Prozess wird für einen Tick ausgeführt.
4. `time` wird erhöht.
5. Neu eingetroffene Prozesse werden mit `enqueueArrivals(time)` aufgenommen.
6. Danach werden LCFS-, SRTF-, Strict-Priority- und MLFQ-Präemptionen geprüft.
7. Bei Präemption, Abschluss oder Quantumablauf werden Segmente und Ereignisse erzeugt.
8. Ein Snapshot wird mit `maybeSnapshot(false)` gespeichert.

Die Formulierung in der Arbeit, nach der zunächst allgemein Ankünfte und dann vor der Tick-Ausführung die Präemption verarbeitet wird, ist deshalb für den konkreten Ablauf ungenau. Auch „Wartezeit aktualisieren“ ist zu grob: Für laufende Prozesse wird sie in `createMetrics(...)` abgeleitet; beim Abschluss wird sie in `finalizeProcess(...)` gesetzt.

### 15.3 Die Pseudocode-Zeile „Kandidat“ ist nicht direkt vorhanden

Im Code gibt es keine Variable `candidate` und keine eigenständige Funktion `selectNextProcess`. Die Auswahl findet innerhalb von `dispatchProcess(...)` über eine verschachtelte Auswahl statt:

```ts
const nextCurrent =
  algorithm === "mlfq"
    ? (readyQueue.shift() ?? null)
    : algorithm === "strictPriority"
      ? selectStrictPriorityProcess(readyQueue, time, strictPriorityTieBreak)
      : algorithm === "sjf"
        ? selectSjfProcess(readyQueue)
        : algorithm === "lcfs"
          ? (readyQueue.pop() ?? null)
          : (readyQueue.shift() ?? null);
```

Die präzise Antwort lautet:

> Der Pseudocode-Begriff „Kandidat“ steht für den Rückgabewert `nextCurrent` in `dispatchProcess()`. Die konkrete Auswahlregel wird dort abhängig vom Algorithmus aufgerufen.

### 15.4 Die Arbeit nennt vier Verfahren, der aktuelle Code unterstützt zusätzlich SJF/SRTF

Die Arbeit grenzt den fachlichen Schwerpunkt auf Round Robin, LCFS, Strict Priority und MLFQ ein. Im aktuellen Repository existieren jedoch zusätzlich `"sjf"` in `AlgorithmType`, `selectSjfProcess(...)`, `shouldPreemptSjf(...)`, SJF/SRTF-Tests, ein Preset und die interne Bezeichnung „SRTF (präemptiv)“.

Das ist kein Widerspruch, wenn SJF/SRTF als zusätzliche Entwicklungs- oder Testfunktion bezeichnet wird. Es wäre aber ungenau, in der Arbeit zu schreiben, der Code kenne ausschließlich die vier Verfahren. Besser ist:

> Gegenstand der fachlichen Hauptbetrachtung sind vier Verfahren. Das Repository enthält darüber hinaus eine zusätzliche SRTF-Implementierung aus einer ergänzenden Entwicklungsphase, die nicht in die Hauptauswertung einbezogen wird.

### 15.5 Exception-Handling-Beispiel muss zum Code passen

Das allgemeine Beispiel mit `JSON.parse(input)` und `useScenario(value)` ist didaktisch korrekt, kommt aber nicht genau so im Code vor. Die tatsächliche JSON-Verarbeitung liegt in `useScenarioWorkspace.ts`:

- `loadScenarios()` liest localStorage, ruft `JSON.parse(raw)` auf und gibt bei Fehlern eine leere Szenarienliste zurück.
- `importScenarioFromJson(jsonString)` ruft `JSON.parse(jsonString)` auf, prüft Mindestanforderungen und gibt ein Ergebnisobjekt mit `success` und `message` zurück.
- `exportScenarioAsJson(id)` fängt Fehler bei JSON-Erzeugung und Blob-/DOM-Export ab und gibt `false` zurück.

Das `try/catch` in `StackList.vue` betrifft dagegen nicht JSON, sondern das Auflösen einer CSS-Farbvariable über `getComputedStyle(...)`. In `useTheme.ts` werden zusätzlich localStorage- und Browser-Kompatibilitätsfehler abgefangen.

### 15.6 Behauptungen zu UI und Ereignislog müssen den aktuellen Stand abbilden

Intern werden Ereignisse weiterhin vollständig im `SimulationRun.events` erzeugt. Der separate sichtbare Ereignislog ist in der aktuellen Präsentationsansicht jedoch nicht aktiv; die `contextHistory` wird nicht mehr an `StackList` übergeben. Für eine aktuelle Beschreibung muss zwischen internem Ereignisprotokoll und sichtbarer Oberfläche unterschieden werden.

### 15.7 Abweichungen bei Testzahlen und Coverage

Die Arbeit nennt zehn Testdateien und 35 Tests. Der zuvor ausgeführte normale Lauf meldete neun Testdateien und 34 Tests. Außerdem beziehen sich die in der Arbeit genannten Coverage-Zahlen auf einen älteren Lauf.

Vor einer Überarbeitung müssen die Werte reproduzierbar neu ermittelt werden:

```bash
npm test
npm run test:coverage
npm run build
```

Die korrekte Prüfungsantwort lautet:

> Die Coverage-Werte sind abhängig vom Stand des Repositories und vom ausgeführten Testkommando. Für die finale Fassung muss ich den Coverage-Lauf reproduzieren und exakt die ausgegebenen Testzahlen und Prozentwerte dokumentieren.

## 16. Antwort, wenn nach einer Ungenauigkeit gefragt wird

> Das Listing in der Arbeit ist konzeptioneller Pseudocode. Bei der Übertragung habe ich Sammelbegriffe wie `selectNextProcess()` und `createSnapshotIfRequired()` verwendet, obwohl diese nicht als gleichnamige Funktionen im Repository existieren. Die tatsächlichen Verantwortlichkeiten sind auf `dispatchProcess()`, `enqueueArrivals()`, die `shouldPreempt...()`-Funktionen, `pushSegment()` und `maybeSnapshot()` verteilt. Außerdem ist die Reihenfolge im Listing gegenüber dem konkreten Tick-Ablauf vereinfacht dargestellt. Das hätte ich klarer als Abstraktion kennzeichnen und mit den echten Funktionsnamen belegen müssen.

## 17. Korrekturregeln für die Präsentation

- Keine erfundenen oder nur sinngemäßen Funktionsnamen als konkrete Codebelege nennen.
- Bei jedem Pseudocode-Schritt eine echte Funktion oder einen echten Codeblock zeigen.
- Zwischen fachlichem Modell und Implementierungsreihenfolge unterscheiden.
- SJF/SRTF als zusätzliche Repository-Funktion, nicht als Hauptverfahren der Arbeit einordnen.
- Bei Exception Handling reale Stellen aus `useScenarioWorkspace.ts`, `StackList.vue` und `useTheme.ts` zeigen.
- Testzahlen und Coverage vor der Präsentation neu ausführen.
- Nicht behaupten, dass ein Ereignislog sichtbar ist, wenn er nur intern erzeugt wird.
