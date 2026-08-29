<template>
  <div class="app-shell">
    <WelcomeModal
      :modelValue="showWelcomeModal"
      @close="closeWelcomeModal"
      @start-demo="startWelcomeDemo"
      @start-tour="startTourFromWelcome"
      @create-scenario="createWelcomeScenario"
      @open-help="openHelpFromWelcome"
    />

    <AlgorithmPickerModal
      :modelValue="showAlgorithmModal"
      :scenarioTitle="activeScenario?.title"
      :modalTitle="
        algorithmModalMode === 'edit'
          ? 'Algorithmus bearbeiten'
          : 'Algorithmus anwenden'
      "
      :runLabel="
        algorithmModalMode === 'edit' && activeRunIndex >= 0
          ? String(activeRunIndex + 1)
          : undefined
      "
      :initialAlgorithm="algorithmModalSeed?.algorithm"
      :initialAlgorithmParams="algorithmModalSeed?.algorithmParams"
      :confirmLabel="
        algorithmModalMode === 'edit' ? 'Run anpassen' : 'Algorithmus anwenden'
      "
      :showDeleteButton="algorithmModalMode === 'edit' && Boolean(activeRun)"
      @close="showAlgorithmModal = false"
      @confirm="confirmAlgorithm"
      @delete-run="deleteCurrentRun"
    />

    <section
      v-if="showGeneratorModal"
      class="modal-overlay"
      @click.self="closeGeneratorModal"
      @keydown.esc.prevent="closeGeneratorModal"
    >
      <div
        class="modal panel"
        ref="generatorModalRef"
        data-tour="generator-modal"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-label="Szenario anlegen"
      >
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

            <div class="preset-groups">
              <div class="preset-group">
                <h4>Basis-Szenarien</h4>
                <div class="button-row">
                  <button
                    class="secondary-button"
                    type="button"
                    @click="loadPreset('classroom')"
                  >
                    Klassisch
                  </button>
                  <button
                    class="secondary-button"
                    type="button"
                    data-tour="preset-staggered"
                    @click="loadPreset('staggered')"
                  >
                    Versetzt
                  </button>
                  <button
                    class="secondary-button"
                    type="button"
                    @click="loadPreset('longTimeline')"
                  >
                    Lang
                  </button>
                  <button
                    class="secondary-button"
                    type="button"
                    @click="loadPreset('manyProcesses')"
                  >
                    Viele Tasks
                  </button>
                </div>
              </div>

              <div class="preset-group">
                <h4>Algorithmus-Vergleiche</h4>
                <div class="button-row">
                  <button
                    class="secondary-button"
                    type="button"
                    @click="loadPreset('burstChaos')"
                  >
                    Chaos
                  </button>
                  <button
                    class="secondary-button"
                    type="button"
                    @click="loadPreset('sjfVsSrtf')"
                  >
                    SRTF
                  </button>
                  <button
                    class="secondary-button"
                    type="button"
                    @click="loadPreset('rrQuantumLab')"
                  >
                    RR-Quantum
                  </button>
                  <button
                    class="secondary-button"
                    type="button"
                    @click="loadPreset('priorityStarvation')"
                  >
                    Strict Priority
                  </button>
                  <button
                    class="secondary-button"
                    type="button"
                    @click="loadPreset('mlfqStaircase')"
                  >
                    MLFQ-Treppe
                  </button>
                </div>
              </div>
            </div>

            <div class="process-editor">
              <div class="section-header compact">
                <h3>Tasks</h3>
                <button
                  class="secondary-button"
                  type="button"
                  @click="addProcess"
                >
                  + Task
                </button>
              </div>

              <div class="process-table">
                <div class="process-row process-head">
                  <span>ID</span>
                  <span>Name</span>
                  <span>Ankunft</span>
                  <span>Rechenzeit</span>
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
              <button
                class="primary-button"
                type="submit"
                data-tour="complete-generator"
              >
                {{ generatorSubmitLabel }}
              </button>
            </div>
          </form>

          <aside class="modal-preview panel soft-panel">
            <ScenarioMiniature
              :processes="draft.processes"
              :tickSize="draft.tickSize"
              :title="draft.title || 'Szenario-Vorschau'"
              subtitle="Miniatur aus den aktuellen Taskdaten"
              :compact="true"
            />
          </aside>
        </div>
      </div>
    </section>

    <main
      v-if="isHome"
      ref="dashboardGridRef"
      class="dashboard-grid"
      :class="{ 'dashboard-grid--multi': activeView === 'multi' }"
    >
      <section class="panel status-strip">
        <div class="status-strip-menu">
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
            @tour="startTour"
            @export-scenario="handleExportScenario"
            @import-scenario="handleImportScenario"
          />
        </div>
        <article
          class="status-card"
          :class="{
            'status-card--clickable':
              card.label === 'Szenario' || card.label === 'Algorithmus',
          }"
          v-for="card in statusCards"
          :key="card.label"
          :title="statusCardTitle(card.label)"
          :data-tour="
            card.label === 'Algorithmus' ? 'algorithm-card' : undefined
          "
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
          <span class="status-label">
            {{ card.label }}
            <span
              v-if="card.showEditIcon"
              class="status-label-edit"
              aria-hidden="true"
            >
              ✎
            </span>
          </span>
          <strong>{{ card.value }}</strong>
          <small>{{ card.help }}</small>
        </article>

        <article
          class="status-card status-card--switcher"
          aria-label="Ansicht wechseln"
        >
          <span class="status-label">Ansicht</span>
          <div class="view-toggle view-toggle--compact">
            <button
              type="button"
              class="secondary-button"
              :class="{ 'primary-button': activeView === 'focus' }"
              :title="viewToggleTitle('focus')"
              @click="setActiveView('focus')"
            >
              Fokusansicht
            </button>
            <button
              type="button"
              class="secondary-button"
              data-tour="open-multi-view"
              :class="{ 'primary-button': activeView === 'multi' }"
              :title="viewToggleTitle('multi')"
              @click="setActiveView('multi')"
            >
              Vergleichsübersicht
            </button>
          </div>

          <small>Wechselt zwischen Detail- und Vergleichsansicht</small>
        </article>
      </section>

      <section
        ref="focusColumnRef"
        class="focus-column panel"
        data-tour="focus-view"
        :class="{ 'focus-column--multi': activeView === 'multi' }"
      >
        <div class="section-header">
          <div class="section-header-main">
            <div class="view-header-row">
              <h2>
                {{
                  activeView === "focus"
                    ? "Fokusansicht"
                    : "Vergleichsübersicht"
                }}
              </h2>
            </div>
            <div class="run-navigation-row">
              <div
                v-if="activeScenario && activeScenario.runs.length > 1"
                class="run-navigation"
              >
                <template
                  v-for="(run, index) in activeScenario.runs"
                  :key="run.id"
                >
                  <span v-if="index > 0" class="run-separator">|</span>
                  <button
                    type="button"
                    class="run-step"
                    :class="{ active: index === activeRunIndex }"
                    :title="runNavigationTitle(index)"
                    @click="selectRun(index)"
                  >
                    {{ index + 1 }}
                  </button>
                </template>
              </div>
              <button
                v-if="activeScenario && activeRun"
                class="primary-button"
                data-tour="add-run"
                type="button"
                :title="'Einen weiteren Algorithmus für dieses Szenario hinzufügen'"
                @click="openAlgorithmModal('create')"
              >
                + weiteren Algorithmus
              </button>
            </div>
          </div>
          <div class="section-header-info">
            <span>{{ focusSubtitle }}</span>
          </div>
        </div>

        <div v-if="!activeScenario" class="empty-state empty-state--actions">
          <strong>Bitte Szenario erstellen</strong>
          <p>
            Öffne das Burgermenü oben links und lege zuerst ein Szenario an oder
            drücke hier:
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
          <div
            v-if="showRawPreview && !activeRun"
            class="scenario-banner scenario-banner--raw"
          >
            <div>
              <strong>Szenario geladen</strong>
              <p class="scenario-line">
                <span>{{ activeScenario.title }}</span>
              </p>
            </div>
            <button
              class="primary-button"
              data-tour="open-algorithm"
              type="button"
              @click="openAlgorithmModal('create')"
            >
              + Algorithmus anwenden
            </button>
          </div>

          <div v-if="activeScenario" class="gantt-wrap" ref="ganttWrapRef">
            <GanttWithGsap
              :key="focusRenderKey"
              v-if="activeView === 'focus'"
              :segments="focusSegments"
              :transitionFromSegments="rawPreviewSegments"
              :tickMarks="focusTickMarks"
              :cellWidth="focusCellWidth"
              :chartHeight="chartHeight"
              :segmentHeight="segmentHeight"
              :viewBox="focusViewBox"
              :activeId="focusActiveId"
              :currentTime="focusCurrentTime"
              :stretchWidth="true"
              v-model:loop="loopPlayback"
              :tickSize="activeScenario.tickSize"
              :controlsEnabled="focusControlsEnabled"
              :introAnimation="hasSimulationStarted"
              :layoutVariant="layoutVariant"
              :layoutPhase="layoutPhase"
              :algorithm="
                activeRun?.algorithm ??
                activeScenario.appliedAlgorithm?.algorithm ??
                'roundRobin'
              "
              :queueLevels="
                activeRun?.algorithmParams.queueLevels ??
                activeScenario.appliedAlgorithm?.algorithmParams.queueLevels ??
                3
              "
              :preemptedProcessId="
                hasSimulationStarted
                  ? (currentPreemptEvent?.processId ?? null)
                  : null
              "
              :preemptTime="
                hasSimulationStarted
                  ? (currentPreemptEvent?.time ?? null)
                  : null
              "
              @seek="seekToTime"
              @play="handlePlaybackPlay"
              @pause="handlePlaybackPause"
              @reset="handlePlaybackReset"
              @step="(delta) => (delta < 0 ? stepBackward() : stepForward())"
              @segmentEnter="onSegmentEnter"
              @segmentLeave="onSegmentLeave"
              @segmentClick="onSegmentClick"
            />

            <MultiView v-else :scenario="activeScenario" />

            <div
              v-if="activeRun && runState && !runState.supported"
              class="empty-state compact gantt-note"
            >
              <strong>{{
                runState.note ?? "Algorithmus noch nicht unterstützt"
              }}</strong>
              <p>
                Die Rohansicht bleibt sichtbar, aber die Visualisierung ist fuer
                diesen Algorithmus noch nicht aktiv.
              </p>
            </div>
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

        <section
          v-if="showMetricsPanel && activeView === 'focus'"
          class="panel metrics-panel"
          data-tour="metrics-panel"
        >
          <div class="section-header compact">
            <h2>Kennzahlen</h2>
          </div>

          <div class="metrics-grid">
            <article
              class="metric-panel"
              v-for="metric in metricCards"
              :key="metric.label"
              :title="metric.tooltip"
            >
              <span class="status-label">{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.help }}</small>
            </article>
          </div>
        </section>

        <section v-else class="panel">
          <ComparisonPanel :scenario="activeScenario" />
        </section>
      </section>

      <aside v-if="activeView === 'focus'" class="side-column">
        <section class="panel small-panel" data-tour="stack-simulation">
          <div class="section-header">
            <h2>Stack-Visualisierung</h2>
            <span>Visualisierung</span>
          </div>

          <div class="stack-area">
            <StackList
              v-if="stackItems.length"
              :items="stackItems"
              :activeId="currentActiveProcessId"
              :contextText="stackExplanation"
              :quantumSummaryText="stackQuantumSummaryText"
              aria-label="Process queue"
            />
            <div v-else class="empty-state compact">
              <strong>{{ stackEmptyTitle }}</strong>
              <p>{{ stackEmptyDescription }}</p>
            </div>
          </div>

          <p class="note-text">{{ simulationNote }}</p>
        </section>

        <aside class="modal-preview panel soft-panel" v-if="activeScenario">
          <ScenarioMiniature
            :processes="activeScenario.processes"
            :tickSize="activeScenario.tickSize"
            :title="'Ausgangslage'"
            subtitle="Startzustand des Szenarios"
            :compact="true"
          />
        </aside>

        <!--           <section class="panel detail-panel" data-tour="results">
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
        </section> -->
      </aside>

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
        <template v-if="currentRoute === 'about'">
          <p>
            Hier entsteht die Seite ueber mich und die Bachelorarbeit. Diese
            Route ist bereits als stabiler Einstiegspunkt vorgesehen.
          </p>
        </template>

        <template v-else>
          <KnowledgePage
            @start-demo="startWelcomeDemo"
            @create-scenario="openGeneratorModal"
            @start-tour="startTour"
          />
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
  watchEffect,
  watch,
} from "vue";
import gsap from "gsap";
import { createSeededScenarioProcesses, simulateScenario } from "@/simulation";
import {
  createBlankScenarioDraft,
  buildSimulationScenario,
  getActiveRun,
  getScenarioRenderSignature,
  useScenarioWorkspace,
  type ScenarioDraft,
} from "@/composables/useScenarioWorkspace";
import BurgerMenu from "./components/BurgerMenu.vue";
import WelcomeModal from "./components/WelcomeModal.vue";
import AlgorithmPickerModal from "./components/AlgorithmPickerModal.vue";
import ScenarioMiniature from "./components/ScenarioMiniature.vue";
import Tooltip from "@/components/Tooltip.vue";
import GanttWithGsap from "./components/GanttWithGsap.vue";
import MultiView from "./components/MultiView.vue";
import StackList from "./components/StackList.vue";
import ComparisonPanel from "./components/ComparisonPanel.vue";
import KnowledgePage from "./components/KnowledgePage.vue";
import { usePlayback } from "@/composables/usePlayback";
import { useTour } from "@/composables/useTour";
import { useFocusTrap } from "@/composables/useFocusTrap";
import { createTimelineLayout } from "./utils/timelineLayout";
import {
  sharedCellWidth,
  computeSharedCellWidth,
} from "@/composables/useTimelineSync";
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
  tooltip?: string;
  showEditIcon?: boolean;
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
  deleteActiveRun,
} = workspace;

