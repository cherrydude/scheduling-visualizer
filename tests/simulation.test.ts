import { describe, expect, it } from "vitest";
import { simulateScenario } from "@/simulation";

describe("simulateScenario", () => {
  it("normalizes malformed input and keeps segment bounds valid", () => {
    const result = simulateScenario({
      id: "broken",
      title: "Broken",
      description: "Broken",
      algorithm: "not-a-real-algorithm" as never,
      algorithmParams: {
        timeQuantum: 0 as never,
        snapshotInterval: -3 as never,
        queueLevels: 0 as never,
      },
      seed: "12" as never,
      tickSize: 0 as never,
      processes: [
        {
          id: "p1",
          name: "P1",
          arrivalTime: -4 as never,
          burstTime: 0 as never,
          priority: -2 as never,
          color: "",
        },
      ],
    });

    expect(result.supported).toBe(true);
    expect(result.totalTime).toBeGreaterThanOrEqual(0);
    expect(result.segments.every((segment) => segment.start >= 0)).toBe(true);
    expect(
      result.segments.every((segment) => segment.end >= segment.start),
    ).toBe(true);
    expect(Number.isFinite(result.finalMetrics.cpuUtilization)).toBe(true);
    expect(Number.isFinite(result.finalMetrics.idleShare)).toBe(true);
    expect(result.snapshots[0]?.time ?? 0).toBe(0);
  });

  it("produces sorted segments for a small round robin scenario", () => {
    const result = simulateScenario({
      id: "rr",
      title: "RR",
      description: "RR",
      algorithm: "roundRobin",
      algorithmParams: {
        timeQuantum: 2,
        snapshotInterval: 1,
        queueLevels: 3,
        strictPriorityTieBreak: "fifo",
        lcfsMode: "preemptive",
        lcfsTieBreak: "stack",
      },
      seed: 7,
      tickSize: 1,
      processes: [
        {
          id: "p1",
          name: "P1",
          arrivalTime: 0,
          burstTime: 3,
          priority: 1,
          color: "#60a5fa",
        },
        {
          id: "p2",
          name: "P2",
          arrivalTime: 1,
          burstTime: 2,
          priority: 2,
          color: "#34d399",
        },
      ],
    });

    const starts = result.segments.map((segment) => segment.start);
    expect(starts).toEqual([...starts].sort((left, right) => left - right));
    expect(result.finalMetrics.completedCount).toBe(2);
    expect(result.snapshots.at(-1)?.time).toBe(result.totalTime);
  });
});