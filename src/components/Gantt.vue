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
        <!-- active glow behind the currently running sub-interval -->
        <rect
          v-if="segment.processId && segment.processId === activeId && !segment.idle && activeSubRect(segment)"
          :x="activeSubRect(segment)?.x"
          :y="segmentY(segment) - 3"
          :width="activeSubRect(segment)?.width"
          :height="segmentHeight + 6"
          :rx="9"
          class="active-glow"
          :style="{ ['--active-color']: segment.color, ['--active-rgb']: hexToRgb(segment.color) }"
          aria-hidden="true"
        />

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

const props = defineProps<{
  segments: TimelineSegment[];
  tickMarks: number[];
  cellWidth: number;
  chartHeight: number;
  segmentHeight: number;
  viewBox: string;
  offsetX?: number;
  activeId?: string | null;
  currentTime?: number;
  tickSize?: number;
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

/**
 * Compute the active sub-rectangle (x + width) for a given segment
 * based on current snapshot time and tick size.
 * Returns null when there's no overlap.
 */
function activeSubRect(segment: TimelineSegment) {
  const ct = props.currentTime ?? 0;
  const ts = props.tickSize ?? 1;
  const activeStart = Math.max(segment.start, ct);
  const activeEnd = Math.min(segment.end, ct + ts);
  if (activeEnd <= activeStart) return null;
  const x = activeStart * props.cellWidth + offsetX - 2;
  const width = Math.max((activeEnd - activeStart) * props.cellWidth, 6) + 4;
  return { x, width };
}

function hexToRgb(hex?: string) {
  if (!hex) return "70,86,105";
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+ c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}
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

.active-glow {
  fill: none;
  stroke: var(--active-color);
  stroke-width: 4;
  opacity: 0.9;
  filter: drop-shadow(0 10px 20px rgba(var(--active-rgb), 0.2));
}

@media (prefers-reduced-motion: reduce) {
  .active-glow { filter: none; stroke-width: 2; opacity: 0.95; }
}
</style>