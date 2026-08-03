export type TimelineLayout = {
  cellWidth: number;
  svgWidth: number;
  shouldScroll: boolean;
  mode: "fit" | "scroll";
};

export function createTimelineLayout(params: {
  timelineLength: number;
  containerWidth: number;
  padding?: number;
  comfortTicks?: number;
  minCellWidth?: number;
  maxCellWidth?: number;
  lockedCellWidth?: number;
}): TimelineLayout {
  const {
    timelineLength,
    containerWidth,
    padding = 160,
    comfortTicks = 28,
    minCellWidth = 10,
    maxCellWidth = 44,
    lockedCellWidth = 24,
  } = params;

  const safeLength = Math.max(1, Math.floor(timelineLength));
  const safeWidth = Math.max(containerWidth, 320);
  const usableWidth = Math.max(safeWidth - padding, 320);
  const fitTicks = Math.min(safeLength, Math.max(4, comfortTicks));
  const rawCellWidth = usableWidth / fitTicks;
  const idealCellWidth = Math.max(
    minCellWidth,
    Math.min(maxCellWidth, rawCellWidth),
  );
  const shouldScroll = safeLength > comfortTicks;
  const cellWidth = shouldScroll
    ? Math.min(idealCellWidth, lockedCellWidth)
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
