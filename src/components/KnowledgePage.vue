<template>
  <div class="knowledge-page">
    <header class="knowledge-hero">
      <div>
        <span class="knowledge-kicker">Wissen &amp; Hilfe</span>
        <h1>Scheduling verständlich lesen</h1>
        <p>
          Diese Seite erklärt die wichtigsten Bereiche der Visualisierung, ihre
          Bedienung und die Bedeutung der Ergebnisse.
        </p>
      </div>
      <div class="knowledge-hero-mark" aria-hidden="true">01</div>
    </header>

    <nav class="knowledge-nav" aria-label="Auf dieser Seite">
      <a href="#start">Schnellstart</a>
      <a href="#fokusansicht">Fokusansicht</a>
      <a href="#stack">Stack-Simulation</a>
      <a href="#kennzahlen">Kennzahlen</a>
      <a href="#vergleich">Vergleichen</a>
      <a href="#praemption">Präemption</a>
    </nav>

    <section id="start" class="knowledge-section knowledge-section--intro">
      <div class="section-heading-block">
        <span class="knowledge-kicker">01 · Einstieg</span>
        <h2>In drei Schritten zur ersten Simulation</h2>
      </div>
      <div class="step-grid">
        <article class="knowledge-step">
          <span class="step-number">1</span>
          <h3>Szenario anlegen</h3>
          <p>
            Öffne das Burgermenü und wähle <strong>+ Szenario</strong>. Lege für
            jeden Prozess ID, Ankunftszeit, Rechenzeit und Priorität fest.
          </p>
        </article>
        <article class="knowledge-step">
          <span class="step-number">2</span>
          <h3>Algorithmus anwenden</h3>
          <p>
            Wähle einen Algorithmus und bestätige die Parameter. Für SJF kannst
            du zwischen nicht-präemptivem SJF und präemptivem SRTF wählen.
          </p>
        </article>
        <article class="knowledge-step">
          <span class="step-number">3</span>
          <h3>Ablauf untersuchen</h3>
          <p>
            Starte Play oder gehe mit den Pfeiltasten Takt für Takt durch den
            Run. Lies dabei Timeline, Stack-Simulation und Kennzahlen zusammen.
          </p>
        </article>
      </div>
    </section>

    <section id="fokusansicht" class="knowledge-section">
      <div class="section-heading-block">
        <span class="knowledge-kicker">02 · Ablauf</span>
        <h2>Die Fokusansicht</h2>
        <p>
          Die Fokusansicht zeigt einen einzelnen Run im Detail. Sie beantwortet
          vor allem die Frage: <strong>Wer bekommt wann CPU-Zeit?</strong>
        </p>
      </div>
      <div class="explanation-grid">
        <article class="explanation-card explanation-card--wide">
          <div class="diagram-sample" aria-hidden="true">
            <span class="diagram-label">Zeit</span>
            <div class="diagram-track">
              <i class="diagram-segment diagram-segment--one">P1</i>
              <i class="diagram-segment diagram-segment--two">P2</i>
              <i class="diagram-segment diagram-segment--three">P1</i>
            </div>
            <div class="diagram-ticks">
              <span>0</span><span>2</span><span>4</span><span>6</span>
            </div>
          </div>
          <h3>Timeline lesen</h3>
          <p>
            Jeder farbige Balken zeigt ein CPU-Ausführungssegment. Die Position
            beschreibt den Zeitraum, die Farbe und Beschriftung den Prozess.
            Eine Lücke steht für Leerlauf der CPU.
          </p>
        </article>
        <article class="explanation-card">
          <h3>Steuerung</h3>
          <ul>
            <li>
              <strong>Play / Pause:</strong> Simulation starten oder anhalten.
            </li>
            <li><strong>← / →:</strong> einen Takt zurück oder vor.</li>
            <li>
              <strong>Reset:</strong> an den Anfang des Runs zurückkehren.
            </li>
            <li><strong>Endlos:</strong> den Ablauf wiederholen.</li>
          </ul>
        </article>
        <article class="explanation-card">
          <h3>Bei MLFQ</h3>
          <p>
            Die horizontalen Ebenen entsprechen den Queue-Levels. Ein Prozess,
            der sein Quantum verbraucht, kann in eine niedrigere Ebene wechseln.
            So werden Demotionen im Ablauf sichtbar.
          </p>
        </article>
      </div>
    </section>

    <section id="stack" class="knowledge-section knowledge-section--split">
      <div class="section-heading-block">
        <span class="knowledge-kicker">03 · Zustand</span>
        <h2>Die Stack-Simulation</h2>
        <p>
          Die Stack-Simulation zeigt den Zustand der Ready Queue zum aktuellen
          Zeitpunkt. Sie ergänzt die Timeline um die Prozesse, die gerade nicht
          laufen.
        </p>
      </div>
      <div class="reading-list">
        <div>
          <strong>Aktiv</strong
          ><span>Der Prozess, der aktuell CPU-Zeit erhält.</span>
        </div>
        <div>
          <strong>Bereit</strong
          ><span>Prozesse, die angekommen sind und auf die CPU warten.</span>
        </div>
        <div>
          <strong>Verdrängt</strong
          ><span
            >Ein Prozess, der unterbrochen wurde und später fortgesetzt werden
            kann.</span
          >
        </div>
        <div>
          <strong>Wartezeit</strong
          ><span
            >Je länger ein Prozess wartet, desto genauer solltest du Fairness
            und Starvation prüfen.</span
          >
        </div>
      </div>
    </section>

    <section id="kennzahlen" class="knowledge-section">
      <div class="section-heading-block">
        <span class="knowledge-kicker">04 · Bewertung</span>
        <h2>Kennzahlen richtig einordnen</h2>
        <p>
          Eine einzelne Kennzahl erklärt keinen Algorithmus vollständig.
          Vergleiche immer mindestens eine Zeitkennzahl mit Fairness oder
          Präemptionen.
        </p>
      </div>
      <div class="metric-guide">
        <div class="metric-row">
          <strong>Wartezeit</strong
          ><span
            >Zeit, die Prozesse in der Ready Queue verbringen. Niedrig ist meist
            besser.</span
          >
        </div>
        <div class="metric-row">
          <strong>Durchlaufzeit</strong
          ><span
            >Zeit von der Ankunft bis zur Fertigstellung eines Prozesses.</span
          >
        </div>
        <div class="metric-row">
          <strong>Antwortzeit</strong
          ><span
            >Zeit bis zur ersten CPU-Ausführung. Wichtig für interaktive
            Systeme.</span
          >
        </div>
        <div class="metric-row">
          <strong>Durchsatz</strong
          ><span
            >Anzahl fertiggestellter Prozesse im Verhältnis zur
            Simulationszeit.</span
          >
        </div>
        <div class="metric-row">
          <strong>Fairness</strong
          ><span
            >Wie gleichmäßig CPU-Zeit verteilt wird. Ein niedriger Wert weist
            auf Ungleichheit hin.</span
          >
        </div>
        <div class="metric-row">
          <strong>Präemptionen</strong
          ><span
            >Wie oft laufende Ausführung durch eine neue Entscheidung
            unterbrochen wurde.</span
          >
        </div>
      </div>
    </section>

    <section
      id="praemption"
      class="knowledge-section knowledge-section--accent"
    >
      <div class="section-heading-block">
        <span class="knowledge-kicker">05 · Unterbrechung</span>
        <h2>Präemption erkennen</h2>
        <p>
          Eine Markierung am Ende eines Timeline-Segments zeigt, dass die
          Ausführung dort nicht einfach fertig war, sondern unterbrochen wurde.
        </p>
      </div>
      <div class="callout-grid">
        <article>
          <strong>Preempt</strong>
          <p>
            Ein anderer Prozess wird bevorzugt, zum Beispiel weil er kürzer ist
            oder eine höhere Priorität besitzt.
          </p>
        </article>
        <article>
          <strong>Quantum abgelaufen</strong>
          <p>
            Die Zeitscheibe eines Round-Robin- oder MLFQ-Prozesses ist
            verbraucht.
          </p>
        </article>
        <article>
          <strong>Segmentende</strong>
          <p>
            Der Marker liegt genau am Zeitpunkt, an dem die Unterbrechung
            stattgefunden hat.
          </p>
        </article>
      </div>
    </section>

    <section id="vergleich" class="knowledge-section">
      <div class="section-heading-block">
        <span class="knowledge-kicker">06 · Vergleich</span>
        <h2>Runs in der Vergleichsübersicht vergleichen</h2>
        <p>
          Ein Vergleich ist aussagekräftig, wenn alle Runs dasselbe Szenario,
          aber unterschiedliche Algorithmen oder Parameter verwenden.
        </p>
      </div>
      <div class="comparison-guide">
        <div class="comparison-guide-step">
          <span>01</span>
          <p>
            Klicke auf <strong>+ weiteren Algorithmus</strong> und lege einen
            zweiten Run an.
          </p>
        </div>
        <div class="comparison-guide-step">
          <span>02</span>
          <p>
            Wechsle in die <strong>Vergleichsübersicht</strong>, um die
            Zeitpläne nebeneinander zu sehen.
          </p>
        </div>
        <div class="comparison-guide-step">
          <span>03</span>
          <p>
            Nutze die <strong>Bewertungsmatrix</strong>: Der gewählte
            Anwendungsfall bestimmt sichtbare Kennzahlen und deren Gewichtung im
            Score.
          </p>
        </div>
      </div>
      <div class="knowledge-note">
        <strong>Wichtig:</strong> Ein hoher Score ist nur innerhalb des
        gewählten Anwendungsfalls sinnvoll. Für interaktive Systeme können
        Antwortzeit und Fairness wichtiger sein als maximaler Durchsatz.
      </div>
    </section>

    <footer class="knowledge-footer">
      <strong>Bereit für den ersten Vergleich?</strong>
      <p>
        Gehe zurück zur Visualisierung, lade ein Classroom-Szenario und
        untersuche deinen ersten Run Schritt für Schritt.
      </p>
    </footer>
  </div>
