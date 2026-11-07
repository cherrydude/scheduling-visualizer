# Prüfungsvorbereitung: Scheduling Visualizer

Diese Datei erklärt die wichtigsten Konzepte, Methoden und Architekturentscheidungen des Scheduling Visualizers. Die Verweise führen direkt zu den relevanten Codezeilen. Die Dokumentation beschreibt bewusst nicht nur **was** der Code macht, sondern auch **warum** diese Lösung gewählt wurde und welche Alternativen möglich wären.

## 1. Kurzüberblick über die Architektur

Die Anwendung ist eine Vue-3-Anwendung mit TypeScript. Die fachliche Simulation ist von der Darstellung getrennt:

- [simulation.ts](../src/simulation.ts#L587) ist die zentrale, tickbasierte Zustandsmaschine.
- [types.ts](../src/types.ts#L2) definiert die Datenverträge zwischen Simulation, UI und Tests.
- [useScenarioWorkspace.ts](../src/composables/useScenarioWorkspace.ts#L395) verwaltet Szenarien, Runs und Local-Storage-Persistenz.
- [usePlayback.ts](../src/composables/usePlayback.ts#L4) steuert die zeitliche Wiedergabe von Snapshots.
- [compare.ts](../src/utils/compare.ts#L117) normalisiert Kennzahlen und berechnet Vergleichsscores.
- [timelineLayout.ts](../src/utils/timelineLayout.ts#L13) berechnet die responsive Darstellung der Zeitachse.
- Die Tests prüfen Simulation, Persistenz, Layout und Accessibility unabhängig voneinander.

Die grundlegende Datenflussrichtung lautet:

```text
Szenario-Eingabe
    -> Normalisierung
    -> Simulation als Zustandsmaschine
    -> Events, Segmente, Snapshots und Metriken
    -> Playback, Gantt-Diagramm, Stack-Ansicht und Vergleich
```

### Warum diese Trennung?

Eine alternative Lösung wäre, die Scheduling-Logik direkt in Vue-Komponenten zu implementieren. Das wäre zunächst einfacher sichtbar, würde aber mehrere Nachteile erzeugen:

- Die Logik wäre schwerer isoliert zu testen.
- UI-Zustände und fachliche Zustände würden vermischt.
- Ein Algorithmus könnte nicht ohne Rendering getestet oder wiederverwendet werden.
- Änderungen an der Darstellung könnten ungewollt die Simulation beeinflussen.

Die Trennung folgt deshalb dem Prinzip **Separation of Concerns**: Jede Schicht hat eine klar abgegrenzte Verantwortung.

## 2. TypeScript-Grundkonzepte

### 2.1 Was ist ein `interface`?

Ein `interface` beschreibt die Form eines Objekts. Es legt fest, welche Eigenschaften vorhanden sein müssen und welchen Typ sie besitzen. Ein Interface erzeugt zur Laufzeit keinen JavaScript-Code; es dient der statischen Prüfung durch TypeScript.

Beispiel: [ProcessInput](../src/types.ts#L10)

```ts
export interface ProcessInput {
  id: string;
  arrivalTime: number;
  burstTime: number;
}
```

Ein Objekt ist gültig, wenn es diese Struktur erfüllt. Dadurch erkennt TypeScript Tippfehler und fehlende Eigenschaften bereits vor dem Start der Anwendung.

**Warum ein Interface?**

Ein Interface ist passend, wenn eine Objektstruktur beschrieben wird, die an mehreren Stellen verwendet oder erweitert werden kann. `ProcessRuntime` erweitert beispielsweise [ProcessInput](../src/types.ts#L59) um veränderliche Laufzeitdaten.

**Alternative:** Ein `type`-Alias kann ebenfalls Objektformen beschreiben:

```ts
type ProcessInput = {
  id: string;
};
```

Interfaces eignen sich besonders gut für erweiterbare Objektverträge und Deklarationszusammenführung. Type-Aliase sind flexibler bei Vereinigungen, Tupeln und komplexen Typausdrücken. Im Projekt werden beide passend eingesetzt.

### 2.2 Was ist ein `type`?

Ein Type-Alias gibt einem Typ einen Namen. Besonders nützlich ist er für Vereinigungen:

- [AlgorithmType](../src/types.ts#L2) erlaubt nur die fünf unterstützten Algorithmusnamen.
- [ProcessStatus](../src/types.ts#L49) beschreibt alle möglichen Prozesszustände.
- [EventType](../src/types.ts#L73) beschreibt erlaubte Ereignisarten.

```ts
type ProcessStatus = "pending" | "ready" | "running" | "finished";
```

Das ist sicherer als ein beliebiger `string`, weil ungültige Werte vom Compiler erkannt werden.

### 2.3 Optionales Feld mit `?`

In [ProcessInput](../src/types.ts#L10) ist `group?: string` optional. Das bedeutet: Die Eigenschaft kann fehlen oder einen String enthalten. Optionale Felder werden verwendet, wenn die Information fachlich nicht für jeden Prozess existiert.

### 2.4 `null` und `undefined`

`null` wird im Projekt verwendet, wenn ein Wert fachlich bewusst nicht vorhanden ist, zum Beispiel `responseTime: number | null` bei einem Prozess, der noch nicht gestartet wurde. `undefined` wird überwiegend für optionale Konfigurationen verwendet.

Diese Unterscheidung ist hilfreich:

- `null`: Der Zustand ist bekannt und bedeutet „noch nicht vorhanden“.
- `undefined`: Die Eigenschaft oder Konfiguration wurde nicht angegeben.

### 2.5 Type Guard

[isAlgorithmType](../src/simulation.ts#L39) ist ein Type Guard. Die Rückgabe `value is AlgorithmType` sagt TypeScript: Wenn die Funktion `true` liefert, darf `value` anschließend als `AlgorithmType` behandelt werden.

```ts
function isAlgorithmType(value: unknown): value is AlgorithmType {
  return value === "roundRobin" || value === "sjf";
}
```

**Warum notwendig?** Daten aus Local Storage oder Formularen sind zunächst nicht vertrauenswürdig und haben effektiv den Typ `unknown`. Ein Type Guard prüft sie explizit.

**Alternative:** Ein `as AlgorithmType` wäre kürzer, aber unsicher. Damit würde man TypeScript nur versichern, dass der Wert korrekt sei, ohne ihn tatsächlich zu prüfen.

### 2.6 `unknown` statt `any`

Eingaben wie [clampPositiveInteger](../src/simulation.ts#L29) akzeptieren `unknown`. Das zwingt den Code, den Wert vor der Nutzung zu prüfen. `any` würde die Typprüfung umgehen und Fehler in die Laufzeit verschieben.

### 2.7 Generics und Callback-Funktionen

Funktionen wie `Array.map`, `filter` und `reduce` erhalten Funktionen als Argumente. Diese Funktionen heißen Callbacks. TypeScript leitet dabei die Typen der Elemente aus dem Array ab.

Beispiel in [createMetrics](../src/simulation.ts#L152):

```ts
processes.filter((process) => process.finishedAt !== null);
```

`process` wird automatisch als `ProcessRuntime` erkannt. Das verbessert Lesbarkeit und verhindert manuelle Typwiederholungen.

## 3. Zentrale Datenmodelle

### [Scenario](../src/types.ts#L38)

Ein Szenario enthält Metadaten, Algorithmusparameter, Seed, Tickgröße und Prozesse. Es ist die fachliche Eingabe eines Simulationslaufs.

### [ProcessInput](../src/types.ts#L10)

Beschreibt die unveränderlichen Eingabedaten eines Prozesses:

- `arrivalTime`: Zeitpunkt der Ankunft in der Ready Queue.
- `burstTime`: benötigte CPU-Zeit.
- `priority`: numerische Priorität; kleinere Werte bedeuten im Projekt höhere Priorität.
- `color` und `group`: Darstellungs- und Gruppierungsinformationen.

### [ProcessRuntime](../src/types.ts#L59)

Erweitert die Eingabe um den aktuellen Laufzeitstatus. Dazu gehören Restlaufzeit, ausgeführte Zeit, Startzeit, Endzeit und berechnete Warte-/Antwortzeiten.

Die Trennung zwischen `ProcessInput` und `ProcessRuntime` verhindert, dass die ursprünglichen Eingabedaten während der Simulation unkontrolliert verändert werden.

### [ScheduleEvent](../src/types.ts#L84)

Ein Event beschreibt eine beobachtbare Änderung, beispielsweise Ankunft, Disposition, Präemption oder Abschluss. Events eignen sich für:

- eine nachvollziehbare Erklärung des Algorithmus,
- Event-Listen in der UI,
- Metriken wie Präemptionsanzahl,
- spätere Erweiterungen wie Logging oder Export.

### [SimulationSnapshot](../src/types.ts#L120)

Ein Snapshot ist ein serialisierbarer Zwischenstand. Er enthält nicht nur den aktuellen Prozess, sondern auch Ready Queue, Quantum und Metriken. Dadurch kann das Playback jeden Zustand reproduzieren, ohne die Simulation bei jedem UI-Schritt erneut auszuführen.

**Alternative:** Die UI könnte bei jedem Schritt die Simulation neu berechnen. Das wäre speichersparender, aber langsamer, schwerer zu synchronisieren und anfälliger für Änderungen an der Simulationslogik.

## 4. Simulation und Scheduling

### 4.1 Eingabenormalisierung

[normalizeScenarioInput](../src/simulation.ts#L54) bildet eine Schutzgrenze zwischen externen Eingaben und der Simulation.

Sie stellt unter anderem sicher, dass:

- unbekannte Algorithmen auf Round Robin zurückfallen,
- Ankunftszeiten nicht negativ sind,
- Burst-Zeiten mindestens einen Tick dauern,
- Quantum und Snapshot-Intervall positive Ganzzahlen sind,
- fehlende IDs, Namen und Farben ersetzt werden.

**Entscheidung:** Die Simulation normalisiert selbst, obwohl die Formulare ebenfalls Eingaben prüfen. Das ist eine Defense-in-Depth-Strategie. Die Funktion bleibt dadurch auch bei Tests, Importen oder zukünftigen API-Eingängen robust.

**Alternative:** Nur die UI validieren. Das wäre weniger doppelt, aber die Simulation wäre dann von jedem einzelnen Aufrufer abhängig.

### 4.2 Laufzeitobjekte

[createRuntime](../src/simulation.ts#L127) erzeugt aus Eingabeprozessen veränderliche Laufzeitobjekte. Die Prozesse werden nach Ankunftszeit und ID sortiert. Die ID ist ein deterministischer Tie-Breaker.

Die Sortierung ist wichtig, weil die Simulation dadurch bei gleicher Eingabe reproduzierbar bleibt.

### 4.3 Hauptfunktion

[simulateScenario](../src/simulation.ts#L587) ist eine diskrete Simulation. Die Zeit wird tickweise erhöht:

1. Prozesse mit passender Ankunftszeit werden in die Ready Queue aufgenommen.
2. Falls keine CPU-Belegung existiert, wird ein Prozess disponiert.
3. Der laufende Prozess erhält genau einen CPU-Tick.
4. Restlaufzeit, ausgeführte Zeit und Quantum werden aktualisiert.
5. Neue Ankünfte können eine Präemption auslösen.
6. Bei Abschluss, Präemption oder Quantumablauf werden Events und Segmente erzeugt.
7. Ein Snapshot wird für die UI gespeichert.

**Warum diskrete Ticks?**

Die Darstellung soll jeden einzelnen Scheduling-Schritt zeigen. Eine tickbasierte Simulation ist leicht verständlich, deterministisch und gut visualisierbar.

**Alternative:** Eine ereignisbasierte Simulation würde direkt zum nächsten relevanten Zeitpunkt springen. Das wäre bei sehr großen Zeitwerten effizienter, aber die Implementierung der gleichzeitigen Ankünfte, Quantumgrenzen und Snapshot-Zeitpunkte wäre komplexer.

### 4.4 Dispatch

[dispatchProcess](../src/simulation.ts#L291) wählt einen Prozess aus der Ready Queue und markiert ihn als laufend. Die Auswahl ist algorithmusabhängig:

- Round Robin: FIFO, also erstes Element.
- LCFS: Stack-Verhalten, also letztes Element.
- Strict Priority: kleinste Prioritätszahl.
- SJF/SRTF: kleinste Restlaufzeit.
- MLFQ: erste Prozessposition, da die Queue bereits nach Level geordnet ist.

Beim ersten Start wird zusätzlich die Antwortzeit berechnet. Ein Kontextwechsel wird nur gezählt, wenn tatsächlich ein anderer Prozess die CPU übernimmt.

### 4.5 Ready Queue

[enqueueReadyProcess](../src/simulation.ts#L385) zentralisiert die Aufnahme in die Ready Queue. Das verhindert, dass jeder Algorithmus eigene, leicht abweichende Einfügelogik benötigt.

Beim MLFQ wird nach Queue-Level sortiert. Bei Strict Priority wird nach Priorität einsortiert. Für Round Robin und SJF bleibt die Einfügeposition zunächst die Ankunfts-/Warte-Reihenfolge; die Auswahlentscheidung erfolgt beim Dispatch.

### 4.6 Round Robin

Round Robin teilt die CPU-Zeit in Zeitscheiben, dem sogenannten Quantum. Nach Ablauf des Quantums wird der Prozess nur dann präemptiert, wenn andere Prozesse bereit sind.

**Vorteil:** Faire CPU-Verteilung und gute Reaktionsfähigkeit.

**Nachteil:** Ein zu kleines Quantum verursacht viele Kontextwechsel; ein zu großes Quantum ähnelt FCFS.

**Alternative:** FCFS wäre einfacher, unterstützt aber keine faire Zeitscheibenverteilung und reagiert schlechter auf kurze interaktive Prozesse.

### 4.7 LCFS

LCFS steht für Last Come, First Served. Der zuletzt angekommene Prozess wird bevorzugt. In der präemptiven Variante unterbricht eine neue Ankunft den aktuellen Prozess.

Der Spezialfall in [preemptCurrentProcess](../src/simulation.ts#L683) verhindert, dass der gerade verdrängte Prozess sofort wieder vom Stack gewählt wird. Die neue Ankunft soll oben auf dem Stack bleiben.

**Vorteil:** Neu eintreffende kurze Arbeiten können sehr schnell starten.

**Nachteil:** Ältere Prozesse können verhungern, also dauerhaft warten.

**Alternative:** Nicht-präemptives LCFS würde erst nach Abschluss des laufenden Prozesses wechseln und wäre einfacher, aber weniger reaktiv.

### 4.8 Strict Priority

[shouldPreemptStrictPriority](../src/simulation.ts#L430) prüft, ob ein wartender Prozess eine höhere Priorität besitzt. Im Projekt bedeutet eine kleinere Zahl eine höhere Priorität.

Gleichstände werden über [selectStrictPriorityProcess](../src/simulation.ts#L492) und konfigurierbare Tie-Breaker aufgelöst:

- FIFO: ursprüngliche Reihenfolge,
- arrivalTime: früher angekommener Prozess,
- remainingTime: kürzere Restlaufzeit,
- waitingTime: länger wartender Prozess,
- id: lexikografische Stabilisierung.

**Vorteil:** Kritische oder wichtige Prozesse können bevorzugt werden.

**Nachteil:** Prozesse niedriger Priorität können verhungern.

**Alternative:** Aging würde die Priorität wartender Prozesse langsam erhöhen. Das würde Starvation reduzieren, würde aber die Prioritätssemantik komplexer machen.

### 4.9 SJF/SRTF

[shouldPreemptSjf](../src/simulation.ts#L457) prüft die präemptive Variante. Sie wird häufig SRTF (Shortest Remaining Time First) genannt, weil die Restlaufzeit und nicht nur die ursprüngliche Burst-Zeit verglichen wird.

[selectSjfProcess](../src/simulation.ts#L546) verwendet Restlaufzeit, Ankunftszeit und ID als stabile Auswahlregeln.

**Vorteil:** Theoretisch sehr gute durchschnittliche Wartezeit, wenn Laufzeiten bekannt sind.

**Nachteil:** Benötigt eine Schätzung oder Kenntnis der Burst-Zeit; lange Prozesse können benachteiligt werden.

### 4.10 MLFQ

MLFQ steht für Multilevel Feedback Queue. Prozesse starten in einer hohen Prioritätsqueue. Nach Quantumablauf werden sie in eine niedrigere Queue verschoben. Höhere Queues können niedrigere Queues präemptieren.

[quantumForLevel](../src/simulation.ts#L211) berechnet die Quantumlänge eines Levels. In dieser Implementierung wächst das Quantum mit dem Queue-Level.

**Vorteil:** Kurze/interaktive Prozesse reagieren schnell, während CPU-intensive Prozesse nach unten wandern.

**Nachteil:** Das Verhalten hängt stark von Quantum, Queue-Anzahl und Regeln für Beförderung/Alterung ab.

**Alternative:** Eine klassische MLFQ kann zusätzlich Aging, Beförderungen und regelmäßige Prioritäts-Boosts verwenden. Die aktuelle vereinfachte Variante ist leichter zu erklären und zu visualisieren.

### 4.11 Präemption

Eine Präemption bedeutet, dass der aktuell laufende Prozess die CPU verliert, obwohl er noch nicht beendet ist. Die Simulation protokolliert das als Event und führt den Prozess wieder der Ready Queue zu.

Das ist von einem Kontextwechsel zu unterscheiden:

- Präemption: fachlicher Grund für die Unterbrechung.
- Kontextwechsel: technischer Wechsel der CPU-Ausführung auf einen anderen Prozess.

Ein Kontextwechsel kann nach einer Präemption oder nach einem normalen Prozessabschluss auftreten.

## 5. Metriken

[createMetrics](../src/simulation.ts#L152) berechnet Werte für Zwischenstände und den Endzustand.

- **Wartezeit:** Zeit, in der ein Prozess nach seiner Ankunft nicht auf der CPU lief.
- **Durchlaufzeit:** `finishedAt - arrivalTime`.
- **Antwortzeit:** Zeit von der Ankunft bis zum ersten CPU-Einsatz.
- **CPU-Auslastung:** `busyTicks / currentTime`.
- **Idle-Anteil:** `1 - cpuUtilization`.
- **Präemptionsanzahl:** Anzahl der `preempt`- und `quantumExpired`-Events.
- **Kontextwechsel:** Anzahl der Wechsel zwischen unterschiedlichen Prozessen.

Noch laufende Prozesse bekommen bei Zwischen-Snapshots eine vorläufige Wartezeit. Für die Endmetriken stehen dagegen die abgeschlossenen Werte zur Verfügung.

## 6. Events, Segmente und Snapshots

[createSnapshot](../src/simulation.ts#L216) bündelt den sichtbaren Simulationszustand. Ein Snapshot ist bewusst eine Momentaufnahme und kein Verweis auf die veränderlichen Runtime-Objekte.

[pushSegment](../src/simulation.ts#L684) speichert zusammenhängende CPU-Abschnitte für das Gantt-Diagramm. Dadurch muss die UI nicht aus einzelnen Ticks selbst Segmente zusammensetzen.

**Warum werden alle drei Darstellungen gespeichert?**

- Events erklären, was passiert ist.
- Segmente zeigen, wann welcher Prozess lief.
- Snapshots erlauben zeitliches Navigieren.

Diese Daten überschneiden sich teilweise, erfüllen aber unterschiedliche Aufgaben und halten die Darstellungsschicht einfach.

## 7. Szenarioverwaltung und Persistenz

### Datenverträge

- [ScenarioDraft](../src/composables/useScenarioWorkspace.ts#L19): Formularinhalt vor dem Speichern.
- [ScenarioRecord](../src/composables/useScenarioWorkspace.ts#L31): gespeichertes Szenario mit Runs.
- [ScenarioRunRecord](../src/composables/useScenarioWorkspace.ts#L15): ein konkreter Algorithmuslauf.

### [normalizeScenario](../src/composables/useScenarioWorkspace.ts#L224)

Migriert alte oder unvollständige Local-Storage-Daten in die aktuelle Struktur. Das ist wichtig, weil gespeicherte Browserdaten auch nach einer späteren Codeänderung noch existieren können.

### [buildSimulationScenario](../src/composables/useScenarioWorkspace.ts#L273)

Trennt das gespeicherte Szenario vom konkret ausgewählten Run und erzeugt die Eingabe für `simulateScenario`.

### [getScenarioRenderSignature](../src/composables/useScenarioWorkspace.ts#L305)

Erzeugt eine deterministische Zeichenkette aus allen render-relevanten Werten. Komponenten können damit erkennen, dass sich nicht nur die Objektidentität, sondern tatsächlich der Inhalt geändert hat.

### [useScenarioWorkspace](../src/composables/useScenarioWorkspace.ts#L395)

Das Vue-Composable kapselt reaktive Zustände und Aktionen wie Erstellen, Auswählen, Duplizieren, Löschen und Anwenden eines Algorithmus.

**Warum Local Storage?** Für diese lokale Lern- und Visualisierungsanwendung ist kein Server erforderlich. Szenarien bleiben im Browser erhalten.

**Alternativen:**

- IndexedDB für größere Datenmengen und strukturierte Abfragen.
- Backend-Datenbank für Synchronisation zwischen Geräten und Benutzerkonten.
- URL- oder Datei-Export für reproduzierbare Freigabe.

Local Storage ist hier die pragmatische Lösung, weil die Daten klein sind und keine Anmeldung benötigt wird.

## 8. Vue-Composables und Reaktivität

Ein Composable ist eine Funktion, die wiederverwendbare Vue-Reaktivität kapselt. Es ist vergleichbar mit einem kleinen, zustandsbehafteten Service, bleibt aber in Vue-Konventionen eingebettet.

### [usePlayback](../src/composables/usePlayback.ts#L4)

Verwaltet Snapshot-Index, Wiedergabestatus, Geschwindigkeit und Timer. `ref` erzeugt reaktive Einzelwerte, `computed` berechnet die Snapshot-Anzahl, `watch` reagiert auf Änderungen.

[clearTimer](../src/composables/usePlayback.ts#L20) verhindert mehrere parallele Intervalle. [startTimer](../src/composables/usePlayback.ts#L28) berechnet die Intervalllänge aus der Geschwindigkeit.

**Alternative:** `requestAnimationFrame` wäre für kontinuierliche Animationen geeignet. Für diskrete Snapshot-Schritte ist `setInterval` verständlicher und ausreichend.

### [useGanttZoom](../src/composables/useGanttZoom.ts#L18)

Beobachtet die Containergröße mit `ResizeObserver` und berechnet eine passende Zellbreite. So reagiert das Diagramm auch auf Layoutänderungen ohne Fenster-Resize.

### [useTimelineSync](../src/composables/useTimelineSync.ts#L7)

Teilt die berechnete Zellbreite zwischen Timeline-Ansichten, damit mehrere Gantt-Darstellungen synchron ausgerichtet bleiben.

### [useFocusTrap](../src/composables/useFocusTrap.ts#L4)

Begrenzt den Tastaturfokus auf ein Modal. Das ist eine Accessibility-Anforderung: Nutzer sollen mit Tab nicht hinter einem geöffneten Dialog weiter navigieren.

### [useTheme](../src/composables/useTheme.ts#L42)

Liest die Systemeinstellung `prefers-color-scheme`, setzt das HTML-Attribut `data-theme` und reagiert auf Änderungen. Das Attribut ermöglicht CSS, das Thema zentral zu steuern.

### [useTour](../src/composables/useTour.ts#L16)

Kapselt die Shepherd-Tour. Aktionen werden als Funktionen injiziert. Dadurch kennt die Tour nicht die interne Struktur von `AppShell`, sondern ruft nur definierte Aktionen auf.

Das ist ein Beispiel für **Dependency Injection**: Abhängigkeiten werden von außen übergeben und nicht innerhalb der Tour fest verdrahtet.

## 9. Vergleich und Scoring

### [extractValues](../src/utils/compare.ts#L42)

Überführt einen Simulationslauf in vergleichbare Kennzahlen. Der Durchsatz wird als abgeschlossene Prozesse pro Zeiteinheit berechnet.

### [normalizeAcrossRuns](../src/utils/compare.ts#L64)

Skaliert Werte je Kennzahl auf 0 bis 1. Das verhindert, dass beispielsweise eine Kennzahl mit großen absoluten Zahlen automatisch stärker gewichtet wird.

Bei identischen Minima und Maxima wird der Nenner künstlich auf 1 gesetzt. So entsteht keine Division durch null.

### [computeScoreForRow](../src/utils/compare.ts#L94)

Berechnet einen gewichteten Score. Bei Wartezeit oder Kontextwechseln ist ein niedriger Wert besser; deshalb wird der normalisierte Wert invertiert. Beim Durchsatz ist ein höherer Wert besser.

**Alternative:** Pareto-Optimierung oder eine nicht gewichtete Rangliste würden keine subjektiven Gewichte benötigen. Ein gewichteter Score ist jedoch für eine didaktische Vergleichsansicht leichter verständlich.

### [buildComparisonRows](../src/utils/compare.ts#L117)

Baut die vollständigen Zeilen der Vergleichstabelle und sortiert nach Score.

## 10. Layout und Responsive Design

[createTimelineLayout](../src/utils/timelineLayout.ts#L13) entscheidet zwischen `fit` und `scroll`.

- Kurze Zeitachsen werden eingepasst oder bewusst gestreckt.
- Lange Zeitachsen erhalten eine begrenzte Zellbreite und werden scrollbar.
- Mindest- und Maximalbreiten verhindern unleserliche oder übergroße Zellen.

**Warum feste Grenzen?** Ohne Grenzen könnten sehr lange Läufe winzige Zellen erzeugen oder kurze Läufe übermäßig viel Platz beanspruchen.

## 11. Accessibility als technisches Konzept

Accessibility bedeutet, dass die Anwendung auch mit unterschiedlichen Fähigkeiten und Eingabemethoden nutzbar ist.

Wichtige Konzepte im Projekt:

- `role="dialog"` beschreibt die Semantik eines Modals.
- `aria-modal="true"` signalisiert, dass der Dialog den Hintergrund modal überlagert.
- `aria-hidden` verhindert, dass Hintergrundinhalte von assistiven Technologien gelesen werden.
- `inert` verhindert zusätzlich Interaktionen mit dem Hintergrund.
- Fokus-Trapping hält den Tastaturfokus im Dialog.
- `prefers-reduced-motion` reduziert Animationen für Nutzer, die Bewegung vermeiden möchten.
- axe-core prüft typische WCAG-Verstöße automatisiert.

**Wichtig für die Prüfung:** Automatisierte Accessibility-Tests ersetzen keine manuelle Prüfung mit Tastatur und Screenreader. Sie ergänzen sie.

## 12. Reproduzierbarkeit und Tests

[createSeededScenarioProcesses](../src/simulation.ts#L1148) verwendet einen Seed. Derselbe Seed erzeugt dieselben Prozessdaten.

Das ist für Tests wichtig, weil Zufall sonst zu nicht reproduzierbaren Fehlern führen könnte.

Die Simulationstests prüfen unter anderem:

- deterministische Ergebnisse,
- Eingabenormalisierung,
- korrekte Segmentgrenzen,
- Präemption,
- MLFQ-Demotion,
- Metriken und Snapshot-Zeitpunkte.

Ein Test ist nicht nur eine Fehlerprüfung, sondern auch eine ausführbare fachliche Spezifikation: Er dokumentiert, welches Verhalten dauerhaft garantiert werden soll.

## 13. Typische Prüfungsfragen mit Kurzantworten

### Warum TypeScript statt reinem JavaScript?

TypeScript erkennt falsche Datentypen, fehlende Eigenschaften und ungültige Vereinigungswerte bereits während der Entwicklung. Das ist besonders wertvoll bei komplexen Zuständen wie `ProcessRuntime` und `SimulationRun`.

### Warum werden Eingaben normalisiert?

Weil Daten aus Formularen und Local Storage nicht automatisch vertrauenswürdig sind. Normalisierung stellt Invarianten her, bevor die Zustandsmaschine startet.

### Warum ist `simulateScenario` keine Vue-Funktion?

Die Simulation ist fachliche Logik und soll unabhängig von Rendering und Browser-Lifecycle testbar sein.

### Was ist eine Zustandsmaschine?

Eine Zustandsmaschine beschreibt erlaubte Zustände und Übergänge. Hier wechselt ein Prozess beispielsweise von `pending` zu `ready`, danach zu `running`, eventuell zu `preempted` und schließlich zu `finished`.

### Was ist der Unterschied zwischen Präemption und Kontextwechsel?

Präemption beschreibt, warum ein Prozess unterbrochen wird. Kontextwechsel beschreibt den Wechsel der CPU-Ausführung auf einen anderen Prozess.

### Warum gibt es Events und Snapshots gleichzeitig?

Events erklären Veränderungen, Snapshots speichern komplette sichtbare Zustände. Beide Modelle dienen unterschiedlichen Verbraucherinnen und Verbrauchern der Anwendung.

### Warum werden bei gleicher Priorität Tie-Breaker benötigt?

Ohne Tie-Breaker könnte die Auswahl von der zufälligen Reihenfolge oder Implementierungsdetails abhängen. Tie-Breaker machen das Verhalten deterministisch und erklärbar.

### Welche Grenzen hat die Simulation?

Sie modelliert CPU-Scheduling diskret und abstrahiert beispielsweise I/O, Blockierung, mehrere CPU-Kerne und reale Kontextwechselkosten. Diese Vereinfachung ist für die Visualisierung bewusst gewählt.

### Welche Erweiterungen wären sinnvoll?

- I/O- und Blockierungszustände,
- mehrere CPU-Kerne,
- reale Kontextwechselkosten,
- Aging gegen Starvation,
- Import/Export von Szenarien,
- Persistenz über ein Backend,
- ereignisbasierte Simulation für sehr große Zeitachsen.

## 14. Gute Antwortstruktur in der Prüfung

Bei einer Frage zu einer Methode kann folgende Struktur verwendet werden:

1. **Verantwortung:** Was ist die Aufgabe der Methode?
2. **Eingaben und Ausgabe:** Welche Daten kommen hinein und was wird erzeugt?
3. **Entscheidung:** Warum wurde diese Lösung gewählt?
4. **Alternative:** Welche andere Lösung wäre möglich?
5. **Trade-off:** Was wäre der Vorteil und Nachteil der Alternative?
6. **Test:** Wie wird das Verhalten abgesichert?

Beispiel für `simulateScenario`:

> Die Methode führt ein Szenario tickweise als diskrete Zustandsmaschine aus. Sie nimmt ein normalisiertes Szenario entgegen und liefert Events, Gantt-Segmente, Snapshots, Metriken und Laufzeitprozesse zurück. Die tickweise Ausführung wurde gewählt, weil jeder Scheduling-Schritt visualisiert werden soll. Eine ereignisbasierte Simulation wäre bei großen Zeitspannen effizienter, aber komplexer bei gleichzeitigen Ereignissen und Snapshot-Grenzen. Die Tests sichern Determinismus, Segmentgrenzen und Algorithmusverhalten ab.