const scenarioPresets: Record<string, ScenarioDraft> = {
  classroom: {
    title: "Klassenzimmer",
    description:
      "Ein ausgewogenes Beispiel mit drei Tasks für den Einstieg in die Visualisierung.",
    seed: 17,
    tickSize: 1,
    processes: [
      {
        id: "P1",
        name: "P1",
        arrivalTime: 0,
        burstTime: 4,
        priority: 2,
        color: "var(--data-1)",
        group: "A",
      },
      {
        id: "P2",
        name: "P2",
        arrivalTime: 1,
        burstTime: 3,
        priority: 1,
        color: "var(--data-2)",
        group: "A",
      },
      {
        id: "P3",
        name: "P3",
        arrivalTime: 2,
        burstTime: 5,
        priority: 3,
        color: "var(--data-3)",
        group: "B",
      },
    ],
  },
  staggered: {
    title: "Versetzt",
    description:
      "Tasks treffen nacheinander ein. Unter einem passenden präemptiven Algorithmus werden Ankünfte und mögliche Präemptionen sichtbar.",
    seed: 33,
    tickSize: 1,
    processes: [
      {
        id: "A",
        name: "A",
        arrivalTime: 0,
        burstTime: 6,
        priority: 2,
        color: "var(--data-4)",
        group: "A",
      },
      {
        id: "B",
        name: "B",
        arrivalTime: 2,
        burstTime: 4,
        priority: 1,
        color: "var(--data-5)",
        group: "B",
      },
      {
        id: "C",
        name: "C",
        arrivalTime: 4,
        burstTime: 3,
        priority: 4,
        color: "var(--data-6)",
        group: "B",
      },
      {
        id: "D",
        name: "D",
        arrivalTime: 5,
        burstTime: 2,
        priority: 2,
        color: "var(--data-7)",
        group: "C",
      },
    ],
  },
  longTimeline: {
    title: "Extrem lang",
    description:
      "Langer Zeitstrahl mit wenigen, aber sehr ausgedehnten Rechenzeiten für die Zoom- und Scroll-Tests.",
    seed: 101,
    tickSize: 1,
    processes: [
      {
        id: "L1",
        name: "L1",
        arrivalTime: 0,
        burstTime: 14,
        priority: 2,
        color: "var(--data-8)",
        group: "A",
      },
      {
        id: "L2",
        name: "L2",
        arrivalTime: 6,
        burstTime: 12,
        priority: 1,
        color: "var(--data-9)",
        group: "A",
      },
      {
        id: "L3",
        name: "L3",
        arrivalTime: 12,
        burstTime: 10,
        priority: 3,
        color: "var(--data-10)",
        group: "B",
      },
      {
        id: "L4",
        name: "L4",
        arrivalTime: 19,
        burstTime: 9,
        priority: 4,
        color: "var(--data-3)",
        group: "C",
      },
    ],
  },
  manyProcesses: {
    title: "Viele Tasks",
    description:
      "Ein dichtes Szenario mit 11 Tasks, um die Reihen- und Höhenlogik zu prüfen.",
    seed: 202,
    tickSize: 1,
    processes: [
      {
        id: "P1",
        name: "P1",
        arrivalTime: 0,
        burstTime: 4,
        priority: 2,
        color: "var(--data-8)",
        group: "A",
      },
      {
        id: "P2",
        name: "P2",
        arrivalTime: 1,
        burstTime: 3,
        priority: 1,
        color: "var(--data-2)",
        group: "A",
      },
      {
        id: "P3",
        name: "P3",
        arrivalTime: 1,
        burstTime: 5,
        priority: 3,
        color: "var(--data-3)",
        group: "A",
      },
      {
        id: "P4",
        name: "P4",
        arrivalTime: 2,
        burstTime: 4,
        priority: 2,
        color: "var(--data-10)",
        group: "B",
      },
      {
        id: "P5",
        name: "P5",
        arrivalTime: 3,
        burstTime: 6,
        priority: 4,
        color: "var(--data-11)",
        group: "B",
      },
      {
        id: "P6",
        name: "P6",
        arrivalTime: 4,
        burstTime: 3,
        priority: 1,
        color: "var(--data-12)",
        group: "C",
      },
      {
        id: "P7",
        name: "P7",
        arrivalTime: 5,
        burstTime: 4,
        priority: 2,
        color: "var(--data-5)",
        group: "C",
      },
      {
        id: "P8",
        name: "P8",
        arrivalTime: 6,
        burstTime: 5,
        priority: 3,
        color: "var(--data-7)",
        group: "D",
      },
      {
        id: "P9",
        name: "P9",
        arrivalTime: 7,
        burstTime: 3,
        priority: 1,
        color: "var(--data-4)",
        group: "D",
      },
      {
        id: "P10",
        name: "P10",
        arrivalTime: 8,
        burstTime: 4,
        priority: 2,
        color: "var(--data-13)",
        group: "E",
      },
      {
        id: "P11",
        name: "P11",
        arrivalTime: 9,
        burstTime: 3,
        priority: 4,
        color: "var(--data-14)",
        group: "E",
      },
    ],
  },
  burstChaos: {
    title: "Rechenzeit-Chaos",
    description:
      "Unterschiedliche kurze Rechenzeiten und dichte Ankünfte für einen Stress-Test der Visualisierung. Viele Kontextwechsel entstehen besonders bei kleinem Round-Robin-Quantum.",
    seed: 303,
    tickSize: 1,
    processes: [
      {
        id: "C1",
        name: "C1",
        arrivalTime: 0,
        burstTime: 2,
        priority: 1,
        color: "var(--data-8)",
        group: "A",
      },
      {
        id: "C2",
        name: "C2",
        arrivalTime: 0,
        burstTime: 1,
        priority: 2,
        color: "var(--data-10)",
        group: "A",
      },
      {
        id: "C3",
        name: "C3",
        arrivalTime: 1,
        burstTime: 2,
        priority: 3,
        color: "var(--data-3)",
        group: "B",
      },
      {
        id: "C4",
        name: "C4",
        arrivalTime: 2,
        burstTime: 1,
        priority: 4,
        color: "var(--data-11)",
        group: "B",
      },
      {
        id: "C5",
        name: "C5",
        arrivalTime: 2,
        burstTime: 2,
        priority: 2,
        color: "var(--data-12)",
        group: "C",
      },
      {
        id: "C6",
        name: "C6",
        arrivalTime: 3,
        burstTime: 1,
        priority: 1,
        color: "var(--data-9)",
        group: "C",
      },
    ],
  },
  sjfVsSrtf: {
    title: "SRTF-Präemption",
    description:
      "Ein langer Starttask und mehrere kurze Spätankömmlinge machen die Präemption nach kürzester Restlaufzeit sichtbar.",
    seed: 707,
    tickSize: 1,
    processes: [
      {
        id: "L",
        name: "L",
        arrivalTime: 0,
        burstTime: 10,
        priority: 3,
        color: "var(--data-8)",
        group: "A",
      },
      {
        id: "S1",
        name: "S1",
        arrivalTime: 1,
        burstTime: 1,
        priority: 2,
        color: "var(--data-10)",
        group: "B",
      },
      {
        id: "S2",
        name: "S2",
        arrivalTime: 2,
        burstTime: 2,
        priority: 2,
        color: "var(--data-3)",
        group: "B",
      },
      {
        id: "S3",
        name: "S3",
        arrivalTime: 3,
        burstTime: 1,
        priority: 1,
        color: "var(--data-11)",
        group: "C",
      },
    ],
  },
  rrQuantumLab: {
    title: "RR Quantum-Labor",
    description:
      "Für Round Robin zeigen vier ähnliche Tasks mit gleicher Ankunft den Einfluss eines kleinen gegenüber einem großen Quantum auf Reaktivität und Kontextwechsel.",
    seed: 808,
    tickSize: 1,
    processes: [
      {
        id: "R1",
        name: "R1",
        arrivalTime: 0,
        burstTime: 7,
        priority: 2,
        color: "var(--data-1)",
        group: "A",
      },
      {
        id: "R2",
        name: "R2",
        arrivalTime: 0,
        burstTime: 6,
        priority: 2,
        color: "var(--data-2)",
        group: "A",
      },
      {
        id: "R3",
        name: "R3",
        arrivalTime: 0,
        burstTime: 5,
        priority: 2,
        color: "var(--data-4)",
        group: "B",
      },
      {
        id: "R4",
        name: "R4",
        arrivalTime: 0,
        burstTime: 4,
        priority: 2,
        color: "var(--data-5)",
        group: "B",
      },
    ],
  },
  priorityStarvation: {
    title: "Strict Priority",
    description:
      "Für Strict Priority wird ein langer Task mit niedriger Priorität durch eine lückenlose Folge eintreffender High-Priority-Kurzjobs verzögert.",
    seed: 909,
    tickSize: 1,
    processes: [
      {
        id: "BG",
        name: "BG",
        arrivalTime: 0,
        burstTime: 14,
        priority: 5,
        color: "var(--data-16)",
        group: "Hintergrund",
      },
      {
        id: "H1",
        name: "H1",
        arrivalTime: 1,
        burstTime: 2,
        priority: 1,
        color: "var(--data-12)",
        group: "High",
      },
      {
        id: "H2",
        name: "H2",
        arrivalTime: 3,
        burstTime: 2,
        priority: 1,
        color: "var(--data-13)",
        group: "High",
      },
      {
        id: "H3",
        name: "H3",
        arrivalTime: 5,
        burstTime: 2,
        priority: 1,
        color: "var(--data-14)",
        group: "High",
      },
      {
        id: "H4",
        name: "H4",
        arrivalTime: 7,
        burstTime: 2,
        priority: 1,
        color: "var(--data-15)",
        group: "High",
      },
      {
        id: "H5",
        name: "H5",
        arrivalTime: 9,
        burstTime: 2,
        priority: 1,
        color: "var(--data-1)",
        group: "High",
      },
      {
        id: "H6",
        name: "H6",
        arrivalTime: 11,
        burstTime: 2,
        priority: 1,
        color: "var(--data-2)",
        group: "High",
      },
      {
        id: "H7",
        name: "H7",
        arrivalTime: 13,
        burstTime: 2,
        priority: 1,
        color: "var(--data-3)",
        group: "High",
      },
      {
        id: "H8",
        name: "H8",
        arrivalTime: 15,
        burstTime: 2,
        priority: 1,
        color: "var(--data-4)",
        group: "High",
      },
    ],
  },
  mlfqStaircase: {
    title: "MLFQ-Treppe",
    description:
      "Für MLFQ visualisieren lange CPU-bound Jobs plus kurze interaktive Jobs Queue-Demotionen und das Treppenmuster.",
    seed: 1001,
    tickSize: 1,
    processes: [
      {
        id: "CPU1",
        name: "CPU1",
        arrivalTime: 0,
        burstTime: 12,
        priority: 2,
        color: "var(--data-9)",
        group: "CPU",
      },
      {
        id: "CPU2",
        name: "CPU2",
        arrivalTime: 0,
        burstTime: 11,
        priority: 2,
        color: "var(--data-8)",
        group: "CPU",
      },
      {
        id: "I1",
        name: "I1",
        arrivalTime: 2,
        burstTime: 2,
        priority: 1,
        color: "var(--data-3)",
        group: "Interaktiv",
      },
      {
        id: "I2",
        name: "I2",
        arrivalTime: 6,
        burstTime: 1,
        priority: 1,
        color: "var(--data-11)",
        group: "Interaktiv",
      },
      {
        id: "I3",
        name: "I3",
        arrivalTime: 9,
        burstTime: 2,
        priority: 1,
        color: "var(--data-10)",
        group: "Interaktiv",
      },
    ],
  },
};

