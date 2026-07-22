<template>
  <div class="app-shell">
    <!-- Topbar removed: Gantt controls are sufficient -->

    <main class="dashboard-grid">
      <section class="panel status-strip">
        <article
          class="status-card"
          v-for="card in statusCards"
          :key="card.label"
        >
          <span class="status-label">{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <small>{{ card.help }}</small>
        </article>
      </section>

      <section class="focus-column panel">
        <div class="section-header">
          <h2>Fokusansicht</h2>
          <span>{{ algorithmName(selectedScenario.algorithm) }}</span>
        </div>

        <div class="warning-banner" v-if="runState && !runState.supported">
          {{ runState.note }}
        </div>

        <div class="gantt-wrap" ref="ganttWrapRef">
          <GanttWithGsap
            :key="'raw-preview'"
            :segments="focusSegments"
            :tickMarks="focusTickMarks"
            :cellWidth="cellWidth"
            :chartHeight="chartHeight"
            :segmentHeight="segmentHeight"
            :viewBox="focusViewBox"
            :activeId="focusActiveId"
            :currentTime="focusCurrentTime"
            v-model:loop="loopPlayback"
            :controlsEnabled="focusControlsEnabled"
            :introAnimation="hasSimulationStarted"
            @step="(delta) => (delta < 0 ? stepBackward() : stepForward())"
            @play="handlePlaybackPlay"
            @pause="handlePlaybackPause"
            @reset="handlePlaybackReset"
            @segmentEnter="onSegmentEnter"
            @segmentLeave="onSegmentLeave"
            @segmentClick="onSegmentClick"
            @seek="
              (time) => {
                const idx = snapshotsRef.findIndex((s: any) => s.time >= time);
                if (idx >= 0) playback.seek(idx);
              }
            "
          />
          <!--           <svg
            :viewBox="ganttViewBox"
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

            <g v-if="visibleSegments.length">
              <g
                v-for="segment in visibleSegments"
                :key="`${segment.processName}-${segment.start}-${segment.end}`"
              >
                <rect
                  :x="segment.start * cellWidth + 80"
                  :y="segmentY(segment)"
                  :width="
                    Math.max((segment.end - segment.start) * cellWidth, 4)
                  "
                  :height="segmentHeight"
                  :rx="7"
                  :fill="segment.idle ? 'url(#idleGradient)' : segment.color"
                  :opacity="segmentOpacity(segment)"
                  :stroke="segment.idle ? '#94a3b8' : 'rgba(255,255,255,0.2)'"
                  @pointerenter.prevent="onSegmentEnter(segment, $event)"
                  @pointerleave.prevent="onSegmentLeave"
                  @click.prevent="onSegmentClick(segment)"
                  style="cursor: pointer;"
                />
                <text
                  :x="segment.start * cellWidth + 88"
                  :y="segmentY(segment) + 22"
                  class="gantt-label"
                >
                  {{ segment.processName }}
                </text>
              </g>
            </g>

            <text v-else x="80" y="120" class="empty-gantt">
              Noch keine Timeline verfuegbar. Erstelle ein Szenario und starte
              die Simulation.
            </text>

            <g v-for="tick in tickMarks" :key="tick" class="tick-mark">
              <line
                :x1="tick * cellWidth + 80"
                y1="16"
                :x2="tick * cellWidth + 80"
                :y2="chartHeight - 18"
              />
              <text :x="tick * cellWidth + 80" :y="chartHeight - 4">
                {{ tick }}
              </text>
            </g>
          </svg> -->
        </div>

        <div class="timeline-caption">
          <span>Aktuelle Zeit: {{ currentSnapshot?.time ?? 0 }}</span>
          <span>Queue: {{ currentSnapshot?.readyQueue.length ?? 0 }}</span>
        </div>

        <!-- Old Scrubber removed: using Gantt local controls -->
      </section>

      <aside class="side-column">
        <section class="panel small-panel">
          <div class="section-header">
            <h2>Stack-Simulation</h2>
            <span>Simulation</span>
          </div>

          <div class="stack-area">
            <StackList
              v-if="stackItems.length"
              :items="stackItems"
              :maxVisible="6"
              :activeId="currentSnapshot?.currentProcessId ?? null"
              aria-label="Process queue"
            />
          </div>

          <p class="note-text">{{ simulationNote }}</p>
        </section>

        <section
          class="panel metric-panel"
          v-for="metric in metricCards"
          :key="metric.label"
        >
          <span class="status-label">{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.help }}</small>
        </section>

        <section class="panel small-panel">
          <div class="section-header">
            <h2>Vergleich</h2>
            <span>Woche 2 Zielbild</span>
          </div>

          <div class="compare-list">
            <article
              class="compare-card"
              v-for="comparison in comparisonCards"
              :key="comparison.label"
            >
              <span>{{ comparison.label }}</span>
              <strong>{{ comparison.value }}</strong>
              <small>{{ comparison.help }}</small>
            </article>
          </div>
        </section>
      </aside>

      <section class="panel detail-panel">
        <div class="section-header">
          <h2>Ereignislog</h2>
          <span>{{ currentEventLabel }}</span>
        </div>

        <div class="event-list">
          <article
            v-for="event in recentEvents"
            :key="`${event.time}-${event.type}-${event.processId ?? 'idle'}`"
            class="event-item"
          >
            <div>
              <strong>{{ event.type }}</strong>
              <p>{{ event.reason }}</p>
            </div>
            <span>{{ event.time }}</span>
          </article>
        </div>
      </section>
    </main>

    <Tooltip
      :x="tooltip.x"
      :y="tooltip.y"
      :visible="tooltip.visible"
      :title="tooltip.title"
      :subtitle="tooltip.subtitle"
    />

    <section
      v-if="showModal"
      class="modal-overlay"
      @click.self="closeGenerator"
    >
      <div class="modal panel" ref="modalRef" tabindex="-1">
        <div class="section-header">
          <h2>Szenario-Generator</h2>
          <button
            class="secondary-button"
            type="button"
            @click="closeGenerator"
          >
            Schliessen
          </button>
        </div>

        <div class="modal-layout">
          <form class="form-grid" @submit.prevent="saveScenario">
            <label>
              <span>Titel</span>
              <input
                v-model="draft.title"
                type="text"
                placeholder="Mein Szenario"
              />
            </label>
            <label>
              <span>Beschreibung</span>
              <input
                v-model="draft.description"
                type="text"
                placeholder="Kurzbeschreibung"
              />
            </label>

            <label>
              <span>Algorithmus</span>
              <select v-model="draft.algorithm">
                <option
                  v-for="option in algorithmOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label>
              <span>Zeitscheibe</span>
              <input v-model.number="draft.timeQuantum" type="number" min="1" />
            </label>

            <label>
              <span>Seed</span>
              <input v-model.number="draft.seed" type="number" />
            </label>
            <label>
              <span>Tick-Grösse</span>
              <input v-model.number="draft.tickSize" type="number" min="1" />
            </label>

            <div class="button-row">
              <button
                class="secondary-button"
                type="button"
                @click="loadPreset('classroom')"
              >
                Preset 1
              </button>
              <button
                class="secondary-button"
                type="button"
                @click="loadPreset('staggered')"
              >
                Preset 2
              </button>
              <button
                class="secondary-button"
                type="button"
                @click="randomizeDraft"
              >
                Zufall
              </button>
            </div>

            <div class="process-editor">
              <div class="section-header compact">
                <h3>Prozesse</h3>
                <button
                  class="secondary-button"
                  type="button"
                  @click="addProcess"
                >
                  + Prozess
                </button>
              </div>

              <div class="process-table">
                <div class="process-row process-head">
                  <span>ID</span>
                  <span>Name</span>
                  <span>Ankunft</span>
                  <span>Burst</span>
                  <span>Prio</span>
                  <span>Farbe</span>
                  <span></span>
                </div>

                <div
                  class="process-row"
                  v-for="(process, index) in draft.processes"
                  :key="process.id"
                >
                  <input v-model="process.id" type="text" />
                  <input v-model="process.name" type="text" />
                  <input
                    v-model.number="process.arrivalTime"
                    type="number"
                    min="0"
                  />
                  <input
                    v-model.number="process.burstTime"
                    type="number"
                    min="1"
                  />
                  <input
                    v-model.number="process.priority"
                    type="number"
                    min="1"
                  />
                  <input v-model="process.color" type="color" />
                  <button
                    class="danger-button"
                    type="button"
                    @click="removeProcess(index)"
                  >
                    -
                  </button>
                </div>
              </div>
            </div>

            <div class="button-row submit-row">
              <button class="primary-button" type="submit">
                Szenario uebernehmen
              </button>
            </div>
          </form>

          <aside class="modal-help panel soft-panel">
            <h3>Hinweis</h3>
            <p>
              Das Modal legt die Grundlage fuer den MVP-Flow fest. Fuer Woche 1
              sind Presets, Seed und eine manuelle Prozessliste ausreichend. Die
              spaeteren Algorithmen koennen im gleichen Generator erweitert
              werden.
            </p>
            <p>
              GSAP wird hier bereits genutzt, um das Modal und spaeter die
              Dashboard-Uebergaenge weich zu animieren.
            </p>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import gsap from "gsap";
