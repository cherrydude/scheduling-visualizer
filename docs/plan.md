## Plan: Accessibility-Audit und Thesis-Nachweis

Die Bachelorarbeit und der Scheduling-Visualizer werden gemeinsam überarbeitet. Schwerpunkt ist eine WCAG-/BITV-orientierte, praktisch belegte Accessibility-Prüfung des bestehenden Vue-Visualizers. Nachhaltigkeit wird ausdrücklich aus diesem Arbeitsumfang ausgeschlossen. Das Ergebnis soll keine pauschale Konformitätserklärung sein, sondern eine nachvollziehbare Traceability von Anforderung über Entwurf und Implementierung bis zum Test-/Prüfergebnis.

**Steps**

### Phase 1: Prüfmaßstab und Traceability festlegen
1. Eine begrenzte Prüfmatrix mit eindeutigen IDs definieren, z. B. A11Y-01 bis A11Y-08: semantische Struktur, Tastaturbedienung, Fokus sichtbar und logisch, Dialog-Fokusmanagement, Statuskommunikation, Gantt-/SVG-Zugänglichkeit, Kontrast/Farbnutzung, Reflow/Zoom sowie reduzierte Bewegung. Die Kriterien werden auf die tatsächlich relevante Oberfläche des Schedulers begrenzt.
2. Für jedes Kriterium festlegen: WCAG-Referenz, konkrete Produktanforderung, Prüfverfahren, erwartetes Ergebnis und bekannte Grenze. WCAG 2.1 bleibt die normative Referenz; das Kursdokument von Annika Brinkmann wird als angewandte UI-/Accessibility-Handreichung und Entwurfsgrundlage eingeordnet, nicht als Ersatz für die Primärquelle.
3. Eine Kurzfassung der Matrix im Haupttext und eine vollständige Operationalisierungstabelle im Anhang vorsehen. Jede Zeile enthält A-ID, Anforderung, Entwurfsentscheidung in Kapitel 4, Implementierungsort, Test-/Prüfnachweis und Ergebnis/Grenze.

### Phase 2: Bestehenden Scheduler prüfen
4. Automatisierte Basisprüfung ausführen: Build und bestehende Vitest-Suite. Die tatsächliche Testdatei- und Testfallzahl wird aus dem aktuellen Stand ermittelt, bevor Zahlen in Kapitel 6 übernommen werden.
5. Accessibility-Codepfade gezielt prüfen: `useFocusTrap`, Welcome-/Algorithmus-/Generator- und Ranking-Dialog, Burger-Menü, Playback-Steuerung, Gantt-SVG, Vergleichsansicht, Statusmeldungen und globale Fokus-/Forced-Colors-Regeln.
6. Manuelles Prüfprotokoll für die fokussierte Oberfläche durchführen: vollständiger Keyboard-Walkthrough ohne Maus, sichtbare Fokusreihenfolge, Tab-Zirkulation und Escape in Dialogen, Fokus-Rückgabe, Menübedienung, Gantt-Segmente, Slider, Statusänderungen, 200-%-Zoom/Reflow, reduzierte Bewegung sowie Farb-/Kontrastprüfung. Für jede Prüfung werden Setup, Schritte, Beobachtung und Ergebnis dokumentiert.
7. Die vorhandenen Tests korrekt klassifizieren: statische Quelltextprüfungen bleiben statische Prüfungen; der Placeholder-Test wird nicht als Accessibility-Nachweis gezählt; `axe-core` wird nur als Runtime-Prüfung bezeichnet, wenn tatsächlich ein DOM-Scan in einer laufenden gerenderten Oberfläche erfolgt.

### Phase 3: Fokussierte Produktverbesserungen
8. Kritische Dialogpfade vereinheitlichen, insbesondere `RankingEditModal.vue` an das vorhandene `useFocusTrap`-Muster anbinden und Escape, initialen Fokus sowie Fokus-Rückgabe nach demselben Prinzip absichern.
9. Bedienelemente mit unvollständiger Semantik verbessern: Range-Slider in `GanttWithGsap.vue` mit sichtbarer/programmgesteuerter Beschriftung versehen; die Vergleichsansicht entweder als echte Tabs mit `role="tab"`/`aria-selected`/Tastaturnavigation ausführen oder die vorhandene `tablist`-Rolle entfernen und als Auswahlgruppe modellieren.
10. Burger-Menü und interaktive Gantt-Darstellung auf tatsächlich nutzbare Tastaturinteraktion und verständliche Statuskommunikation prüfen und nur dort erweitern, wo das Prüfprotokoll eine Lücke zeigt.
11. Kontrast- und Farbnutzung anhand der tatsächlich verwendeten Designvariablen in `styles.css` prüfen. Farbe darf nicht alleinige Informationsträgerin sein; Status, Prozessidentität und aktive Zustände erhalten zusätzlich Text, Struktur, Muster, Label oder andere nichtfarbliche Unterscheidungsmerkmale. Forced Colors und sichtbare Fokusindikatoren bleiben erhalten.
12. Falls eine echte DOM-basierte axe-Prüfung im vorhandenen Test-Setup ohne unverhältnismäßigen Umbau möglich ist, einen kleinen Runtime-Test für gerenderte Kernansichten ergänzen. Andernfalls wird der Umfang bewusst auf statische Tests plus manuelles Prüfprotokoll begrenzt und genau so dokumentiert.

