import { describe, it, expect } from "vitest";
import { simulateScenario } from "@/simulation";
import type { Scenario } from "@/types";

describe("Simulation basic properties", () => {
  it("is deterministic for the same input", () => {
    const scenario: Scenario = {
      algorithm: "roundRobin",
      algorithmParams: { timeQuantum: 1, snapshotInterval: 1 },
      processes: [
        { id: "P1", name: "P1", arrivalTime: 0, burstTime: 3, priority: 1, color: "" },
        { id: "P2", name: "P2", arrivalTime: 1, burstTime: 2, priority: 1, color: "" },
      ],
    };
    const a = simulateScenario(scenario);
    const b = simulateScenario(scenario);
    expect(a.totalTime).toBe(b.totalTime);
    expect(a.finalMetrics.completedCount).toBe(2);
    expect(a.events.length).toBeGreaterThan(0);
    expect(JSON.stringify(a.segments)).toBe(JSON.stringify(b.segments));
  });

  it("LCFS preempts on new arrival in preemptive mode", () => {
    const scenario: Scenario = {
      algorithm: "lcfs",
      algorithmParams: { lcfsMode: "preemptive", snapshotInterval: 1 },
      processes: [
        { id: "P1", name: "P1", arrivalTime: 0, burstTime: 5, priority: 1, color: "" },
        { id: "P2", name: "P2", arrivalTime: 1, burstTime: 1, priority: 1, color: "" },
      ],
    };
    const run = simulateScenario(scenario);
    // Expect at least one preempt event for P1
    const p1Preempt = run.events.some(e => e.type === "preempt" && e.processId === "P1");
    expect(p1Preempt).toBe(true);
  });
});