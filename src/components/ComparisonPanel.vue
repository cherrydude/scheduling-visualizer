<template>
  <div class="comparison-panel">
    <div class="section-header compact header-clickable" @click="openEditor">
      <div style="display: flex; align-items: center; gap: 8px">
        <h3>Ranking</h3>
        <button
          class="icon-button"
          type="button"
          aria-label="Ranking bearbeiten"
          @click.stop="openEditor"
        >
          ✎
        </button>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import RankingList from "./RankingList.vue";
import RankingEditModal from "./RankingEditModal.vue";
import { useScenarioWorkspace } from "@/composables/useScenarioWorkspace";
import { useComparison } from "@/composables/useComparison";

const workspace = useScenarioWorkspace();
const comparison = useComparison();

import { ref } from "vue";

const showEditor = ref(false);

const rows = computed(() => {
  const scenario = workspace.activeScenario.value;
  if (!scenario || !scenario.runs.length) return [];
  return comparison.buildForScenario(scenario);
});

const hasRuns = computed(() =>
  Boolean(
    workspace.activeScenario.value &&
    (workspace.activeScenario.value.runs ?? []).length > 0,
  ),
);

const weights = comparison.state.weights as Record<string, number>;

function formatKey(key: string) {
  if (key === "averageTurnaroundTime") return "Durchlaufzeit";
  if (key === "averageWaitingTime") return "Wartezeit";
  if (key === "throughput") return "Durchsatz";
  if (key === "fairnessIndex") return "Fairness";
  return key;
}

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
  color: #7dd3fc;
  font-size: 0.95rem;
  padding: 2px 6px;
  border-radius: 6px;
}
.icon-button:hover {
  background: rgba(125, 211, 252, 0.06);
}
</style>
