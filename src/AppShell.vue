<template>
  <div class="app-shell">
    <WelcomeModal :modelValue="showWelcomeModal" @close="closeWelcomeModal" />

    <AlgorithmPickerModal
      :modelValue="showAlgorithmModal"
      :scenarioTitle="activeScenario?.title"
      :initialAlgorithm="algorithmModalSeed?.algorithm"
      :initialAlgorithmParams="algorithmModalSeed?.algorithmParams"
      :confirmLabel="
        algorithmModalMode === 'edit' ? 'Run anpassen' : 'Algorithmus anwenden'
      "
      @close="showAlgorithmModal = false"
      @confirm="confirmAlgorithm"
    />

    <section
      v-if="showGeneratorModal"
      class="modal-overlay"
      @click.self="closeGeneratorModal"
    >
      <div class="modal panel" ref="generatorModalRef" tabindex="-1">
        <div class="section-header">
          <h2>{{ generatorModalTitle }}</h2>
          <button
            class="secondary-button"
            type="button"
            @click="closeGeneratorModal"
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
                  :key="`${process.id}-${index}`"
                >
                  <input v-model="process.id" type="text" placeholder="P1" />
                  <input
                    v-model="process.name"
                    type="text"
                    placeholder="Name"
                  />
                  <input
                    v-model.number="process.arrivalTime"
                    type="number"
                    min="0"
                    placeholder="0"
                  />
                  <input
                    v-model.number="process.burstTime"
                    type="number"
                    min="1"
                    placeholder="5"
                  />
                  <input
                    v-model.number="process.priority"
                    type="number"
                    min="0"
                    placeholder="1"
                  />
                  <input v-model="process.color" type="color" />
                  <button
                    class="danger-button"
                    type="button"
                    @click="removeProcess(index)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div class="button-row submit-row">
              <button class="primary-button" type="submit">
                {{ generatorSubmitLabel }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <header class="topbar panel">
      <div class="topbar-left">
        <BurgerMenu
          :scenarios="scenarios"
          :activeScenarioId="activeScenarioId"
          @create="openGeneratorModal"
          @select="selectScenarioAndReset"
          @duplicate="duplicateScenarioAndReset"
          @rename="renameScenarioFromMenu"
          @delete="deleteScenarioFromMenu"
          @about="navigate('/about')"
          @knowledge="navigate('/wissen')"
        />
        <div class="topbar-brand">
          <strong>{{ headerTitle }}</strong>
          <span v-if="isHome">Scheduling Visualizer</span>
          <span v-else>Navigation und Wissen</span>
        </div>
      </div>

      <div v-if="isHome" class="topbar-actions">
        <button
          class="primary-button"
          type="button"
          @click="togglePlay"
          :disabled="!canPlay"
        >
          {{ isPlaying ? "Pause" : "Start" }}
        </button>
        <button
          class="secondary-button"
          type="button"
          @click="stepBackward"
          :disabled="currentStepIndex === 0"
        >
          Zurueck
        </button>
        <button
          class="secondary-button"
          type="button"
          @click="stepForward"
          :disabled="!canStepForward"
        >
          Weiter
        </button>
        <button class="secondary-button" type="button" @click="resetPlayback">
          Reset
        </button>
        <label class="loop-toggle">
          <input v-model="loopPlayback" type="checkbox" />
          <span>Endlos-Schleife</span>
        </label>
      </div>

      <div v-else class="topbar-actions">
        <button class="secondary-button" type="button" @click="navigate('/')">
          Zurueck zur Visualisierung
        </button>
      </div>
    </header>

    <main v-if="isHome" class="dashboard-grid">
      <section class="panel status-strip">
        <article
          class="status-card"
          :class="{
            'status-card--clickable':
              card.label === 'Szenario' || card.label === 'Algorithmus',
          }"
          v-for="card in statusCards"
          :key="card.label"
          :role="
            card.label === 'Szenario' || card.label === 'Algorithmus'
              ? 'button'
              : undefined
          "
          :tabindex="
            card.label === 'Szenario' || card.label === 'Algorithmus'
              ? 0
              : undefined
          "
          @click="handleStatusCardClick(card.label)"
          @keydown.enter.prevent="handleStatusCardClick(card.label)"
          @keydown.space.prevent="handleStatusCardClick(card.label)"
        >
          <span class="status-label">{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <small>{{ card.help }}</small>
        </article>
      </section>

      <section class="focus-column panel">
        <div class="section-header">
          <h2>Fokusansicht</h2>
          <div class="section-header-actions">
            <span>{{ focusSubtitle }}</span>
            <button
              v-if="activeScenario && activeRun"
              class="primary-button"
              type="button"
              @click="openAlgorithmModal('create')"
            >
              + weiteren Algorithmus
            </button>
          </div>
        </div>

        <div v-if="!activeScenario" class="empty-state empty-state--actions">
          <strong>Bitte Szenario erstellen</strong>
          <p>
            Oeffne das Burgermenue oben links und lege zuerst ein Szenario an
            oder drücke hier:
            <button
              class="inline-link-button"
              type="button"
              @click="openGeneratorModal"
            >
              +
            </button>
          </p>
        </div>

        <template v-else>
          <div v-if="!activeRun" class="scenario-banner">
            <div>
              <strong>Szenario geladen</strong>
              <p class="scenario-line">
                <span>{{ activeScenario.title }}</span>
              </p>
            </div>
            <button
              class="primary-button"
              type="button"
              @click="openAlgorithmModal('create')"
            >
              + Algorithmus anwenden
            </button>
          </div>

          <div v-if="activeScenario.runs.length > 1" class="run-navigation">
            <button
              v-for="(run, index) in activeScenario.runs"
              :key="run.id"
              type="button"
              class="run-step"
              :class="{ active: index === activeRunIndex }"
              @click="selectRun(index)"
            >
              {{ index + 1 }}
            </button>
          </div>

          <div
            v-if="runState && runState.supported"
            class="gantt-wrap"
            ref="ganttWrapRef"
          >
            <Gantt
              :segments="visibleSegments"
              :tickMarks="tickMarks"
              :cellWidth="cellWidth"
              :chartHeight="chartHeight"
              :segmentHeight="segmentHeight"
              :viewBox="ganttViewBox"
              :activeId="currentSnapshot?.currentProcessId ?? null"
              :currentTime="currentSnapshot?.time ?? 0"
              :tickSize="activeScenario.tickSize"
              @segmentEnter="onSegmentEnter"
              @segmentLeave="onSegmentLeave"
              @segmentClick="onSegmentClick"
            />
          </div>

          <div v-else class="empty-state compact">
            <strong>{{
              runState?.note ?? "Kein Algorithmus zugeordnet"
            }}</strong>
            <p>
              Nutze „Algorithmus anwenden“, um das Szenario fuer die
              Visualisierung zu aktivieren.
            </p>
          </div>
        </template>

        <div class="timeline-caption">
          <span>Aktuelle Zeit: {{ currentSnapshot?.time ?? 0 }}</span>
          <span>Queue: {{ currentSnapshot?.readyQueue.length ?? 0 }}</span>
        </div>

        <Scrubber
          v-if="runState && runState.supported"
          :total="timelineEnd"
          :currentTime="currentSnapshot?.time ?? 0"
          @seek="seekToTime"
        />
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
            <div v-else class="empty-state compact">
              <strong>Keine Daten</strong>
              <p>Aktiviere zuerst ein Szenario mit Algorithmus.</p>
            </div>
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

      <Tooltip
        :x="tooltip.x"
        :y="tooltip.y"
        :visible="tooltip.visible"
        :title="tooltip.title"
        :subtitle="tooltip.subtitle"
      />
    </main>

    <main v-else class="panel route-panel">
      <div class="section-header">
        <h2>{{ routeTitle }}</h2>
        <button class="secondary-button" type="button" @click="navigate('/')">
          Zur Visualisierung
        </button>
      </div>

      <div class="route-copy">
        <p v-if="currentRoute === 'about'">
          Hier entsteht die Seite ueber mich und die Bachelorarbeit. Diese Route
          ist bereits als stabiler Einstiegspunkt vorgesehen.
        </p>
        <template v-else>
          <p>
            Diese Seite wird spaeter die Kurz-Anleitung zur Nutzung sowie die
            Erklaerungen zu Prozessen und Algorithmen enthalten.
          </p>
        </template>
      </div>
    </main>
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
import {
  createBlankScenarioDraft,
  useScenarioWorkspace,
  type ScenarioDraft,
} from "@/composables/useScenarioWorkspace";
import BurgerMenu from "./components/BurgerMenu.vue";
import WelcomeModal from "./components/WelcomeModal.vue";
import AlgorithmPickerModal from "./components/AlgorithmPickerModal.vue";
import Scrubber from "@/components/Scrubber.vue";
import Tooltip from "@/components/Tooltip.vue";
import Gantt from "./components/Gantt.vue";
import StackList from "./components/StackList.vue";
import { usePlayback } from "@/composables/usePlayback";
import type {
  AlgorithmType,
  ScheduleEvent,
  SimulationRun,
  SimulationSnapshot,
  TimelineSegment,
  Scenario,
} from "@/types";

type RouteName = "home" | "about" | "knowledge";

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

const workspace = useScenarioWorkspace();
const {
  scenarios,
  activeScenarioId,
  activeScenario,
  createScenario,
  selectScenario,
  renameScenario,
  updateScenario,
  deleteScenario,
  duplicateScenario,
  applyAlgorithm,
  createRun,
  updateActiveRun,
  setActiveRun,
} = workspace;

const scenarioPresets: Record<string, ScenarioDraft> = {
  classroom: {
    title: "Klassenzimmer",
    description:
      "Ein ausgewogenes Beispiel mit drei Prozessen und mittlerer Zeitscheibe.",
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

const showWelcomeModal = ref(false);
const showGeneratorModal = ref(false);
const showAlgorithmModal = ref(false);
const generatorMode = ref<"create" | "edit">("create");
const algorithmModalMode = ref<"create" | "edit">("create");
const algorithmModalSeed = ref<{
  algorithm: AlgorithmType;
  algorithmParams: {
    timeQuantum: number;
    snapshotInterval: number;
    queueLevels: number;
  };
} | null>(null);
const generatorModalRef = ref<HTMLElement | null>(null);
const ganttWrapRef = ref<HTMLElement | null>(null);
const currentRoute = ref<RouteName>("home");
const loopPlayback = ref(false);

const draft = reactive<ScenarioDraft>(createBlankScenarioDraft());

const generatorModalTitle = computed(() =>
  generatorMode.value === "edit" ? "Szenario bearbeiten" : "Szenario-Generator",
);

const generatorSubmitLabel = computed(() =>
  generatorMode.value === "edit"
    ? "Szenario speichern"
    : "Szenario uebernehmen",
);

function cloneDraft(source: ScenarioDraft): void {
  draft.title = source.title;
  draft.description = source.description;
  draft.seed = source.seed;
  draft.tickSize = source.tickSize;
  draft.processes = source.processes.map((process) => ({ ...process }));
}

function openScenarioEditModal(): void {
  if (!activeScenario.value) {
    return;
  }

  generatorMode.value = "edit";
  cloneDraft({
    title: activeScenario.value.title,
    description: activeScenario.value.description,
    seed: activeScenario.value.seed,
    tickSize: activeScenario.value.tickSize,
    processes: activeScenario.value.processes.map((process) => ({
      ...process,
    })),
  });
  showGeneratorModal.value = true;
}

cloneDraft(scenarioPresets.classroom);

const activeRunIndex = computed<number>(
  () => activeScenario.value?.activeRunIndex ?? -1,
);
const activeRun = computed(() => {
  const scenario = activeScenario.value;
  if (!scenario || scenario.activeRunIndex < 0) {
    return null;
  }

  return scenario.runs[scenario.activeRunIndex] ?? null;
});

const simulationScenario = computed<Scenario | null>(() => {
  const scenario = activeScenario.value;
  const run = activeRun.value;
  if (!scenario || !run) {
    return null;
  }

  return {
    id: `${scenario.id}:${run.id}`,
    title: scenario.title,
    description: scenario.description,
    algorithm: run.algorithm,
    algorithmParams: run.algorithmParams,
    seed: scenario.seed,
    tickSize: scenario.tickSize,
    processes: scenario.processes.map((process) => ({ ...process })),
  };
});

const runState = computed<SimulationRun | null>(() =>
  simulationScenario.value ? simulateScenario(simulationScenario.value) : null,
);

const totalSnapshots = computed(() => runState.value?.snapshots.length ?? 0);
const currentStepIndex = ref(0);
const isPlaying = ref(false);

const snapshotsRef = computed(() => runState.value?.snapshots ?? []);
const playback = usePlayback(snapshotsRef, {
  intervalMs: 1000,
  loop: loopPlayback,
});
const loopIteration = computed(() => playback.loopIteration.value);

const currentSnapshot = computed<SimulationSnapshot | null>(
  () =>
    runState.value?.snapshots[currentStepIndex.value] ??
    runState.value?.snapshots[runState.value.snapshots.length - 1] ??
    null,
);

const canStepForward = computed(
  () => currentStepIndex.value < Math.max(totalSnapshots.value - 1, 0),
);
const canPlay = computed(
  () => totalSnapshots.value > 0 && Boolean(runState.value),
);
const visibleSegments = computed(() => runState.value?.segments ?? []);
const timelineEnd = computed(() =>
  visibleSegments.value.reduce((max, segment) => Math.max(max, segment.end), 0),
);
const tickMarks = computed(() => {
  const time = Math.max(runState.value?.totalTime ?? 8, 8);
  return Array.from({ length: time + 1 }, (_, index) => index);
});

type StackItem = {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
};
const stableStackIds = ref<string[]>([]);
const stackItems = ref<StackItem[]>([]);
const lastTop = ref<string | null>(null);
const loopLogStart = ref(0);

function isProcessDone(pid: string, snap: SimulationSnapshot | null) {
  if (!snap) {
    return false;
  }

  return !visibleSegments.value.some(
    (segment) => segment.processId === pid && segment.end > snap.time,
  );
}

function findProcessMeta(pid?: string | null) {
  if (!pid) {
    return { name: pid ?? "?", color: "#475569" };
  }

  const seg = visibleSegments.value.find(
    (segment) => segment.processId === pid,
  );
  const proc = activeScenario.value?.processes.find(
    (process) => process.id === pid,
  );

  return {
    name: seg?.processName ?? proc?.name ?? pid,
    color: seg?.color ?? proc?.color ?? "#475569",
  };
}

function buildInitialOrder(snap: SimulationSnapshot | null, max = 8) {
  if (!snap) {
    return [];
  }

  const ids: string[] = [];
  const seen = new Set<string>();

  const push = (pid?: string | null) => {
    if (!pid || seen.has(pid)) {
      return;
    }

    seen.add(pid);
    ids.push(pid);
  };

  push(snap.currentProcessId);
  if (Array.isArray(snap.readyQueue)) {
    for (const pid of snap.readyQueue) {
      if (ids.length >= max) {
        break;
      }

      push(pid);
    }
  }

  for (const segment of visibleSegments.value) {
    if (ids.length >= max) {
      break;
    }

    if (
      segment.processId &&
      !seen.has(segment.processId) &&
      segment.end > (snap?.time ?? 0)
    ) {
      push(segment.processId);
    }
  }

  return ids;
}

function writeStackFromIds(ids: string[], max = 8) {
  const snap = currentSnapshot.value;
  stableStackIds.value = ids
    .filter((pid) => !isProcessDone(pid, snap))
    .slice(0, max);
  stackItems.value = stableStackIds.value.map((pid) => {
    const meta = findProcessMeta(pid);
    const nextSeg =
      visibleSegments.value.find(
        (segment) =>
          segment.processId === pid &&
          segment.end > (currentSnapshot.value?.time ?? 0),
      ) ?? visibleSegments.value.find((segment) => segment.processId === pid);
    const subtitle = nextSeg ? `t ${nextSeg.start}–${nextSeg.end}` : "t done";
    return { id: pid, title: meta.name, subtitle, color: meta.color };
  });
}

function resetPlayback(): void {
  currentStepIndex.value = 0;
  playback.seek(0);
  playback.reset();
  playback.pause();
}

watch(
  simulationScenario,
  () => {
    stableStackIds.value = [];
    stackItems.value = [];
    lastTop.value = null;
    resetPlayback();
  },
  { immediate: true },
);

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

watch(
  () => currentSnapshot.value,
  (snap, prev) => {
    if (!snap) {
      return;
    }

    const newTop = snap.currentProcessId ?? null;
    if (newTop === lastTop.value) {
      return;
    }

    lastTop.value = newTop;

    if (!stableStackIds.value.length) {
      writeStackFromIds(buildInitialOrder(snap));
      return;
    }

    const idx = stableStackIds.value.indexOf(newTop ?? "");
    if (idx > -1) {
      stableStackIds.value.splice(idx, 1);
    }
    if (newTop) {
      stableStackIds.value.unshift(newTop);
    }

    const prevTop = prev?.currentProcessId ?? null;
    if (prevTop && prevTop !== newTop) {
      if (!isProcessDone(prevTop, snap)) {
        const pidx = stableStackIds.value.indexOf(prevTop);
        if (pidx > -1) {
          stableStackIds.value.splice(pidx, 1);
        }
        stableStackIds.value.push(prevTop);
      } else {
        const pidx = stableStackIds.value.indexOf(prevTop);
        if (pidx > -1) {
          stableStackIds.value.splice(pidx, 1);
        }
      }
    }

    const max = 8;
    const fillIds: string[] = [];
    for (const segment of visibleSegments.value) {
      if (stableStackIds.value.length + fillIds.length >= max) {
        break;
      }

      if (
        segment.processId &&
        stableStackIds.value.indexOf(segment.processId) === -1 &&
        !fillIds.includes(segment.processId)
      ) {
        fillIds.push(segment.processId);
      }
    }

    writeStackFromIds(stableStackIds.value.concat(fillIds).slice(0, max));
  },
  { immediate: true },
);

watch(
  () => playback.index.value,
  (value) => {
    currentStepIndex.value = value;
  },
);

watch(currentStepIndex, (value) => {
  if (playback.index.value !== value) {
    playback.seek(value);
  }
});

watch(
  () => playback.playing.value,
  (value) => {
    isPlaying.value = value;
  },
);

watch(
  () => loopIteration.value,
  (iteration, previousIteration) => {
    if (iteration <= previousIteration) {
      return;
    }

    loopLogStart.value = currentSnapshot.value?.time ?? 0;
    stableStackIds.value = [];
    stackItems.value = [];
    lastTop.value = null;
  },
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
    value: activeScenario.value?.title ?? "Kein Szenario",
    help:
      activeScenario.value?.description ?? "Noch kein aktives Szenario geladen",
  },
  {
    label: "Algorithmus",
    value: activeRun.value
      ? algorithmName(activeRun.value.algorithm)
      : "Kein Algo",
    help: activeRun.value ? "Aktiver Run" : "Bitte erst Algorithmus anwenden",
  },
  {
    label: "Zeit",
    value: String(currentSnapshot.value?.time ?? 0),
    help: "Aktuelle Simulationszeit",
  },
  {
    label: "Laufstatus",
    value: isPlaying.value ? "Running" : activeRun.value ? "Paused" : "Bereit",
    help: "Steuerung per Toolbar",
  },
]);

function handleStatusCardClick(label: string): void {
  if (label === "Szenario") {
    if (activeScenario.value) {
      openScenarioEditModal();
    } else {
      openGeneratorModal();
    }
    return;
  }

  if (label === "Algorithmus") {
    openAlgorithmModal(activeRun.value ? "edit" : "create");
  }
}

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

const recentEvents = computed<ScheduleEvent[]>(() => {
  const currentTime = currentSnapshot.value?.time ?? 0;
  const startTime = loopLogStart.value;
  return (
    runState.value?.events
      .filter((event) => event.time >= startTime && event.time <= currentTime)
      .slice(-6)
      .reverse() ?? []
  );
});
const ganttViewBox = computed(
  () =>
    `0 0 ${Math.max((runState.value?.totalTime ?? 12) * cellWidth + 100, 860)} ${chartHeight}`,
);

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  title: "",
  subtitle: "",
});