import { createSeededScenarioProcesses, simulateScenario } from "@/simulation";
import Tooltip from "@/components/Tooltip.vue";
import GanttWithGsap from "./components/GanttWithGsap.vue";
import StackList from "./components/StackList.vue";
import { usePlayback } from "@/composables/usePlayback";
import type {
  AlgorithmType,
  ProcessInput,
  Scenario,
  ScheduleEvent,
  SimulationRun,
  SimulationSnapshot,
  TimelineSegment,
} from "@/types";

interface ScenarioDraft {
  title: string;
  description: string;
  algorithm: AlgorithmType;
  timeQuantum: number;
  seed: number;
  tickSize: number;
  processes: ProcessInput[];
}

interface ScenarioOption {
  label: string;
  value: AlgorithmType;
}

interface MetricCard {
  label: string;
  value: string;
  help: string;
}

interface ComparisonCard {
  label: string;
  value: string;
  help: string;
}

const algorithmOptions: ScenarioOption[] = [
  { label: "Round Robin", value: "roundRobin" },
  { label: "LCFS", value: "lcfs" },
  { label: "Strict Priority", value: "strictPriority" },
  { label: "MLFQ", value: "mlfq" },
];

const presetScenarios: Record<string, ScenarioDraft> = {
  classroom: {
    title: "Klassenzimmer",
    description:
      "Ein ausgewogenes Beispiel mit drei Prozessen und mittlerer Zeitscheibe.",
    algorithm: "roundRobin",
    timeQuantum: 2,
    seed: 17,
    tickSize: 1,
    processes: [
      {
        id: "P1",
        name: "P1",
        arrivalTime: 0,
        burstTime: 4,
        priority: 2,
        color: "#7dd3fc",
        group: "A",
      },
      {
        id: "P2",
        name: "P2",
        arrivalTime: 1,
        burstTime: 3,
        priority: 1,
        color: "#60a5fa",
        group: "A",
      },
      {
        id: "P3",
        name: "P3",
        arrivalTime: 2,
        burstTime: 5,
        priority: 3,
        color: "#34d399",
        group: "B",
      },
    ],
  },
  staggered: {
    title: "Versetzt",
    description:
      "Prozesse treffen nacheinander ein, um Preemption und Queue-Wechsel sichtbar zu machen.",
    algorithm: "roundRobin",
    timeQuantum: 3,
    seed: 33,
    tickSize: 1,
    processes: [
      {
        id: "A",
        name: "A",
        arrivalTime: 0,
        burstTime: 6,
        priority: 2,
        color: "#fbbf24",
        group: "A",
      },
      {
        id: "B",
        name: "B",
        arrivalTime: 2,
        burstTime: 4,
        priority: 1,
        color: "#a78bfa",
        group: "B",
      },
      {
        id: "C",
        name: "C",
        arrivalTime: 4,
        burstTime: 3,
        priority: 4,
        color: "#f87171",
        group: "B",
      },
      {
        id: "D",
        name: "D",
        arrivalTime: 5,
        burstTime: 2,
        priority: 2,
        color: "#22c55e",
        group: "C",
      },
    ],
  },
};

