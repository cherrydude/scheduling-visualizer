import { describe, expect, it } from "vitest";
import {
  buildSimulationScenario,
  getActiveRun,
  type ScenarioRecord,
} from "@/composables/useScenarioWorkspace";

describe("workspace helpers", () => {
  const scenario: ScenarioRecord = {
    id: "scenario-1",
    title: "Scenario 1",
    description: "Test",
    seed: 17,
    tickSize: 1,
    processes: [
      {
        id: "p1",
        name: "P1",
        arrivalTime: 0,
        burstTime: 2,
        priority: 1,
        color: "#60a5fa",
      },
    ],
    runs: [
      {
        id: "run-1",
        algorithm: "roundRobin",
        algorithmParams: {
          timeQuantum: 2,
          snapshotInterval: 1,
          queueLevels: 3,
          strictPriorityTieBreak: "fifo",
          lcfsMode: "preemptive",
          lcfsTieBreak: "stack",
        },
      },
    ],
    activeRunIndex: 0,
    appliedAlgorithm: null,
  };

  it("returns the active run safely", () => {
    expect(getActiveRun(scenario)?.id).toBe("run-1");
    expect(getActiveRun({ ...scenario, activeRunIndex: -1 }) ).toBeNull();
  });

  it("builds a simulation scenario from the active run", () => {
    const simScenario = buildSimulationScenario(scenario);

    expect(simScenario?.id).toBe("scenario-1:run-1");
    expect(simScenario?.algorithm).toBe("roundRobin");
    expect(simScenario?.processes).toHaveLength(1);
    expect(simScenario?.processes[0]).not.toBe(scenario.processes[0]);
  });
});