</template>

<style scoped>
.knowledge-page {
  display: grid;
  gap: 2rem;
}
.knowledge-hero {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 2rem;
  padding: 1.5rem 0 0.5rem;
  border-bottom: 1px solid var(--panel-border);
}
.knowledge-hero h1 {
  margin: 0.35rem 0 0.65rem;
  font-size: clamp(1.8rem, 4vw, 3.3rem);
  letter-spacing: 0;
}
.knowledge-hero p,
.section-heading-block > p {
  max-width: 68ch;
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}
.knowledge-hero-mark {
  font-size: 5rem;
  line-height: 0.8;
  font-weight: 800;
  color: var(--accent);
  opacity: 0.3;
}
.knowledge-kicker {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.knowledge-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.knowledge-nav a {
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--panel-border);
  border-radius: 999px;
  color: var(--text);
  text-decoration: none;
  font-size: 0.86rem;
}
.knowledge-nav a:hover,
.knowledge-nav a:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
}
.knowledge-section {
  display: grid;
  gap: 1rem;
  scroll-margin-top: 1rem;
}
.knowledge-section--intro {
  padding-top: 0.25rem;
}
.knowledge-section--accent {
  padding: 1.25rem;
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 14px;
  background: rgba(245, 158, 11, 0.07);
}
.section-heading-block {
  display: grid;
  gap: 0.45rem;
}
.section-heading-block h2 {
  margin: 0;
  font-size: clamp(1.35rem, 2.4vw, 2rem);
  letter-spacing: 0;
}
.step-grid,
.explanation-grid,
.callout-grid,
.comparison-guide {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}
.knowledge-step,
.explanation-card,
.callout-grid article {
  padding: 1rem;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  background: var(--panel-bg);
}
.step-number {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  margin-bottom: 0.8rem;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  font-weight: 700;
}
.knowledge-step h3,
.explanation-card h3,
.callout-grid strong {
  margin: 0 0 0.45rem;
}
.knowledge-step p,
.explanation-card p,
.callout-grid p {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
}
.explanation-card--wide {
  grid-column: span 2;
}
.explanation-card ul {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding-left: 1.1rem;
  color: var(--muted);
  line-height: 1.45;
}
.diagram-sample {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 1rem;
  color: var(--muted);
  font-size: 0.72rem;
}
.diagram-track {
  display: flex;
  height: 2.4rem;
  overflow: hidden;
  border-radius: 6px;
}
.diagram-segment {
  display: grid;
  place-items: center;
  color: white;
  font-style: normal;
  font-weight: 700;
}
.diagram-segment--one {
  width: 33%;
  background: var(--data-1);
}
.diagram-segment--two {
  width: 25%;
  background: var(--data-2);
}
.diagram-segment--three {
  width: 42%;
  background: var(--data-4);
}
.diagram-ticks {
  display: flex;
  justify-content: space-between;
}
.knowledge-section--split {
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.2fr);
  align-items: start;
}
.reading-list {
  display: grid;
  gap: 0.55rem;
}
.reading-list div,
.metric-row {
  display: grid;
  grid-template-columns: minmax(120px, 0.35fr) 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--panel-border);
}
.reading-list span,
.metric-row span {
  color: var(--muted);
  line-height: 1.45;
}
.metric-guide {
  border-top: 2px solid var(--accent);
}
.callout-grid {
  grid-template-columns: repeat(3, 1fr);
}
.callout-grid p {
  font-size: 0.9rem;
}
.comparison-guide-step {
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
  border-left: 3px solid var(--accent);
  background: rgba(96, 165, 250, 0.08);
}
.comparison-guide-step span {
  color: var(--accent);
  font-weight: 800;
}
.comparison-guide-step p {
  margin: 0;
  line-height: 1.5;
}
.knowledge-note {
  padding: 0.85rem 1rem;
  border-radius: 8px;
  background: rgba(96, 165, 250, 0.1);
  color: var(--text);
  line-height: 1.5;
}
.knowledge-footer {
  padding: 1.5rem 0 0.5rem;
  border-top: 1px solid var(--panel-border);
}
.knowledge-footer strong {
  font-size: 1.15rem;
}
.knowledge-footer p {
  margin: 0.35rem 0 0;
  color: var(--muted);
}
@media (max-width: 760px) {
  .knowledge-hero {
    align-items: start;
  }
  .knowledge-hero-mark {
    display: none;
  }
  .step-grid,
  .explanation-grid,
  .callout-grid,
  .comparison-guide,
  .knowledge-section--split {
    grid-template-columns: 1fr;
  }
  .explanation-card--wide {
    grid-column: auto;
  }
  .reading-list div,
  .metric-row {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
}
</style>
