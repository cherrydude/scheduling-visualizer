export type AlgorithmType = 'roundRobin' | 'lcfs' | 'strictPriority' | 'mlfq';

export interface ProcessInput {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color: string;
  group?: string;
}

export interface AlgorithmParams {
  timeQuantum?: number;
  /** Anzahl Ticks zwischen automatischen Snapshots (1 = jeder Tick) */
  snapshotInterval?: number;
  queueLevels?: number;
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

export type ProcessStatus = 'pending' | 'ready' | 'running' | 'waiting' | 'blocked' | 'preempted' | 'finished';

export interface ProcessRuntime extends ProcessInput {
  remainingTime: number;
  status: ProcessStatus;
  waitingTime: number;
  turnaroundTime: number;
  responseTime: number | null;
  executedTime: number;
  startedAt: number | null;
  finishedAt: number | null;
}

export type EventType = 'arrival' | 'dispatch' | 'start' | 'preempt' | 'finish' | 'idle' | 'quantumExpired' | 'contextSwitch';

export interface ScheduleEvent {
  time: number;
  type: EventType;
  processId: string | null;
  processName: string | null;
  algorithm: AlgorithmType;
  fromStatus?: ProcessStatus | 'idle';
  toStatus?: ProcessStatus | 'idle';
  reason: string;
}

export interface TimelineSegment {
  processId: string | null;
  processName: string;
  start: number;
  end: number;
  color: string;
  idle?: boolean;
}

export interface SimulationMetrics {
  averageWaitingTime: number | null;
  averageTurnaroundTime: number | null;
  averageResponseTime: number | null;
  cpuUtilization: number;
  idleShare: number;
  contextSwitches: number;
  fairnessIndex: number | null;
  completedCount: number;
}

export interface SimulationSnapshot {
  time: number;
  currentProcessId: string | null;
  currentProcessName: string | null;
  readyQueue: string[];
  remainingQuantum: number;
  lastEvent: ScheduleEvent | null;
  metrics: SimulationMetrics;
}

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
