<template>
  <svg
    :viewBox="resolvedViewBox"
    :width="svgWidth"
    :height="svgHeight"
    :style="{ width: `${svgWidth}px`, height: `${svgHeight}px` }"
    preserveAspectRatio="none"
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
      <g v-if="isMlfqLayout">
        <line
          v-for="level in mlfqLevelCount - 1"
          :key="`guide-${level}`"
          :x1="offsetX"
          :x2="offsetX + 2000"
          :y1="laneTop + level * laneStride - 9"
          :y2="laneTop + level * laneStride - 9"
          class="level-guide"
          aria-hidden="true"
        />
        <text
          v-for="level in mlfqLevelCount"
          :key="`label-${level}`"
          :x="22"
          :y="laneTop + (level - 1) * laneStride + 11"
          class="level-label"
        >
          {{ levelLabel(level - 1) }}
        </text>
      </g>

      <rect
        v-if="completedOverlayWidth > 0"
        :x="offsetX"
        y="16"
        :width="completedOverlayWidth"
        :height="renderChartHeight - 34"
        rx="14"
        class="completed-overlay"
        aria-hidden="true"
      />

      <g
        v-for="segment in segments"
        :key="`${segment.processName}-${segment.start}-${segment.end}`"
      >
        <g
          class="bar-wrap"
          :data-id="`${segment.processName}-${segment.start}-${segment.end}`"
          :data-lane-index="getSegmentLevel(segment)"
        >
          <rect
            v-if="shouldPulse(segment)"
            :x="segmentBaseX(segment) - 5"
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

          <template v-if="shouldSplitSegment(segment)">
            <rect
              class="gantt-bar gantt-bar--split gantt-bar--done"
              :x="segmentBaseX(segment)"
              :y="segmentY(segment)"
              :width="splitLeftWidth(segment)"
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

            <rect
              class="gantt-bar gantt-bar--split gantt-bar--remaining"
              :x="splitRightX(segment)"
              :y="segmentY(segment)"
              :width="splitRightWidth(segment)"
              :height="segmentHeight"
              :rx="7"
              :fill="segment.idle ? 'url(#idleGradient)' : segment.color"
              :opacity="Math.max(segmentOpacity(segment) - 0.16, 0.42)"
              :stroke="segment.idle ? '#94a3b8' : 'rgba(255,255,255,0.2)'"
              style="cursor: pointer"
              @pointerenter.prevent="handleEnter(segment, $event)"
              @pointerleave.prevent="handleLeave"
              @click.prevent="handleClick(segment)"
            />
          </template>

          <rect
            v-else
            class="gantt-bar"
            :x="segmentBaseX(segment)"
            :y="segmentY(segment)"
            :width="segmentWidth(segment)"
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
            :x="segmentBaseX(segment) + 8"
            :y="segmentY(segment) + 22"
            class="gantt-label"
          >
            {{ segment.processName }}
          </text>
        </g>
      </g>

      <g
        v-for="segment in activeSegments"
        :key="`${segment.processName}-${segment.start}-${segment.end}-active`"
      >
        <rect
          :x="segmentBaseX(segment) - 1"
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
          :x="
            segmentBaseX(segment) +
            Math.max(
              0,
              (activeSubRect(segment)?.x ?? 0) -
                (segment.start * cellWidth + offsetX),
            )
          "
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
        :y2="renderChartHeight - 18"
        class="time-pointer"
        aria-hidden="true"
      />
    </g>

    <text v-else x="80" y="120" class="empty-gantt">
      Noch keine Timeline verfuegbar. Erstelle ein Szenario und starte die
      Simulation.
    </text>

    <g class="tick-layer" aria-hidden="true">
      <rect
        :x="0"
        :y="Math.max(18, renderChartHeight - 54)"
        :width="svgWidth"
        :height="32"
        fill="rgba(2, 6, 23, 0.85)"
      />
      <g v-for="tick in safeTickMarks" :key="tick" class="tick-mark">
        <line
          :x1="tick * cellWidth + offsetX"
          y1="16"
          :x2="tick * cellWidth + offsetX"
          :y2="Math.max(44, renderChartHeight - 28)"
        />
        <text
          :x="tick * cellWidth + offsetX"
          :y="Math.max(24, renderChartHeight - 40)"
          text-anchor="middle"
          dominant-baseline="hanging"
        >
          {{ tick }}
        </text>
      </g>
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
  layoutVariant?: "push" | "smooth";
  layoutPhase?: "preview" | "activation" | "settle" | "running";
  algorithm?: string;
  queueLevels?: number;
  preemptedProcessId?: string | null;
  preemptTime?: number | null;
}>();

const emit = defineEmits<{
  (e: "segmentEnter", segment: TimelineSegment, ev: PointerEvent): void;
  (e: "segmentLeave"): void;
  (e: "segmentClick", segment: TimelineSegment): void;
}>();

