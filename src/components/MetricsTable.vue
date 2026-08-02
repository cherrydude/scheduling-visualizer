<template>
  <div>
    <div class="section-header compact">
      <h3>Vergleichstabelle</h3>
      <small>Runs im aktuellen Szenario</small>
    </div>

    <table v-if="rows && rows.length" class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Run</th>
          <th>Algorithmus</th>
          <th>Score</th>
          <th>Turnaround</th>
          <th>Waiting</th>
          <th>Throughput</th>
          <th>Fairness</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="row.id">
          <td>{{ idx + 1 }}</td>
          <td>{{ row.id }}</td>
          <td>{{ row.label }}</td>
          <td>{{ row.score }}</td>
          <td>{{ format(row.metrics.averageTurnaroundTime) }}</td>
          <td>{{ format(row.metrics.averageWaitingTime) }}</td>
          <td>{{ formatThroughput(row) }}</td>
          <td>{{ format(row.metrics.fairnessIndex) }}</td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty-state compact">
      <strong>Keine Runs</strong>
      <p>Wende einen Algorithmus an, um Vergleichswerte zu sehen.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useScenarioWorkspace } from "@/composables/useScenarioWorkspace";
import { useComparison } from "@/composables/useComparison";

const workspace = useScenarioWorkspace();
const comparison = useComparison();

const rows = computed(() => {
  const scenario = workspace.activeScenario.value;
  if (!scenario || !scenario.runs.length) return [];
  return comparison.buildForScenario(scenario);
});

function format(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number.isFinite(v)
    ? String(Math.round((v as number) * 100) / 100)
    : "—";
}

function formatThroughput(row: any) {
  const t = row.totalTime || 0;
  const c = row.metrics.completedCount || 0;
  return t > 0 ? (Math.round((c / t) * 1000) / 1000).toString() : "—";
}
</script>

<style scoped>
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table th,
.table td {
  padding: 6px 8px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}
</style>