const cellWidth = 44;
const segmentHeight = 34;
const chartHeight = 260;

const headerTitle = computed(() => {
  if (currentRoute.value === "about") {
    return "Ueber mich";
  }

  if (currentRoute.value === "knowledge") {
    return "Wissen";
  }

  return "MVP Dashboard";
});

const routeTitle = computed(() =>
  currentRoute.value === "about" ? "Ueber mich" : "Wissen",
);
const isHome = computed(() => currentRoute.value === "home");
const focusSubtitle = computed(() => {
  if (!activeScenario.value) {
    return "Kein Szenario aktiv";
  }

  if (!activeRun.value) {
    return "Algorithmus fehlt";
  }

  return algorithmName(activeRun.value.algorithm);
});

function normalizeRoute(pathname: string): RouteName {
  if (pathname.startsWith("/about")) {
    return "about";
  }

  if (pathname.startsWith("/wissen")) {
    return "knowledge";
  }

  return "home";
}

function navigate(path: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.history.pushState({}, "", path);
  currentRoute.value = normalizeRoute(path);
}

function syncRoute(): void {
  if (typeof window === "undefined") {
    return;
  }

  currentRoute.value = normalizeRoute(window.location.pathname);
}

function openWelcomeIfNeeded(): void {
  if (typeof window === "undefined") {
    return;
  }

  const seen = window.sessionStorage.getItem(
    "scheduling-visualizer.welcome-seen",
  );
  showWelcomeModal.value = !seen;
}

