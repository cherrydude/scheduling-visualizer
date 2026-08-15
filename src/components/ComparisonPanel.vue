<template>
  <div class="comparison-panel">
    <div class="section-header compact comparison-header">
      <div>
        <h3>Vergleichsübersicht</h3>
        <p class="subtitle subtitle-meta">
          Wähle einen Anwendungsfall und gewichte die Runs nach den dafür
          relevanten Kennzahlen.
        </p>
      </div>

    </div>

    <div class="case-selector" role="tablist" aria-label="Anwendungsfälle">
      <button
        v-for="appCase in caseOptions"
        :key="appCase.id"
        type="button"
        class="case-card"
        :class="{ 'case-card--active': appCase.id === selectedCaseId }"
        :aria-pressed="appCase.id === selectedCaseId"
        @click="selectedCaseId = appCase.id"
      >
        <strong>{{ appCase.label }}</strong>
        <small>{{ appCase.subtitle }}</small>
        <span v-if="appCase.id !== 'custom'">{{ appCase.description }}</span>
        <span v-else class="custom-case-copy">
          Passe die bekannten Kennzahlen an deinen eigenen Kontext an.
          <button
            class="inline-link-button custom-case-link"
            type="button"
            @click.stop="openCustomModal"
          >
            Hier anpassen ✎
          </button>
        </span>
      </button>
    </div>

    <RankingEditModal
      :modelValue="showCustomModal"
      :initialWeights="comparison.state.weights"
      @close="closeCustomModal"
      @confirm="applyCustomWeights"
    />

    <div class="comparison-table">
      <div
        class="visually-hidden"
        role="status"
        aria-live="polite"
      >
        {{ bestRowId ? `Bester Lauf: Run ${bestRowId}.` : '' }}
        {{ worstRowId ? `Schwächster Lauf: Run ${worstRowId}.` : '' }}
      </div>
      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>Run-ID</th>
              <th>Algorithmus</th>
              <th>Status</th>
              <th v-for="col in visibleColumns" :key="col.key">{{ col.label }}</th>
              <th>Score</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(row, idx) in rows"
              :key="row.id"
              :class="{
                'row-best': row.id === bestRowId,
                'row-worst': row.id === worstRowId,
              }"
            >
              <td>Run {{ row.id }}</td>
              <td>
                <strong>{{ row.label }}</strong>
              </td>
              <td>
                <span
                  class="status-pill"
                  :class="statusClass(row.id)"
                  :aria-label="statusLabel(row.id) || 'Neutraler Status'"
                >
                  {{ statusLabel(row.id) }}
                </span>
              </td>
              <td v-for="col in visibleColumns" :key="col.key">
                {{ formatColumnValue(row, col.key) }}
              </td>
              <td>{{ formatScore(row.score) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useScenarioWorkspace, type ScenarioRecord } from "@/composables/useScenarioWorkspace";
import { useComparison } from "@/composables/useComparison";
import type { ComparisonMetricKey, ComparisonRow } from "@/utils/compare";
import RankingEditModal from "./RankingEditModal.vue";

type ComparisonCaseId = "interactive" | "batch" | "webServer" | "softRealtime" | "custom";

type ComparisonCase = {
  id: ComparisonCaseId;
  label: string;
  subtitle: string;
  description: string;
  weights: Record<string, number>;
  columns: ComparisonMetricKey[];
};

type ColumnDefinition = {
  key: ComparisonMetricKey;
  label: string;
};

const props = defineProps<{
  scenario?: ScenarioRecord | null;
}>();

const workspace = useScenarioWorkspace();
const comparison = useComparison();

const STORAGE_KEY = "scheduling-visualizer.comparison.case.v1";

const allColumns: ColumnDefinition[] = [
  { key: "averageResponseTime", label: "Antwortzeit" },
  { key: "averageWaitingTime", label: "Wartezeit" },
  { key: "averageTurnaroundTime", label: "Durchlaufzeit" },
  { key: "throughput", label: "Durchsatz" },
  { key: "fairnessIndex", label: "Fairness" },
  { key: "contextSwitches", label: "Kontextwechsel" },
  { key: "preemptionCount", label: "Präemptions" },
  { key: "maxWaitingTime", label: "Max. Wartezeit" },
  { key: "starvedProcessCount", label: "Starvation" },
];

const defaultCustomWeights = {
  averageResponseTime: 0,
  averageTurnaroundTime: 0.4,
  averageWaitingTime: 0.3,
  throughput: 0.2,
  fairnessIndex: 0.1,
  contextSwitches: 0,
  preemptionCount: 0,
  maxWaitingTime: 0,
  starvedProcessCount: 0,
};

const caseOptions: ComparisonCase[] = [
  {
    id: "interactive",
    label: "Interaktiv / UI",
    subtitle: "Desktop, Web, Mobile",
    description:
      "Antwortzeit und Fairness sind wichtiger als maximaler Durchsatz.",
    weights: {
      averageResponseTime: 0.4,
      averageWaitingTime: 0.2,
      fairnessIndex: 0.15,
      contextSwitches: 0.1,
      preemptionCount: 0.05,
      maxWaitingTime: 0.05,
      starvedProcessCount: 0.05,
    },
    columns: [
      "averageResponseTime",
      "averageWaitingTime",
      "maxWaitingTime",
      "fairnessIndex",
      "starvedProcessCount",
    ],
  },
  {
    id: "batch",
    label: "Batch / HPC",
    subtitle: "Rendering, Analyse, Berechnung",
    description:
      "Durchsatz und Durchlaufzeit zählen, Kontextwechsel sind teuer.",
    weights: {
      throughput: 0.3,
      averageTurnaroundTime: 0.3,
      contextSwitches: 0.15,
      preemptionCount: 0.1,
      averageWaitingTime: 0.05,
      starvedProcessCount: 0.1,
      maxWaitingTime: 0,
    },
    columns: [
      "throughput",
      "averageTurnaroundTime",
      "starvedProcessCount",
      "contextSwitches",
      "preemptionCount",
    ],
  },
  {
    id: "webServer",
    label: "Web Server",
    subtitle: "API, Gateway, Backend",
    description:
      "Kurze Wartezeiten und stabile Reaktionszeit sind entscheidend.",
    weights: {
      averageWaitingTime: 0.25,
      averageResponseTime: 0.25,
      maxWaitingTime: 0.15,
      throughput: 0.1,
      fairnessIndex: 0.1,
      starvedProcessCount: 0.1,
      contextSwitches: 0.05,
    },
    columns: [
      "averageWaitingTime",
      "maxWaitingTime",
      "averageResponseTime",
      "starvedProcessCount",
      "throughput",
    ],
  },
  {
    id: "softRealtime",
    label: "Soft Real-Time",
    subtitle: "Audio, Video, Gaming",
    description:
      "Reaktionszeit und Präemptionsverhalten sind hier die kritischen Punkte.",
    weights: {
      averageResponseTime: 0.35,
      maxWaitingTime: 0.15,
      preemptionCount: 0.15,
      averageWaitingTime: 0.15,
      starvedProcessCount: 0.1,
      contextSwitches: 0.05,
      fairnessIndex: 0.05,
    },
    columns: [
      "averageResponseTime",
      "maxWaitingTime",
      "preemptionCount",
      "averageWaitingTime",
      "starvedProcessCount",
    ],
  },
  {
    id: "custom",
    label: "Eigener Anwendungsfall",
    subtitle: "Freie Gewichtung",
    description: "Passe die bekannten Kennzahlen an deinen eigenen Kontext an.",
    weights: comparison.state.weights,
    columns: [
      "averageResponseTime",
      "averageWaitingTime",
      "averageTurnaroundTime",
      "throughput",
      "fairnessIndex",
      "contextSwitches",
      "preemptionCount",
      "maxWaitingTime",
      "starvedProcessCount",
    ],
  },
];

const activeScenario = computed(() => props.scenario ?? workspace.activeScenario.value);

const selectedCaseId = ref<ComparisonCaseId>(loadSelectedCaseId());
const showCustomModal = ref(false);

watch(
  selectedCaseId,
  (value) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, value);
      }
    } catch {
      // ignore storage errors
    }
  },
  { immediate: true },
);

