<template>
  <p :id="summaryId" class="visually-hidden">{{ summaryText }}</p>
  <svg
    :viewBox="resolvedViewBox"
    :width="stretchWidth ? '100%' : svgWidth"
    :height="svgHeight"
    :style="{
      width: stretchWidth ? '100%' : `${svgWidth}px`,
      height: `${svgHeight}px`,
    }"
    preserveAspectRatio="none"
    class="gantt-svg"
    role="img"
    :aria-labelledby="`${titleId} ${descId}`"
    :aria-describedby="summaryId"
  >
    <defs>
      <linearGradient id="idleGradient" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="var(--surface-dark)" />
        <stop offset="100%" stop-color="var(--surface-light)" />
      </linearGradient>
    </defs>

    <title :id="titleId">Gantt chart</title>
    <desc :id="descId">Timeline showing process execution segments and tick marks.</desc>

    <g v-if="segments && segments.length">
      <g v-if="isMlfqLayout">
        <line
          v-for="level in mlfqLevelCount - 1"
          :key="`guide-${level}`"
          :x1="offsetX"
          :x2="mlfqGuideLineEndX"
          :y1="getMlfqGuideY(level)"
          :y2="getMlfqGuideY(level)"
          class="level-guide level-guide--mlfq"
          aria-hidden="true"
        />
        <text
          v-for="level in mlfqLevelCount"
          :key="`label-${level}`"
          :x="22"
          :y="getMlfqLevelLabelY(level - 1)"
          class="level-label"
          dominant-baseline="middle"
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
              :stroke="segment.idle ? 'var(--muted)' : 'rgba(255,255,255,0.2)'"
              style="cursor: pointer"
              tabindex="0"
              role="button"
              @focus="handleEnter(segment, $event)"
              @blur="handleLeave"
              @pointerenter.prevent="handleEnter(segment, $event)"
              @pointerleave.prevent="handleLeave"
              @click.prevent="handleClick(segment)"
              @keydown.enter.prevent="handleClick(segment)"
              @keydown.space.prevent="handleClick(segment)"
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
              :stroke="segment.idle ? 'var(--muted)' : 'rgba(255,255,255,0.2)'"
              style="cursor: pointer"
              tabindex="0"
              role="button"
              @focus="handleEnter(segment, $event)"
              @blur="handleLeave"
              @pointerenter.prevent="handleEnter(segment, $event)"
              @pointerleave.prevent="handleLeave"
              @click.prevent="handleClick(segment)"
              @keydown.enter.prevent="handleClick(segment)"
              @keydown.space.prevent="handleClick(segment)"
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
            :stroke="segment.idle ? 'var(--muted)' : 'rgba(255,255,255,0.2)'"
            style="cursor: pointer"
            tabindex="0"
            role="button"
            @focus="handleEnter(segment, $event)"
            @blur="handleLeave"
            @pointerenter.prevent="handleEnter(segment, $event)"
            @pointerleave.prevent="handleLeave"
            @click.prevent="handleClick(segment)"
            @keydown.enter.prevent="handleClick(segment)"
            @keydown.space.prevent="handleClick(segment)"
          />

          <text
            :x="labelX(segment)"
            :y="segmentY(segment) + 22"
            :text-anchor="labelAlignment === 'end' ? 'end' : 'start'"
            class="gantt-label"
          >
            {{ segment.processName }}
          </text>

          <line
            v-if="preemptionEvent(segment)"
            :x1="segmentBaseX(segment) + segmentWidth(segment)"
            :x2="segmentBaseX(segment) + segmentWidth(segment)"
            :y1="segmentY(segment) - 4"
            :y2="segmentY(segment) + segmentHeight + 4"
            class="preemption-marker"
            :aria-label="preemptionLabel(segment)"
          >
            <title>{{ preemptionLabel(segment) }}</title>
          </line>
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
      Noch keine Visualisierung verfügbar. Erstelle ein Szenario und starte die
      Simulation.
    </text>

    <g class="tick-layer" aria-hidden="true">
      <g v-for="tick in safeTickMarks" :key="tick" class="tick-mark">
        <line
          :x1="tick * cellWidth + offsetX"
          y1="16"
          :x2="tick * cellWidth + offsetX"
          :y2="Math.max(44, renderChartHeight - footerSpace + 20)"
        />
        <text
          :x="tick * cellWidth + offsetX"
          :y="Math.max(24, renderChartHeight - footerSpace + 8)"
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
import type { ScheduleEvent, TimelineSegment } from "@/types";

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
  labelAlignment?: "start" | "end";
  stretchWidth?: boolean;
  events?: ScheduleEvent[];
}>();

