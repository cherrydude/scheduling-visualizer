import { computed, ref, watch } from "vue";
import type {
  AlgorithmParams,
  AlgorithmType,
  ProcessInput,
  Scenario,
} from "@/types";

export interface AlgorithmAttachment {
  algorithm: AlgorithmType;
  algorithmParams: AlgorithmParams;
}

export interface ScenarioRunRecord extends AlgorithmAttachment {
  id: string;
}

export interface ScenarioDraft {
  title: string;
  description: string;
  seed: number;
  tickSize: number;
  processes: ProcessInput[];
}

export interface ScenarioUpdateDraft extends ScenarioDraft {
  id: string;
}

export interface ScenarioRecord extends ScenarioDraft {
  id: string;
  runs: ScenarioRunRecord[];
  activeRunIndex: number;
  appliedAlgorithm: AlgorithmAttachment | null;
}

const STORAGE_KEY = "scheduling-visualizer.scenarios.v1";
const ACTIVE_KEY = "scheduling-visualizer.active-scenario.v1";

const DEFAULT_ALGORITHM_PARAMS: AlgorithmParams = {
  timeQuantum: 2,
  snapshotInterval: 1,
  queueLevels: 3,
  strictPriorityTieBreak: "fifo",
  lcfsMode: "preemptive",
  lcfsTieBreak: "stack",
};

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneProcesses(processes: ProcessInput[]): ProcessInput[] {
  return processes.map((process) => ({ ...process }));
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPositiveInteger(value: unknown, fallback: number): number {
  return Math.max(1, Math.floor(toFiniteNumber(value, fallback)));
}

function normalizeProcessInput(
  process: Partial<ProcessInput> | null | undefined,
  fallbackIndex: number,
): ProcessInput {
  const fallbackId = `P${fallbackIndex + 1}`;
  return {
    id:
      typeof process?.id === "string" && process.id.trim()
        ? process.id
        : fallbackId,
    name:
      typeof process?.name === "string" && process.name.trim()
        ? process.name
        : fallbackId,
    arrivalTime: Math.max(0, Math.floor(toFiniteNumber(process?.arrivalTime, 0))),
    burstTime: Math.max(1, toPositiveInteger(process?.burstTime ?? 1, 1)),
    priority: Math.max(0, Math.floor(toFiniteNumber(process?.priority, 1))),
    color:
      typeof process?.color === "string" && process.color.trim()
        ? process.color
        : 'var(--data-2)',
    group:
      typeof process?.group === "string" && process.group.trim()
        ? process.group
        : undefined,
  };
}

function normalizeProcesses(processes: unknown): ProcessInput[] {
  if (!Array.isArray(processes)) {
    return [];
  }

  return processes.map((process, index) =>
    normalizeProcessInput(process as Partial<ProcessInput>, index),
  );
}

function isAlgorithmType(value: unknown): value is AlgorithmType {
  return (
    value === "roundRobin" ||
    value === "lcfs" ||
    value === "strictPriority" ||
    value === "mlfq"
  );
}

function createAlgorithmParams(
  params: Partial<AlgorithmParams> | null | undefined,
): AlgorithmParams {
  return {
    timeQuantum: toPositiveInteger(
      params?.timeQuantum,
      DEFAULT_ALGORITHM_PARAMS.timeQuantum ?? 2,
    ),
    snapshotInterval: toPositiveInteger(
      params?.snapshotInterval,
      DEFAULT_ALGORITHM_PARAMS.snapshotInterval ?? 1,
    ),
    queueLevels: Math.max(
      2,
      toPositiveInteger(
        params?.queueLevels,
        DEFAULT_ALGORITHM_PARAMS.queueLevels ?? 3,
      ),
    ),
    strictPriorityTieBreak:
      params?.strictPriorityTieBreak ?? DEFAULT_ALGORITHM_PARAMS.strictPriorityTieBreak,
    lcfsMode: params?.lcfsMode ?? DEFAULT_ALGORITHM_PARAMS.lcfsMode,
    lcfsTieBreak: params?.lcfsTieBreak ?? DEFAULT_ALGORITHM_PARAMS.lcfsTieBreak,
  };
}

function createAlgorithmAttachment(
  algorithm: AlgorithmType,
  params?: Partial<AlgorithmParams> | null,
): AlgorithmAttachment {
  return {
    algorithm,
    algorithmParams: createAlgorithmParams(params),
  };
}

function normalizeAlgorithmAttachment(
  attachment: Partial<AlgorithmAttachment> | null | undefined,
): AlgorithmAttachment | null {
  if (!isAlgorithmType(attachment?.algorithm)) {
    return null;
  }

  return createAlgorithmAttachment(
    attachment.algorithm,
    attachment.algorithmParams,
  );
}

function normalizeRun(
  run: Partial<ScenarioRunRecord> | Partial<AlgorithmAttachment>,
  fallbackId?: string,
): ScenarioRunRecord | null {
  const attachment = normalizeAlgorithmAttachment(run);
  if (!attachment) {
    return null;
  }

  return {
    id:
      typeof (run as ScenarioRunRecord).id === "string" &&
      (run as ScenarioRunRecord).id
        ? (run as ScenarioRunRecord).id
        : fallbackId || createId("run"),
    ...attachment,
  };
}

function normalizeScenarioDraft(
  record: Partial<ScenarioUpdateDraft>,
): ScenarioUpdateDraft {
  return {
    id:
      typeof record.id === "string" && record.id
        ? record.id
        : createId("scenario"),
    title: record.title || "Benutzer-Szenario",
    description:
      record.description || "Vom Szenario-Generator erstelltes Beispiel.",
    seed: toFiniteNumber(record.seed, 17),
    tickSize: toPositiveInteger(record.tickSize, 1),
    processes: normalizeProcesses(record.processes),
  };
}

function normalizeScenario(record: Partial<ScenarioRecord>): ScenarioRecord {
  const runs = Array.isArray((record as ScenarioRecord).runs)
    ? (record as ScenarioRecord).runs
        .map((run, index) =>
          normalizeRun(run, `${record.id || "scenario"}-run-${index + 1}`),
        )
        .filter((run): run is ScenarioRunRecord => Boolean(run))
    : record.appliedAlgorithm
      ? [
          normalizeRun(
            record.appliedAlgorithm,
            `${record.id || "scenario"}-run-1`,
          ),
        ].filter((run): run is ScenarioRunRecord => Boolean(run))
      : [];

  const activeRunIndex = Number.isInteger(
    (record as ScenarioRecord).activeRunIndex,
  )
    ? Math.max(
        0,
        Math.min(
          (record as ScenarioRecord).activeRunIndex,
          Math.max(runs.length - 1, 0),
        ),
      )
    : record.appliedAlgorithm
      ? 0
      : -1;

  return {
    id:
      typeof record.id === "string" && record.id
        ? record.id
        : createId("scenario"),
    title: record.title || "Benutzer-Szenario",
    description:
      record.description || "Vom Szenario-Generator erstelltes Beispiel.",
    seed: toFiniteNumber(record.seed, 17),
    tickSize: toPositiveInteger(record.tickSize, 1),
    processes: normalizeProcesses(record.processes),
    runs,
    activeRunIndex,
    appliedAlgorithm:
      activeRunIndex >= 0 ? runs[activeRunIndex] ?? null : null,
  };
}

export function buildSimulationScenario(
  scenario: ScenarioRecord,
  run: ScenarioRunRecord | null = getActiveRun(scenario),
): Scenario | null {
  if (!run) {
    return null;
  }

  return {
    id: `${scenario.id}:${run.id}`,
    title: scenario.title,
    description: scenario.description,
    algorithm: run.algorithm,
    algorithmParams: run.algorithmParams,
    seed: scenario.seed,
    tickSize: scenario.tickSize,
    processes: cloneProcesses(scenario.processes),
  };
}

export function getActiveRun(scenario: ScenarioRecord): ScenarioRunRecord | null {
  if (scenario.activeRunIndex < 0) {
    return null;
  }

  return scenario.runs[scenario.activeRunIndex] ?? null;
}

function loadScenarios(): ScenarioRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((entry) => normalizeScenario(entry));
  } catch {
    return [];
  }
}