const activeCase = computed(() => {
  return caseOptions.find((entry) => entry.id === selectedCaseId.value) ?? caseOptions[0];
});

const resolvedWeights = computed(() =>
  activeCase.value.id === "custom" ? comparison.state.weights : activeCase.value.weights,
);

const rows = computed(() => {
  const scenario = activeScenario.value;
  if (!scenario?.runs.length) {
    return [] as ComparisonRow[];
  }

  return comparison.buildForScenario(scenario, resolvedWeights.value);
});

const selectedCustomColumns = ref<ComparisonMetricKey[]>([
  "averageResponseTime",
  "averageWaitingTime",
  "averageTurnaroundTime",
  "throughput",
  "fairnessIndex",
  "contextSwitches",
  "preemptionCount",
  "maxWaitingTime",
  "starvedProcessCount",
]);

const visibleColumns = computed(() => {
  if (activeCase.value.id === "custom") {
    return allColumns.filter((column) => selectedCustomColumns.value.includes(column.key));
  }

  return allColumns.filter((column) => activeCase.value.columns.includes(column.key));
});

const bestRowId = computed(() => rows.value[0]?.id ?? null);
const worstRowId = computed(() => rows.value[rows.value.length - 1]?.id ?? null);

function formatColumnValue(row: ComparisonRow, key: ComparisonMetricKey): string {
  const value = row.rawValues[key];

  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }

  if (key === "contextSwitches" || key === "preemptionCount" || key === "starvedProcessCount" || key === "maxWaitingTime") {
    return String(Math.round(value));
  }

  return value.toFixed(2);
}

