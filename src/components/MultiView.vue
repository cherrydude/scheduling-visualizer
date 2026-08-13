<template>
  <div class="multi-view" ref="multiViewRef">
    <div class="multi-controls">
      <button class="secondary-button" @click="togglePlay">
        {{ hasPlayableRuns && playback.playing.value ? 'Pause' : 'Play' }}
      </button>
      <input
        type="range"
        :min="0"
        :max="Math.max(playback.total.value - 1, 0)"
        :disabled="!hasPlayableRuns"
        v-model.number="currentIndex"
      />
      <span class="time-label">t {{ playbackTime }}</span>
    </div>

    <div
      v-if="runCards.length"
      :class="['grid', { 'grid--stacked': stackRuns }]"
      :style="{ gridTemplateColumns: gridTemplateColumns }"
    >
      <div v-for="(rs, idx) in runCards" :key="rs.runId" class="cell">
        <div class="cell-header">
          <div class="cell-title-row">
            <strong>Run {{ idx + 1 }} — {{ rs.algorithmLabel }}</strong>
            <span class="run-score">Score {{ formatMetric(rs.score) }}</span>
          </div>
          <div class="cell-meta-row">
            <span class="run-params">{{ rs.paramLabel }}</span>
            <span v-if="rs.algorithmName === 'mlfq'" class="mlfq-badge">
              Queue-Lagen {{ rs.algorithmParams.queueLevels ?? 3 }}
            </span>
            <span class="run-params">t {{ rs.totalTime }}</span>
          </div>
          <div class="cell-stats">
            <span>W {{ formatMetric(rs.metrics.averageWaitingTime) }}</span>
            <span>T {{ formatMetric(rs.metrics.averageTurnaroundTime) }}</span>
            <span>F {{ formatMetric(rs.metrics.fairnessIndex) }}</span>
          </div>
        </div>
        <MiniGantt
          :segments="rs.segments"
          :cellWidth="multiViewCellWidth ?? undefined"
          :chartHeight="stackRuns ? 160 : 92"
          :segmentHeight="stackRuns ? 20 : 15"
          :currentTime="playbackTime"
          :algorithm="rs.algorithmName"
          :queueLevels="rs.algorithmParams.queueLevels"
        />
      </div>
    </div>

    <div v-else class="empty-state compact">
      <strong>Keine Runs verfuegbar</strong>
      <p>Füge zuerst einen Algorithmus zum Szenario hinzu, um die Multi-View zu sehen.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from "vue";
import MiniGantt from "./MiniGantt.vue";
import { simulateScenario } from "@/simulation";
import { usePlayback } from "@/composables/usePlayback";
import { createTimelineLayout } from "@/utils/timelineLayout";
import type { AlgorithmParams, SimulationRun } from "@/types";
import type { ScenarioRecord, ScenarioRunRecord } from "@/composables/useScenarioWorkspace";

const props = defineProps<{
  scenario: ScenarioRecord | null;
}>();

const multiViewRef = ref<HTMLElement | null>(null);

const runStates = computed(() => {
  if (!props.scenario) {
    return [] as Array<
      SimulationRun & {
        runId: string;
        algorithmName: string;
        algorithmParams: AlgorithmParams;
      }
    >;
  }

  return props.scenario.runs.map((run: ScenarioRunRecord) => {
    const sim = simulateScenario({
      id: `${props.scenario?.id}:${run.id}`,
      title: props.scenario?.title ?? "",
      description: props.scenario?.description ?? "",
      algorithm: run.algorithm,
      algorithmParams: run.algorithmParams,
      seed: props.scenario?.seed ?? 1,
      tickSize: props.scenario?.tickSize ?? 1,
      processes: props.scenario?.processes.map((p) => ({ ...p })) ?? [],
    });

    return {
      ...(sim as SimulationRun),
      runId: run.id,
      algorithmName: run.algorithm,
      algorithmParams: run.algorithmParams,
    };
  });
});

const maxTime = computed(() => Math.max(8, ...(runStates.value.map((r) => r.totalTime ?? 8) ?? [8])));

const multiViewViewport = computed(() => Math.floor(multiViewRef.value?.clientWidth ?? 0));

const shouldStackByTime = computed(() => maxTime.value >= 28);

const columnsCount = computed(() => {
  if (shouldStackByTime.value) return 1;

  const vp = Number(multiViewViewport.value ?? 0);
  if (vp > 0) {
    const cols = Math.max(1, Math.floor(vp / desiredMinPanelWidth));
    return Math.min(cols, Math.max(1, runCards.value.length));
  }

  return Math.max(1, runCards.value.length);
});

const multiViewPanelWidth = computed(() => {
  const vp = Number(multiViewViewport.value ?? 0);
  const cols = Math.max(1, columnsCount.value);
  const totalGap = Math.max(0, cols - 1) * 14;

  if (vp <= 0) {
    return 0;
  }

  return Math.max(320, Math.floor((vp - totalGap) / cols));
});

