import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

export interface TourActions {
  openGenerator: () => void;
  loadStaggered: () => void;
  applyRoundRobin: () => void;
  openComparisonRun: () => void;
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

  function alignTourArrowTo(
    stepClass: string,
    targetSelector: string,
    containerSelector: string,
  ): void {
    void waitForLayout().then(() => {
      const step = document.querySelector<HTMLElement>(
        `.shepherd-element.${stepClass}`,
      );
      const arrow = step?.querySelector<HTMLElement>("[data-popper-arrow]");
      const target = document.querySelector<HTMLElement>(targetSelector);
      const container = document.querySelector<HTMLElement>(containerSelector);

      if (!step || !arrow || !target || !container) return;

      const initialStepRect = step.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      step.style.marginTop = `${containerRect.top - initialStepRect.top}px`;

      const stepRect = step.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      arrow.style.transform = "none";
      arrow.style.top = `${
        targetRect.top +
        targetRect.height / 2 -
        stepRect.top -
        arrow.offsetHeight / 2
      }px`;
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
      text: `
        <p>Diese Tour zeigt dir die wichtigsten Schritte:</p>
        <ul>
          <li>wie du ein Szenario anlegst</li>
          <li>verschiedene Scheduling-Algorithmus auf entsprechende Szenarien anwendest</li>
          <li>die Visualisierung startest und das Ergebnis eines Runs einordnest</li>
          <li>mehrere Runs vergleichen kannst</li>
        </ul>
`,
      buttons: [{ text: "Tour starten", action: next }],
    });

    instance.addStep({
      id: "generator-entry",
      title: "1. Szenario anlegen",
      text: "Zum Start ist es notwendig, ein neues Szenario anzulegen. Einmal erstellte Szenarien können später bearbeitet und gelöscht werden. Klicke nun zuerst auf das Burger-Menü, um die Szenarioverwaltung zu öffnen.",
      attachTo: { element: '[data-tour="burger-button"]', on: "bottom" },
      canClickTarget: true,
      beforeShowPromise: waitForLayout,
      when: {
        show() {
          document
            .querySelector<HTMLElement>('[data-tour="burger-button"]')
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
      id: "generator-entry-plus",
      title: "2. Eigenes Szenario erstellen",
      text: "Klicke auf „Eigenes Szenario erstellen“, um mit einer leeren Task-Liste zu beginnen.",
      attachTo: { element: '[data-tour="burger-menu-panel"]', on: "right" },
      classes: "generator-entry-plus",
      canClickTarget: true,
      beforeShowPromise: waitForLayout,
      when: {
        show() {
          document
            .querySelector<HTMLElement>('[data-tour="open-generator"]')
            ?.addEventListener("click", () => window.setTimeout(next, 0), {
              once: true,
            });
          alignTourArrowTo(
            "generator-entry-plus",
            '[data-tour="open-generator"]',
            '[data-tour="burger-menu-panel"]',
          );
        },
      },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
      ],
    });

    instance.addStep({
      id: "generator-details",
      title: "3. Szenario anwenden",
      text: "Prüfe kurz die angezeigten Szenario- und Taskdaten. Bestätige danach unten mit „Szenario anwenden“, um diese als eigenständiges Szenario in die Visualisierung zu übernehmen.",
      attachTo: { element: '[data-tour="generator-modal"]', on: "left" },
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
      title: "5. Algorithmus anwenden",
      text: "Klicke nun auf „+ Algorithmus anwenden“, um das Modal für den anzuwendenden Algorithmus zu öffnen und so einen Run durchzuführen.",
      attachTo: { element: '[data-tour="open-algorithm"]', on: "top" },
      canClickTarget: true,
      beforeShowPromise: waitForLayout,
      when: {
        show() {
          document
            .querySelector<HTMLElement>('[data-tour="open-algorithm"]')
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
      id: "algorithm-modal",
      title: "6. Algorithmus auswählen",
      text: "Wähle in diesem Feld Round Robin aus. Das Quantum legt fest, wie viele Takte ein Prozess höchstens am Stück erhält. Wir belassen es hier erstmal bei 2. Klicke danach auf „Weiter“.",
      attachTo: { element: '[data-tour="algorithm-select"]', on: "left" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Weiter", action: next },
      ],
    });

    instance.addStep({
      id: "apply-algorithm",
      title: "7. Algorithmus anwenden",
      text: "Klicke jetzt auf den Button „Algorithmus anwenden“, um Round Robin mit dem gewählten Quantum zu bestätigen und auf das Szenario anzuwenden.",
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
      text: "Die Fokusansicht zeigt einen Run im Detail: Dargestellt wird, in welcher Reihenfolge der Algorithmus die zuvor geladenen Prozesse aus dem Szenario abarbeitet. Tritt eine Präemption auf, erfolgt eine Animation der entsprechenden Prozesssegmente.",
      attachTo: { element: '[data-tour="focus-view"]', on: "top" },
    });

    instance.addStep({
      id: "metrics",
      title: "9. Kennzahlen einordnen",
      text: "Die Kennzahlen fassen den Run zusammen. Wartezeit und Durchlaufzeit zeigen Verzögerungen, während Präemptionen und Kontextwechsel das Scheduling-Verhalten sichtbar machen.",
      attachTo: { element: '[data-tour="metrics-panel"]', on: "top" },
    });

    instance.addStep({
      id: "playback",
      title: "10. Visualisierung abspielen",
      text: "Starte die Visualisierung und beobachte, wie sich Timeline und Prozesszustände Schritt für Schritt verändern. Du kannst auch die Tastatur verwenden: Leertaste für Start/Pause, Pfeil rechts für einen Schritt vor, Pfeil links für einen Schritt zurück und R zum Zurücksetzen.",
      attachTo: { element: '[data-tour="playback-controls"]', on: "bottom" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        {
          text: "Visualisierung starten",
          action: () => {
            actions.startPlayback();
            next();
          },
        },
      ],
    });

    instance.addStep({
      id: "results",
      title: "11. Stack-Visualisierung verstehen",
      text: "Die Stack-Visualisierung zeigt aktive, bereite und preämptierte Prozesse. Lange Wartezeiten helfen dabei, das Verhalten unter Last zu verstehen.",
      attachTo: { element: '[data-tour="stack-simulation"]', on: "top" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Vergleich vorbereiten", action: () => next() },
      ],
    });

    instance.addStep({
      id: "add-run",
      title: "12. Einen weiteren Run hinzufügen",
      text: "Ein zweiter Run macht Unterschiede zwischen Algorithmen sichtbar. Öffne das Modal und bestätige dort einen Round Robin mit einem Quantum von 3.",
      attachTo: { element: '[data-tour="add-run"]', on: "bottom" },
      canClickTarget: true,
      beforeShowPromise: waitForLayout,
      when: {
        show() {
          document
            .querySelector<HTMLElement>('[data-tour="add-run"]')
            ?.addEventListener(
              "click",
              (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                actions.openComparisonRun();
                window.setTimeout(next, 0);
              },
              { once: true, capture: true },
            );
        },
      },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
      ],
    });

    instance.addStep({
      id: "comparison-algorithm",
      title: "13. Round Robin für den Vergleich wählen",
      text: "Wähle im Modal Round Robin aus und klicke anschließend auf „Weiter“.",
      attachTo: { element: '[data-tour="algorithm-select"]', on: "left" },
      canClickTarget: true,
      beforeShowPromise: waitForLayout,
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Weiter", action: next },
      ],
    });

    instance.addStep({
      id: "comparison-quantum",
      title: "14. Zeitscheibe festlegen",
      text: "Wähle hier eine Zeitscheibe größer gleich 3 und trage den Wert 3 ein. Klicke danach auf „Weiter“.",
      attachTo: { element: '[data-tour="algorithm-quantum"]', on: "left" },
      canClickTarget: true,
      beforeShowPromise: waitForLayout,
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Weiter", action: next },
      ],
    });

    instance.addStep({
      id: "comparison-apply",
      title: "15. Algorithmus anwenden",
      text: "Bestätige jetzt deine Auswahl mit diesem Button „Algorithmus anwenden“.",
      attachTo: { element: '[data-tour="apply-algorithm"]', on: "top" },
      canClickTarget: true,
      beforeShowPromise: waitForLayout,
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
      id: "multi-view",
      title: "16. Runs in der Vergleichsübersicht vergleichen",
      text: "In der Vergleichsübersicht betrachtest du die Zeitpläne mehrerer Runs nebeneinander. So erkennst du Unterschiede bei Reihenfolge, Preämption und Durchlauf.",
      attachTo: { element: '[data-tour="open-multi-view"]', on: "top" },
      canClickTarget: true,
      beforeShowPromise: waitForLayout,
      when: {
        show() {
          document
            .querySelector<HTMLElement>('[data-tour="open-multi-view"]')
            ?.addEventListener(
              "click",
              (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                actions.openMultiView();
                window.setTimeout(next, 0);
              },
              { once: true, capture: true },
            );
        },
      },
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
      title: "17. Vergleichsübersicht lesen",
      text: "Hier siehst du die Runs mit ihren Zeitplänen nebeneinander. Vergleiche, wann Prozesse ausgeführt werden und wie oft sie unterbrochen werden.",
      attachTo: { element: '[data-tour="multi-view"]', on: "top" },
      buttons: [
        { text: "Zurück", action: back, classes: "shepherd-button-secondary" },
        { text: "Weiter", action: next },
      ],
    });

    instance.addStep({
      id: "comparison-table",
      title: "18. Bewertungsmatrix lesen",
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