const showWelcomeModal = ref(false);
const showGeneratorModal = ref(false);
const showAlgorithmModal = ref(false);
const showMetricsPanel = ref(true);
const generatorMode = ref<"create" | "edit">("create");
const algorithmModalMode = ref<"create" | "edit">("create");
const algorithmModalSeed = ref<{
  algorithm: AlgorithmType;
  algorithmParams: {
    timeQuantum: number;
    snapshotInterval: number;
    queueLevels: number;
    sjfMode?: "preemptive";
    mlfqMode?: "classic" | "simplified";
    lcfsMode?: "preemptive";
    lcfsTieBreak?: "stack" | "id";
  };
} | null>(null);
const generatorModalRef = ref<HTMLElement | null>(null);
useFocusTrap(generatorModalRef, closeGeneratorModal);
const ganttWrapRef = ref<HTMLElement | null>(null);
const dashboardGridRef = ref<HTMLElement | null>(null);
const focusColumnRef = ref<HTMLElement | null>(null);
const focusViewportWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 0,
);
const savedFocusCellWidth = ref<number | null>(null);
const savedFocusSvgWidth = ref<number | null>(null);
const focusCellWidthOverride = ref<number | null>(null);
const focusSvgWidthOverride = ref<number | null>(null);
const currentRoute = ref<RouteName>("home");
const loopPlayback = ref(false);
let focusViewportObserver: ResizeObserver | null = null;

