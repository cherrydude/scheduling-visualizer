import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

export interface TourActions {
  openGenerator: () => void;
  loadClassroom: () => void;
  openAlgorithm: () => void;
  applySjf: () => void;
  addComparisonRun: () => void;
  startPlayback: () => void;
  openMultiView: () => void;
}

const TOUR_STORAGE_KEY = "scheduling-visualizer.tour-seen";

export function useTour(actions: TourActions) {
  let tour: InstanceType<typeof Shepherd.Tour> | null = null;

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
          { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
          { text: "Weiter", action: next },
        ],
      },
    });

    instance.addStep({
      id: "welcome",
      title: "Kurz-Tour: Erste Schritte",
      text: "In wenigen Schritten lernst du Szenarien, Algorithmen, Playback und Kennzahlen kennen.",
      buttons: [{ text: "Tour starten", action: next }],
    });

    instance.addStep({
      id: "generator-entry",
      title: "1. Szenario vorbereiten",
      text: "Öffne den Szenario-Generator. Dort kannst du Prozesse mit Ankunft, Burst und Priorität anlegen.",
      attachTo: { element: '[data-tour="burger-button"]', on: "bottom" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Generator öffnen", action: () => { actions.openGenerator(); next(); } },
      ],
    });

    instance.addStep({
      id: "generator",
      title: "2. Prozesse laden",
      text: "Für diese Tour laden wir ein reproduzierbares Classroom-Beispiel. Eigene Szenarien kannst du jederzeit ergänzen.",
      attachTo: { element: '[data-tour="generator-modal"]', on: "top" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Classroom laden", action: () => { actions.loadClassroom(); next(); } },
      ],
    });

    instance.addStep({
      id: "algorithm",
      title: "3. Algorithmus anwenden",
      text: "Wähle SJF und den präemptiven Modus (SRTF). So wird sichtbar, wenn ein kürzerer Job einen laufenden Prozess verdrängt.",
      attachTo: { element: '[data-tour="algorithm-card"]', on: "bottom" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "SJF anwenden", action: () => { actions.openAlgorithm(); actions.applySjf(); next(); } },
      ],
    });

    instance.addStep({
      id: "focus-view",
      title: "4. Fokusansicht lesen",
      text: "Die Fokusansicht zeigt einen Run im Detail: Timeline, aktuelle CPU-Zeit und die Zustände der Prozesse werden gemeinsam sichtbar.",
      attachTo: { element: '[data-tour="focus-view"]', on: "top" },
    });

    instance.addStep({
      id: "metrics",
      title: "5. Kennzahlen einordnen",
      text: "Die Kennzahlen fassen den Run zusammen. Wartezeit und Durchlaufzeit zeigen Verzögerungen, Fairness und Starvation helfen bei der Beurteilung der Verteilung.",
      attachTo: { element: '[data-tour="metrics-panel"]', on: "top" },
    });

    instance.addStep({
      id: "playback",
      title: "6. Simulation abspielen",
      text: "Starte die Simulation und beobachte, wie sich die Timeline und die Prozesszustände Schritt für Schritt verändern.",
      attachTo: { element: '[data-tour="playback-controls"]', on: "bottom" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Play starten", action: () => { actions.startPlayback(); next(); } },
      ],
    });

    instance.addStep({
      id: "results",
      title: "7. Stack-Simulation verstehen",
      text: "Die Stack-Simulation zeigt aktive, bereite und verdrängte Prozesse. Lange Wartezeiten können auf mögliche Starvation hinweisen.",
      attachTo: { element: '[data-tour="stack-simulation"]', on: "top" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Vergleich vorbereiten", action: () => next() },
      ],
    });

    instance.addStep({
      id: "add-run",
      title: "8. Einen weiteren Run hinzufügen",
      text: "Ein zweiter Run macht Unterschiede zwischen Algorithmen sichtbar. Füge für dasselbe Szenario einen Round-Robin-Run hinzu.",
      attachTo: { element: '[data-tour="add-run"]', on: "bottom" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Round Robin hinzufügen", action: () => { actions.addComparisonRun(); next(); } },
      ],
    });

    instance.addStep({
      id: "multi-view",
      title: "9. Runs in der Multi-View vergleichen",
      text: "In der Multi-View betrachtest du die Zeitpläne mehrerer Runs nebeneinander. So erkennst du Unterschiede bei Reihenfolge, Preemption und Durchlauf.",
      attachTo: { element: '[data-tour="multi-view"]', on: "top" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Multi-View öffnen", action: () => { actions.openMultiView(); window.setTimeout(next, 0); } },
      ],
    });

    instance.addStep({
      id: "comparison-table",
      title: "10. Vergleichstabelle lesen",
      text: "Die Vergleichstabelle stellt die Runs anhand ausgewählter Kennzahlen gegenüber. Der Anwendungsfall bestimmt sichtbare Spalten und Gewichtungen für den Score.",
      attachTo: { element: '[data-tour="comparison-table"]', on: "top" },
      buttons: [{ text: "Tour beenden", action: () => instance.complete() }],
    });

    instance.on("complete", () => window.localStorage.setItem(TOUR_STORAGE_KEY, "1"));
    instance.on("cancel", () => window.localStorage.setItem(TOUR_STORAGE_KEY, "1"));
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