import { ref } from "vue";
import { createTimelineLayout } from "@/utils/timelineLayout";

const sharedCellWidth = ref<number | null>(null);

function computeSharedCellWidth(timelineLength: number, containerWidth: number, options: {
  padding?: number;
  comfortTicks?: number;
  minCellWidth?: number;
  maxCellWidth?: number;
  lockedCellWidth?: number;
} = {}) {
  const layout = createTimelineLayout({
    timelineLength: Math.max(1, Math.floor(timelineLength)),
    containerWidth: Math.max(320, Math.floor(containerWidth)),
    padding: options.padding ?? 140,
    comfortTicks: options.comfortTicks ?? 28,
    minCellWidth: options.minCellWidth ?? 10,
    maxCellWidth: options.maxCellWidth ?? 44,
    lockedCellWidth: options.lockedCellWidth ?? 24,
  });

  sharedCellWidth.value = layout.cellWidth;
  return layout;
}

export { sharedCellWidth, computeSharedCellWidth };
