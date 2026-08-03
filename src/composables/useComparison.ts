import { computed, reactive, watch } from "vue";
import { buildComparisonRows } from "@/utils/compare";
import { simulateScenario } from "@/simulation";
import {
  buildSimulationScenario,
  type ScenarioRecord,
} from "@/composables/useScenarioWorkspace";

export function useComparison() {
  const state = reactive({
    weights: {
      averageTurnaroundTime: 0.4,
      averageWaitingTime: 0.3,
      throughput: 0.2,
      fairnessIndex: 0.1,
    },
  });

  const STORAGE_KEY = "scheduling-visualizer.comparison.weights.v1";

  // load persisted weights if present
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          Object.assign(state.weights, parsed);
        }
      }
    }
  } catch {
    // ignore invalid data
  }

  function buildForScenario(scenario: ScenarioRecord) {
    const runs: Array<{
      id: string;
      label: string;
      run: ReturnType<typeof simulateScenario>;
    }> = [];

    (scenario.runs ?? []).forEach((run, index) => {
      const simScenario = buildSimulationScenario(scenario, run);
      const sim = simScenario ? simulateScenario(simScenario) : null;

      if (!sim) {
        return;
      }

      // Use the 1-based run index as the public run id in comparisons
      // This avoids collisions when multiple runs share the same algorithm name
      // and matches the numbering shown in the navigation.
      runs.push({ id: String(index + 1), label: run.algorithm, run: sim });
    });

    return buildComparisonRows(runs, state.weights);
  }

  // persist weights on change
  watch(
    () => state.weights,
    (v) => {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
        }
      } catch {
        /* ignore */
      }
    },
    { deep: true },
  );

  return {
    state,
    buildForScenario,
  };
}
