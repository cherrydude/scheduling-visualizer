<template>
  <div class="multi-view" ref="multiViewRef">
    <div class="multi-controls">
      <button class="secondary-button" @click="togglePlay">
        {{ playback.playing.value ? 'Pause' : 'Play' }}
      </button>
      <input
        type="range"
        :min="0"
        :max="Math.max(playback.total.value - 1, 0)"
        v-model.number="currentIndex"
      />
      <span class="time-label">t {{ playbackTime }}</span>
    </div>

    <div class="grid">
      <div v-for="(rs, idx) in runCards" :key="rs.runId" class="cell">
        <div class="cell-header">
          <div class="cell-title-row">
            <strong>Run {{ idx + 1 }} — {{ rs.algorithmLabel }}</strong>
            <span class="run-score">Score {{ formatMetric(rs.score) }}</span>
          </div>
          <div class="cell-meta-row">
            <span class="run-params">{{ rs.paramLabel }}</span>
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
          :cellWidth="multiViewCellWidth"
          :chartHeight="92"
          :segmentHeight="15"
          :currentTime="playbackTime"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from "vue";
import MiniGantt from "./MiniGantt.vue";
import { simulateScenario } from "@/simulation";
import { usePlayback } from "@/composables/usePlayback";
import { useGanttZoom } from "@/composables/useGanttZoom";
import type { Scenario, SimulationRun } from "@/types";

const props = defineProps<{
  scenario: Scenario | null;
}>();

const multiViewRef = ref<HTMLElement | null>(null);

const runStates = computed(() => {
  if (!props.scenario) return [] as Array<SimulationRun & { runId: string; algorithmName: string }>;

  return props.scenario.runs.map((run) => {
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
    };
  });
});

const maxTime = computed(() => Math.max(8, ...(runStates.value.map((r) => r.totalTime ?? 8) ?? [8])));

const { cellWidth: multiViewCellWidth } = useGanttZoom(
  multiViewRef,
  maxTime,
  {
    baseCellWidth: 28,
    minCellWidth: 18,
    viewportPadding: 56,
    minViewportWidth: 320,
  },
);

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

function togglePlay() {
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
  params?: SimulationRun["algorithmParams"],
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
.cell {
  padding: 0.75rem 0.75rem 0.65rem;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.48)),
    rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 12px 32px rgba(2, 6, 23, 0.18);
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
.cell-stats span {
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  background: rgba(148, 163, 184, 0.1);
  color: #cbd5e1;
  font-size: 0.72rem;
  line-height: 1.2;
}
.run-score {
  color: #7dd3fc;
  background: rgba(125, 211, 252, 0.08);
}
.cell-stats span {
  color: #e2e8f0;
}
.cell :deep(.mini-gantt) {
  padding-top: 0.15rem;
}
.time-label { color: #cbd5e1; }
</style>
