/** Layoutentscheidung für die horizontale Zeitleiste. */
export type TimelineLayout = {
  cellWidth: number;
  svgWidth: number;
  shouldScroll: boolean;
  mode: "fit" | "scroll";
};

/**
 * Berechnet Zellbreite und SVG-Größe abhängig von verfügbaren Platz und Laufzeit.
 * Lange Zeitachsen bleiben scrollbar, kurze Zeitachsen werden möglichst gut eingepasst.
 */
export function createTimelineLayout(params: {
  timelineLength: number;
  containerWidth: number;
  padding?: number;
  comfortTicks?: number;
  minCellWidth?: number;
  maxCellWidth?: number;
  lockedCellWidth?: number;
  forceFit?: boolean;
}): TimelineLayout {
  const {
    timelineLength,
    containerWidth,
    padding = 160,
    comfortTicks = 28,
    minCellWidth = 10,
    maxCellWidth = 44,
    lockedCellWidth = 24,
    forceFit = false,
  } = params;

  const safeLength = Math.max(1, Math.floor(timelineLength));
  const safeWidth = Math.max(containerWidth, 320);
  const usableWidth = Math.max(safeWidth - padding, 320);
  const rawCellWidth = usableWidth / safeLength;

  if (forceFit) {
    // Im Fokusmodus ist Scrollen unerwünscht. Bei kurzen Läufen darf die
    // Darstellung wachsen; lange Läufe behalten dagegen die Maximalbreite.
    const shouldStretch = safeLength <= 16;
    const fittedCellWidth = shouldStretch ? rawCellWidth : maxCellWidth;
    const finalCellWidth = Math.max(1, fittedCellWidth);
    const visibleRightPad = 80 + 12;
    const expandedSvgWidth = Math.max(
      safeWidth,
      safeLength * finalCellWidth + padding * 0.5 + visibleRightPad,
    );

    return {
      cellWidth: finalCellWidth,
      svgWidth: expandedSvgWidth,
      shouldScroll: false,
      mode: "fit",
    };
  }

  const idealCellWidth = Math.max(
    minCellWidth,
    Math.min(maxCellWidth, rawCellWidth),
  );
  // Sobald die ideale Darstellung den nutzbaren Bereich überschreitet,
  // wird die Zellbreite begrenzt und die überstehende Zeitachse scrollbar.
  const shouldScroll = safeLength * idealCellWidth > usableWidth;
  const cellWidth = shouldScroll
    ? Math.max(minCellWidth, Math.min(idealCellWidth, lockedCellWidth))
    : idealCellWidth;
  const svgWidth = Math.max(
    usableWidth,
    safeLength * cellWidth + padding * 0.5,
  );

  return {
    cellWidth,
    svgWidth,
    shouldScroll,
    mode: shouldScroll ? "scroll" : "fit",
  };
}
