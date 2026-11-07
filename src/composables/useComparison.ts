import { reactive, watch } from "vue";
import { buildComparisonRows } from "@/utils/compare";
import { simulateScenario } from "@/simulation";
import {
  buildSimulationScenario,
  type ScenarioRecord,
} from "@/composables/useScenarioWorkspace";

/** Verwaltet Gewichtungen und erstellt vergleichbare Simulationsläufe. */
export function useComparison() {
  const state = reactive({
    weights: {
      averageResponseTime: 0,
      averageTurnaroundTime: 0.4,
      averageWaitingTime: 0.3,
      throughput: 0.2,
      contextSwitches: 0,
      preemptionCount: 0,
      maxWaitingTime: 0,
    },
  });

  const STORAGE_KEY = "scheduling-visualizer.comparison.weights.v1";

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
    // Ungültige oder nicht zugängliche Browserdaten dürfen den Vergleich nicht blockieren.
  }

  function buildForScenario(
    scenario: ScenarioRecord,
    weights: Record<string, number> = state.weights,
  ) {
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

      runs.push({ id: String(index + 1), label: run.algorithm, run: sim });
    });

    return buildComparisonRows(runs, weights);
  }

  // Gewichtungen werden reaktiv persistiert, damit ein Seitenwechsel keine
  // fachliche Vergleichseinstellung verliert.
  watch(
    () => state.weights,
    (v) => {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
        }
      } catch {
        // ignore
      }
    },
    { deep: true },
  );

  return {
    state,
    buildForScenario,
  };
}