const selectedPresetId = ref("classroom");
const showModal = ref(true);
const modalRef = ref<HTMLElement | null>(null);
const ganttWrapRef = ref<HTMLElement | null>(null);

const draft = reactive<ScenarioDraft>({
  ...presetScenarios.classroom,
  processes: presetScenarios.classroom.processes.map((process) => ({
    ...process,
  })),
});

const customScenario = ref<Scenario | null>(null);
const currentStepIndex = ref(0);
const isPlaying = ref(false);
const hasSimulationStarted = ref(false);
const loopPlayback = ref(false);
let playTimer: number | undefined;

const selectedScenario = computed<Scenario>(() => {
  if (customScenario.value) {
    return customScenario.value;
  }

  return {
    id: selectedPresetId.value,
    title: draft.title,
    description: draft.description,
    algorithm: draft.algorithm,
    algorithmParams: {
      timeQuantum: draft.timeQuantum,
      queueLevels: 3,
    },
    seed: draft.seed,
    tickSize: draft.tickSize,
    processes: draft.processes.map((process) => ({ ...process })),
  };
});

const runState = computed<SimulationRun | null>(() =>
  simulateScenario(selectedScenario.value),
);
const totalSnapshots = computed(() => runState.value?.snapshots.length ?? 0);
const rawPreviewSegments = computed<TimelineSegment[]>(() => {
  return selectedScenario.value.processes
    .slice()
    .sort(
      (left, right) =>
        left.arrivalTime - right.arrivalTime || left.id.localeCompare(right.id),
    )
    .map((process) => ({
      processId: process.id,
      processName: process.name,
      start: process.arrivalTime,
      end: process.arrivalTime + process.burstTime,
      color: process.color,
    }));
});
const currentSnapshot = computed<SimulationSnapshot | null>(
  () =>
    runState.value?.snapshots[currentStepIndex.value] ??
    runState.value?.snapshots[runState.value.snapshots.length - 1] ??
    null,
);
const visibleSegments = computed(() => runState.value?.segments ?? []);
const timelineEnd = computed(() =>
  visibleSegments.value.reduce((max, segment) => Math.max(max, segment.end), 0),
);
const focusSegments = computed(() => rawPreviewSegments.value);
const focusTickMarks = computed(() => {
  const time = Math.max(
    hasSimulationStarted.value
      ? (runState.value?.totalTime ?? timelineEnd.value)
      : rawPreviewSegments.value.reduce(
          (max, segment) => Math.max(max, segment.end),
          0,
        ),
    8,
  );

  return Array.from({ length: time + 1 }, (_, index) => index);
});
const focusViewBox = computed(
  () =>
    `0 0 ${Math.max(
      (hasSimulationStarted.value
        ? (runState.value?.totalTime ?? timelineEnd.value)
        : rawPreviewSegments.value.reduce(
            (max, segment) => Math.max(max, segment.end),
            0,
          )) *
        cellWidth +
        100,
      860,
    )} ${chartHeight}`,
);
const focusCurrentTime = computed(() =>
  hasSimulationStarted.value ? (currentSnapshot.value?.time ?? 0) : 0,
);
const focusActiveId = computed(() =>
  hasSimulationStarted.value
    ? (currentSnapshot.value?.currentProcessId ?? null)
    : null,
);
const focusControlsEnabled = computed(() => Boolean(runState.value));
const canStepForward = computed(
  () => currentStepIndex.value < timelineEnd.value,
);
// --- Stable stack: initialize once, update only on top-change ---
type StackItem = {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
};

