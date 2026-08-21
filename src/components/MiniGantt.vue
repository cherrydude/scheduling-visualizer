<template>
  <div class="mini-gantt" ref="rootRef">
    <Gantt
      :segments="segments"
      :tickMarks="tickMarks"
      :cellWidth="resolvedCellWidth"
      :chartHeight="chartHeight"
      :segmentHeight="segmentHeight"
      :viewBox="viewBox"
      :offsetX="offsetX"
      :algorithm="algorithm"
      :queueLevels="queueLevels"
      :events="events"
      labelAlignment="end"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount, watchEffect } from "vue";
import Gantt from "./Gantt.vue";
import { createTimelineLayout } from "@/utils/timelineLayout";
import type { ScheduleEvent, TimelineSegment } from "@/types";

const props = defineProps<{
  segments: TimelineSegment[];
  cellWidth?: number;
  chartHeight?: number;
  segmentHeight?: number;
  algorithm?: string;
  queueLevels?: number;
  events?: ScheduleEvent[];
}>();

const rootRef = ref<HTMLElement | null>(null);
const measuredWidth = ref(0);

let observer: ResizeObserver | null = null;

watchEffect((onCleanup) => {
  const el = rootRef.value;
  if (!el) {
    measuredWidth.value = 0;
    return;
  }

  const update = () => {
    measuredWidth.value = Math.floor(el.clientWidth || 0);
  };

  update();

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(update);
    observer.observe(el);
  }

  onCleanup(() => {
    observer?.disconnect();
    observer = null;
  });
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});

const chartHeight = computed(() => props.chartHeight ?? 120);
const segmentHeight = computed(() => props.segmentHeight ?? 18);

const maxTime = computed(() => Math.max(8, ...(props.segments?.map((s) => s.end) ?? [8])));
const tickMarks = computed(() => Array.from({ length: maxTime.value + 1 }, (_, i) => i));

const resolvedLayout = computed(() => {
  const explicitCellWidth = props.cellWidth ?? 0;

  if (explicitCellWidth > 0) {
    const svgWidth = Math.max(
      maxTime.value * explicitCellWidth + 180,
      measuredWidth.value || 240,
    );

    return {
      cellWidth: explicitCellWidth,
      svgWidth,
    };
  }

  return createTimelineLayout({
    timelineLength: maxTime.value,
    containerWidth: measuredWidth.value,
    padding: 140,
    comfortTicks: 28,
    minCellWidth: 10,
    maxCellWidth: 44,
    lockedCellWidth: 24,
  });
});

const resolvedCellWidth = computed(() => resolvedLayout.value.cellWidth);

const offsetX = computed(() => 12);

const viewBox = computed(() => {
  const totalWidth = Math.max(resolvedLayout.value.svgWidth, 240);
  return `0 0 ${totalWidth} ${chartHeight.value}`;
});
</script>

<style scoped>
.mini-gantt {
  width: 100%;
  padding: 0.25rem 0;
}
</style>
