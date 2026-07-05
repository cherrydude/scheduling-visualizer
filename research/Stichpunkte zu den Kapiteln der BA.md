# Stichpunkte zu den Kapiteln der Bachelorarbeit

## 1. Einleitung

- Hinführung zum Thema Scheduling und dessen Relevanz in Betriebssystemen
- Problemstellung: schwer verständliche Abläufe präemptiver Verfahren
- Motivation für die Entwicklung einer interaktiven Visualisierung
- Ziel der Bachelorarbeit
- Forschungsfrage bzw. Leitfrage
- Methodisches Vorgehen und Aufbau der Arbeit

## 2. Theoretische Grundlagen

### 2.1 Betriebssysteme und Prozessverwaltung

- Aufgabe von Betriebssystemen
- Prozesse und Threads als Grundbegriffe
- Prozesszustände und Zustandsübergänge
- Verwaltung von Ressourcen durch das Betriebssystem

### 2.2 CPU-Scheduling in Betriebssystemen

- Bedeutung von CPU-Scheduling
- Zielsetzungen von Scheduling-Verfahren
- Einfluss auf Systemverhalten und Benutzererfahrung
- Zusammenhang zwischen Scheduling und Multitasking

### 2.3 Präemptive Scheduling-Verfahren

- Definition präemptiver Verfahren
- Kontextwechsel und Unterbrechung laufender Prozesse
- Vorteile und Nachteile präemptiver Planung
- Abgrenzung zu nicht-präemptiven Verfahren

### 2.4 Überblick über die betrachteten Algorithmen

#### 2.4.1 Last Come First Served

- Grundprinzip des Algorithmus
- Ablauf und Reihenfolge der Abarbeitung
- typische Eigenschaften und Nachteile

#### 2.4.2 Round Robin

- Zeitquantum als zentrales Prinzip
- zyklische Abarbeitung der Prozesse
- Bedeutung für Fairness und Reaktionszeit

#### 2.4.3 Strict Priority

- Prioritätsbasierte Auswahl des nächsten Prozesses
- Auswirkungen auf wichtige und weniger wichtige Prozesse
- mögliche Probleme wie Starvation

#### 2.4.4 Multilevel Feedback Queue

- Aufbau mehrerer Warteschlangen
- dynamische Anpassung der Prozesspriorität
- Vorteile für unterschiedlich priorisierte bzw. rechenintensive Prozesse

### 2.5 Kriterien zur Bewertung von Scheduling-Verfahren

#### 2.5.1 Wartezeit

- Definition der Wartezeit
- Berechnung und Bedeutung für den Vergleich der Verfahren

#### 2.5.2 Durchlaufzeit

- Definition der Durchlaufzeit
- Zusammenhang zwischen Einlastung und Abschluss eines Prozesses

#### 2.5.3 Reaktionszeit

- Bedeutung der Reaktionszeit für interaktive Systeme
- Relevanz bei präemptiven Verfahren

## 3. Didaktische Grundlagen interaktiver Visualisierungen

### 3.1 Lernen mit digitalen Medien

- Rolle digitaler Medien im Lernprozess
- Chancen interaktiver Anwendungen
- Abgrenzung zu rein textbasierten oder statischen Lernformen

### 3.2 Multimediales und visuelles Lernen

- Nutzen von Bildern, Animationen und Interaktionen
- Verarbeitung komplexer Informationen durch visuelle Darstellung
- Verbindung zwischen Wahrnehmung und Verständnis

### 3.3 Didaktischer Nutzen von Simulationen

- Simulation als Methode zur Veranschaulichung abstrakter Abläufe
- Erprobung von Szenarien ohne reale Systemeingriffe
- Lernen durch Beobachtung und Vergleich

### 3.4 Visualisierung komplexer Abläufe im Lernkontext

- Warum Scheduling-Abläufe schwer statisch darstellbar sind
- Mehrwert von Zeitachsen und Gantt-Diagrammen
- Visualisierung von Präemption und Kontextwechseln

### 3.5 Anforderungen an die Aufbereitung von Scheduling-Prozessen

- Verständlichkeit und Reduktion kognitiver Belastung
- sinnvolle Schritt-für-Schritt-Darstellung
- Vergleichbarkeit verschiedener Algorithmen
- didaktische Klarheit der Darstellung

## 4. Grundlagen der Mensch-Computer-Interaktion

### 4.1 Ziele der Mensch-Computer-Interaktion

- Verständliche und effiziente Nutzung von Software
- Nutzerorientierung als zentrales Prinzip
- Bedeutung von Interaktionsdesign für Lernanwendungen

### 4.2 Usability und Nutzerfreundlichkeit

- Definition von Usability
- Kriterien wie Effektivität, Effizienz und Zufriedenheit
- Bedeutung für Lern- und Visualisierungsanwendungen

### 4.3 Interaktionsgestaltung für Lernanwendungen

- Gestaltung einfacher und klarer Interaktionen
- Unterstützung des Lernprozesses durch gute Bedienbarkeit
- Vermeidung unnötiger Komplexität

### 4.4 Rückmeldung, Transparenz und Verständlichkeit

- Sichtbarkeit des aktuellen Zustands
- verständliche Rückmeldungen bei Nutzeraktionen
- Bedeutung von Konsistenz und Vorhersagbarkeit

### 4.5 Anforderungen an die Benutzungsoberfläche des Visualizers