const stableStackIds = ref<string[]>([]);
const stackItems = ref<StackItem[]>([]);

function findProcessMeta(pid?: string | null) {
  if (!pid) return { name: pid ?? "?", color: "#475569" };
  const seg = visibleSegments.value.find((s) => s.processId === pid);
  const proc = selectedScenario.value.processes.find((p) => p.id === pid);
  return {
    name: seg?.processName ?? proc?.name ?? pid,
    color: seg?.color ?? proc?.color ?? "#475569",
  };
}

function isProcessDone(pid: string, snap: SimulationSnapshot | null) {
  if (!snap) return false;
  return !visibleSegments.value.some(
    (s) => s.processId === pid && s.end > snap.time,
  );
}

function buildInitialOrder(snap: SimulationSnapshot | null, max = 8) {
  if (!snap) return [];
  const ids: string[] = [];
  const seen = new Set<string>();

  const push = (pid?: string | null) => {
    if (!pid || seen.has(pid)) return;
    seen.add(pid);
    ids.push(pid);
  };

  push(snap.currentProcessId);
  if (Array.isArray(snap.readyQueue)) {
    for (const pid of snap.readyQueue) {
      if (ids.length >= max) break;
      push(pid);
    }
  }

  for (const s of visibleSegments.value) {
    if (ids.length >= max) break;
    if (s.processId && !seen.has(s.processId) && s.end > (snap?.time ?? 0)) {
      push(s.processId);
    }
  }

  return ids;
}

