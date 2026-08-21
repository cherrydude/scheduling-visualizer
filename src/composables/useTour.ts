import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

export interface TourActions {
  openGenerator: () => void;
  loadStaggered: () => void;
  openAlgorithm: () => void;
  applySjf: () => void;
  addComparisonRun: () => void;
  startPlayback: () => void;
  openMultiView: () => void;
}

const TOUR_STORAGE_KEY = "scheduling-visualizer.tour-seen";

export function useTour(actions: TourActions) {
  let tour: InstanceType<typeof Shepherd.Tour> | null = null;

  function waitForLayout(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  function createTour(): InstanceType<typeof Shepherd.Tour> {
    const next = () => tour?.next();
    const back = () => tour?.back();

    const instance = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true, label: "Tour beenden" },
        classes: "scheduling-tour",
        scrollTo: { behavior: "auto", block: "center" },
        buttons: [
          {
            text: "Zurück",
            action: back,
            classes: "shepherd-button-secondary",
          },
          { text: "Weiter", action: next },
        ],
      },
    });

    instance.addStep({
      id: "welcome",
      title: "Kurz-Tour: Erste Schritte",
      text: "Diese Tour zeigt dir die wichtigsten Schritte: Szenario anlegen, Simulation starten und Runs vergleichen.",
      buttons: [{ text: "Tour starten", action: next }],
    });

    instance.addStep({
      id: "generator-entry",
      title: "1. Szenario vorbereiten",
      text: "Öffne den Szenario-Generator, um Prozesse und ihre Ausgangsdaten festzulegen.",
      attachTo: { element: '[data-tour="burger-button"]', on: "bottom" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        {
          text: "Generator öffnen",
          action: () => {
            actions.openGenerator();
            next();
          },
        },
      ],
    });

    instance.addStep({
      id: "generator",
      title: "2. Szenario und Prozesse laden",
      text: "Klicke jetzt auf den Button „Versetzt“, um ein vorbereitetes Szenario zu laden.",
      attachTo: { element: '[data-tour="preset-staggered"]', on: "left" },
      canClickTarget: true,
      beforeShowPromise: waitForLayout,
      when: {
        show() {
          document
            .querySelector<HTMLElement>('[data-tour="preset-staggered"]')
            ?.addEventListener("click", next, { once: true });
        },
      },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        {
          text: "Weiter",
          action: () => {
            actions.loadStaggered();
            next();
          },
        },
      ],
    });

    instance.addStep({
      id: "generator-details",
      title: "3. Den Szenario-Generator verstehen",
      text: "Prüfe kurz die angezeigten Szenario- und Prozessdaten. Die Vorschau hilft dir beim Überblick; mit „Szenario übernehmen“ startest du mit diesen Daten in die Simulation.",
      attachTo: { element: '[data-tour="complete-generator"]', on: "top" },
      canClickTarget: true,
      beforeShowPromise: waitForLayout,
      when: {
        show() {
          document
            .querySelector<HTMLElement>('[data-tour="complete-generator"]')
            ?.addEventListener("click", () => window.setTimeout(next, 0), {
              once: true,
            });
        },
      },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
      ],
    });

    instance.addStep({
      id: "algorithm",
      title: "4. Algorithmus anwenden",
      text: "Öffne hier das Modal, um einen Algorithmus und seine Einstellungen auszuwählen.",
      attachTo: { element: '[data-tour="algorithm-card"]', on: "bottom" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        {
          text: "Modal öffnen",
          action: () => {
            actions.openAlgorithm();
            window.setTimeout(next, 0);
          },
        },
      ],
    });

    instance.addStep({
      id: "algorithm-modal",
      title: "5. Algorithmus auswählen",
      text: "Wähle in diesem Feld „Shortest Job First“ aus.",
      attachTo: { element: '[data-tour="algorithm-select"]', on: "left" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Weiter", action: next },
      ],
    });

    instance.addStep({
      id: "algorithm-mode",
      title: "6. Ausführungsmodus wählen",
      text: "Wähle anschließend den Modus „Präemptiv (SRTF)“.",
      attachTo: { element: '[data-tour="sjf-mode-select"]', on: "left" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Weiter", action: next },
      ],
    });

    instance.addStep({
      id: "apply-algorithm",
      title: "7. Algorithmus anwenden",
      text: "Klicke jetzt auf den echten Button „Algorithmus anwenden“, um deine Auswahl zu bestätigen.",
      attachTo: { element: '[data-tour="apply-algorithm"]', on: "top" },
      canClickTarget: true,
      when: {
        show() {
          document
            .querySelector<HTMLElement>('[data-tour="apply-algorithm"]')
            ?.addEventListener("click", () => window.setTimeout(next, 0), {
              once: true,
            });
        },
      },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
      ],
    });

    instance.addStep({
      id: "focus-view",
      title: "8. Fokusansicht lesen",
      text: "Die Fokusansicht zeigt einen Run im Detail: Timeline, aktuelle CPU-Zeit und die Zustände der Prozesse werden gemeinsam sichtbar.",
      attachTo: { element: '[data-tour="focus-view"]', on: "top" },
    });

    instance.addStep({
      id: "metrics",
      title: "9. Kennzahlen einordnen",
      text: "Die Kennzahlen fassen den Run zusammen. Wartezeit und Durchlaufzeit zeigen Verzögerungen, Fairness und Starvation helfen bei der Beurteilung der Verteilung.",
      attachTo: { element: '[data-tour="metrics-panel"]', on: "top" },
    });

    instance.addStep({
      id: "playback",
      title: "10. Simulation abspielen",
      text: "Starte die Simulation und beobachte, wie sich die Timeline und die Prozesszustände Schritt für Schritt verändern.",
      attachTo: { element: '[data-tour="playback-controls"]', on: "bottom" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        {
          text: "Play starten",
          action: () => {
            actions.startPlayback();
            next();
          },
        },
      ],
    });

    instance.addStep({
      id: "results",
      title: "11. Stack-Simulation verstehen",
      text: "Die Stack-Simulation zeigt aktive, bereite und verdrängte Prozesse. Lange Wartezeiten können auf mögliche Starvation hinweisen.",
      attachTo: { element: '[data-tour="stack-simulation"]', on: "top" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Vergleich vorbereiten", action: () => next() },
      ],
    });

    instance.addStep({
      id: "add-run",
      title: "12. Einen weiteren Run hinzufügen",
      text: "Ein zweiter Run macht Unterschiede zwischen Algorithmen sichtbar. Füge für dasselbe Szenario einen Round-Robin-Run hinzu.",
      attachTo: { element: '[data-tour="add-run"]', on: "bottom" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        {
          text: "Round Robin hinzufügen",
          action: () => {
            actions.addComparisonRun();
            next();
          },
        },
      ],
    });

    instance.addStep({
      id: "multi-view",
      title: "13. Runs in der Vergleichsübersicht vergleichen",
      text: "In der Vergleichsübersicht betrachtest du die Zeitpläne mehrerer Runs nebeneinander. So erkennst du Unterschiede bei Reihenfolge, Preemption und Durchlauf.",
      attachTo: { element: '[data-tour="multi-view"]', on: "top" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        {
          text: "Vergleichsübersicht öffnen",
          action: () => {
            actions.openMultiView();
            window.setTimeout(next, 0);
          },
        },
      ],
    });

    instance.addStep({
      id: "multi-view-details",
      title: "14. Vergleichsübersicht lesen",
      text: "Hier siehst du die Runs mit ihren Zeitplänen nebeneinander. Vergleiche, wann Prozesse ausgeführt werden und wie oft sie unterbrochen werden.",
      attachTo: { element: '[data-tour="multi-view"]', on: "top" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Weiter", action: next },
      ],
    });

    instance.addStep({
      id: "comparison-table",
      title: "15. Bewertungsmatrix lesen",
      text: "Die Bewertungsmatrix stellt die Runs anhand ausgewählter Kennzahlen gegenüber. Der gewählte Anwendungsfall bestimmt sichtbare Spalten und Gewichtungen für den Score.",
      attachTo: { element: '[data-tour="comparison-table"]', on: "top" },
      buttons: [{ text: "Tour beenden", action: () => instance.complete() }],
    });

    instance.on("complete", () =>
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1"),
    );
    instance.on("cancel", () =>
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1"),
    );
    return instance;
  }

  function start(): void {
    tour?.cancel();
    tour = createTour();
    tour.start();
  }

  function stop(): void {
    tour?.cancel();
    tour = null;
  }

  return { start, stop, storageKey: TOUR_STORAGE_KEY };
}