const activeView = ref<"focus" | "multi">("focus");

const tour = useTour({
  openGenerator: openGeneratorModal,
  loadStaggered: loadTourStaggered,
  applyRoundRobin: applyTourRoundRobin,
  openComparisonRun: openTourComparisonRun,
  startPlayback: () => {
    void handlePlaybackPlay();
  },
  openMultiView: () => setActiveView("multi"),
});

// Theme follows OS; no user control in-app.

function setActiveView(view: "focus" | "multi") {
  activeView.value = view;
}

function updateFocusViewportWidth(): void {
  const element = ganttWrapRef.value;

  if (!element) {
    focusViewportWidth.value = Math.floor(window.innerWidth);
    return;
  }

  const computedStyle = window.getComputedStyle(element);
  const horizontalPadding =
    Number.parseFloat(computedStyle.paddingLeft || "0") +
    Number.parseFloat(computedStyle.paddingRight || "0");

  focusViewportWidth.value = Math.max(
    320,
    Math.floor(element.clientWidth - horizontalPadding),
  );
}

watchEffect((onCleanup) => {
  const element = ganttWrapRef.value;

  if (!element) {
    return;
  }

  updateFocusViewportWidth();

  if (focusViewportObserver) {
    focusViewportObserver.disconnect();
    focusViewportObserver = null;
  }

  if (typeof ResizeObserver === "undefined") {
    return;
  }

  focusViewportObserver = new ResizeObserver(() => {
    updateFocusViewportWidth();
  });
  focusViewportObserver.observe(element);

  onCleanup(() => {
    focusViewportObserver?.disconnect();
    focusViewportObserver = null;
  });
});

const draft = reactive<ScenarioDraft>(createBlankScenarioDraft());

const generatorModalTitle = computed(() =>
  generatorMode.value === "edit" ? "Szenario bearbeiten" : "Szenario-Generator",
);

const generatorSubmitLabel = computed(() =>
  generatorMode.value === "edit" ? "Szenario speichern" : "Szenario anwenden",
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
  return scenario ? getActiveRun(scenario) : null;
});

const simulationScenario = computed<Scenario | null>(() => {
  const scenario = activeScenario.value;
  return scenario ? buildSimulationScenario(scenario, activeRun.value) : null;
});

const runState = computed<SimulationRun | null>(() =>
  simulationScenario.value ? simulateScenario(simulationScenario.value) : null,
);

const totalSnapshots = computed(() => runState.value?.snapshots.length ?? 0);
const isPlaying = ref(false);
const hasSimulationStarted = ref(false);
const layoutVariant = ref<"push" | "smooth">("smooth");
const layoutPhase = ref<"preview" | "activation" | "settle" | "running">(
  "preview",
);
let activationTimer: number | undefined;
let settleTimer: number | undefined;

const snapshotsRef = computed(() => runState.value?.snapshots ?? []);
const playback = usePlayback(snapshotsRef, {
  intervalMs: 1000,
  loop: loopPlayback,
});
const loopIteration = computed(() => playback.loopIteration.value);

const currentStepIndex = computed(() => playback.index.value);

const currentSnapshot = computed<SimulationSnapshot | null>(
  () => runState.value?.snapshots[currentStepIndex.value] ?? null,
);

function findActiveProcessId(time?: number | null): string | null {
  if (time === null || time === undefined) {
    return null;
  }

  const activeSegment = visibleSegments.value.find(
    (segment) =>
      Boolean(segment.processId) &&
      !segment.idle &&
      segment.start <= time &&
      time < segment.end,
  );

  return activeSegment?.processId ?? null;
}

const currentActiveProcessId = computed(() => {
  const snapshot = currentSnapshot.value;
  const fallbackId = findActiveProcessId(snapshot?.time);

  if (!snapshot) {
    return fallbackId;
  }

  if (!snapshot.currentProcessId) {
    return fallbackId;
  }

  return resolveSnapshotProcessId(snapshot, snapshot.currentProcessId);
});

const currentPreemptEvent = computed<ScheduleEvent | null>(() => {
  const currentTime = currentSnapshot.value?.time;
  if (currentTime === null || currentTime === undefined) {
    return null;
  }

  const events = runState.value?.events ?? [];
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.time < currentTime) {
      break;
    }

    if (event.type === "preempt" && event.time === currentTime) {
      return event;
    }
  }

  return null;
});