const multiViewLayout = computed(() =>
  createTimelineLayout({
    timelineLength: maxTime.value,
    containerWidth: multiViewPanelWidth.value,
    padding: 140,
    comfortTicks: 28,
    minCellWidth: 10,
    maxCellWidth: 44,
    lockedCellWidth: 24,
  }),
);

const multiViewCellWidth = computed(() => multiViewLayout.value.cellWidth);

// usePlayback expects a ref with .value array -> create snapshot list for times 0..maxTime
const snapshotsRef = computed(() => Array.from({ length: maxTime.value + 1 }, (_, i) => ({ time: i })));

const playback = usePlayback(snapshotsRef as any, { intervalMs: 700 });

const currentIndex = computed<number>({
  get: () => playback.index.value,
  set: (v: number) => playback.seek(v),
});

const playbackTime = computed(() => snapshotsRef.value[playback.index.value]?.time ?? 0);

const runCards = computed(() =>
  runStates.value.map((run) => ({
    ...run,
    algorithmLabel: algorithmLabel(run.algorithmName),
    paramLabel: formatParamLabel(run.algorithmName, run.algorithmParams),
    score: run.finalMetrics?.fairnessIndex ?? null,
    metrics: run.finalMetrics ?? {
      averageWaitingTime: null,
      averageTurnaroundTime: null,
      fairnessIndex: null,
    },
  })),
);

// When the timeline gets long or the ticks get too dense, stack the runs vertically
// so each MiniGantt can use the full row width and stay readable.
const stackRuns = computed(() => {
  const cw = Number(multiViewCellWidth.value ?? 0);
  const mt = Number(maxTime.value ?? 0);
  const vp = Number(multiViewViewport.value ?? 0);

  // Long timelines should switch to a single-column layout early.
  if (shouldStackByTime.value) {
    return true;
  }

  // If tick width becomes too small, the rows are hard to read side by side.
  if (cw > 0 && cw < 24) {
    return true;
  }

  // If we know the viewport, stack when the total timeline width fills most of it.
  if (vp > 0) {
    const totalWidth = cw * mt;
    return totalWidth > vp * 0.7;
  }

  return mt > 18 || cw < 24;
});

// Compute how many columns should be shown per row so runs wrap to new rows
const desiredMinPanelWidth = 360; // desired minimum width per panel before wrapping

const gridTemplateColumns = computed(() => `repeat(${columnsCount.value}, 1fr)`);

const hasPlayableRuns = computed(() => runCards.value.length > 0);

function togglePlay() {
  if (!hasPlayableRuns.value) {
    return;
  }

  playback.toggle();
}

function formatMetric(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(2);
}

function algorithmLabel(algorithm: string): string {
  switch (algorithm) {
    case "roundRobin":
      return "Round Robin";
    case "lcfs":
      return "LCFS";
    case "strictPriority":
      return "Strict Priority";
    case "mlfq":
      return "MLFQ";
    default:
      return algorithm;
  }
}

function formatParamLabel(
  algorithm: string,
  params?: AlgorithmParams,
): string {
  if (!params) {
    return "";
  }

  if (algorithm === "mlfq") {
    return `Stufen ${params.queueLevels ?? 3} · Q ${params.timeQuantum ?? 2}`;
  }

  if (algorithm === "roundRobin") {
    return `Q ${params.timeQuantum ?? 2}`;
  }

  if (algorithm === "lcfs") {
    return params.lcfsMode === "nonPreemptive" ? "non-preemptive" : "preemptive";
  }

  return "";
}

onUnmounted(() => {
  playback.pause();
});
</script>

<style scoped>
.multi-view {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.multi-controls {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 0.85rem;
}
.grid--stacked {
  grid-template-columns: 1fr;
  gap: 1.2rem;
}
.grid--stacked .cell {
  padding: 1rem;
}
.cell {
  padding: 0.75rem 0.75rem 0.65rem;
  border-radius: 16px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
  color: var(--text);
  min-width: 0;
}
.cell-header {
  margin-bottom: 0.15rem;
}
.cell-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.2rem;
}
.cell-meta-row,
.cell-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.35rem;
}
.run-score,
.run-params,
.mlfq-badge,
.cell-stats span {
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  background: var(--chip-bg, rgba(148, 163, 184, 0.08));
  color: var(--muted);
  font-size: 0.72rem;
  line-height: 1.2;
}
.run-score {
  color: var(--accent);
  background: var(--chip-accent-bg, rgba(125, 211, 252, 0.08));
}
.mlfq-badge {
  color: var(--text);
  background: rgba(234, 179, 8, 0.12);
}
.cell-stats span {
  color: var(--text);
}
.cell :deep(.mini-gantt) {
  padding-top: 0.15rem;
  min-width: 0;
}
.time-label { color: var(--muted); }
</style>