function writeStackFromIds(ids: string[], max = 8) {
  stableStackIds.value = ids.slice(0, max);
  stackItems.value = stableStackIds.value.map((pid) => {
    const meta = findProcessMeta(pid);
    const nextSeg =
      visibleSegments.value.find(
        (s) =>
          s.processId === pid && s.end > (currentSnapshot.value?.time ?? 0),
      ) ?? visibleSegments.value.find((s) => s.processId === pid);
    const subtitle = nextSeg ? `t ${nextSeg.start}–${nextSeg.end}` : `t done`;
    return { id: pid, title: meta.name, subtitle, color: meta.color };
  });
}

// initialize once when runState / first snapshot available
watch(
  () => runState.value?.snapshots.length,
  (len) => {
    if (len && !stableStackIds.value.length) {
      const snap = currentSnapshot.value;
      const ids = buildInitialOrder(snap);
      writeStackFromIds(ids);
    }
  },
  { immediate: true },
);

// update only on top-change (minimizes reordering)
let lastTop: string | null = null;
watch(
  () => currentSnapshot.value,
  (snap, prev) => {
    if (!snap) return;
    const newTop = snap.currentProcessId ?? null;
    if (newTop === lastTop) return;
    lastTop = newTop;

    if (!stableStackIds.value.length) {
      writeStackFromIds(buildInitialOrder(snap));
      return;
    }

    const idx = stableStackIds.value.indexOf(newTop ?? "");
    if (idx > -1) stableStackIds.value.splice(idx, 1);
    if (newTop) stableStackIds.value.unshift(newTop);

    const prevTop = prev?.currentProcessId ?? null;
    if (prevTop && prevTop !== newTop) {
      if (!isProcessDone(prevTop, snap)) {
        const pidx = stableStackIds.value.indexOf(prevTop);
        if (pidx > -1) stableStackIds.value.splice(pidx, 1);
        stableStackIds.value.push(prevTop);
      } else {
        const pidx = stableStackIds.value.indexOf(prevTop);
        if (pidx > -1) stableStackIds.value.splice(pidx, 1);
      }
    }

    const max = 8;
    const fillIds: string[] = [];
    for (const s of visibleSegments.value) {
      if (stableStackIds.value.length + fillIds.length >= max) break;
      if (
        s.processId &&
        stableStackIds.value.indexOf(s.processId) === -1 &&
        !fillIds.includes(s.processId)
      ) {
        fillIds.push(s.processId);
      }
    }
    writeStackFromIds(stableStackIds.value.concat(fillIds).slice(0, max));
  },
  { immediate: true },
);
const currentEventLabel = computed(() =>
  currentSnapshot.value?.lastEvent
    ? `${currentSnapshot.value.lastEvent.type} @ ${currentSnapshot.value.lastEvent.time}`
    : "Keine Ereignisse",
);
const simulationNote = computed(() => runState.value?.note ?? "");

