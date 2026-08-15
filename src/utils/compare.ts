import type { SimulationMetrics, SimulationRun } from "@/types";

export type ComparisonMetricKey =
  | "averageTurnaroundTime"
  | "averageWaitingTime"
  | "averageResponseTime"
  | "throughput"
  | "fairnessIndex"
  | "contextSwitches"
  | "preemptionCount"
  | "cpuUtilization"
  | "idleShare"
  | "maxWaitingTime"
  | "starvedProcessCount";

const LOWER_IS_BETTER = new Set<ComparisonMetricKey>([
  "averageTurnaroundTime",
  "averageWaitingTime",
  "averageResponseTime",
  "contextSwitches",
  "preemptionCount",
  "cpuUtilization",
  "idleShare",
  "maxWaitingTime",
  "starvedProcessCount",
]);

export interface ComparisonRow {
  id: string;
  label: string;
  metrics: SimulationMetrics;
  totalTime: number;
  score: number;
  normalized: Record<string, number>;
  rawValues: Record<string, number | null>;
}

function safeNumber(value: number | null | undefined) {
  return Number.isFinite(value as number) ? (value as number) : NaN;
}

export function extractValues(run: SimulationRun) {
  const m = run.finalMetrics;
  const throughput = run.totalTime > 0 ? m.completedCount / run.totalTime : 0;

  return {
    averageTurnaroundTime: safeNumber(m.averageTurnaroundTime),
    averageWaitingTime: safeNumber(m.averageWaitingTime),
    averageResponseTime: safeNumber(m.averageResponseTime),
    throughput,
    fairnessIndex: safeNumber(m.fairnessIndex),
    contextSwitches: safeNumber(m.contextSwitches),
    preemptionCount: safeNumber(m.preemptionCount),
    cpuUtilization: safeNumber(m.cpuUtilization),
    idleShare: safeNumber(m.idleShare),
    maxWaitingTime: safeNumber(m.maxWaitingTime),
    starvedProcessCount: safeNumber(m.starvedProcessCount),
  };
}

export function normalizeAcrossRuns(
  rows: { id: string; values: Record<string, number> }[],
  keys: string[],
) {
  const mins: Record<string, number> = {};
  const maxs: Record<string, number> = {};

  for (const key of keys) {
    const vals = rows.map((r) => r.values[key]).filter((v) => !Number.isNaN(v));
    mins[key] = vals.length ? Math.min(...vals) : 0;
    maxs[key] = vals.length ? Math.max(...vals) : 1;
    if (mins[key] === maxs[key]) {
      // avoid division by zero
      maxs[key] = mins[key] + 1;
    }
  }

  return rows.map((row) => {
    const normalized: Record<string, number> = {};
    for (const key of keys) {
      const v = row.values[key];
      normalized[key] = Number.isNaN(v)
        ? 0
        : (v - mins[key]) / (maxs[key] - mins[key]);
    }

    return { id: row.id, values: row.values, normalized };
  });
}

export function computeScoreForRow(
  normalized: Record<string, number>,
  weights: Record<string, number>,
) {
  let score = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (!weight) {
      continue;
    }

    const metricKey = key as ComparisonMetricKey;
    const value = normalized[key] ?? 0;
    const contribution = LOWER_IS_BETTER.has(metricKey) ? 1 - value : value;
    score += weight * contribution;
  }

  return Math.round(score * 1000) / 1000;
}

export function buildComparisonRows(
  runs: { id: string; label: string; run: SimulationRun }[],
  weights: Record<string, number>,
) {
  const keys = [
    "averageTurnaroundTime",
    "averageWaitingTime",
    "averageResponseTime",
    "throughput",
    "fairnessIndex",
    "contextSwitches",
    "preemptionCount",
    "cpuUtilization",
    "idleShare",
  ];

  const rawRows = runs.map((r) => ({ id: r.id, values: extractValues(r.run) }));
  const normalizedRows = normalizeAcrossRuns(rawRows, keys);

  const result: ComparisonRow[] = runs.map((r) => {
    const norm = normalizedRows.find((n) => n.id === r.id)?.normalized ?? {};
    const raw =
      rawRows.find((n) => n.id === r.id)?.values ??
      ({} as Record<string, number>);
    const score = computeScoreForRow(norm as Record<string, number>, weights);

    return {
      id: r.id,
      label: r.label,
      metrics: r.run.finalMetrics,
      totalTime: r.run.totalTime,
      score,
      normalized: norm,
      rawValues: raw,
    };
  });

  result.sort((a, b) => b.score - a.score);
  return result;
}
