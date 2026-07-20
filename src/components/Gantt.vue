<template>
  <svg
    :viewBox="viewBox"
    class="gantt-svg"
    role="img"
    aria-label="Gantt-Diagramm"
  >
    <defs>
      <linearGradient id="idleGradient" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="#334155" />
        <stop offset="100%" stop-color="#475569" />
      </linearGradient>
    </defs>

    <g v-if="segments && segments.length">
      <rect
        v-if="completedOverlayWidth > 0"
        :x="offsetX"
        y="16"
        :width="completedOverlayWidth"
        :height="chartHeight - 34"
        rx="14"
        class="completed-overlay"
        aria-hidden="true"
      />

      <g
        v-for="segment in segments"
        :key="`${segment.processName}-${segment.start}-${segment.end}`"
      >
        <rect
          v-if="shouldPulse(segment)"
          :x="segment.start * cellWidth + offsetX - 5"
          :y="segmentY(segment) - 5"
          :width="Math.max((segment.end - segment.start) * cellWidth, 4) + 10"
          :height="segmentHeight + 10"
          :rx="12"
          class="preempt-pulse"
          :style="{
            ['--pulse-color']: segment.color,
            ['--pulse-rgb']: hexToRgb(segment.color),
          }"
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
          style="cursor: pointer"
          @pointerenter.prevent="handleEnter(segment, $event)"
          @pointerleave.prevent="handleLeave"
          @click.prevent="handleClick(segment)"
        />

        <text
          :x="segment.start * cellWidth + offsetX + 8"
          :y="segmentY(segment) + 22"
          class="gantt-label"
        >
          {{ segment.processName }}
        </text>
      </g>

      <g
        v-for="segment in activeSegments"
        :key="`${segment.processName}-${segment.start}-${segment.end}-active`"
      >
        <rect
          :x="segment.start * cellWidth + offsetX - 1"
          :y="segmentY(segment) - 2"
          :width="Math.max((segment.end - segment.start) * cellWidth, 4) + 2"
          :height="segmentHeight + 4"
          :rx="9"
          class="active-glow active-glow--trail"
          :style="{
            ['--active-color']: segment.color,
            ['--active-rgb']: hexToRgb(segment.color),
          }"
          aria-hidden="true"
        />

        <rect
          v-if="activeSubRect(segment)"
          :x="activeSubRect(segment)?.x"
          :y="segmentY(segment) - 3"
          :width="activeSubRect(segment)?.width"
          :height="segmentHeight + 6"
          :rx="9"
          class="active-glow active-glow--current"
          :style="{
            ['--active-color']: segment.color,
            ['--active-rgb']: hexToRgb(segment.color),
          }"
          aria-hidden="true"
        />
      </g>

      <line
        v-if="pointerX !== null"
        :x1="pointerX"
        y1="16"
        :x2="pointerX"
        :y2="chartHeight - 18"
        class="time-pointer"
        aria-hidden="true"
      />
    </g>

    <text v-else x="80" y="120" class="empty-gantt">
      Noch keine Timeline verfuegbar. Erstelle ein Szenario und starte die
      Simulation.
    </text>

    <g v-for="tick in tickMarks" :key="tick" class="tick-mark">
      <line
        :x1="tick * cellWidth + offsetX"
        y1="16"
        :x2="tick * cellWidth + offsetX"
        :y2="chartHeight - 18"
      />
      <text :x="tick * cellWidth + offsetX" :y="chartHeight - 4">
        {{ tick }}
      </text>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";
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
  preemptedProcessId?: string | null;
  preemptTime?: number | null;
}>();

const emit = defineEmits<{
  (e: "segmentEnter", segment: TimelineSegment, ev: PointerEvent): void;
  (e: "segmentLeave"): void;
  (e: "segmentClick", segment: TimelineSegment): void;
}>();

const offsetX = props.offsetX ?? 80;

const activeSegments = computed(() =>
  props.segments.filter(
    (segment) =>
      segment.processId &&
      segment.processId === props.activeId &&
      !segment.idle &&
      activeSubRect(segment),
  ),
);

function shouldPulse(segment: TimelineSegment): boolean {
  if (
    !props.preemptedProcessId ||
    props.preemptTime === null ||
    props.preemptTime === undefined
  ) {
    return false;
  }

  return (
    !segment.idle &&
    segment.processId === props.preemptedProcessId &&
    props.currentTime === props.preemptTime
  );
}

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
  if (props.currentTime === undefined || props.currentTime === null) {
    return 0.9;
  }

  if (segment.end <= props.currentTime) {
    return 0.52;
  }

  if (props.activeId && segment.processId === props.activeId) {
    return 1;
  }

  return 0.82;
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

const pointerX = computed(() => {
  if (props.currentTime === undefined || props.currentTime === null) {
    return null;
  }

  return props.currentTime * props.cellWidth + offsetX;
});

const completedOverlayWidth = computed(() => {
  const x = pointerX.value;
  if (x === null) {
    return 0;
  }

  return Math.max(0, x - offsetX);
});

function hexToRgb(hex?: string) {
  if (!hex) return "70,86,105";
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
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

.completed-overlay {
  fill: rgba(100, 116, 139, 0.24);
  stroke: rgba(148, 163, 184, 0.08);
  pointer-events: none;
}

.preempt-pulse {
  fill: transparent;
  stroke: rgba(var(--pulse-rgb), 0.85);
  stroke-width: 3;
  filter: drop-shadow(0 0 12px rgba(var(--pulse-rgb), 0.35));
  transform-box: fill-box;
  transform-origin: center;
  animation: preemptPulse 0.9s ease-out 1;
  pointer-events: none;
}

.active-glow {
  fill: none;
  stroke: var(--active-color);
  stroke-width: 4;
  opacity: 0.9;
  filter: drop-shadow(0 10px 20px rgba(var(--active-rgb), 0.2));
}

.active-glow--trail {
  opacity: 0.35;
  stroke-width: 3;
  filter: drop-shadow(0 6px 14px rgba(var(--active-rgb), 0.12));
}

.active-glow--current {
  opacity: 0.95;
  stroke-width: 4.5;
  filter: drop-shadow(0 10px 24px rgba(var(--active-rgb), 0.28));
}

.time-pointer {
  stroke: #ef4444;
  stroke-width: 2.1;
  stroke-linecap: round;
  filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.28));
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .active-glow {
    filter: none;
    stroke-width: 2;
    opacity: 0.95;
  }
  .active-glow--trail {
    opacity: 0.28;
  }
  .active-glow--current {
    stroke-width: 3;
  }
  .time-pointer {
    filter: none;
  }
}

@keyframes preemptPulse {
  0% {
    opacity: 0.95;
    transform: scale(0.98);
  }
  70% {
    opacity: 0.35;
    transform: scale(1.01);
  }
  100% {
    opacity: 0;
    transform: scale(1.03);
  }
}
</style>