const statusCards = computed<MetricCard[]>(() => [
  {
    label: "Szenario",
    value: selectedScenario.value.title,
    help: selectedScenario.value.description,
  },
  {
    label: "Algorithmus",
    value: algorithmName(selectedScenario.value.algorithm),
    help: "Im MVP aktiv ist Round Robin.",
  },
  {
    label: "Zeit",
    value: String(currentSnapshot.value?.time ?? 0),
    help: "Aktuelle Simulationszeit",
  },
  {
    label: "Laufstatus",
    value: isPlaying.value ? "Running" : "Paused",
    help: "Steuerung per Toolbar",
  },
]);

const metricCards = computed<MetricCard[]>(() => {
  const metrics =
    currentSnapshot.value?.metrics ?? runState.value?.finalMetrics;

  return [
    {
      label: "Wartezeit",
      value: formatMetric(metrics?.averageWaitingTime),
      help: "Mittelwert",
    },
    {
      label: "Durchlaufzeit",
      value: formatMetric(metrics?.averageTurnaroundTime),
      help: "Mittelwert",
    },
    {
      label: "Reaktionszeit",
      value: formatMetric(metrics?.averageResponseTime),
      help: "Mittelwert",
    },
    {
      label: "CPU-Auslastung",
      value: formatPercent(metrics?.cpuUtilization ?? 0),
      help: "Busy / Total",
    },
    {
      label: "Kontextwechsel",
      value: String(metrics?.contextSwitches ?? 0),
      help: "Gezählt im Lauf",
    },
    {
      label: "Fairness",
      value: formatMetric(metrics?.fairnessIndex),
      help: "Jain Index",
    },
  ];
});

const comparisonCards = computed<ComparisonCard[]>(() => [
  { label: "LCFS", value: "bereit", help: "Wird in Woche 2 integriert" },
  {
    label: "Strict Priority",
    value: "bereit",
    help: "Wird in Woche 2 integriert",
  },
  { label: "MLFQ", value: "bereit", help: "Wird in Woche 2 integriert" },
]);

const recentEvents = computed<ScheduleEvent[]>(
  () => runState.value?.events.slice(-6).reverse() ?? [],
);
const ganttViewBox = computed(
  () =>
    `0 0 ${Math.max(timelineEnd.value * cellWidth + 100, 860)} ${chartHeight}`,
);

// Playback composable bridges snapshots -> UI index/time
const snapshotsRef = computed(() => runState.value?.snapshots ?? []);
const playback = usePlayback(snapshotsRef, {
  intervalMs: 750,
  loop: loopPlayback,
});

// keep currentStepIndex and playback.index in sync
watch(
  () => playback.index.value,
  (v) => {
    currentStepIndex.value = v;
  },
);

watch(currentStepIndex, (v) => {
  if (playback.index.value !== v) playback.seek(v);
});

watch(
  () => playback.playing.value,
  (v) => {
    isPlaying.value = v;
  },
);

// Tooltip state for gantt interactions
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  title: "",
  subtitle: "",
});

function seekTo(index: number) {
  playback.seek(index);
}

function onSegmentEnter(segment: TimelineSegment, e: PointerEvent) {
  tooltip.visible = true;
  tooltip.x = e.clientX;
  tooltip.y = e.clientY;
  tooltip.title = segment.processName;
  tooltip.subtitle = `Start ${segment.start} — End ${segment.end}`;
}

function onSegmentLeave() {
  tooltip.visible = false;
}

function onSegmentClick(segment: TimelineSegment) {
  // focus behaviour: seek to segment start
  const idx = snapshotsRef.value.findIndex((s: any) => s.time >= segment.start);
  if (idx >= 0) playback.seek(idx);
}

const cellWidth = 44;
const segmentHeight = 34;
const chartHeight = 260;

watch(currentStepIndex, async () => {
  await nextTick();
  animateDashboardStep();
});

watch(showModal, async (visible) => {
  if (visible) {
    // lock page scroll
    document.body.style.overflow = "hidden";
    await nextTick();
    if (modalRef.value) {
      modalRef.value.focus?.();
      gsap.fromTo(
        modalRef.value,
        { y: 24, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: "power2.out" },
      );
    }
    return;
  }

  // closing: animate out then restore body scroll
  if (modalRef.value) {
    gsap.to(modalRef.value, {
      y: 12,
      opacity: 0,
      scale: 0.995,
      duration: 0.18,
      ease: "power1.in",
      onComplete: () => {
        document.body.style.overflow = "";
      },
    });
  } else {
    document.body.style.overflow = "";
  }
});

