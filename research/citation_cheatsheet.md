# Zitier‑Kurzreferenz und Muster‑Sätze

Diese Datei enthält eine kompakte Anleitung für In‑Text‑Zitate im APA‑Stil (auf Deutsch formuliert) sowie fertige Muster‑Sätze für Einleitung, Methoden und Diskussion, die du direkt in deiner Bachelorarbeit verwenden kannst. Die Zitationsdaten stammen aus `research/bibliography_selected.bib` im Repository.

## Kurzregeln (APA‑7) — In‑Text

- 1 Autor: (Nachname, Jahr) oder Nachname (Jahr)
- 2 Autoren: (Nachname1 & Nachname2, Jahr) oder Nachname1 und Nachname2 (Jahr)
- 3+ Autoren: (Nachname1 et al., Jahr) oder Nachname1 et al. (Jahr)
- Direktes Zitat: ergänze Seitenzahl: (Nachname, Jahr, p. X)
- Mehrere Quellen in einer Klammer: alphabetisch, durch Semikolon getrennt: (AutorA, Jahr; AutorB, Jahr)

## Kurze Beispiele (Formen)

- Narrative Form: Hundhausen, Douglas und Stasko (2002) zeigen, dass …
- Parenthetische Form: (Hundhausen, Douglas, & Stasko, 2002)
- Zwei Autoren: (Meing & Tandingan, 2025) bzw. Meing und Tandingan (2025)
- Drei+ Autoren: (Banks et al., 2010) bzw. Banks et al. (2010)
- Software/GitHub: (Sibtain-12, 2023) — Optional: Commit‑Hash hinzufügen: (Sibtain-12, 2023, commit 1a2b3c4)
- Webseiten ohne Datum: (GreenSock, n.d.) oder (Vue.js Core Team, n.d.)

## Fertige Muster‑Sätze

Hinweis: Du kannst die Sätze direkt einfügen oder leicht anpassen; die Zitate sind bereits im APA‑In‑Text‑Format.

### Einleitung

1. Präemptive Scheduling‑Algorithmen sind zentral für das Verständnis moderner Betriebssysteme, zeigen charakteristische Unterschiede hinsichtlich Antwortzeit, Durchlaufzeit und Anzahl der Kontextwechsel und werden in der Literatur ausführlich beschrieben (Silberschatz, Galvin, & Gagne, 2018; Tanenbaum & Bos, 2014).

2. Die Konzepte und Metriken, die in dieser Arbeit verwendet werden (Wartezeit, Durchlaufzeit, Antwortzeit), folgen den Standarddefinitionen der Betriebssystemliteratur (Silberschatz et al., 2018; Pinedo, 2016).

3. Frühere Übersichten zur Wirksamkeit von Algorithmus‑Visualisierungen kommen zu dem Schluss, dass Visualisierungen allein nicht automatisch Lerngewinne bringen — entscheidend ist die Form der Interaktion und Einbindung der Lernenden (Hundhausen, Douglas, & Stasko, 2002).

4. Ziel dieser Arbeit ist es, präemptive Scheduler (u. a. Round Robin, LCFS, MLFQ) korrekt zu simulieren, interaktiv zu visualisieren und die didaktische Wirksamkeit der Visualisierungen zu evaluieren (Meing & Tandingan, 2025; AlgoViz community, n.d.).

### Methoden

1. Die Simulationsumgebung basiert auf diskreter Ereignissimulation (discrete‑event simulation) mit deterministischen Zufallsseeds zur Reproduzierbarkeit der Szenarien (Banks, Carson II, Nelson, & Nicol, 2010).

2. Für die Implementierung wurde eine clientseitige Web‑Applikation mit Vue 3 und TypeScript gewählt; für die Timeline‑Animationen kommt GSAP zum Einsatz, um flüssige und kontrollierte Animationen zu ermöglichen (Vue.js Core Team, n.d.; GreenSock, n.d.).

3. Zur Bewertung der Visualisierungseffekte kombinieren wir quantitative Metriken (Durchschnitts‑Wartezeit, Durchlaufzeit, Anzahl der Kontextwechsel) mit einer kurzen Nutzerstudie und SUS‑Messung zur Usability (Brooke, 1996; Hundhausen et al., 2002).

4. Die MLFQ‑Varianten, die in Experimenten verglichen werden, orientieren sich an den in Meing & Tandingan (2025) beschriebenen Kombinationen; für die Auswahl von Zeitquantum‑Parametern wird eine deterministische (seed‑basierte) Strategie verwendet, um Vergleichbarkeit sicherzustellen.

### Diskussion

1. Unsere Ergebnisse bestätigen, dass interaktive Eingriffspunkte (z. B. Vorhersageaufgaben, Manipulation von Parametern) die Lernwirkung der Visualisierung erhöhen — ein Befund, der mit der Meta‑Studie von Hundhausen et al. (2002) und neueren AV‑Interventionsstudien übereinstimmt (Hundhausen et al., 2002; Kucera, 2025).

2. Im Vergleich zu Standard‑Benchmarks zeigen MLFQ‑Kombinationen eine bessere Anpassungsfähigkeit an heterogene Workloads, was mit den Simulationsergebnissen von Meing & Tandingan (2025) konsistent ist; die Unterschiede in Antwortzeit und Kontextwechselrate sind diskutiert und kontextualisiert.

3. Methodische Einschränkungen unserer Evaluation bestehen in der Stichprobengröße der Nutzertests und möglichen Verzerrungen durch Vorwissen der Teilnehmenden; zukünftige Arbeiten sollten randomisierte Kontrollgruppen und größere Stichproben umfassen (Hundhausen et al., 2002; Banks et al., 2010).

4. Implementierungs‑ und Performanzaspekte (Rendering, Frame‑Rates) sind kritisch für die Nutzbarkeit großer Szenarien; wir schlagen eine Kombination aus optimierten SVG/Canvas‑Renderpfaden und reduzierten Intro‑Animationen vor, wie sie in Web‑Animations‑Best‑Practices empfohlen werden (GreenSock, n.d.; Vue.js Core Team, n.d.; W3C, 2018).

## Quick links

- BibTeX Datei im Repo: `bibliography_selected.bib` (root)
- Repo permalink: https://github.com/cherrydude/scheduling-visualizer/blob/main/bibliography_selected.bib

---

Wenn du möchtest, committe ich diese Datei in dein Repository (als `docs/citation_cheatsheet.md`). Bestätige kurz mit "Ja, committe die Datei" und ich lege sie an.
