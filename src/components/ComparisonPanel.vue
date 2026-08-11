<template>
  <div class="comparison-panel">
    <div class="section-header compact header-clickable">
      <div style="display: flex; align-items: center; gap: 8px">
        <h3>Ranking</h3>
        <div style="display:flex; gap:8px; align-items:center">
          <button
            class="icon-button"
            type="button"
            aria-label="Ranking bearbeiten"
            @click.stop="openEditor"
          >
            ✎
          </button>
          <button class="secondary-button" type="button" @click="toggleTable">
            {{ showTable ? 'Tabelle ausblenden' : 'Tabelle anzeigen' }}
          </button>
          <button class="secondary-button" type="button" @click="exportCsv">
            CSV export
          </button>
        </div>
      </div>
      <small>Vergleich aller Runs (Szenario)</small>
    </div>

    <RankingEditModal
      :modelValue="showEditor"
      :initialWeights="weights"
      @close="showEditor = false"
      @confirm="applyWeights"
    />

    <RankingList :rows="rows" :has-runs="hasRuns" />

    <div v-if="showTable" class="comparison-table">
      <div class="table-controls">
        <span class="table-controls-label">Spalten</span>
        <label v-for="col in availableColumns" :key="col.key" class="table-toggle">
          <input type="checkbox" v-model="selectedColumns" :value="col.key" />
          <span>{{ col.label }}</span>
        </label>
      </div>

      <div class="table-shell">
        <table>
        <thead>
          <tr>
            <th>#</th>
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
            :class="{ 'row-best': row.id === bestRowId, 'row-worst': row.id === worstRowId }"
          >
            <td>{{ row.id }}</td>
            <td>{{ row.label }}</td>
            <td>
              <span class="status-pill" :class="statusClass(row.id)">
                {{ statusLabel(row.id) }}
              </span>
            </td>
            <td v-for="col in visibleColumns" :key="col.key">
              {{ formatMetricForRow(row, col.key) }}
            </td>
            <td>{{ row.score }}</td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import RankingList from "./RankingList.vue";
import RankingEditModal from "./RankingEditModal.vue";
import {
  useScenarioWorkspace,
  type ScenarioRecord,
} from "@/composables/useScenarioWorkspace";
import { useComparison } from "@/composables/useComparison";

const props = defineProps<{
  scenario?: ScenarioRecord | null;
}>();

const workspace = useScenarioWorkspace();
const comparison = useComparison();

import { ref } from "vue";

const showEditor = ref(false);
const showTable = ref(true);

const availableColumns = [
  { key: 'averageTurnaroundTime', label: 'Turnaround' },
  { key: 'averageWaitingTime', label: 'Waiting Time' },
  { key: 'throughput', label: 'Throughput' },
  { key: 'fairnessIndex', label: 'Fairness (Jain)' },
  { key: 'contextSwitches', label: 'Context Switches' },
  { key: 'cpuUtilization', label: 'CPU Utilization' },
  { key: 'averageResponseTime', label: 'Response Time' },
];

const selectedColumns = ref(availableColumns.map(c => c.key));

const activeScenario = computed(() => props.scenario ?? workspace.activeScenario.value);

const bestRowId = computed(() => rows.value[0]?.id ?? null);
const worstRowId = computed(() => rows.value[rows.value.length - 1]?.id ?? null);

function toggleTable() {
  showTable.value = !showTable.value;
}

const visibleColumns = computed(() => {
  return availableColumns.filter(c => selectedColumns.value.includes(c.key));
});

function formatMetricForRow(row: any, key: string) {
  // prefer rawValues for normalized/simple metrics, otherwise try metrics
  if (key in row.rawValues) {
    const v = row.rawValues[key];
    return Number.isFinite(v) ? v.toFixed(2) : '--';
  }

  const m = row.metrics as any;
  if (key === 'throughput') {
    return (row.totalTime > 0 ? (m.completedCount / row.totalTime).toFixed(2) : '--');
  }

  if (key in m) {
    const val = m[key];
    return Number.isFinite(val) ? (typeof val === 'number' ? val.toFixed(2) : String(val)) : '--';
  }

  return '--';
}

function statusLabel(id: string): string {
  if (id === bestRowId.value) {
    return "Best";
  }

  if (id === worstRowId.value) {
    return "Worst";
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

function exportCsv() {
  const hdr = ['id','algorithm', ...selectedColumns.value, 'score'];
  const csvRows = [hdr.join(',')];
  for (const row of rows.value) {
    const cols = [row.id, `"${row.label}"`];
    for (const key of selectedColumns.value) {
      cols.push(`"${String(formatMetricForRow(row, key)).replace(/"/g, '""')}"`);
    }
    cols.push(String(row.score));
    csvRows.push(cols.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'comparison.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const rows = computed(() => {
  const scenario = activeScenario.value;
  if (!scenario?.runs.length) return [];
  return comparison.buildForScenario(scenario);
});

const hasRuns = computed(() =>
  Boolean(activeScenario.value?.runs.length),
);

const weights = comparison.state.weights as Record<string, number>;

function openEditor() {
  showEditor.value = true;
}

function applyWeights(newWeights: Record<string, number>) {
  Object.assign(weights, newWeights);
}
</script>

<style scoped>
.weights-panel {
  margin-top: 10px;
}
.weight {
  margin: 6px 0;
}
input[type="range"] {
  width: 100%;
}
.header-clickable {
  cursor: pointer;
}
.icon-button {
  background: transparent;
  border: 0;
  color: var(--accent);
  font-size: 0.95rem;
  padding: 2px 6px;
  border-radius: 6px;
}
.icon-button:hover {
  background: rgba(125, 211, 252, 0.06);
}
.comparison-table {
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}
.table-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.65rem;
  align-items: center;
  margin-bottom: 0.75rem;
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
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.26);
  color: var(--text);
  font-size: 0.8rem;
}
.table-toggle input {
  margin: 0;
}
.table-shell {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.26);
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 520px;
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
  background: rgba(15, 23, 42, 0.95);
  color: var(--muted);
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
tbody tr:hover {
  background: rgba(125, 211, 252, 0.05);
}
.row-best {
  background: rgba(125, 211, 252, 0.08);
}
.row-worst {
  background: rgba(248, 113, 113, 0.08);
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
  background: rgba(125, 211, 252, 0.1);
  color: var(--accent);
  border-color: rgba(125, 211, 252, 0.2);
}
.status-pill--worst {
  background: rgba(248, 113, 113, 0.12);
  color: var(--danger);
  border-color: rgba(248, 113, 113, 0.24);
}
.status-pill--neutral {
  background: rgba(148, 163, 184, 0.08);
  color: var(--muted);
  border-color: rgba(148, 163, 184, 0.14);
}
</style>
