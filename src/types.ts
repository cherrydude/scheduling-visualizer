/** Alle im Simulator verfügbaren Scheduling-Strategien. */
export type AlgorithmType =
  | "roundRobin"
  | "lcfs"
  | "strictPriority"
  | "mlfq"
  | "sjf";

/** Unveränderliche Eingabedaten eines Prozesses innerhalb eines Szenarios. */
export interface ProcessInput {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color: string;
  group?: string;
}

/** Optionale Parameter, die das Verhalten eines Algorithmus konkretisieren. */
export interface AlgorithmParams {
  timeQuantum?: number;
  /** Anzahl Ticks zwischen automatischen Snapshots (1 = jeder Tick) */
  snapshotInterval?: number;
  queueLevels?: number;
  sjfMode?: "preemptive";
  mlfqMode?: "classic" | "simplified";
  strictPriorityTieBreak?:
    | "fifo"
    | "arrivalTime"
    | "remainingTime"
    | "waitingTime"
    | "id";
  lcfsMode?: "preemptive";
  lcfsTieBreak?: "stack" | "id";
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  algorithm: AlgorithmType;
  algorithmParams: AlgorithmParams;
  seed: number;
  tickSize: number;
  processes: ProcessInput[];
}

export type ProcessStatus =
  | "pending"
  | "ready"
  | "running"
  | "waiting"
  | "blocked"
  | "preempted"
  | "finished";

/** Laufzeitstatus eines Prozesses inklusive während der Simulation berechneter Werte. */
export interface ProcessRuntime extends ProcessInput {
  remainingTime: number;
  status: ProcessStatus;
  waitingTime: number;
  turnaroundTime: number;
  responseTime: number | null;
  executedTime: number;
  startedAt: number | null;
  finishedAt: number | null;
  queueLevel?: number;
  mlfqRemainingQuantum?: number;
}

/** Ereignisse bilden den fachlichen Ablauf der Zustandsmaschine ab. */
export type EventType =
  | "arrival"
  | "dispatch"
  | "start"
  | "preempt"
  | "finish"
  | "idle"
  | "quantumExpired"
  | "contextSwitch";

/** Ein protokollierter Zustands- oder Scheduling-Übergang. */
export interface ScheduleEvent {
  time: number;
  type: EventType;
  processId: string | null;
  processName: string | null;
  algorithm: AlgorithmType;
  fromStatus?: ProcessStatus | "idle";
  toStatus?: ProcessStatus | "idle";
  reason: string;
}

/** Ein zusammenhängender Abschnitt im Gantt-Diagramm. */
export interface TimelineSegment {
  processId: string | null;
  processName: string;
  start: number;
  end: number;
  color: string;
  idle?: boolean;
  queueLevel?: number;
}

/** Kennzahlen eines Zwischenstands oder eines abgeschlossenen Simulationslaufs. */
export interface SimulationMetrics {
  averageWaitingTime: number | null;
  averageTurnaroundTime: number | null;
  averageResponseTime: number | null;
  maxWaitingTime: number | null;
  cpuUtilization: number;
  idleShare: number;
  contextSwitches: number;
  preemptionCount: number;
  completedCount: number;
}

/** Serialisierbarer UI-Zwischenstand für Scrubber, Playback und Detailansichten. */
export interface SimulationSnapshot {
  time: number;
  currentProcessId: string | null;
  currentProcessName: string | null;
  currentQueueLevel?: number | null;
  readyQueue: string[];
  readyQueueLevels?: number[];
  readyQueueQuantums?: Array<number | null>;
  currentQuantumTotal?: number | null;
  currentQuantumUsed?: number | null;
  remainingQuantum: number;
  lastEvent: ScheduleEvent | null;
  metrics: SimulationMetrics;
}

/** Vollständiges Ergebnis eines Simulationslaufs. */
export interface SimulationRun {
  snapshots: SimulationSnapshot[];
  events: ScheduleEvent[];
  segments: TimelineSegment[];
  finalMetrics: SimulationMetrics;
  processStates: ProcessRuntime[];
  totalTime: number;
  supported: boolean;
  note?: string;
}