function closeWelcomeModal(): void {
  showWelcomeModal.value = false;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("scheduling-visualizer.welcome-seen", "1");
  }
}

function openGeneratorModal(): void {
  generatorMode.value = "create";
  cloneDraft(createBlankScenarioDraft());
  showGeneratorModal.value = true;
  navigate("/");
}

function closeGeneratorModal(): void {
  showGeneratorModal.value = false;
}

function openAlgorithmModal(mode: "create" | "edit"): void {
  if (!activeScenario.value) {
    return;
  }

  algorithmModalMode.value = mode;
  algorithmModalSeed.value = activeRun.value
    ? {
        algorithm: activeRun.value.algorithm,
        algorithmParams: {
          timeQuantum: activeRun.value.algorithmParams.timeQuantum ?? 2,
          snapshotInterval:
            activeRun.value.algorithmParams.snapshotInterval ?? 1,
          queueLevels: activeRun.value.algorithmParams.queueLevels ?? 3,
        },
      }
    : {
        algorithm: "roundRobin",
        algorithmParams: {
          timeQuantum: 2,
          snapshotInterval: 1,
          queueLevels: 3,
        },
      };
  showAlgorithmModal.value = true;
}

function confirmAlgorithm(payload: {
  algorithm: AlgorithmType;
  algorithmParams: {
    timeQuantum: number;
    snapshotInterval: number;
    queueLevels: number;
  };
}): void {
  if (!activeScenario.value) {
    return;
  }

  if (algorithmModalMode.value === "edit" && activeRun.value) {
    updateActiveRun(payload);
  } else {
    createRun(payload);
  }
  algorithmModalMode.value = "create";
  algorithmModalSeed.value = null;
  showAlgorithmModal.value = false;
  resetPlayback();
}

