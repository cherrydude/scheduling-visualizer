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
      :currentTime="currentTime"
      :algorithm="algorithm"
      :queueLevels="queueLevels"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount, watchEffect } from "vue";
import Gantt from "./Gantt.vue";
import type { TimelineSegment } from "@/types";

const props = defineProps<{
  segments: TimelineSegment[];
  cellWidth?: number;
  chartHeight?: number;
  segmentHeight?: number;
  currentTime?: number;
  algorithm?: string;
  queueLevels?: number;
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

const providedCellWidth = computed(() => props.cellWidth ?? 0);
const chartHeight = computed(() => props.chartHeight ?? 120);
const segmentHeight = computed(() => props.segmentHeight ?? 18);
const currentTime = computed(() => props.currentTime ?? 0);

const maxTime = computed(() => Math.max(8, ...(props.segments?.map((s) => s.end) ?? [8])));
const tickMarks = computed(() => Array.from({ length: maxTime.value + 1 }, (_, i) => i));

const resolvedCellWidth = computed(() => {
  // prefer an explicitly provided cellWidth
  if (providedCellWidth.value && providedCellWidth.value > 0) return providedCellWidth.value;

  const length = Math.max(1, Math.floor(maxTime.value));
  const padding = 56; // leave room for labels and breathing space
  const avail = Math.max(240, measuredWidth.value - padding);
  const fitted = Math.floor(avail / length);
  const minCell = 12;
  const base = 28;
  return Math.max(minCell, Math.min(base, fitted));
});

const offsetX = computed(() => 12);

const viewBox = computed(() => {
  const totalWidth = Math.max(maxTime.value * resolvedCellWidth.value + offsetX.value + 40, 240);
  const visible = Math.max(240, measuredWidth.value || 240);
  const ct = currentTime.value ?? 0;

  // compute a startX so currentTime is visible (slightly left of center)
  const desiredCenter = ct * resolvedCellWidth.value + offsetX.value;
  const startXUnclamped = Math.floor(desiredCenter - visible * 0.45);
  const startX = Math.max(0, Math.min(Math.max(0, totalWidth - visible), startXUnclamped));

  return `${startX} 0 ${totalWidth} ${chartHeight.value}`;
});
</script>

<style scoped>
.mini-gantt {
  width: 100%;
  padding: 0.25rem 0;
}
</style>
