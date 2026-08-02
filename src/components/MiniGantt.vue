<template>
  <div class="mini-gantt">
    <Gantt
      :segments="segments"
      :tickMarks="tickMarks"
      :cellWidth="cellWidth"
      :chartHeight="chartHeight"
      :segmentHeight="segmentHeight"
      :viewBox="viewBox"
      :currentTime="currentTime"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Gantt from "./Gantt.vue";
import type { TimelineSegment } from "@/types";

const props = defineProps<{
  segments: TimelineSegment[];
  cellWidth?: number;
  chartHeight?: number;
  segmentHeight?: number;
  currentTime?: number;
}>();

const cellWidth = computed(() => props.cellWidth ?? 28);
const chartHeight = computed(() => props.chartHeight ?? 120);
const segmentHeight = computed(() => props.segmentHeight ?? 18);
const currentTime = computed(() => props.currentTime ?? 0);

const maxTime = computed(() =>
  Math.max(8, ...(props.segments?.map((s) => s.end) ?? [8])),
);

const tickMarks = computed(() => Array.from({ length: maxTime.value + 1 }, (_, i) => i));

const viewBox = computed(
  () => `0 0 ${Math.max(maxTime.value * cellWidth.value + 60, 240)} ${chartHeight.value}`,
);
</script>

<style scoped>
.mini-gantt {
  width: 100%;
  padding: 0.5rem 0;
}
</style>