const currentStackPreemptEvent = computed<ScheduleEvent | null>(() => {
  const currentTime = currentSnapshot.value?.time;
  if (currentTime === null || currentTime === undefined) {
    return null;
  }

  const events = runState.value?.events ?? [];
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.time < currentTime) {
      break;
    }

    if (
      (event.type === "preempt" || event.type === "quantumExpired") &&
      event.time === currentTime
    ) {
      return event;
    }
  }

  return null;
});

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
const scenarioTimelineLength = computed(() => {
  const processes = activeScenario.value?.processes ?? [];

  const totalBurst = processes.reduce(
    (sum, process) => sum + Math.max(1, Math.floor(process.burstTime)),
    0,
  );

  const maxArrivalEnd = processes.reduce(
    (max, process) =>
      Math.max(
        max,
        Math.floor(process.arrivalTime) +
          Math.max(1, Math.floor(process.burstTime)),
      ),
    0,
  );

  return Math.max(8, totalBurst, maxArrivalEnd);
});
const focusTimelineLength = computed(() => {
  const simulatedMax = runState.value?.totalTime ?? 0;

  return Math.max(scenarioTimelineLength.value, Math.floor(simulatedMax));
});
const rawPreviewSegments = computed<TimelineSegment[]>(() => {
  const scenario = activeScenario.value;
  if (!scenario) {
    return [];
  }

  return scenario.processes
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

const focusSegments = computed(() =>
  layoutPhase.value === "running"
    ? visibleSegments.value
    : rawPreviewSegments.value,
);

const focusLayout = computed(() =>
  createTimelineLayout({
    timelineLength: focusTimelineLength.value,
    containerWidth: focusViewportWidth.value,
    padding: 140,
    comfortTicks: 28,
    minCellWidth: 10,
    maxCellWidth: 44,
    lockedCellWidth: 24,
    forceFit: true,
  }),
);

const focusCellWidth = computed(() => {
  return focusCellWidthOverride.value ?? focusLayout.value.cellWidth;
});

const focusTickMarks = computed(() => {
  return Array.from(
    { length: focusTimelineLength.value + 1 },
    (_, index) => index,
  );
});

type StackItem = {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
  status?: "active" | "ready" | "preempted" | "arrived" | "finished";
  level?: number | null;
  quantumRemaining?: number | null;
  quantumTotal?: number | null;
  waitingTicks?: number;
};
const stackItems = ref<StackItem[]>([]);
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
    return { name: pid ?? "?", color: "var(--data-15)" };
  }

  const seg = visibleSegments.value.find(
    (segment) => segment.processId === pid,
  );
  const proc = activeScenario.value?.processes.find(
    (process) => process.id === pid,
  );

  return {
    name: seg?.processName ?? proc?.name ?? pid,
    color: seg?.color ?? proc?.color ?? "var(--data-15)",
  };
}

function resolveSnapshotProcessId(
  snapshot: SimulationSnapshot,
  nameOrId: string,
): string {
  const exactMatch = activeScenario.value?.processes.find(
    (process) => process.id === nameOrId || process.name === nameOrId,
  );

  return exactMatch?.id ?? nameOrId;
}

function buildStackOrder(snap: SimulationSnapshot | null) {
  if (!snap) {
    return [];
  }

  const entries: Array<{ id: string; level: number | null }> = [];
  const seen = new Set<string>();

  const push = (pid?: string | null, level: number | null = null) => {
    if (!pid || seen.has(pid)) {
      return;
    }

    seen.add(pid);
    entries.push({ id: pid, level });
  };

  const snapshotActiveId = snap.currentProcessId
    ? resolveSnapshotProcessId(snap, snap.currentProcessId)
    : findActiveProcessId(snap.time);

  push(snapshotActiveId, snap.currentQueueLevel ?? null);
  if (Array.isArray(snap.readyQueue)) {
    for (const [index, nameOrId] of snap.readyQueue.entries()) {
      push(
        resolveSnapshotProcessId(snap, nameOrId),
        snap.readyQueueLevels?.[index] ?? null,
      );
    }
  }

  return entries;
}

function findReadyQueueLevelByProcessId(
  snap: SimulationSnapshot | null,
  pid: string | null,
): number | null {
  if (!snap || !pid || !Array.isArray(snap.readyQueue)) {
    return null;
  }

  const queueIndex = snap.readyQueue.findIndex(
    (nameOrId) => resolveSnapshotProcessId(snap, nameOrId) === pid,
  );

  if (queueIndex < 0) {
    return null;
  }

  return snap.readyQueueLevels?.[queueIndex] ?? null;
}

function findReadyQueueQuantumByProcessId(
  snap: SimulationSnapshot | null,
  pid: string | null,
): number | null {
  if (!snap || !pid || !Array.isArray(snap.readyQueue)) {
    return null;
  }

  const queueIndex = snap.readyQueue.findIndex(
    (nameOrId) => resolveSnapshotProcessId(snap, nameOrId) === pid,
  );

  if (queueIndex < 0) {
    return null;
  }

  return snap.readyQueueQuantums?.[queueIndex] ?? null;
}

function executedTimeUntil(pid: string, time: number): number {
  return visibleSegments.value
    .filter((segment) => segment.processId === pid)
    .reduce((sum, segment) => {
      const overlap = Math.max(
        0,
        Math.min(segment.end, time) - Math.max(segment.start, 0),
      );
      return sum + overlap;
    }, 0);
}

function waitingTicksAtSnapshot(
  pid: string,
  snap: SimulationSnapshot | null,
): number {
  if (!snap) {
    return 0;
  }

  const process = activeScenario.value?.processes.find(
    (item) => item.id === pid,
  );
  if (!process) {
    return 0;
  }

  const sinceArrival = Math.max(0, snap.time - process.arrivalTime);
  const executed = executedTimeUntil(pid, snap.time);
  return Math.max(0, sinceArrival - executed);
}

function quantumTotalForLevel(level: number | null | undefined): number | null {
  if (activeRun.value?.algorithm !== "mlfq") {
    return null;
  }

  if (level === null || level === undefined) {
    return null;
  }

  const baseQuantum = Math.max(
    1,
    Math.floor(activeRun.value.algorithmParams.timeQuantum ?? 2),
  );

  return Math.max(1, baseQuantum * (level + 1));
}

function currentArrivedProcessIds(
  snap: SimulationSnapshot | null,
): Set<string> {
  const arrived = new Set<string>();
  if (!snap) {
    return arrived;
  }

  const currentTime = snap.time;
  const events = runState.value?.events ?? [];

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.time < currentTime) {
      break;
    }

    if (
      event.type === "arrival" &&
      event.time === currentTime &&
      event.processId
    ) {
      arrived.add(event.processId);
    }
  }

  return arrived;
}

function currentFinishedProcessIds(
  snap: SimulationSnapshot | null,
): Set<string> {
  const finished = new Set<string>();
  if (!snap) {
    return finished;
  }

  const currentTime = snap.time;
  const events = runState.value?.events ?? [];

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.time < currentTime) {
      break;
    }

    if (
      event.type === "finish" &&
      event.time === currentTime &&
      event.processId
    ) {
      finished.add(event.processId);
    }
  }

  return finished;
}

function writeStackFromSnapshot(snap: SimulationSnapshot | null) {
  const activeId = currentActiveProcessId.value;
  const snapshotActiveId = snap?.currentProcessId
    ? resolveSnapshotProcessId(snap, snap.currentProcessId)
    : null;
  const preemptedId = currentStackPreemptEvent.value?.processId ?? null;
  const arrivedIds = currentArrivedProcessIds(snap);
  const finishedIds = currentFinishedProcessIds(snap);
  const entries = buildStackOrder(snap).filter(
    (entry) => !isProcessDone(entry.id, snap),
  );

  if (preemptedId) {
    const existingIndex = entries.findIndex(
      (entry) => entry.id === preemptedId,
    );

    if (existingIndex < 0) {
      const derivedLevel = findReadyQueueLevelByProcessId(snap, preemptedId);
      entries.push({
        id: preemptedId,
        level: derivedLevel,
      });
    }
  }

  for (const finishedId of finishedIds) {
    const existingIndex = entries.findIndex((entry) => entry.id === finishedId);
    if (existingIndex < 0) {
      entries.push({ id: finishedId, level: null });
    }
  }

  stackItems.value = entries.map((entry) => {
    const pid = entry.id;
    const meta = findProcessMeta(pid);
    const isFinishedNow = finishedIds.has(pid);
    const nextSeg =
      visibleSegments.value.find(
        (segment) =>
          segment.processId === pid && segment.end > (snap?.time ?? 0),
      ) ?? visibleSegments.value.find((segment) => segment.processId === pid);
    const levelLabel =
      entry.level === null || entry.level === undefined
        ? ""
        : `L${entry.level + 1} · `;
    const quantumTotal = quantumTotalForLevel(entry.level);
    const quantumRemaining =
      activeRun.value?.algorithm === "mlfq"
        ? pid === snapshotActiveId
          ? Math.max(0, snap?.remainingQuantum ?? 0)
          : findReadyQueueQuantumByProcessId(snap, pid)
        : null;
    const quantumText =
      quantumTotal !== null && quantumRemaining !== null
        ? ` · Q ${Math.max(0, quantumTotal - quantumRemaining)}/${quantumTotal}`
        : "";
    const subtitle = isFinishedNow
      ? `${levelLabel}abgeschlossen bei t ${snap?.time ?? 0}`
      : nextSeg
        ? `${levelLabel}t ${nextSeg.start}–${nextSeg.end}${quantumText}`
        : entry.level === null || entry.level === undefined
          ? "t done"
          : `${levelLabel}t done${quantumText}`;
    const status =
      pid === activeId
        ? "active"
        : pid === preemptedId
          ? "preempted"
          : arrivedIds.has(pid)
            ? "arrived"
            : isFinishedNow
              ? "finished"
              : "ready";
    const waitingTicks = waitingTicksAtSnapshot(pid, snap);
    return {
      id: pid,
      title: meta.name,
      subtitle,
      color: meta.color,
      status,
      level: entry.level,
      quantumRemaining,
      quantumTotal,
      waitingTicks,
    };
  });
}

