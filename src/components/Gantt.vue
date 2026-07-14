<template>
  <svg :viewBox="viewBox" class="gantt-svg" role="img" aria-label="Gantt-Diagramm">
    <defs>
      <linearGradient id="idleGradient" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="#334155" />
        <stop offset="100%" stop-color="#475569" />
      </linearGradient>
    </defs>

    <g v-if="segments && segments.length">
      <g v-for="segment in segments" :key="`${segment.processName}-${segment.start}-${segment.end}`">
        <rect
          :x="segment.start * cellWidth + offsetX"
          :y="segmentY(segment)"
          :width="Math.max((segment.end - segment.start) * cellWidth, 4)"
          :height="segmentHeight"
          :rx="7"
          :fill="segment.idle ? 'url(#idleGradient)' : segment.color"
          :opacity="segmentOpacity(segment)"
          :stroke="segment.idle ? '#94a3b8' : 'rgba(255,255,255,0.2)'"
          style="cursor: pointer;"
          @pointerenter.prevent="handleEnter(segment, $event)"
          @pointerleave.prevent="handleLeave"
          @click.prevent="handleClick(segment)"
        />
        <text :x="segment.start * cellWidth + offsetX + 8" :y="segmentY(segment) + 22" class="gantt-label">
          {{ segment.processName }}
        </text>
      </g>
    </g>

    <text v-else x="80" y="120" class="empty-gantt">
      Noch keine Timeline verfuegbar. Erstelle ein Szenario und starte die Simulation.
    </text>

    <g v-for="tick in tickMarks" :key="tick" class="tick-mark">
      <line :x1="tick * cellWidth + offsetX" y1="16" :x2="tick * cellWidth + offsetX" :y2="chartHeight - 18" />
      <text :x="tick * cellWidth + offsetX" :y="chartHeight - 4">{{ tick }}</text>
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { TimelineSegment } from "@/types";
import { computed } from "vue";

const props = defineProps<{
  segments: TimelineSegment[];
  tickMarks: number[];
  cellWidth: number;
  chartHeight: number;
  segmentHeight: number;
  viewBox: string;
  offsetX?: number;
}>();

const emit = defineEmits<{
  (e: "segmentEnter", segment: TimelineSegment, ev: PointerEvent): void;
  (e: "segmentLeave"): void;
  (e: "segmentClick", segment: TimelineSegment): void;
}>();

const offsetX = props.offsetX ?? 80;

function handleEnter(segment: TimelineSegment, ev: Event) {
  emit("segmentEnter", segment, ev as PointerEvent);
}

function handleLeave() {
  emit("segmentLeave");
}

function handleClick(segment: TimelineSegment) {
  emit("segmentClick", segment);
}

const segmentY = (segment: TimelineSegment): number => {
  if (segment.idle) return 180;
  const segmentsByProcess = props.segments
    .map((s) => s.processId)
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  const index = segmentsByProcess.indexOf(segment.processId);
  return 28 + Math.max(index, 0) * (props.segmentHeight + 14);
};

const segmentOpacity = (segment: TimelineSegment): number => {
  // simple default: fully visible
  return 0.9;
};
</script>

<style scoped>
.gantt-svg {
  display: block;
  width: 100%;
  min-height: 260px;
}
.gantt-label,
.tick-mark text,
.empty-gantt {
  fill: #e2e8f0;
  font-size: 12px;
}
.tick-mark line {
  stroke: rgba(148, 163, 184, 0.18);
  stroke-width: 1;
}
</style>