const emit = defineEmits<{
  (e: "segmentEnter", segment: TimelineSegment, ev: PointerEvent): void;
  (e: "segmentLeave"): void;
  (e: "segmentClick", segment: TimelineSegment): void;
}>();

const offsetX = props.offsetX ?? 80;
const uid = Math.random().toString(36).slice(2, 9);
const titleId = `gantt-title-${uid}`;
const descId = `gantt-desc-${uid}`;
const summaryId = `gantt-summary-${uid}`;
const summaryText = computed(() => {
  if (!props.segments || props.segments.length === 0) return "Noch keine Segmente vorhanden.";
  const starts = props.segments.map((s) => s.start ?? 0);
  const ends = props.segments.map((s) => s.end ?? 0);
  const min = Math.min(...starts);
  const max = Math.max(...ends);
  return `${props.segments.length} Segment(e), Zeitbereich ${min}–${max}.`;
});
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
const mlfqGuideLineEndX = computed(() => {
  const lastTick = safeTickMarks.value[safeTickMarks.value.length - 1] ?? 0;
  return offsetX + (lastTick + 0.5) * props.cellWidth;
});
const laneGap = 14;
const laneTop = 28;
const minLaneCountForHeight = 8;
const isMlfqLayout = computed(() => props.algorithm === "mlfq");
const mlfqLevelCount = computed(() => Math.max(2, props.queueLevels ?? 3));
const laneStride = props.segmentHeight + laneGap;
const footerSpace = 64;
const getMlfqRowTop = (level: number): number => laneTop + level * laneStride;
const getMlfqGuideY = (level: number): number =>
  getMlfqRowTop(level) - laneGap / 2;
const getMlfqLevelLabelY = (level: number): number =>
  getMlfqRowTop(level) + props.segmentHeight / 2;
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
  const neededHeight =
    laneTop + (laneCount - 1) * laneStride + props.segmentHeight + footerSpace;
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

function preemptionEvent(segment: TimelineSegment): ScheduleEvent | null {
  if (segment.idle || !segment.processId || !props.events?.length) {
    return null;
  }

  return props.events.find(
    (event) =>
      (event.type === "preempt" || event.type === "quantumExpired") &&
      event.processId === segment.processId &&
      event.time === segment.end,
  ) ?? null;
}

function preemptionLabel(segment: TimelineSegment): string {
  const event = preemptionEvent(segment);
  if (!event) {
    return "";
  }

  const kind = event.type === "quantumExpired" ? "Quantum abgelaufen" : "Präemption";
  return `${kind} von ${segment.processName} bei t ${event.time}: ${event.reason}`;
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

const labelAlignment = computed(() => props.labelAlignment ?? "start");

const labelX = (segment: TimelineSegment): number => {
  const baseX = segmentBaseX(segment);

  if (labelAlignment.value === "end") {
    return baseX + segmentWidth(segment) - 8;
  }

  return baseX + 8;
};

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
  // allow CSS variable references like `var(--data-1)` by resolving them
  if (hex.trim().startsWith("var(") && typeof window !== "undefined") {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(
        hex.trim().slice(4, -1).trim(),
      );
      if (v) {
        hex = v.trim();
      }
    } catch (e) {
      // fallthrough to parse input string
    }
  }

  const h = hex.replace("#", "").trim();
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  if (!Number.isFinite(bigint)) return "70,86,105";
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
  fill: var(--text);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.tick-mark line {
  stroke: var(--tick-overlay);
  stroke-width: 1;
}
.tick-mark text {
  paint-order: stroke;
}

.level-label {
  fill: var(--tick-label);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.level-guide--mlfq {
  stroke: rgba(255, 255, 255, 0.42);
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.9;
  filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.18));
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

.preemption-marker {
  stroke: var(--warning, #f59e0b);
  stroke-width: 3;
  stroke-linecap: round;
  pointer-events: none;
  filter: drop-shadow(0 0 3px rgba(245, 158, 11, 0.7));
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
  stroke: var(--danger);
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