function resetPlayback(): void {
  if (activationTimer !== undefined) {
    window.clearTimeout(activationTimer);
    activationTimer = undefined;
  }

  if (settleTimer !== undefined) {
    window.clearTimeout(settleTimer);
    settleTimer = undefined;
  }

  playback.reset();
  playback.seek(0);
  playback.pause();
  hasSimulationStarted.value = false;
  layoutPhase.value = "preview";
}

function beginLaunchSequence(onReady: () => void): void {
  if (activationTimer !== undefined) {
    window.clearTimeout(activationTimer);
    activationTimer = undefined;
  }

  if (settleTimer !== undefined) {
    window.clearTimeout(settleTimer);
    settleTimer = undefined;
  }

  layoutPhase.value = "activation";
  activationTimer = window.setTimeout(() => {
    layoutPhase.value = "settle";
    activationTimer = undefined;
    settleTimer = window.setTimeout(() => {
      layoutPhase.value = "running";
      settleTimer = undefined;
      onReady();
    }, 140);
  }, 180);
}

watch(
  simulationScenario,
  () => {
    stackItems.value = [];
    resetPlayback();
    sharedCellWidth.value = null;
    savedFocusCellWidth.value = null;
    savedFocusSvgWidth.value = null;
    focusCellWidthOverride.value = null;
    focusSvgWidthOverride.value = null;

    if (activeView.value === "focus") {
      void nextTick(() => {
        updateFocusViewportWidth();
      });
    }
  },
  { immediate: true },
);

watch(
  () => runState.value?.snapshots.length,
  (len) => {
    if (len) {
      writeStackFromSnapshot(currentSnapshot.value);
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
    writeStackFromSnapshot(snap);
  },
  { immediate: true },
);

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
    stackItems.value = [];
  },
);

watch(activeView, async (view, previousView) => {
  if (view === previousView) {
    return;
  }

  if (previousView === "focus" && view === "multi") {
    savedFocusCellWidth.value = focusCellWidth.value;
    savedFocusSvgWidth.value =
      focusSvgWidthOverride.value ?? focusLayout.value.svgWidth;
  }

  await nextTick();

  const focusColumn = focusColumnRef.value;
  if (focusColumn) {
    gsap.fromTo(
      focusColumn,
      { opacity: 0.9, y: 4, scale: view === "multi" ? 0.992 : 0.996 },
      { opacity: 1, y: 0, scale: 1, duration: 0.36, ease: "power2.out" },
    );
  }
  if (previousView === "multi" && view === "focus") {
    focusCellWidthOverride.value = savedFocusCellWidth.value;
    focusSvgWidthOverride.value = savedFocusSvgWidth.value;
  }

  // when coming back from MultiView, restart the focus playback from the beginning
  if (previousView === "multi" && view === "focus") {
    resetPlayback();
  }
});

// keep shared cell width in sync when focus is active
watch(
  [
    () => focusTimelineLength.value,
    () => focusViewportWidth.value,
    () => activeView.value,
  ],
  ([tlLen, vp, view]) => {
    if (view === "focus") {
      computeSharedCellWidth(tlLen, vp);
    }
  },
  { immediate: true },
);

const currentEventLabel = computed(() =>
  currentSnapshot.value?.lastEvent
    ? `${currentSnapshot.value.lastEvent.type} @ ${currentSnapshot.value.lastEvent.time}`
    : "Keine Ereignisse",
);

const stackExplanation = computed(() => {
  const activeId = currentActiveProcessId.value;
  const activeName =
    currentSnapshot.value?.currentProcessName ??
    (activeId ? findProcessMeta(activeId).name : null);
  const preemptEvent = currentStackPreemptEvent.value;

  if (preemptEvent?.processName) {
    if (
      preemptEvent.algorithm === "mlfq" &&
      preemptEvent.type === "quantumExpired"
    ) {
      return `${preemptEvent.processName} hat sein Quantum auf dieser Queue-Stufe verbraucht und wurde nach unten einsortiert; ${activeName ?? "ein anderer Task"} übernimmt jetzt die CPU.`;
    }

    if (preemptEvent.algorithm === "roundRobin") {
      return `${preemptEvent.processName} wurde präemptiert, weil sein Zeitquantum aufgebraucht wurde; ${activeName ?? "ein anderer Task"} übernimmt nun die CPU.`;
    }

    if (preemptEvent.algorithm === "lcfs") {
      return `${preemptEvent.processName} wurde präemptiert, weil ein neuer Task eingetroffen ist; der zuletzt Angekommene (${activeName ?? "ein anderer Task"}) läuft jetzt.`;
    }

    return `${preemptEvent.processName} wurde präemptiert; jetzt läuft ${activeName ?? "ein anderer Task"}.`;
  }

  if (activeName) {
    return `${activeName} ist jetzt aktiv. Die übrigen Tasks warten in der Queue.`;
  }

  return "Gerade ist kein Task aktiv.";
});

const stackQuantumSummaryText = computed(() => {
  if (activeRun.value?.algorithm !== "mlfq" || stackItems.value.length === 0) {
    return "";
  }

  const sums = new Map<number, number>();

  for (const item of stackItems.value) {
    const level = item.level;
    const remaining = item.quantumRemaining;

    if (
      level === null ||
      level === undefined ||
      remaining === null ||
      remaining === undefined
    ) {
      continue;
    }

    sums.set(level, (sums.get(level) ?? 0) + Math.max(0, remaining));
  }

  if (sums.size === 0) {
    return "";
  }

  const entries = Array.from(sums.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([level, total]) => `L${level + 1}: ${total}`);

  return `Restquantum je Level: ${entries.join(" · ")}`;
});

const stackEmptyTitle = computed(() =>
  isStackSimulationFinished.value ? "Visualisierung beendet" : "Keine Daten",
);

const stackEmptyDescription = computed(() =>
  isStackSimulationFinished.value
    ? "Alle Tasks wurden verarbeitet."
    : "Aktiviere zuerst ein Szenario mit Algorithmus.",
);

const isStackSimulationFinished = computed(() => {
  if (!activeScenario.value || !activeRun.value || !runState.value) {
    return false;
  }

  const snapshot = currentSnapshot.value;
  if (!snapshot) {
    return false;
  }

  const processCount = activeScenario.value.processes.length;
  const completedCount = snapshot.metrics.completedCount ?? 0;
  const hasActiveProcess = Boolean(currentActiveProcessId.value);
  const readyQueueSize = snapshot.readyQueue.length;

  return (
    completedCount >= processCount && !hasActiveProcess && readyQueueSize === 0
  );
});

const simulationNote = computed(() => runState.value?.note ?? "");