onMounted(() => {
  animateDashboardStep();
});

onBeforeUnmount(() => {
  pausePlayback();
});

function algorithmName(algorithm: AlgorithmType): string {
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

function formatMetric(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(2);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function animateDashboardStep(): void {
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>(".status-card"),
  );
  if (cards.length) {
    gsap.fromTo(
      cards,
      { opacity: 0.65, y: 6 },
      { opacity: 1, y: 0, duration: 0.25, stagger: 0.04, ease: "power2.out" },
    );
  }

  if (ganttWrapRef.value) {
    gsap.fromTo(
      ganttWrapRef.value,
      { opacity: 0.7, scale: 0.995 },
      { opacity: 1, scale: 1, duration: 0.24, ease: "power1.out" },
    );
  }
}

function openGenerator(): void {
  showModal.value = true;
}

function closeGenerator(): void {
  showModal.value = false;
}

function loadPreset(key: keyof typeof presetScenarios): void {
  selectedPresetId.value = key;
  const preset = presetScenarios[key];
  draft.title = preset.title;
  draft.description = preset.description;
  draft.algorithm = preset.algorithm;
  draft.timeQuantum = preset.timeQuantum;
  draft.seed = preset.seed;
  draft.tickSize = preset.tickSize;
  draft.processes = preset.processes.map((process) => ({ ...process }));
  customScenario.value = null;
}

function randomizeDraft(): void {
  draft.processes = createSeededScenarioProcesses(
    draft.seed,
    Math.max(3, Math.min(6, draft.processes.length || 4)),
  ).map((process, index) => ({
    ...process,
    name: `P${index + 1}`,
    id: `P${index + 1}`,
  }));
}

function addProcess(): void {
  const index = draft.processes.length + 1;
  draft.processes.push({
    id: `P${index}`,
    name: `P${index}`,
    arrivalTime: 0,
    burstTime: 3,
    priority: 1,
    color: "#60a5fa",
  });
}

function removeProcess(index: number): void {
  draft.processes.splice(index, 1);
}

function saveScenario(): void {
  customScenario.value = {
    id: "custom",
    title: draft.title || "Benutzer-Szenario",
    description:
      draft.description || "Vom Szenario-Generator erstelltes Beispiel.",
    algorithm: draft.algorithm,
    algorithmParams: {
      timeQuantum: draft.timeQuantum,
      queueLevels: 3,
    },
    seed: draft.seed,
    tickSize: draft.tickSize,
    processes: draft.processes.map((process) => ({ ...process })),
  };

  selectedPresetId.value = "custom";
  closeGenerator();
  resetPlayback();
}

function resetPlayback(): void {
  currentStepIndex.value = 0;
  hasSimulationStarted.value = false;
  pausePlayback();
}

function stepForward(): void {
  if (!canStepForward.value) {
    return;
  }

  currentStepIndex.value += 1;
}

function stepBackward(): void {
  currentStepIndex.value = Math.max(0, currentStepIndex.value - 1);
}

function pausePlayback(): void {
  playback.pause();
}

async function handlePlaybackPlay(): Promise<void> {
  if (!hasSimulationStarted.value) {
    hasSimulationStarted.value = true;
  }
  await nextTick();
  playback.play();
}

function handlePlaybackPause(): void {
  playback.pause();
}

function handlePlaybackReset(): void {
  resetPlayback();
}

function segmentY(segment: TimelineSegment): number {
  if (segment.idle) {
    return 180;
  }

  const processIndex = selectedScenario.value.processes.findIndex(
    (process) => process.id === segment.processId,
  );
  return 28 + Math.max(processIndex, 0) * (segmentHeight + 14);
}

function segmentOpacity(segment: TimelineSegment): number {
  if (!currentSnapshot.value) {
    return 0.9;
  }

  return segment.end <= currentSnapshot.value.time ? 1 : 0.55;
}
</script>
