import { describe, it, expect } from "vitest";
import { simulateScenario } from "@/simulation";
import type { Scenario } from "@/types";

// Algorithmusunabhängige Eigenschaften für reproduzierbare Simulationsläufe.
describe("Simulation basic properties", () => {
  // Determinismus ist Voraussetzung für stabile Visualisierungen und Vergleiche.
  it("is deterministic for the same input", () => {
    const scenario: Scenario = {
      algorithm: "roundRobin",
      algorithmParams: { timeQuantum: 1, snapshotInterval: 1 },
      processes: [
        {
          id: "P1",
          name: "P1",
          arrivalTime: 0,
          burstTime: 3,
          priority: 1,
          color: "",
        },
        {
          id: "P2",
          name: "P2",
          arrivalTime: 1,
          burstTime: 2,
          priority: 1,
          color: "",
        },
      ],
    };
    const a = simulateScenario(scenario);
    const b = simulateScenario(scenario);
    expect(a.totalTime).toBe(b.totalTime);
    expect(a.finalMetrics.completedCount).toBe(2);
    expect(a.events.length).toBeGreaterThan(0);
    expect(JSON.stringify(a.segments)).toBe(JSON.stringify(b.segments));
  });

  // Der erste Snapshot beschreibt den Zustand vor der ersten Disposition.
  it("exposes the first dispatched task after the initial snapshot", () => {
    const scenario: Scenario = {
      algorithm: "roundRobin",
      algorithmParams: { timeQuantum: 2, snapshotInterval: 1 },
      processes: [
        {
          id: "P1",
          name: "P1",
          arrivalTime: 0,
          burstTime: 3,
          priority: 1,
          color: "",
        },
        {
          id: "P2",
          name: "P2",
          arrivalTime: 0,
          burstTime: 2,
          priority: 1,
          color: "",
        },
      ],
    };

    const run = simulateScenario(scenario);
    const firstDispatch = run.events.find((event) => event.type === "dispatch");
    const firstActiveSnapshot = run.snapshots.find(
      (snapshot) => snapshot.currentProcessId !== null,
    );

    expect(run.snapshots[0]?.currentProcessId).toBeNull();
    expect(firstDispatch?.processId).toBe("P1");
    expect(firstActiveSnapshot?.currentProcessId).toBe(
      firstDispatch?.processId,
    );
  });

  // LCFS muss bei einer neuen Ankunft den laufenden Prozess sofort verdrängen.
  it("LCFS preempts on new arrival in preemptive mode", () => {
    const scenario: Scenario = {
      algorithm: "lcfs",
      algorithmParams: { lcfsMode: "preemptive", snapshotInterval: 1 },
      processes: [
        {
          id: "P1",
          name: "P1",
          arrivalTime: 0,
          burstTime: 5,
          priority: 1,
          color: "",
        },
        {
          id: "P2",
          name: "P2",
          arrivalTime: 1,
          burstTime: 1,
          priority: 1,
          color: "",
        },
      ],
    };
    const run = simulateScenario(scenario);
    const p1Preempt = run.events.some(
      (e) => e.type === "preempt" && e.processId === "P1",
    );
    expect(p1Preempt).toBe(true);
  });
});