- klare Struktur der Oberfläche
- intuitive Bedienung
- geeignete Eingabemöglichkeiten für Prozesse und Parameter
- gute Lesbarkeit und visuelle Hierarchie

## 5. Anforderungen und Konzeption des Scheduling-Visualizers

### 5.1 Zielgruppe und Einsatzkontext

- Studierende als primäre Zielgruppe
- Einsatz in der Lehre oder Selbstlernphase
- typische Nutzungssituationen

### 5.2 Fachliche Anforderungen

- korrekte Modellierung der Scheduling-Verfahren
- Unterstützung der ausgewählten Algorithmen
- nachvollziehbare Berechnung der Kennzahlen

### 5.3 Didaktische Anforderungen

- Förderung des Verständnisses für Scheduling-Abläufe
- Vergleichbarkeit der Algorithmen
- schrittweise oder automatische Erklärung der Abläufe

### 5.4 Funktionale Anforderungen

- Eingabe von Prozessdaten
- Auswahl des gewünschten Algorithmus
- Start, Pause, Schrittweise-Ausführung und Neustart von Simulationen
- Anzeige von Ergebnissen und Kennzahlen

### 5.5 Nicht-funktionale Anforderungen

- gute Bedienbarkeit
- schnelle Reaktionszeit der Anwendung
- übersichtliches Layout
- plattformunabhängige Nutzung im Webbrowser

### 5.6 Konzeption der Simulationslogik

- Modellierung der Prozessdaten
- Ablaufsteuerung der Simulation
- Behandlung von Kontextwechseln und Zeitquantum
- Berechnung von Wartezeit, Durchlaufzeit und Reaktionszeit

### 5.7 Konzeption der Visualisierung

- Nutzung von Zeitachsen und Gantt-Diagrammen
- Farbcodierung von Prozessen
- Darstellung von Aktivität, Wartephasen und Unterbrechungen
- Vergleich mehrerer Algorithmen auf demselben Szenario

### 5.8 Konzeption der Benutzungsoberfläche

- Anordnung der Eingabefelder und Steuerungselemente
- Gestaltung verständlicher Anzeigen
- Rückmeldung über den Simulationszustand
- Übersichtlichkeit und Konzentration auf die Lernziele

## 6. Implementierung

### 6.1 Technische Grundlagen und verwendete Technologien

- Einsatz von TypeScript, HTML, CSS, SVG und Vue.js
- Gründe für die Wahl des Web-Stacks
- technische Rahmenbedingungen

### 6.2 Architektur der Anwendung

- Aufbau der Komponenten
- Trennung von Logik, Darstellung und Steuerung
- Datenfluss innerhalb der Anwendung

### 6.3 Modellierung der Scheduling-Verfahren

- Abbildung der Algorithmen in Code
- Verarbeitung von Prioritäten, Zeitquantum und Warteschlangen
- Sicherstellung fachlicher Korrektheit

### 6.4 Umsetzung der Simulation

- zeitbasierte Simulation der Prozesse
- Schritt-für-Schritt-Ausführung
- automatische Berechnung der nächsten Ereignisse

### 6.5 Umsetzung der Visualisierung

- Darstellung der Prozessabläufe in SVG
- Umsetzung der Zeitachsen und Ablaufbalken
- visuelle Hervorhebung relevanter Ereignisse

### 6.6 Umsetzung der Interaktionsmechanismen

- Eingabe und Bearbeitung von Prozessdaten
- Steuerung der Simulation durch Nutzeraktionen
- Rückmeldungen und Aktualisierung der Ansicht

### 6.7 Besondere technische Herausforderungen

- Synchronisation von Simulation und Darstellung
- korrekte Behandlung von Präemption und Kontextwechseln
- Reproduzierbarkeit und Verständlichkeit der Ergebnisse

## 7. Evaluation

### 7.1 Zielsetzung der Evaluation

- Überprüfung der Verständlichkeit und Nützlichkeit
- Bewertung der fachlichen Korrektheit
- Einschätzung der Benutzerfreundlichkeit

### 7.2 Evaluationsdesign

- Auswahl der Evaluationsmethode
- mögliche Szenarien und Testaufgaben
- Kriterien für die Bewertung

### 7.3 Durchführung der Evaluation

- Beschreibung des Ablaufs
- dokumentierte Testfälle
- Einbindung von Rückmeldungen

### 7.4 Auswertung der Ergebnisse

- Zusammenfassung der Beobachtungen
- qualitative Einschätzungen
- Vergleich der Algorithmen und Darstellungsformen

### 7.5 Diskussion der Ergebnisse

- Interpretation der Rückmeldungen
- Stärken und Schwächen der Anwendung
- Ableitung von Verbesserungspotenzial

## 8. Fazit und Ausblick

### 8.1 Zusammenfassung der Ergebnisse

- Rückblick auf Zielsetzung und Umsetzung
- wichtigste Erkenntnisse der Arbeit

### 8.2 Beantwortung der Forschungsfrage

- inwiefern das Ziel der Veranschaulichung erreicht wurde
- Beitrag der Anwendung zum Verständnis von Scheduling

### 8.3 Ausblick auf mögliche Weiterentwicklungen

- Erweiterung um weitere Scheduling-Verfahren
- Verbesserung der Evaluation
- mögliche didaktische und technische Erweiterungen
