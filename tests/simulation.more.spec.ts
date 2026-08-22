import { describe, it, expect } from "vitest";
import { simulateScenario } from "@/simulation";
import type { Scenario } from "@/types";

describe("Simulation additional checks", () => {
  it("MLFQ demotes process when quantum expires (classic mode)", () => {
    const scenario: Scenario = {
      algorithm: "mlfq",
      algorithmParams: {
        timeQuantum: 1,
        queueLevels: 3,
        snapshotInterval: 1,
        mlfqMode: "classic",
      },
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
          burstTime: 1,
          priority: 1,
          color: "",
        },
      ],
    };

    const run = simulateScenario(scenario);
    const demoted = run.events.some(
      (e) => e.type === "quantumExpired" && e.processId === "P1",
    );
    expect(demoted).toBe(true);
  });

  it("StrictPriority tieBreak 'remainingTime' selects shorter remaining job first", () => {
    const scenario: Scenario = {
      algorithm: "strictPriority",
      algorithmParams: {
        strictPriorityTieBreak: "remainingTime",
        snapshotInterval: 1,
      },
      processes: [
        {
          id: "A",
          name: "A",
          arrivalTime: 0,
          burstTime: 5,
          priority: 1,
          color: "",
        },
        {
          id: "B",
          name: "B",
          arrivalTime: 0,
          burstTime: 1,
          priority: 1,
          color: "",
        },
      ],
    };

    const run = simulateScenario(scenario);
    const firstDispatch = run.events.find((e) => e.type === "dispatch");
    expect(firstDispatch?.processId).toBe("B");
  });

  it("SRTF preempts the running job when a shorter job arrives", () => {
    const scenario: Scenario = {
      algorithm: "sjf",
      algorithmParams: { snapshotInterval: 1, sjfMode: "preemptive" },
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
        {
          id: "P3",
          name: "P3",
          arrivalTime: 1,
          burstTime: 2,
          priority: 1,
          color: "",
        },
      ],
    };

    const run = simulateScenario(scenario);
    const p1Preempted = run.events.some(
      (event) => event.type === "preempt" && event.processId === "P1",
    );

    const firstFinished = run.events.find((event) => event.type === "finish");
    expect(p1Preempted).toBe(true);
    expect(firstFinished?.processId).toBe("P2");
  });

  it("SRTF preempts when a shorter remaining-time process arrives", () => {
    const scenario: Scenario = {
      algorithm: "sjf",
      algorithmParams: { snapshotInterval: 1, sjfMode: "preemptive" },
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
    const p1Preempted = run.events.some(
      (event) => event.type === "preempt" && event.processId === "P1",
    );
    const firstFinished = run.events.find((event) => event.type === "finish");

    expect(p1Preempted).toBe(true);
    expect(firstFinished?.processId).toBe("P2");
  });

  it("normalizes legacy non-preemptive SJF data to SRTF", () => {
    const scenario = {
      algorithm: "sjf",
      algorithmParams: {
        snapshotInterval: 1,
        sjfMode: "nonPreemptive",
      },
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
    } as unknown as Scenario;

    const run = simulateScenario(scenario);

    expect(run.events).toContainEqual(
      expect.objectContaining({ type: "preempt", processId: "P1" }),
    );
  });

  it("does not preempt SRTF when remaining times are equal", () => {
    const scenario: Scenario = {
      algorithm: "sjf",
      algorithmParams: { snapshotInterval: 1, sjfMode: "preemptive" },
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

    const run = simulateScenario(scenario);

    expect(run.events).not.toContainEqual(
      expect.objectContaining({ type: "preempt", processId: "P1" }),
    );
  });

  it("creates visible starvation for a low-priority process", () => {
    const highPriorityJobs = Array.from({ length: 8 }, (_, index) => ({
      id: `H${index + 1}`,
      name: `H${index + 1}`,
      arrivalTime: index * 2 + 1,
      burstTime: 2,
      priority: 1,
      color: "",
    }));
    const scenario: Scenario = {
      algorithm: "strictPriority",
      algorithmParams: { snapshotInterval: 1 },
      processes: [
        {
          id: "BG",
          name: "BG",
          arrivalTime: 0,
          burstTime: 14,
          priority: 5,
          color: "",
        },
        ...highPriorityJobs,
      ],
    };

    const run = simulateScenario(scenario);
    const backgroundProcess = run.processStates.find(
      (process) => process.id === "BG",
    );

    expect(backgroundProcess?.waitingTime).toBeGreaterThanOrEqual(14);
    expect(run.finalMetrics.starvedProcessCount).toBeGreaterThanOrEqual(1);
  });
});