function formatScore(score: number): string {
  return score.toFixed(3);
}

function statusLabel(id: string): string {
  if (id === bestRowId.value) {
    return "Bester";
  }

  if (id === worstRowId.value) {
    return "Schwächster";
  }

  return "";
}

function statusClass(id: string): string {
  if (id === bestRowId.value) {
    return "status-pill--best";
  }

  if (id === worstRowId.value) {
    return "status-pill--worst";
  }

  return "status-pill--neutral";
}

function openCustomModal() {
  showCustomModal.value = true;
}

function closeCustomModal() {
  showCustomModal.value = false;
}

function applyCustomWeights(newWeights: Record<string, number>) {
  Object.assign(comparison.state.weights, newWeights);
}

function loadSelectedCaseId(): ComparisonCaseId {
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw && caseOptions.some((entry) => entry.id === raw)) {
        return raw as ComparisonCaseId;
      }
    }
  } catch {
    // ignore storage errors
  }

  return "interactive";
}
</script>

<style scoped>
.comparison-panel {
  display: grid;
  gap: 1rem;
}

.comparison-header {
  align-items: flex-start;
  gap: 1rem;
}

.case-selector {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.case-card {
  display: grid;
  gap: 0.35rem;
  text-align: left;
  padding: 0.9rem 1rem;
  border-radius: 18px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  color: var(--text);
  box-shadow: var(--panel-shadow);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.case-card strong {
  font-size: 0.98rem;
}

.case-card small,
.case-card span {
  color: var(--muted);
}

.case-card--active {
  border-color: color-mix(in srgb, var(--accent) 34%, var(--panel-border));
  background: color-mix(in srgb, var(--accent) 10%, var(--panel-bg));
  transform: translateY(-1px);
}

.custom-editor {
  display: grid;
  gap: 0.9rem;
}

.custom-editor h4 {
  margin: 0 0 0.25rem;
}

.custom-editor p {
  margin: 0;
  color: var(--muted);
}

.custom-editor__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.custom-weight-grid {
  display: grid;
  gap: 0.8rem;
}

.custom-weight-row {
  display: grid;
  gap: 0.35rem;
}

.custom-weight-row strong {
  color: var(--accent);
  font-size: 0.85rem;
}

.column-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.65rem;
  align-items: center;
}

.comparison-table {
  padding-top: 0.25rem;
}

.table-shell {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

th,
td {
  padding: 0.7rem 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  text-align: left;
}

th {
  position: sticky;
  top: 0;
  background: var(--panel-bg);
  color: var(--muted);
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

tbody tr:hover {
  background: color-mix(in srgb, var(--accent) 5%, var(--panel-bg));
}

.row-best {
  background: color-mix(in srgb, var(--accent) 9%, var(--panel-bg));
}

.row-worst {
  background: color-mix(in srgb, var(--danger) 9%, var(--panel-bg));
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
  font-size: 0.72rem;
  border: 1px solid transparent;
}

.status-pill--best {
  background: color-mix(in srgb, var(--accent) 10%, var(--panel-bg));
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 20%, var(--panel-border));
}

.status-pill--worst {
  background: color-mix(in srgb, var(--danger) 12%, var(--panel-bg));
  color: var(--danger);
  border-color: color-mix(in srgb, var(--danger) 24%, var(--panel-border));
}

.status-pill--neutral {
  background: color-mix(in srgb, var(--muted) 8%, var(--panel-bg));
  color: var(--muted);
  border-color: color-mix(in srgb, var(--muted) 14%, var(--panel-border));
}

.table-controls-label {
  color: var(--muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.table-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  color: var(--text);
  font-size: 0.8rem;
}

.table-toggle input {
  margin: 0;
}

@media (max-width: 900px) {
  .custom-editor__header {
    grid-template-columns: 1fr;
  }

  .custom-editor__header {
    display: grid;
  }
}
</style>