function selectRun(index: number): void {
  if (!activeScenario.value) {
    return;
  }

  const nextIndex = Math.max(
    0,
    Math.min(index, activeScenario.value.runs.length - 1),
  );
  if (activeScenario.value.activeRunIndex === nextIndex) {
    return;
  }

  setActiveRun(nextIndex);
  resetPlayback();
}

function selectScenarioAndReset(id: string): void {
  selectScenario(id);
  navigate("/");
  resetPlayback();
}

function duplicateScenarioAndReset(id: string): void {
  duplicateScenario(id);
  navigate("/");
  resetPlayback();
}

function renameScenarioFromMenu(id: string): void {
  const nextTitle = window.prompt(
    "Neuer Szenario-Name",
    activeScenario.value?.title ?? "",
  );
  if (!nextTitle) {
    return;
  }

  renameScenario(id, nextTitle);
}

function deleteScenarioFromMenu(id: string): void {
  const confirmed = window.confirm("Szenario wirklich loeschen?");
  if (!confirmed) {
    return;
  }

  deleteScenario(id);
  navigate("/");
  resetPlayback();
}

function seekToTime(time: number): void {
  const idx = snapshotsRef.value.findIndex(
    (snapshot: SimulationSnapshot) => snapshot.time >= time,
  );
  playback.seek(idx >= 0 ? idx : snapshotsRef.value.length - 1);
}

