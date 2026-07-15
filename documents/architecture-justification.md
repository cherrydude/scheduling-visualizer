# Architektur- und Designbegründung — Scheduling Visualizer (MVP)

## Zweck dieses Dokuments

Dieses Dokument erklärt die zentralen Architektur- und Designentscheidungen, die während der Entwicklung des Scheduling-Visualizers getroffen wurden. Die Begründungen sind so formuliert, dass sie direkt in die Bachelorarbeit übernommen oder als Grundlage für ein Methodenkapitel genutzt werden können.

---

## Überblick — Hohe Ebene

Ziel der Anwendung ist eine interaktive, deterministische Visualisierung präemptiver Scheduling-Verfahren (MVP). Die Implementierung ist rein clientseitig (Vue 3 + TypeScript + Vite), mit einem klar getrennten, deterministischen Simulationskern und einer Darstellungsschicht, die nur aus den vom Kern gelieferten Snapshots ableitet.

Grundprinzipien:

- Determinismus und Reproduzierbarkeit
- Trennung von Simulation (Logik) und Darstellung (UI)
- Vorhersehbare, testbare Schnittstellen (Types / Snapshots / Events)
- Erweiterbarkeit für weitere Algorithmen (LCFS, Strict Priority, MLFQ)

---

## Entscheidungen im Detail

**1. Reines Frontend / Deterministischer Simulationskern**

- Begründung: Ein deterministischer, rein-frontend Simulationskern erlaubt:
  - Transparente, reproduzierbare Experimente (wichtiger für wissenschaftliche Arbeit).
  - Einfache Unit-Tests und Validierung ohne Serverabhängigkeiten.
  - Offline-Demonstrationen und einfache Deployment-Optionen (statische Seite).
- Konsequenz: `simulateScenario` liefert vollständige Simulationsergebnisse (Snapshots, Events, Segmente, Metriken).

**2. Snapshot-basiertes Playback**

- Begründung: Snapshots (vollständiger, kurz-frequenter Zustand der Simulation) ermöglichen:
  - Einfaches Vor-/Zurückspringen, Zeitreise und deterministische Wiedergabe.
  - UI-Entkopplung: die Visualisierung rendert nur Zustand, keine Logik.
  - Geringere Fehleranfälligkeit bei Concurrency/Timing (kein UI-getriebener Simulationsstand).
- Implementierungshinweis: `AlgorithmParams.snapshotInterval` bietet Kontrolle über Speicher/Taktung.

**3. Trennung Simulation vs. UI (Single Source of Truth)**

- Begründung: Der Simulationskern ist die einzige Quelle für Zeit, Events, Segmente und Metriken. Dadurch sind Metriken konsistent und unabhängig von UI-Rendering.
- Vorteil in der Arbeit: Messungen (Wartezeit, Durchlaufzeit, Reaktionszeit) können wissenschaftlich korrekt begründet und reproduziert werden.

**4. Vue 3 + TypeScript + Vite**

- Begründung:
  - Vue 3 ermöglicht kompakte SFCs mit klarer Reaktivität und Composition-API (ideal für kompositionale UI-Komponenten wie Gantt, Scrubber).
  - TypeScript erzwingt Typkonsistenz zwischen Simulation und UI; verringert Schnittstellenfehler.
  - Vite bietet schnellen HMR für iteratives Entwickeln während Bachelorarbeit-Entwicklung.
- Konsequenz: zentrale Domain-Typen (`src/types.ts`) definieren API-Verträge.

**5. Komponentendesign: `Gantt.vue`, `Scrubber.vue`, `Tooltip.vue`, `usePlayback`**

- Begründung:
  - `Gantt.vue` kapselt die SVG-Logik (Rendering, Hit-Tests, Pointer-Events) → bessere Wartbarkeit und Wiederverwendbarkeit.
  - `Scrubber.vue` trennt Steuerlogik für Zeitsprung und erlaubt einfache Tests der Steuerungskomponenten.
  - `Tooltip.vue` ist wiederverwendbar und hält UI-Details getrennt von Datenmodell.
  - `usePlayback` (Composable) isoliert Zeitsteuerung: spielen/pausieren/seek/speed, wiederverwendbar in anderen Views.