const offsetX = props.offsetX ?? 80;
const svgWidth = computed(() => {
  const width = Number.parseFloat(props.viewBox.split(/\s+/)[2] ?? "0");
  return Number.isFinite(width) && width > 0 ? width : 1200;
});
const svgHeight = computed(() => renderChartHeight.value);
const resolvedViewBox = computed(
  () => `0 0 ${svgWidth.value} ${svgHeight.value}`,
);
const safeTickMarks = computed(() => {
  const uniqueTicks = new Set<number>();

  for (const tick of props.tickMarks) {
    if (Number.isInteger(tick) && tick >= 0) {
      uniqueTicks.add(tick);
    }
  }

  return Array.from(uniqueTicks).sort((left, right) => left - right);
});
const laneGap = 14;
const laneTop = 28;
const minLaneCountForHeight = 8;
const isMlfqLayout = computed(() => props.algorithm === "mlfq");
const mlfqLevelCount = computed(() => Math.max(2, props.queueLevels ?? 3));
const laneStride = props.segmentHeight + laneGap;
const visibleProcessCount = computed(() => {
  const ids = new Set<string>();
  for (const segment of props.segments) {
    if (segment.processId) {
      ids.add(segment.processId);
    }
  }
  return ids.size;
});
const renderChartHeight = computed(() => {
  const baseHeight = Math.max(props.chartHeight, 260);
  const laneCount = Math.max(
    minLaneCountForHeight,
    isMlfqLayout.value ? mlfqLevelCount.value : visibleProcessCount.value,
  );
  const neededHeight = laneTop + (laneCount - 1) * laneStride + props.segmentHeight + 24;
  return Math.max(baseHeight, neededHeight);
});

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

const levelLabel = (level: number): string => `L${level + 1}`;

const getSegmentLevel = (segment: TimelineSegment): number => {
  if (isMlfqLayout.value) {
    return Math.min(
      mlfqLevelCount.value - 1,
      Math.max(0, segment.queueLevel ?? 0),
    );
  }

  const segmentsByProcess = props.segments
    .map((s) => s.processId)
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  const index = segmentsByProcess.indexOf(segment.processId);
  return Math.max(0, index >= 0 ? index : 0);
};

const segmentY = (segment: TimelineSegment): number => {
  if (segment.idle) return 180;
  return laneTop + getSegmentLevel(segment) * laneStride;
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

const isPushVariant = () => props.layoutVariant === "push";
const isActivationPhase = () => props.layoutPhase === "activation";
const isSettlePhase = () => props.layoutPhase === "settle";
const currentTime = () => props.currentTime ?? 0;

const orderedProcessIds = computed(() => {
  const ids = new Set<string>();
  for (const segment of props.segments) {
    if (segment.processId) {
      ids.add(segment.processId);
    }
  }
  return Array.from(ids);
});

const activationOffsetByProcess = (segment: TimelineSegment): number => {
  if (
    !props.activeId ||
    !segment.processId ||
    segment.processId === props.activeId
  ) {
    return 0;
  }

  const activeIndex = orderedProcessIds.value.indexOf(props.activeId);
  const segmentIndex = orderedProcessIds.value.indexOf(segment.processId);
  if (activeIndex < 0 || segmentIndex < 0 || segmentIndex <= activeIndex) {
    return 0;
  }

  return (segmentIndex - activeIndex) * props.cellWidth;
};

const segmentBaseX = (segment: TimelineSegment): number => {
  const time = currentTime();
  const baseX = segment.start * props.cellWidth + offsetX;

  if (isActivationPhase()) {
    return baseX;
  }

  if (isSettlePhase()) {
    if (segment.processId === props.activeId) {
      return baseX;
    }

    return baseX + activationOffsetByProcess(segment);
  }

  if (!isPushVariant()) {
    return baseX;
  }

  if (segment.start <= time) {
    return baseX;
  }

  const shift = Math.min(
    props.cellWidth * 0.35,
    Math.max(0, (segment.start - time) * props.cellWidth * 0.2),
  );

  return baseX + shift;
};

const segmentWidth = (segment: TimelineSegment): number =>
  Math.max((segment.end - segment.start) * props.cellWidth, 4);

const splitCursor = (segment: TimelineSegment): number | null => {
  const time = props.currentTime;
  if (
    isActivationPhase() ||
    time === undefined ||
    time === null ||
    segment.idle ||
    time <= segment.start ||
    time >= segment.end
  ) {
    return null;
  }

  return time;
};

const shouldSplitSegment = (segment: TimelineSegment): boolean =>
  splitCursor(segment) !== null;

const splitLeftWidth = (segment: TimelineSegment): number => {
  const cursor = splitCursor(segment);
  if (cursor === null) {
    return segmentWidth(segment);
  }

  return Math.max((cursor - segment.start) * props.cellWidth, 4);
};

const splitRightWidth = (segment: TimelineSegment): number => {
  const cursor = splitCursor(segment);
  if (cursor === null) {
    return segmentWidth(segment);
  }

  return Math.max((segment.end - cursor) * props.cellWidth, 4);
};

const splitRightX = (segment: TimelineSegment): number => {
  const cursor = splitCursor(segment);
  if (cursor === null) {
    return segmentBaseX(segment);
  }

  const gap = isPushVariant() ? 6 : 3;
  const pushOffset = isPushVariant()
    ? Math.min(
        props.cellWidth * 0.45,
        Math.max(0, (segment.end - cursor) * props.cellWidth * 0.12),
      )
    : 0;

  return cursor * props.cellWidth + offsetX + gap + pushOffset;
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
  fill: #f8fafc;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.tick-mark line {
  stroke: rgba(125, 211, 252, 0.24);
  stroke-width: 1;
}
.tick-mark text {
  paint-order: stroke;
  stroke: rgba(2, 6, 23, 0.7);
  stroke-width: 3px;
  stroke-linejoin: round;
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

.bar-wrap {
  transform-origin: 0 0;
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