### Phase 4: Thesis-Inhalte einarbeiten
13. Kapitel 3 erweitern: Accessibility als operationalisierte nicht-funktionale Anforderung mit A-IDs, Zielgruppe/Einsatzkontext, Kontrast/Farbe, Tastatur, Fokus, Reflow, Statuskommunikation und reduzierter Bewegung.
14. Kapitel 4 erweitern: Accessibility als Entwurfsprinzip. Beschreiben, wie Dialogzustände, Fokusmanagement, semantische SVG-Beschreibung, Statuskanäle und Farbcodierung in die Architektur eingeordnet werden.
15. Kapitel 5 erweitern: konkrete Umsetzung anhand der betroffenen Komponenten und Composables. Keine allgemeine Wiedergabe des Handouts, sondern Begründung der Entscheidungen am Scheduler.
16. Kapitel 6 erweitern: Prüfstrategie und Ergebnisse getrennt nach automatisierten Tests, statischer Codeprüfung und manueller Prüfung. Kontraste/Farben, Keyboard, Dialoge, Gantt, Reflow und Reduced Motion werden mit Ergebnis und Grenze aufgeführt. Keine Behauptung vollständiger WCAG-/BITV-Konformität.
17. Kapitel 7 ergänzen: Screenshots und Produktzustände interpretieren, insbesondere Fokusansicht, Status-/Ereignisanzeige, Dialog und Vergleichsansicht. Jede Abbildung wird mit der unterstützten Nutzerhandlung bzw. Anforderung verknüpft.
18. Anhang ergänzen: vollständige Operationalisierungsmatrix und kompaktes Accessibility-Prüfprotokoll. Das Kursdokument sowie der abgeschlossene Kurs werden im Methodik-/Danksagungs- oder Quellenkontext angemessen erwähnt; die wissenschaftlichen Kriterien werden primär über WCAG und einschlägige HCI-Literatur belegt.

### Phase 5: Verifikation und redaktioneller Abschluss
19. Nach jeder Produktänderung die fokussierten Frontend-Tests ausführen; anschließend Build und vollständige Testsuite ausführen.
20. Die manuelle Prüfung nach den Änderungen wiederholen und alte Befunde als behoben, offen oder bewusst nicht im Scope markieren.
21. Thesis kompilieren, Inhalts-/Abbildungs-/Literaturverzeichnis aktualisieren und prüfen, dass alle A-IDs, Quellen, Implementierungsverweise und Testzahlen konsistent sind.
22. Endkontrolle auf Überclaims: Die Arbeit beschreibt einen begrenzten, nachweisbaren Accessibility-Prüfstand und keine Zertifizierung, vollständige BITV-Erfüllung oder empirische Lernwirksamkeit.

