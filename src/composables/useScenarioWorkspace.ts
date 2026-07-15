import { computed, ref, watch } from 'vue';
import type { AlgorithmParams, AlgorithmType, ProcessInput } from '@/types';

export interface AlgorithmAttachment {
  algorithm: AlgorithmType;
  algorithmParams: AlgorithmParams;
}

export interface ScenarioDraft {
  title: string;
  description: string;
  seed: number;
  tickSize: number;
  processes: ProcessInput[];
}

export interface ScenarioRecord extends ScenarioDraft {
  id: string;
  appliedAlgorithm: AlgorithmAttachment | null;
}

const STORAGE_KEY = 'scheduling-visualizer.scenarios.v1';
const ACTIVE_KEY = 'scheduling-visualizer.active-scenario.v1';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneProcesses(processes: ProcessInput[]): ProcessInput[] {
  return processes.map((process) => ({ ...process }));
}

function normalizeScenario(record: Partial<ScenarioRecord>): ScenarioRecord {
  return {
    id: typeof record.id === 'string' && record.id ? record.id : createId('scenario'),
    title: record.title || 'Benutzer-Szenario',
    description: record.description || 'Vom Szenario-Generator erstelltes Beispiel.',
    seed: Number.isFinite(record.seed) ? Number(record.seed) : 17,
    tickSize: Number.isFinite(record.tickSize) ? Math.max(1, Number(record.tickSize)) : 1,
    processes: Array.isArray(record.processes) ? cloneProcesses(record.processes) : [],
    appliedAlgorithm: record.appliedAlgorithm
      ? {
          algorithm: record.appliedAlgorithm.algorithm,
          algorithmParams: {
            timeQuantum: record.appliedAlgorithm.algorithmParams?.timeQuantum ?? 2,
            snapshotInterval: record.appliedAlgorithm.algorithmParams?.snapshotInterval ?? 1,
            queueLevels: record.appliedAlgorithm.algorithmParams?.queueLevels ?? 3,
          },
        }
      : null,
  };
}

function loadScenarios(): ScenarioRecord[] {
  if (typeof window === 'undefined') {
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
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_KEY) || null;
}

function persistScenarios(scenarios: ScenarioRecord[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function createBlankScenarioDraft(): ScenarioDraft {
  return {
    title: '',
    description: '',
    seed: 17,
    tickSize: 1,
    processes: [],
  };
}

export function useScenarioWorkspace() {
  const scenarios = ref<ScenarioRecord[]>(loadScenarios());
  const activeScenarioId = ref<string | null>(loadActiveScenarioId());

  const activeScenario = computed(() =>
    scenarios.value.find((scenario) => scenario.id === activeScenarioId.value) ?? null,
  );

  function persistActiveScenarioId(id: string | null): void {
    if (typeof window === 'undefined') {
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
    if (activeScenarioId.value && scenarios.value.some((scenario) => scenario.id === activeScenarioId.value)) {
      return;
    }

    activeScenarioId.value = scenarios.value[0]?.id ?? null;
  }

  function createScenario(draft: ScenarioDraft): ScenarioRecord {
    const scenario = normalizeScenario({
      id: createId('scenario'),
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
      scenario.id === id ? { ...scenario, title: title || scenario.title } : scenario,
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
      id: createId('scenario'),
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
            appliedAlgorithm: {
              algorithm: attachment.algorithm,
              algorithmParams: {
                timeQuantum: attachment.algorithmParams.timeQuantum ?? 2,
                snapshotInterval: attachment.algorithmParams.snapshotInterval ?? 1,
                queueLevels: attachment.algorithmParams.queueLevels ?? 3,
              },
            },
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
      scenario.id === activeScenario.value?.id ? { ...scenario, appliedAlgorithm: null } : scenario,
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
    deleteScenario,
    duplicateScenario,
    applyAlgorithm,
    clearAlgorithm,
  };
}