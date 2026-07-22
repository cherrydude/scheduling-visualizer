<template>
  <article
    class="scenario-miniature"
    :class="{ 'scenario-miniature--compact': compact }"
  >
    <header v-if="title || subtitle" class="scenario-miniature-header">
      <div>
        <h3 v-if="title">{{ title }}</h3>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <span class="scenario-miniature-badge">{{ badgeLabel }}</span>
    </header>

    <svg
      class="scenario-miniature-svg"
      :viewBox="viewBox"
      role="img"
      :aria-label="ariaLabel"
    >
      <g
        v-for="(process, index) in sortedProcesses"
        :key="`${process.id}-${index}`"
      >
        <text
          class="scenario-miniature-label"
          :x="labelX"
          :y="rowY(index) + barHeight - 6"
        >
          {{ process.name }}
        </text>

        <line
          :x1="timeOffset"
          :x2="maxWidth - 16"
          :y1="rowY(index) + barHeight + 8"
          :y2="rowY(index) + barHeight + 8"
          class="scenario-miniature-track"
        />

        <rect
          :x="timeOffset + process.arrivalTime * tickWidth"
          :y="rowY(index)"
          :width="Math.max(process.burstTime * tickWidth, 8)"
          :height="barHeight"
          rx="9"
          :fill="process.color"
          class="scenario-miniature-bar"
        />

        <text
          class="scenario-miniature-meta"
          :x="timeOffset + process.arrivalTime * tickWidth + 8"
          :y="rowY(index) + barHeight - 6"
        >
          {{ process.arrivalTime }} →
          {{ process.arrivalTime + process.burstTime }}
        </text>
      </g>

      <g v-for="tick in tickMarks" :key="tick">
        <line
          :x1="timeOffset + tick * tickWidth"
          :x2="timeOffset + tick * tickWidth"
          :y1="topPadding - 8"
          :y2="bottomLine"
          class="scenario-miniature-tick"
        />
        <text
          v-if="tick % tickStep === 0"
          class="scenario-miniature-tick-label"
          :x="timeOffset + tick * tickWidth"
          :y="topPadding - 12"
        >
          {{ tick }}
        </text>
      </g>
    </svg>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ProcessInput } from "@/types";

const props = defineProps<{
  processes: ProcessInput[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
  tickSize?: number;
}>();

const sortedProcesses = computed(() =>
  [...(props.processes ?? [])].sort(
    (left, right) =>
      left.arrivalTime - right.arrivalTime || left.id.localeCompare(right.id),
  ),
);

const compact = computed(() => Boolean(props.compact));
const tickWidth = computed(() => (compact.value ? 16 : 20));
const rowGap = computed(() => (compact.value ? 32 : 38));
const barHeight = computed(() => (compact.value ? 18 : 22));
const topPadding = computed(() => (compact.value ? 24 : 30));
const labelX = 8;
const timeOffset = computed(() => (compact.value ? 64 : 84));

const maxTick = computed(() => {
  const burstTail = sortedProcesses.value.reduce(
    (max, process) => Math.max(max, process.arrivalTime + process.burstTime),
    0,
  );
  return Math.max(8, burstTail + 1);
});

const tickMarks = computed(() =>
  Array.from({ length: maxTick.value + 1 }, (_, index) => index),
);
const tickStep = computed(() => (compact.value ? 2 : 1));
const maxWidth = computed(
  () => timeOffset.value + maxTick.value * tickWidth.value + 20,
);
const bottomLine = computed(
  () =>
    topPadding.value +
    Math.max(sortedProcesses.value.length - 1, 0) * rowGap.value +
    barHeight.value +
    12,
);
const viewBox = computed(
  () => `0 0 ${maxWidth.value} ${bottomLine.value + 16}`,
);
const badgeLabel = computed(() => (compact.value ? "Vorschau" : "Rohansicht"));
const ariaLabel = computed(() =>
  props.title ? `Szenario-Miniatur: ${props.title}` : "Szenario-Miniatur",
);

function rowY(index: number): number {
  return topPadding.value + index * rowGap.value;
}
</script>

<style scoped>
.scenario-miniature {
  display: grid;
  gap: 0.75rem;
  padding: 0.95rem;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.96),
    rgba(15, 23, 42, 0.76)
  );
}

.scenario-miniature--compact {
  padding: 0.75rem;
  gap: 0.5rem;
}

.scenario-miniature-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.scenario-miniature-header h3 {
  margin: 0;
  font-size: 0.98rem;
}

.scenario-miniature-header p {
  margin: 0.2rem 0 0;
  color: #94a3b8;
  font-size: 0.82rem;
}

.scenario-miniature-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.65rem;
  padding: 0 0.55rem;
  border-radius: 999px;
  color: #e2e8f0;
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.2);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.scenario-miniature-svg {
  width: 100%;
  min-height: 180px;
  display: block;
}

.scenario-miniature-label,
.scenario-miniature-meta,
.scenario-miniature-tick-label {
  fill: #e2e8f0;
  font-size: 11px;
}

.scenario-miniature-label {
  fill: #cbd5e1;
  font-weight: 600;
}

.scenario-miniature-meta,
.scenario-miniature-tick-label {
  fill: #94a3b8;
  font-size: 10px;
}

.scenario-miniature-track {
  stroke: rgba(148, 163, 184, 0.16);
  stroke-width: 1;
}

.scenario-miniature-bar {
  filter: drop-shadow(0 8px 16px rgba(15, 23, 42, 0.28));
}

.scenario-miniature-tick {
  stroke: rgba(148, 163, 184, 0.12);
  stroke-width: 1;
}
</style>