**Relevant files**
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/src/composables/useFocusTrap.ts` — vorhandenes Fokusmanagement als Referenz für Dialoge.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/src/components/RankingEditModal.vue` — voraussichtlich kritischster Dialogpfad.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/src/components/WelcomeModal.vue` — Dialogsemantik und Tastaturverhalten.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/src/components/AlgorithmPickerModal.vue` — Dialogsemantik und Fokusverhalten.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/src/AppShell.vue` — Generator-Dialog, Statuskarten und zentrale Interaktionslogik.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/src/components/BurgerMenu.vue` — Menüsemantik und Tastaturnavigation.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/src/components/Gantt.vue` — SVG-Semantik, Labels, Beschreibungen und Segmentinteraktion.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/src/components/GanttWithGsap.vue` — Playback, Slider und Reduced Motion.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/src/components/ComparisonPanel.vue` — Auswahl-/Tab-Semantik und Live-Status.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/src/styles.css` — Farben, Kontrast, Fokusindikatoren, Forced Colors, Typografie und Reduced-Motion-Regeln.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/tests/accessibility.test.ts` — Placeholder, nicht als Nachweis ausgeben.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/tests/accessibility.real.test.ts` — statische Accessibility-Markerprüfungen.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/tests/axe.runtime.test.ts` — aktuell ebenfalls statische Prüfungen trotz Dateiname.
- `/home/cherrydude/Projekte/bht-ba-root/bachlorarbeit/thesis-final/03-anforderungsanalyse.tex` — A11Y-Anforderungen und A-ID-Matrix im Haupttext.
- `/home/cherrydude/Projekte/bht-ba-root/bachlorarbeit/thesis-final/04-systementwurf.tex` — Accessibility als Entwurfsprinzip.
- `/home/cherrydude/Projekte/bht-ba-root/bachlorarbeit/thesis-final/05-implementierung.tex` — konkrete Umsetzung.
- `/home/cherrydude/Projekte/bht-ba-root/bachlorarbeit/thesis-final/06-qualitaetssicherung.tex` — Prüfverfahren, Ergebnisse und Grenzen.
- `/home/cherrydude/Projekte/bht-ba-root/bachlorarbeit/thesis-final/07-ergebnis-produktpraesentation.tex` — interpretierte Produktnachweise.
- `/home/cherrydude/Projekte/bht-ba-root/bachlorarbeit/thesis-final/anhang.tex` — vollständige Matrix und Prüfprotokoll.
- `/home/cherrydude/Projekte/bht-ba-root/scheduling-visualizer/research/40_1x1_UI-Design.txt` — Kurs-/Handreichungsgrundlage für UI- und Accessibility-Entscheidungen.
- `/home/cherrydude/Projekte/bht-ba-root/bachlorarbeit/thesis-final/bib.bib` — WCAG- und HCI-Quellen ergänzen bzw. korrekt einordnen.

**Verification**
1. `npm run test` im Scheduler ohne Placeholder-Testzählung als Accessibility-Ergebnis zu interpretieren.
2. `npm run build` im Scheduler erfolgreich ausführen.
3. Fokussierte Vitest-Prüfungen für Dialoge, Menü, Gantt, Playback, Statuskommunikation und Vergleichsansicht ergänzen bzw. ausführen.
4. Manuelles Prüfprotokoll an mindestens einer Desktop- und einer schmalen Viewport-Größe sowie bei 200-%-Zoom durchführen; Kontrast/Farbe mit einem geeigneten Contrast Checker gegen die tatsächlich gerenderten Zustände prüfen.
5. Keyboard-only-Prüfung einschließlich Dialog-Öffnen/-Schließen, Fokusfalle, Fokus-Rückgabe, Menü, Slider, Playback, Vergleichsansicht und Gantt-Segmenten durchführen.
6. `prefers-reduced-motion` und Forced Colors soweit im verfügbaren Browser-/DevTools-Setup möglich prüfen.
7. Thesis mit dem vorhandenen Makefile/LaTeX-Workflow kompilieren; Verzeichnisse, Seitenzahlen und Literaturverweise kontrollieren.
8. Abschlussprüfung der Operationalisierungsmatrix gegen Code, Tests und manuelle Befunde.

**Decisions**
- Priorität: Accessibility zuerst.
- Prüfbreite: fokussierter Prüfstand, ausdrücklich inklusive Kontrast und Farbnutzung; kein vollständiger Zertifizierungs-/Konformitätsaudit.
- Nachhaltigkeit: aus diesem Arbeitsumfang ausgeschlossen.
- Keine empirische Nutzerstudie und keine Aussage zur Lernwirksamkeit.
- Der Kursabschluss bei Annika Brinkmann darf als Entstehungs- und Anwendungskontext genannt werden; normative Aussagen werden auf WCAG/BITV und wissenschaftliche HCI-Quellen gestützt.
- Vorhandene statische Tests werden nicht rückwirkend als echte axe- oder Laufzeitprüfungen bezeichnet.

**Further Considerations**
1. Vor der Umsetzung muss entschieden werden, ob der vorhandene Placeholder-Test gelöscht, in einen echten Test umgewandelt oder als bewusst gekennzeichneter Scaffold bestehen bleibt. Empfehlung: nicht als Qualitätsnachweis zählen und entweder ersetzen oder klar aus dem Testlauf ausschließen.
2. Die genaue WCAG-Version sollte in der Thesis einheitlich festgelegt werden. Empfehlung: WCAG 2.1 als vorhandene zitierte Referenz beibehalten und die ausgewählten Kriterien explizit nennen.