- Vorteil: einzelne Komponenten lassen sich unabhängig erweitern (z. B. Drag/Zoom, Zoom-Level, Vergleichsansichten).

**6. SVG für Gantt-Visualisierung**

- Begründung:
  - SVG bietet präzises Layout, native text/rect-Elemente, einfache Skalierung (viewBox) und zugängliche DOM-Interaktionen.
  - Leicht per CSS/GSAP animierbar; gute Kontrolle über Zugriffsflächen und Labels.
- Alternative (Canvas) wurde verworfen, weil Canvas weniger zugänglich und schwieriger für DOM-gestützte Tooltips/Events ist.

**7. GSAP für UI-Animationen**

- Begründung:
  - GSAP liefert konsistente, performante Übergänge (Modal, Dashboard-Effekte) und ist ergonomisch für feine Animationstuning.
  - Animationslogik ist rein dekorativ; beeinflusst nicht die Simulation (Trennung von Anliegen).

**8. Ereignislog & Metriken**

- Begründung:
  - Simulation erzeugt sowohl ein chronologisches Event-Log als auch fertige Metriken (Average Waiting Time, Turnaround, Response, CPU-Auslastung, Context Switches, Fairness).
  - Vorteil: die UI zeigt Metriken aus der selben Quelle, die in Experimenten genutzt werden, so dass Visualisierung und Messung identisch sind.

**9. Typsicherheit & Interfaces**

- Begründung:
  - Zentrale Typen (`TimelineSegment`, `SimulationSnapshot`, `ScheduleEvent`, etc.) erleichtern Nachvollziehbarkeit und korrekte Übergaben zwischen Kern und UI.
  - Erlaubt statische Überprüfung und bessere Dokumentation für die Bachelorarbeit.

**10. Speicher- / Performance-Überlegungen**

- Begründung:
  - Snapshots können speicherintensiv werden; deshalb `snapshotInterval` als Parameter, mögliche GC/Pruning später.
  - Rendering optimiert: Gantt rendert nur übergebene Segmente (keine unnötigen DOM-Updates).
  - Profilierbarkeit: durch Trennung Simulation/UI lassen sich Hotspots gezielt messen.

**11. API- und Event-Design (Props/Emits)**

- Begründung:
  - Klare Props/Emits (z. B. `segments`, `tickMarks` und `segmentEnter/Click`) minimieren Kopplung.
  - Ermöglicht Testen der Komponenten isoliert (Unit/Integration).

**12. Zugänglichkeit & Nutzbarkeit**

- Begründung:
  - SVG-Elemente mit ARIA-Attributen und textueller Beschriftung unterstützen Screenreadern grundlegend.
  - Interaktion per Pointerevents ergänzt durch Tastatursteuerung ist als Erweiterung geplant.

---

## Wie diese Entscheidungen in der Bachelorarbeit nutzen

- Methodenteil: Beschreibe die Architektur mit Fokus auf Reproduzierbarkeit (deterministischer Kern) und Messintegrität (Metriken aus Simulation).
- Implementierungsabschnitte: Zeige konkrete Schnittstellen (Beispiele aus `src/types.ts` und `simulateScenario`) als Listing.
- Validierung: Erkläre, wie Snapshot-Wiedergabe und Event-Logs zur Verifikation der Implementierung genutzt werden (Determinismus-Tests).
- Erweiterbarkeit: Diskutiere, wie neue Algorithmen in den existierenden Kern integriert werden können (vorhersagbare Hook-Punkte: enqueue/dispatch/pushSegment).
- Limitationen & zukünftige Arbeit: Speicher-Tradeoffs (Snapshots), erweiterte Visualisierungen (Vergleichsansichten, Zoom), serverseitige Simulation für sehr große Szenarien.

---

## Kurze Zusammenfassung (1–2 Sätze)

Die Architektur trennt strikt Simulationslogik und Darstellung, verwendet deterministische Snapshots als einzige Quelle der Wahrheit und kapselt Visualisierung und Steuerung in wiederverwendbaren, typsicheren Komponenten — das maximiert Reproduzierbarkeit, Testbarkeit und Erweiterbarkeit, Anforderungen, die für eine wissenschaftlich fundierte Bachelorarbeit zentral sind.

---