const statusCards = computed<MetricCard[]>(() => [
  {
    label: "Szenario",
    value: activeScenario.value?.title ?? "Kein Szenario",
    help:
      activeScenario.value?.description ?? "Noch kein aktives Szenario geladen",
    showEditIcon: Boolean(activeScenario.value),
  },
  {
    label: "Algorithmus",
    value: activeRun.value
      ? algorithmName(activeRun.value.algorithm)
      : "Kein Algo",
    help: activeRun.value
      ? formatAlgorithmParams(
          activeRun.value.algorithm,
          activeRun.value.algorithmParams,
        )
      : "Bitte erst Algorithmus anwenden",
    showEditIcon: Boolean(activeRun.value),
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
      tooltip:
        "Durchschnittliche Zeit, die Tasks in der Bereitschaftsschlange auf ihre Ausführung warten.",
    },
    {
      label: "Durchlaufzeit",
      value: formatMetric(metrics?.averageTurnaroundTime),
      help: "Mittelwert",
      tooltip:
        "Durchschnittliche Zeit vom Eintreffen eines Tasks bis zu seiner vollständigen Fertigstellung.",
    },
    {
      label: "Reaktionszeit",
      value: formatMetric(metrics?.averageResponseTime),
      help: "Mittelwert",
      tooltip:
        "Durchschnittliche Zeit vom Eintreffen eines Tasks bis zu seiner ersten Ausführung.",
    },
    {
      label: "Max. Wartezeit",
      value: formatMetric(metrics?.maxWaitingTime),
      help: "höchster Einzelwert",
      tooltip: "Längste Wartezeit eines einzelnen Tasks im aktuellen Lauf.",
    },
    {
      label: "Anzahl Präemptionen",
      value: String(metrics?.preemptionCount ?? 0),
      help: "Präemption + Quantum abgelaufen",
      tooltip:
        "Anzahl der Unterbrechungen, bei denen ein laufender Task zugunsten eines anderen Tasks oder wegen eines abgelaufenen Zeitquantums verdrängt wurde.",
    },
    {
      label: "Kontextwechsel",
      value: String(metrics?.contextSwitches ?? 0),
      help: "Gezählt im Lauf",
      tooltip:
        "Anzahl der Wechsel zwischen Tasks, die vom Prozessor ausgeführt werden.",
    },
  ];
});

const comparisonCards = computed<ComparisonCard[]>(() => [
  {
    label: "LCFS",
    value: "bereit",
    help: "Bereits in der Visualisierung aktiv",
  },
  {
    label: "SRTF",
    value: "implementiert",
    help: "Präemptiv, wählt die kürzeste verbleibende Laufzeit",
  },
  {
    label: "Strict Priority",
    value: "implementiert",
    help: "Präemptiv mit Prioritäten und FIFO-Tie-Break",
  },
  {
    label: "MLFQ",
    value: "implementiert",
    help: "Queue-Stufen sichtbar im Queue-Panel",
  },
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
const focusViewBox = computed(() => {
  const svgWidth =
    focusSvgWidthOverride.value ??
    Math.max(focusLayout.value.svgWidth, focusViewportWidth.value || 860);
  return `0 0 ${svgWidth} ${chartHeight.value}`;
});

const focusRenderKey = computed(() =>
  getScenarioRenderSignature(activeScenario.value),
);

function waitForTwoFrames(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

watch(
  focusRenderKey,
  async (renderKey) => {
    focusCellWidthOverride.value = null;
    focusSvgWidthOverride.value = null;

    if (typeof window === "undefined") {
      return;
    }

    const storageKey = `scheduling-visualizer.focus-layout.v3.${window.innerWidth}.${renderKey}`;
    const storedLayout = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "null",
    ) as { cellWidth?: number; svgWidth?: number } | null;
    if (
      storedLayout &&
      Number.isFinite(storedLayout?.cellWidth) &&
      storedLayout.cellWidth! > 0 &&
      Number.isFinite(storedLayout?.svgWidth) &&
      storedLayout.svgWidth! > 0
    ) {
      focusCellWidthOverride.value = storedLayout.cellWidth!;
      focusSvgWidthOverride.value = storedLayout.svgWidth!;
      return;
    }

    await nextTick();
    await waitForTwoFrames();
    const width = focusLayout.value.cellWidth;
    const svgWidth = focusLayout.value.svgWidth;
    focusCellWidthOverride.value = width;
    focusSvgWidthOverride.value = svgWidth;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ cellWidth: width, svgWidth }),
    );
  },
  { immediate: true },
);

const syncActive = ref(false);
let syncTimer: number | undefined;

function showSyncIndicator(ms = 1200) {
  syncActive.value = true;
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncActive.value = false;
    syncTimer = undefined;
  }, ms);
}

// show indicator when shared cell width updates
watch(sharedCellWidth, (v) => {
  if (v && v > 0) showSyncIndicator(900);
});

const focusCurrentTime = computed(() =>
  layoutPhase.value === "running" ? (currentSnapshot.value?.time ?? 0) : 0,
);

const focusActiveId = computed(() =>
  layoutPhase.value === "activation" || layoutPhase.value === "settle"
    ? (runState.value?.snapshots[0]?.currentProcessId ?? null)
    : layoutPhase.value === "running"
      ? currentActiveProcessId.value
      : null,
);

const focusControlsEnabled = computed(() =>
  Boolean(activeScenario.value && activeRun.value && runState.value?.supported),
);

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  title: "",
  subtitle: "",
});
const segmentHeight = 34;
const chartHeight = computed(() => {
  const processCount = Math.max(activeScenario.value?.processes.length ?? 1, 1);
  const extraHeight = Math.max(0, processCount - 6) * 18;
  return 260 + extraHeight;
});

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

  const run = activeRun.value;

  if (showRawPreview.value) {
    return run
      ? "Rohansicht vor dem Visualisierungsstart"
      : "Rohansicht des geladenen Szenarios";
  }

  return run ? algorithmName(run.algorithm) : "Algorithmus fehlt";
});

const showRawPreview = computed(
  () => Boolean(activeScenario.value) && !hasSimulationStarted.value,
);

const timelineCaptionLeft = computed(() => {
  if (showRawPreview.value) {
    return `Rohansicht: ${activeScenario.value?.title ?? "Szenario"}`;
  }

  return `Aktuelle Zeit: ${currentSnapshot.value?.time ?? 0}`;
});

