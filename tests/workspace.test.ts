import { describe, expect, it } from "vitest";
import {
  buildSimulationScenario,
  getActiveRun,
  getScenarioRenderSignature,
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

  it("changes the render signature when the scenario structure changes", () => {
    const signatureA = getScenarioRenderSignature(scenario);
    const signatureB = getScenarioRenderSignature({
      ...scenario,
      tickSize: 2,
      processes: [
        ...scenario.processes,
        {
          id: "p2",
          name: "P2",
          arrivalTime: 2,
          burstTime: 4,
          priority: 2,
          color: "#fbbf24",
        },
      ],
    });

    expect(signatureA).not.toBe(signatureB);
    expect(signatureA).toContain("scenario-1");
  });

  it("changes the render signature when seed or algorithm settings change", () => {
    const signatureA = getScenarioRenderSignature(scenario);
    const signatureB = getScenarioRenderSignature({
      ...scenario,
      seed: 99,
      runs: [
        {
          ...scenario.runs[0],
          algorithm: "strictPriority",
          algorithmParams: {
            ...scenario.runs[0].algorithmParams,
            timeQuantum: 6,
            strictPriorityTieBreak: "priority",
          },
        },
      ],
      activeRunIndex: 0,
      appliedAlgorithm: null,
    });

    expect(signatureA).not.toBe(signatureB);
  });
});