function onSegmentEnter(segment: TimelineSegment, event: PointerEvent): void {
  tooltip.visible = true;
  tooltip.x = event.clientX;
  tooltip.y = event.clientY;
  tooltip.title = segment.processName;
  tooltip.subtitle = `Start ${segment.start} — End ${segment.end}`;
}

function onSegmentLeave(): void {
  tooltip.visible = false;
}

function onSegmentClick(segment: TimelineSegment): void {
  const idx = snapshotsRef.value.findIndex(
    (snapshot: SimulationSnapshot) => snapshot.time >= segment.start,
  );
  if (idx >= 0) {
    playback.seek(idx);
  }
}

function togglePlay(): void {
  if (!canPlay.value) {
    return;
  }

  playback.toggle();
}

function stepForward(): void {
  if (!canStepForward.value) {
    return;
  }

  playback.stepForward();
}

function stepBackward(): void {
  playback.stepBack();
}

function pausePlayback(): void {
  playback.pause();
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

function loadPreset(key: keyof typeof scenarioPresets): void {
  cloneDraft(scenarioPresets[key]);
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
  const scenarioPayload = {
    title: draft.title || "Benutzer-Szenario",
    description:
      draft.description || "Vom Szenario-Generator erstelltes Beispiel.",
    seed: draft.seed,
    tickSize: draft.tickSize,
    processes: draft.processes.map((process) => ({ ...process })),
  };

  const scenario =
    generatorMode.value === "edit" && activeScenario.value
      ? (() => {
          updateScenario({
            id: activeScenario.value.id,
            ...scenarioPayload,
          });
          return activeScenario.value;
        })()
      : createScenario(scenarioPayload);

  showGeneratorModal.value = false;
  navigate("/");
  resetPlayback();
  activeScenarioId.value = scenario.id;
  generatorMode.value = "create";
}

onMounted(() => {
  openWelcomeIfNeeded();
  syncRoute();
  animateDashboardStep();
  window.addEventListener("popstate", syncRoute);
});

onBeforeUnmount(() => {
  pausePlayback();
  if (typeof window !== "undefined") {
    window.removeEventListener("popstate", syncRoute);
  }
});
</script>

<style scoped>
.app-shell {
  position: relative;
  isolation: isolate;
}

.topbar {
  position: relative;
  z-index: 100;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 101;
}

.empty-state {
  border: 1px dashed rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
}

.empty-state.compact {
  margin-top: 0.75rem;
}

.scenario-banner {
  margin-bottom: 0.85rem;
  padding: 0.9rem 1rem;
  border-radius: 18px;
  border: 1px solid rgba(96, 165, 250, 0.22);
  background: rgba(96, 165, 250, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.scenario-banner p {
  margin: 0.25rem 0 0;
  color: #cbd5e1;
}

.stack-area {
  min-height: 120px;
}

.note-text {
  margin: 0.75rem 0 0;
  color: #94a3b8;
}

.route-panel {
  margin-top: 1rem;
  padding: 1rem;
}

.route-copy {
  max-width: 68ch;
  color: #cbd5e1;
}

.loop-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.9rem;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(148, 163, 184, 0.08);
  color: #e2e8f0;
}

.loop-toggle input {
  width: auto;
  padding: 0;
}

@media (max-width: 900px) {
  .topbar-left {
    width: 100%;
    justify-content: space-between;
  }

  .scenario-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