const timelineCaptionRight = computed(() => {
  if (showRawPreview.value) {
    return activeRun.value
      ? "Algorithmus geladen, Start über Play"
      : "Noch kein Algorithmus gestartet";
  }

  return `Queue: ${currentSnapshot.value?.readyQueue.length ?? 0}`;
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

  const key = "scheduling-visualizer.welcome-seen";
  const seen =
    window.localStorage.getItem(key) === "1" ||
    window.sessionStorage.getItem(key) === "1";
  showWelcomeModal.value = !seen;
}

function closeWelcomeModal(): void {
  showWelcomeModal.value = false;
}

function startTourFromWelcome(): void {
  closeWelcomeModal();
  void nextTick(() => startTour());
}

function startTour(): void {
  closeWelcomeModal();
  void nextTick(() => tour.start());
}

function startWelcomeDemo(): void {
  closeWelcomeModal();
  cloneDraft(scenarioPresets.classroom);
  saveScenario();
  navigate("/");
}

function createWelcomeScenario(): void {
  closeWelcomeModal();
  openGeneratorModal();
}

function loadTourStaggered(): void {
  cloneDraft(scenarioPresets.staggered);
}

function applyTourRoundRobin(): void {
  confirmAlgorithm({
    algorithm: "roundRobin",
    algorithmParams: {
      timeQuantum: 2,
      snapshotInterval: 1,
      queueLevels: 3,
    },
  });
}

function openTourComparisonRun(): void {
  if (!activeScenario.value) {
    return;
  }

  algorithmModalMode.value = "create";
  algorithmModalSeed.value = {
    algorithm: "roundRobin",
    algorithmParams: {
      timeQuantum: 2,
      snapshotInterval: 1,
      queueLevels: 3,
    },
  };
  showAlgorithmModal.value = true;
}

function openHelpFromWelcome(): void {
  closeWelcomeModal();
  navigate("/wissen");
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
          sjfMode: "preemptive",
          mlfqMode: activeRun.value.algorithmParams.mlfqMode ?? "classic",
          lcfsMode: activeRun.value.algorithmParams.lcfsMode ?? "preemptive",
          lcfsTieBreak: activeRun.value.algorithmParams.lcfsTieBreak ?? "stack",
        },
      }
    : {
        algorithm: "roundRobin",
        algorithmParams: {
          timeQuantum: 2,
          snapshotInterval: 1,
          queueLevels: 3,
          sjfMode: "preemptive",
          mlfqMode: "classic",
          lcfsMode: "preemptive",
          lcfsTieBreak: "stack",
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
    sjfMode?: "preemptive";
    mlfqMode?: "classic" | "simplified";
    lcfsMode?: "preemptive";
    lcfsTieBreak?: "stack" | "id";
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

function deleteCurrentRun(): void {
  if (!activeScenario.value || !activeRun.value) {
    return;
  }

  const confirmed = window.confirm("Run wirklich loeschen?");
  if (!confirmed) {
    return;
  }

  deleteActiveRun();
  algorithmModalMode.value = "create";
  algorithmModalSeed.value = null;
  showAlgorithmModal.value = false;
  resetPlayback();
}

async function handlePlaybackPlay(): Promise<void> {
  if (!hasSimulationStarted.value) {
    hasSimulationStarted.value = true;
    beginLaunchSequence(() => {
      playback.play();
    });
    return;
  }

  layoutPhase.value = "running";
  await nextTick();
  playback.play();
}

function handlePlaybackPause(): void {
  if (activationTimer !== undefined) {
    window.clearTimeout(activationTimer);
    activationTimer = undefined;
  }

  if (settleTimer !== undefined) {
    window.clearTimeout(settleTimer);
    settleTimer = undefined;
  }

  playback.pause();
}

function handlePlaybackReset(): void {
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

  if (!hasSimulationStarted.value) {
    hasSimulationStarted.value = true;
    beginLaunchSequence(() => {
      playback.stepForward();
    });
    return;
  }

  layoutPhase.value = "running";
  playback.stepForward();
}

function stepBackward(): void {
  if (!hasSimulationStarted.value && activeRun.value) {
    hasSimulationStarted.value = true;
  }

  layoutPhase.value = hasSimulationStarted.value ? "running" : "preview";
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

function formatAlgorithmParams(
  algorithm: AlgorithmType,
  params: {
    timeQuantum?: number;
    snapshotInterval?: number;
    queueLevels?: number;
    sjfMode?: "preemptive";
    mlfqMode?: "classic" | "simplified";
    strictPriorityTieBreak?:
      | "fifo"
      | "arrivalTime"
      | "remainingTime"
      | "waitingTime"
      | "id";
    lcfsMode?: "preemptive";
    lcfsTieBreak?: "stack" | "id";
  },
): string {
  if (algorithm === "roundRobin") {
    return `Quantum: ${params.timeQuantum ?? 2}`;
  }

  if (algorithm === "mlfq") {
    const mode = params.mlfqMode === "simplified" ? "simplified" : "classic";
    return `Stufen: ${params.queueLevels ?? 3} · Quantum: ${params.timeQuantum ?? 2} · Modus: ${mode}`;
  }

  if (algorithm === "strictPriority") {
    const tieBreakLabels = {
      fifo: "FIFO",
      arrivalTime: "Ankunftszeit",
      remainingTime: "Restzeit",
      waitingTime: "Wartezeit",
      id: "ID",
    };
    const tieBreakLabel =
      tieBreakLabels[params.strictPriorityTieBreak ?? "fifo"];
    return `Tie-Break: ${tieBreakLabel}`;
  }

  if (algorithm === "lcfs") {
    const tieBreak = params.lcfsTieBreak === "id" ? "ID" : "Stack";
    return `Präemptiv · Tie-Break: ${tieBreak}`;
  }

  if (algorithm === "sjf") {
    return "SRTF (präemptiv) · kürzeste Restlaufzeit zuerst";
  }

  return "Keine zusaetzlichen Parameter";
}

function statusCardTitle(label: string): string {
  switch (label) {
    case "Szenario":
      return "Szenario auswählen, erstellen oder bearbeiten";
    case "Algorithmus":
      return "Aktiven Algorithmus anwenden oder anpassen";
    default:
      return "";
  }
}

function viewToggleTitle(view: "focus" | "multi"): string {
  return view === "focus"
    ? "Fokusansicht: einen einzelnen Run mit Steuerung und Details lesen"
    : "Vergleichsübersicht: mehrere Runs parallel vergleichen";
}

function runNavigationTitle(index: number): string {
  return `Run ${index + 1} aktivieren und Verlauf anzeigen`;
}

function algorithmName(algorithm: AlgorithmType): string {
  switch (algorithm) {
    case "roundRobin":
      return "Round Robin";
    case "sjf":
      return "SRTF (Shortest Remaining Time First)";
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

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function handleGlobalShortcuts(event: KeyboardEvent): void {
  if (
    showWelcomeModal.value ||
    showGeneratorModal.value ||
    showAlgorithmModal.value ||
    isTextInputTarget(event.target)
  ) {
    return;
  }

  const key = event.key;
  const normalizedKey = key.toLowerCase();
  const isSpace = key === " " || key === "Spacebar" || event.code === "Space";

  if (isSpace) {
    event.preventDefault();
    if (playback.playing.value) {
      handlePlaybackPause();
    } else {
      void handlePlaybackPlay();
    }
    return;
  }

  if (key === "ArrowRight") {
    event.preventDefault();
    playback.stepForward();
    return;
  }

  if (key === "ArrowLeft") {
    event.preventDefault();
    playback.stepBack();
    return;
  }

  if (normalizedKey === "r") {
    event.preventDefault();
    handlePlaybackReset();
  }
}

function handleExportScenario(id: string): void {
  const { exportScenarioAsJson } = workspace;
  const success = exportScenarioAsJson(id);
  if (!success) {
    alert("Export fehlgeschlagen");
  }
}

function handleImportScenario(result: {
  success: boolean;
  message: string;
}): void {
  if (!result.success) {
    alert(`Import fehlgeschlagen: ${result.message}`);
    return;
  }

  const { importScenarioFromJson } = workspace;
  const importResult = importScenarioFromJson(result.message);

  if (!importResult.success) {
    alert(importResult.message);
  } else {
    alert(importResult.message);
  }
}

onMounted(() => {
  openWelcomeIfNeeded();
  syncRoute();
  animateDashboardStep();

  window.addEventListener("popstate", syncRoute);
  window.addEventListener("keydown", handleGlobalShortcuts);
});

onBeforeUnmount(() => {
  pausePlayback();
  tour.stop();
  if (typeof window !== "undefined") {
    window.removeEventListener("popstate", syncRoute);
    window.removeEventListener("keydown", handleGlobalShortcuts);
  }
});
</script>

<style scoped>
.app-shell {
  position: relative;
  isolation: isolate;
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

.scenario-banner--raw {
  margin-bottom: 0.8rem;
}

.modal-preview {
  align-self: start;
  padding: 0.95rem;
}

.gantt-wrap--raw {
  margin-bottom: 0.75rem;
}

scenario-banner p {
  margin: 0.25rem 0 0;
  color: var(--text);
}

.stack-area {
  min-height: 120px;
}

.note-text {
  margin: 0.75rem 0 0;
  color: var(--muted);
}

.route-panel {
  margin-top: 1rem;
  padding: 1rem;
}

.route-copy {
  max-width: 68ch;
  color: var(--text);
}

.help-lead {
  max-width: 74ch;
  margin: 0 0 1rem;
  color: var(--text);
}

.help-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.9rem;
}

.help-card {
  padding: 0.95rem;
  border-radius: 18px;
  display: grid;
  gap: 0.45rem;
}

.help-card h3 {
  margin: 0;
  font-size: 1rem;
}

.help-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.help-card ul {
  margin: 0.25rem 0 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.35rem;
  color: var(--text);
}

.help-kicker {
  display: inline-flex;
  width: fit-content;
  padding: 0.16rem 0.5rem;
  border-radius: 999px;
  background: rgba(96, 165, 250, 0.12);
  color: var(--accent);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.loop-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 0.9rem;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(148, 163, 184, 0.08);
  color: var(--text);
}

.loop-toggle input {
  width: auto;
  padding: 0;
}

@media (max-width: 900px) {
  .scenario-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