function loadActiveScenarioId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_KEY) || null;
}

function persistScenarios(scenarios: ScenarioRecord[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function createBlankScenarioDraft(): ScenarioDraft {
  return {
    title: "",
    description: "",
    seed: 17,
    tickSize: 1,
    processes: [],
  };
}

export function useScenarioWorkspace() {
  const scenarios = ref<ScenarioRecord[]>(loadScenarios());
  const activeScenarioId = ref<string | null>(loadActiveScenarioId());

  const activeScenario = computed(
    () =>
      scenarios.value.find(
        (scenario) => scenario.id === activeScenarioId.value,
      ) ?? null,
  );

  function persistActiveScenarioId(id: string | null): void {
    if (typeof window === "undefined") {
      return;
    }

    if (id) {
      window.localStorage.setItem(ACTIVE_KEY, id);
      return;
    }

    window.localStorage.removeItem(ACTIVE_KEY);
  }

  function syncPersistence(): void {
    persistScenarios(scenarios.value);
    persistActiveScenarioId(activeScenarioId.value);
  }

  function ensureValidActiveScenario(): void {
    if (
      activeScenarioId.value &&
      scenarios.value.some((scenario) => scenario.id === activeScenarioId.value)
    ) {
      return;
    }

    activeScenarioId.value = scenarios.value[0]?.id ?? null;
  }

  function createScenario(draft: ScenarioDraft): ScenarioRecord {
    const scenario = normalizeScenario({
      id: createId("scenario"),
      title: draft.title,
      description: draft.description,
      seed: draft.seed,
      tickSize: draft.tickSize,
      processes: cloneProcesses(draft.processes),
      appliedAlgorithm: null,
    });

    scenarios.value = [scenario, ...scenarios.value];
    activeScenarioId.value = scenario.id;
    syncPersistence();
    return scenario;
  }

  function selectScenario(id: string): void {
    if (!scenarios.value.some((scenario) => scenario.id === id)) {
      return;
    }

    activeScenarioId.value = id;
    syncPersistence();
  }

  function renameScenario(id: string, title: string): void {
    scenarios.value = scenarios.value.map((scenario) =>
      scenario.id === id
        ? { ...scenario, title: title || scenario.title }
        : scenario,
    );
    syncPersistence();
  }

  function updateScenario(draft: ScenarioUpdateDraft): void {
    scenarios.value = scenarios.value.map((scenario) =>
      scenario.id === draft.id
        ? {
            ...scenario,
            title: draft.title || scenario.title,
            description: draft.description || scenario.description,
            seed: Number.isFinite(draft.seed)
              ? Number(draft.seed)
              : scenario.seed,
            tickSize: Number.isFinite(draft.tickSize)
              ? Math.max(1, Number(draft.tickSize))
              : scenario.tickSize,
            processes: cloneProcesses(draft.processes),
          }
        : scenario,
    );
    syncPersistence();
  }

  function deleteScenario(id: string): void {
    scenarios.value = scenarios.value.filter((scenario) => scenario.id !== id);
    if (activeScenarioId.value === id) {
      activeScenarioId.value = scenarios.value[0]?.id ?? null;
    }
    syncPersistence();
  }

  function duplicateScenario(id: string): void {
    const source = scenarios.value.find((scenario) => scenario.id === id);
    if (!source) {
      return;
    }

    const copy = normalizeScenario({
      ...source,
      id: createId("scenario"),
      title: `${source.title} Kopie`,
      appliedAlgorithm: null,
      processes: cloneProcesses(source.processes),
    });

    scenarios.value = [copy, ...scenarios.value];
    activeScenarioId.value = copy.id;
    syncPersistence();
  }

  function applyAlgorithm(attachment: AlgorithmAttachment): void {
    if (!activeScenario.value) {
      return;
    }

    scenarios.value = scenarios.value.map((scenario) =>
      scenario.id === activeScenario.value?.id
        ? {
            ...scenario,
            runs: [
              ...(scenario.runs ?? []),
              {
                id: createId("run"),
                algorithm: attachment.algorithm,
                algorithmParams: {
                  timeQuantum: attachment.algorithmParams.timeQuantum ?? 2,
                  snapshotInterval:
                    attachment.algorithmParams.snapshotInterval ?? 1,
                  queueLevels: attachment.algorithmParams.queueLevels ?? 3,
                    strictPriorityTieBreak:
                      attachment.algorithmParams.strictPriorityTieBreak ?? "fifo",
                  lcfsMode: attachment.algorithmParams.lcfsMode ?? "preemptive",
                  lcfsTieBreak:
                    attachment.algorithmParams.lcfsTieBreak ?? "stack",
                },
              },
            ],
            activeRunIndex: Math.max(0, (scenario.runs ?? []).length),
            appliedAlgorithm: {
              algorithm: attachment.algorithm,
              algorithmParams: {
                timeQuantum: attachment.algorithmParams.timeQuantum ?? 2,
                snapshotInterval:
                  attachment.algorithmParams.snapshotInterval ?? 1,
                queueLevels: attachment.algorithmParams.queueLevels ?? 3,
                strictPriorityTieBreak:
                  attachment.algorithmParams.strictPriorityTieBreak ?? "fifo",
                lcfsMode: attachment.algorithmParams.lcfsMode ?? "preemptive",
                lcfsTieBreak:
                  attachment.algorithmParams.lcfsTieBreak ?? "stack",
              },
            },
          }
        : scenario,
    );
    syncPersistence();
  }

  function createRun(attachment: AlgorithmAttachment): void {
    applyAlgorithm(attachment);
  }

  function updateActiveRun(attachment: AlgorithmAttachment): void {
    if (!activeScenario.value) {
      return;
    }

    scenarios.value = scenarios.value.map((scenario) => {
      if (scenario.id !== activeScenario.value?.id) {
        return scenario;
      }

      const nextRuns = [...(scenario.runs ?? [])];
      const currentIndex = Math.max(0, scenario.activeRunIndex);
      if (!nextRuns[currentIndex]) {
        return scenario;
      }

      nextRuns[currentIndex] = {
        ...nextRuns[currentIndex],
        algorithm: attachment.algorithm,
        algorithmParams: {
          timeQuantum: attachment.algorithmParams.timeQuantum ?? 2,
          snapshotInterval: attachment.algorithmParams.snapshotInterval ?? 1,
          queueLevels: attachment.algorithmParams.queueLevels ?? 3,
            strictPriorityTieBreak:
              attachment.algorithmParams.strictPriorityTieBreak ?? "fifo",
          lcfsMode: attachment.algorithmParams.lcfsMode ?? "preemptive",
          lcfsTieBreak: attachment.algorithmParams.lcfsTieBreak ?? "stack",
        },
      };

      return {
        ...scenario,
        runs: nextRuns,
        appliedAlgorithm: nextRuns[currentIndex],
      };
    });

    syncPersistence();
  }

  function deleteActiveRun(): void {
    if (!activeScenario.value) {
      return;
    }

    scenarios.value = scenarios.value.map((scenario) => {
      if (scenario.id !== activeScenario.value?.id) {
        return scenario;
      }

      const nextRuns = [...(scenario.runs ?? [])];
      const currentIndex = Math.max(0, scenario.activeRunIndex);
      if (!nextRuns[currentIndex]) {
        return scenario;
      }

      nextRuns.splice(currentIndex, 1);

      const nextActiveRunIndex = nextRuns.length
        ? Math.max(0, Math.min(currentIndex, nextRuns.length - 1))
        : -1;

      return {
        ...scenario,
        runs: nextRuns,
        activeRunIndex: nextActiveRunIndex,
        appliedAlgorithm: nextRuns[nextActiveRunIndex] ?? null,
      };
    });

    syncPersistence();
  }

  function setActiveRun(index: number): void {
    if (!activeScenario.value) {
      return;
    }

    scenarios.value = scenarios.value.map((scenario) =>
      scenario.id === activeScenario.value?.id
        ? {
            ...scenario,
            activeRunIndex: Math.max(
              0,
              Math.min(index, Math.max((scenario.runs?.length ?? 0) - 1, 0)),
            ),
            appliedAlgorithm:
              scenario.runs?.[
                Math.max(
                  0,
                  Math.min(
                    index,
                    Math.max((scenario.runs?.length ?? 0) - 1, 0),
                  ),
                )
              ] ?? null,
          }
        : scenario,
    );
    syncPersistence();
  }

  function clearAlgorithm(): void {
    if (!activeScenario.value) {
      return;
    }

    scenarios.value = scenarios.value.map((scenario) =>
      scenario.id === activeScenario.value?.id
        ? { ...scenario, activeRunIndex: -1, appliedAlgorithm: null }
        : scenario,
    );
    syncPersistence();
  }

  watch(
    scenarios,
    () => {
      ensureValidActiveScenario();
      syncPersistence();
    },
    { deep: true },
  );

  watch(activeScenarioId, () => {
    syncPersistence();
  });

  ensureValidActiveScenario();

  return {
    scenarios,
    activeScenarioId,
    activeScenario,
    createScenario,
    selectScenario,
    renameScenario,
    updateScenario,
    deleteScenario,
    duplicateScenario,
    applyAlgorithm,
    createRun,
    updateActiveRun,
    setActiveRun,
    deleteActiveRun,
    clearAlgorithm,
  };
}
