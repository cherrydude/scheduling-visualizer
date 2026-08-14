import type {
  AlgorithmType,
  ProcessRuntime,
  Scenario,
  ScheduleEvent,
  SimulationMetrics,
  SimulationRun,
  SimulationSnapshot,
  TimelineSegment,
} from "@/types";

function clampInteger(
  value: number,
  minimum: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(minimum, Math.floor(value));
}

function clampPositiveInteger(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

function isAlgorithmType(value: unknown): value is AlgorithmType {
  return (
    value === "roundRobin" ||
    value === "lcfs" ||
    value === "strictPriority" ||
    value === "mlfq"
  );
}

function normalizeScenarioInput(scenario: Scenario): Scenario {
  const normalizedAlgorithm = isAlgorithmType(scenario.algorithm)
    ? scenario.algorithm
    : "roundRobin";

  const normalizedProcesses = Array.isArray(scenario.processes)
    ? scenario.processes.map((process, index) => ({
        id:
          typeof process.id === "string" && process.id.trim()
            ? process.id
            : `P${index + 1}`,
        name:
          typeof process.name === "string" && process.name.trim()
            ? process.name
            : `P${index + 1}`,
        arrivalTime: Math.max(
          0,
          Math.floor(Number(process.arrivalTime) || 0),
        ),
        burstTime: Math.max(1, Math.floor(Number(process.burstTime) || 1)),
        priority: Math.max(0, Math.floor(Number(process.priority) || 0)),
        color:
          typeof process.color === "string" && process.color.trim()
            ? process.color
            : 'var(--data-2)',
        group:
          typeof process.group === "string" && process.group.trim()
            ? process.group
            : undefined,
      }))
    : [];

  return {
    ...scenario,
    algorithm: normalizedAlgorithm,
    algorithmParams: {
      timeQuantum: clampPositiveInteger(scenario.algorithmParams?.timeQuantum, 2),
      snapshotInterval: clampPositiveInteger(
        scenario.algorithmParams?.snapshotInterval,
        1,
      ),
      queueLevels: Math.max(
        2,
        clampPositiveInteger(scenario.algorithmParams?.queueLevels, 3),
      ),
      mlfqMode:
        scenario.algorithmParams?.mlfqMode === "simplified"
          ? "simplified"
          : "classic",
      strictPriorityTieBreak:
        scenario.algorithmParams?.strictPriorityTieBreak ?? "fifo",
      lcfsMode: scenario.algorithmParams?.lcfsMode ?? "preemptive",
      lcfsTieBreak: scenario.algorithmParams?.lcfsTieBreak ?? "stack",
    },
    processes: normalizedProcesses,
  };
}

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function createRuntime(processes: Scenario["processes"]): ProcessRuntime[] {
  return processes
    .map((process) => ({
      ...process,
      remainingTime: clampInteger(process.burstTime, 1, 1),
      status: "pending" as const,
      waitingTime: 0,
      turnaroundTime: 0,
      responseTime: null,
      executedTime: 0,
      startedAt: null,
      finishedAt: null,
      queueLevel: 0,
    }))
    .sort(
      (left, right) =>
        left.arrivalTime - right.arrivalTime || left.id.localeCompare(right.id),
    );
}

function createMetrics(
  processes: ProcessRuntime[],
  currentTime: number,
  busyTicks: number,
  contextSwitches: number,
  events: ScheduleEvent[],
): SimulationMetrics {
  const completedProcesses = processes.filter(
    (process) => process.finishedAt !== null,
  );

  const averageWaitingTime = completedProcesses.length
    ? completedProcesses.reduce(
        (sum, process) => sum + process.waitingTime,
        0,
      ) / completedProcesses.length
    : null;
  const averageTurnaroundTime = completedProcesses.length
    ? completedProcesses.reduce(
        (sum, process) => sum + process.turnaroundTime,
        0,
      ) / completedProcesses.length
    : null;
  const responseTimes = completedProcesses
    .map((p) => p.responseTime)
    .filter((rt): rt is number => rt !== null && Number.isFinite(rt));
  const averageResponseTime = responseTimes.length
    ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
    : null;

  const cpuUtilization = currentTime > 0 ? busyTicks / currentTime : 0;
  const idleShare = 1 - cpuUtilization;
  const preemptionCount = events.filter(
    (event) => event.type === "preempt" || event.type === "quantumExpired",
  ).length;

  const fairnessValues = completedProcesses
    .map((process) => process.executedTime)
    .filter((value) => Number.isFinite(value) && value > 0);
  const fairnessIndex = fairnessValues.length
    ? Math.pow(
        fairnessValues.reduce((sum, value) => sum + value, 0),
        2,
      ) /
      (fairnessValues.length *
        fairnessValues.reduce((sum, value) => sum + value * value, 0))
    : null;

  return {
    averageWaitingTime,
    averageTurnaroundTime,
    averageResponseTime,
    cpuUtilization,
    idleShare,
    contextSwitches,
    preemptionCount,
    fairnessIndex,
    completedCount: completedProcesses.length,
  };
}

function quantumForLevel(baseQuantum: number, queueLevel: number): number {
  return Math.max(1, baseQuantum * (queueLevel + 1));
}

function createSnapshot(
  time: number,
  currentProcess: ProcessRuntime | null,
  readyQueue: ProcessRuntime[],
  remainingQuantum: number,
  lastEvent: ScheduleEvent | null,
  processes: ProcessRuntime[],
  busyTicks: number,
  contextSwitches: number,
  events: ScheduleEvent[],
  algorithm: AlgorithmType,
  mlfqBaseQuantum: number,
  mlfqMode: "classic" | "simplified",
): SimulationSnapshot {
  const isMlfq = algorithm === "mlfq";
  const currentQuantumTotal =
    isMlfq && currentProcess
      ? quantumForLevel(mlfqBaseQuantum, currentProcess.queueLevel ?? 0)
      : null;
  const currentQuantumUsed =
    currentQuantumTotal !== null
      ? Math.max(0, currentQuantumTotal - Math.max(0, remainingQuantum))
      : null;

  return {
    time,
    currentProcessId: currentProcess?.id ?? null,
    currentProcessName: currentProcess?.name ?? null,
    readyQueue: readyQueue.map((process) => process.name),
    readyQueueIds: readyQueue.map((process) => process.id),
    readyQueueDetails: readyQueue.map((process) => ({ id: process.id, name: process.name, queueLevel: process.queueLevel ?? 0 })),
    readyQueueLevels: readyQueue.map((process) => process.queueLevel ?? 0),
    readyQueueQuantums: isMlfq
      ? readyQueue.map((process) => {
          const level = process.queueLevel ?? 0;
          const levelQuantum = quantumForLevel(mlfqBaseQuantum, level);
          if (mlfqMode === "classic") {
            return process.mlfqRemainingQuantum ?? levelQuantum;
          }
          return levelQuantum;
        })
      : undefined,
    currentQuantumTotal,
    currentQuantumUsed,
    currentQueueLevel: currentProcess?.queueLevel ?? null,
    remainingQuantum,
    lastEvent,
    metrics: createMetrics(processes, time, busyTicks, contextSwitches, events),
  };
}

function finalizeProcess(process: ProcessRuntime, time: number): void {
  process.finishedAt = time;
  process.turnaroundTime = time - process.arrivalTime;
  process.waitingTime = process.turnaroundTime - process.burstTime;
  process.status = "finished";
}

function dispatchProcess(
  algorithm: AlgorithmType,
  time: number,
  currentProcess: ProcessRuntime | null,
  readyQueue: ProcessRuntime[],
  remainingQuantum: number,
  events: ScheduleEvent[],
  mlfqBaseQuantum: number,
  mlfqQueueLevels: number,
  mlfqMode: "classic" | "simplified",
  strictPriorityTieBreak:
    | "fifo"
    | "arrivalTime"
    | "remainingTime"
    | "waitingTime"
    | "id" = "fifo",
): {
  nextCurrent: ProcessRuntime | null;
  nextQuantum: number;
  segmentStart: number;
  contextSwitches: number;
  currentSegmentNeedsReset: boolean;
} {
  if (currentProcess || readyQueue.length === 0) {
    return {
      nextCurrent: currentProcess,
      nextQuantum: remainingQuantum,
      segmentStart: time,
      contextSwitches: 0,
      currentSegmentNeedsReset: false,
    };
  }

  const nextCurrent =
    algorithm === "mlfq"
      ? (readyQueue.shift() ?? null)
      : algorithm === "strictPriority"
      ? selectStrictPriorityProcess(readyQueue, time, strictPriorityTieBreak)
      : algorithm === "lcfs"
        ? (readyQueue.pop() ?? null)
        : (readyQueue.shift() ?? null);
  if (!nextCurrent) {
    return {
      nextCurrent: null,
      nextQuantum: remainingQuantum,
      segmentStart: time,
      contextSwitches: 0,
      currentSegmentNeedsReset: false,
    };
  }

  if (nextCurrent.startedAt === null) {
    nextCurrent.startedAt = time;
    nextCurrent.responseTime = time - nextCurrent.arrivalTime;
  }

  nextCurrent.status = "running";
  const nextQuantum =
    algorithm === "mlfq"
      ? mlfqMode === "classic"
        ? nextCurrent.mlfqRemainingQuantum && nextCurrent.mlfqRemainingQuantum > 0
          ? nextCurrent.mlfqRemainingQuantum
          : quantumForLevel(mlfqBaseQuantum, nextCurrent.queueLevel ?? 0)
        : quantumForLevel(mlfqBaseQuantum, nextCurrent.queueLevel ?? 0)
      : remainingQuantum;
  const dispatchEvent: ScheduleEvent = {
    time,
    type: "dispatch",
    processId: nextCurrent.id,
    processName: nextCurrent.name,
    algorithm,
    fromStatus: "ready",
    toStatus: "running",
    reason: `Dispatch from ready queue (${readyQueue.length + 1} total slots before selection).`,
  };
  events.push(dispatchEvent);

  return {
    nextCurrent,
    nextQuantum,
    segmentStart: time,
    contextSwitches: 1,
    currentSegmentNeedsReset: true,
  };
}

function enqueueReadyProcess(
  process: ProcessRuntime,
  algorithm: AlgorithmType,
  readyQueue: ProcessRuntime[],
  mlfqQueueLevels: number,
): void {
  process.status = "ready";

  if (algorithm === "mlfq") {
    process.queueLevel = clampInteger(process.queueLevel ?? 0, 0, mlfqQueueLevels - 1);
    const insertionIndex = readyQueue.findIndex(
      (queuedProcess) => (queuedProcess.queueLevel ?? 0) > (process.queueLevel ?? 0),
    );

    if (insertionIndex === -1) {
      readyQueue.push(process);
      return;
    }

    readyQueue.splice(insertionIndex, 0, process);
    return;
  }

  if (algorithm === "strictPriority") {
    const insertionIndex = readyQueue.findIndex(
      (queuedProcess) => queuedProcess.priority > process.priority,
    );

    if (insertionIndex === -1) {
      readyQueue.push(process);
      return;
    }

    readyQueue.splice(insertionIndex, 0, process);
    return;
  }

  readyQueue.push(process);
}

function shouldPreemptStrictPriority(
  currentProcess: ProcessRuntime | null,
  readyQueue: ProcessRuntime[],
): boolean {
  if (!currentProcess || readyQueue.length === 0) {
    return false;
  }

  return readyQueue.some(
    (queuedProcess) => queuedProcess.priority < currentProcess.priority,
  );
}

function shouldPreemptMlfq(
  currentProcess: ProcessRuntime | null,
  readyQueue: ProcessRuntime[],
): boolean {
  if (!currentProcess || readyQueue.length === 0) {
    return false;
  }

  const currentLevel = currentProcess.queueLevel ?? 0;
  return readyQueue.some(
    (queuedProcess) => (queuedProcess.queueLevel ?? 0) < currentLevel,
  );
}

function strictPriorityScore(
  process: ProcessRuntime,
  time: number,
  tieBreak:
    | "fifo"
    | "arrivalTime"
    | "remainingTime"
    | "waitingTime"
    | "id",
): number {
  switch (tieBreak) {
    case "arrivalTime":
      return process.arrivalTime;
    case "remainingTime":
      return process.remainingTime;
    case "waitingTime":
      return Math.max(0, time - process.arrivalTime - process.executedTime);
    case "id":
      return Number.POSITIVE_INFINITY;
    case "fifo":
    default:
      return Number.POSITIVE_INFINITY;
  }
}

function selectStrictPriorityProcess(
  readyQueue: ProcessRuntime[],
  time: number,
  tieBreak:
    | "fifo"
    | "arrivalTime"
    | "remainingTime"
    | "waitingTime"
    | "id",
): ProcessRuntime | null {
  if (readyQueue.length === 0) {
    return null;
  }

  let bestIndex = 0;
  for (let index = 1; index < readyQueue.length; index += 1) {
    const candidate = readyQueue[index];
    const best = readyQueue[bestIndex];

    if (candidate.priority < best.priority) {
      bestIndex = index;
      continue;
    }

    if (candidate.priority > best.priority) {
      continue;
    }

    if (tieBreak === "fifo") {
      continue;
    }

    const candidateScore = strictPriorityScore(candidate, time, tieBreak);
    const bestScore = strictPriorityScore(best, time, tieBreak);

    if (candidateScore < bestScore) {
      bestIndex = index;
      continue;
    }

    if (candidateScore > bestScore) {
      continue;
    }

    if (tieBreak === "id" && candidate.id.localeCompare(best.id) < 0) {
      bestIndex = index;
    }
  }

  const [selected] = readyQueue.splice(bestIndex, 1);
  return selected ?? null;
}

export function simulateScenario(scenario: Scenario): SimulationRun {
  const simulationScenario = normalizeScenarioInput(scenario);

  if (
    simulationScenario.algorithm !== "roundRobin" &&
    simulationScenario.algorithm !== "lcfs" &&
    simulationScenario.algorithm !== "strictPriority" &&
    simulationScenario.algorithm !== "mlfq"
  ) {
    return {
      snapshots: [],
      events: [],
      segments: [],
      finalMetrics: {
        averageWaitingTime: null,
        averageTurnaroundTime: null,
        averageResponseTime: null,
        cpuUtilization: 0,
        idleShare: 1,
        contextSwitches: 0,
        preemptionCount: 0,
        fairnessIndex: null,
        completedCount: 0,
      },
      processStates: createRuntime(simulationScenario.processes),
      totalTime: 0,
      supported: false,
      note: `Der Algorithmus ${simulationScenario.algorithm} ist fuer den ersten MVP-Schritt noch nicht implementiert.`,
    };
  }

  const processes = createRuntime(simulationScenario.processes);
  const pending = [...processes].sort(
    (left, right) =>
      left.arrivalTime - right.arrivalTime || left.id.localeCompare(right.id),
  );
  const readyQueue: ProcessRuntime[] = [];
  const events: ScheduleEvent[] = [];
  const snapshots: SimulationSnapshot[] = [];
  const segments: TimelineSegment[] = [];
  const maxTicks =
    processes.reduce((sum, process) => sum + process.burstTime, 0) +
    processes.reduce((sum, process) => Math.max(sum, process.arrivalTime), 0) +
    25;
  const quantum = clampInteger(
    simulationScenario.algorithmParams.timeQuantum ?? 2,
    1,
    2,
  );
  const lcfsMode = simulationScenario.algorithmParams.lcfsMode ?? "preemptive";
  const lcfsTieBreak = simulationScenario.algorithmParams.lcfsTieBreak ?? "stack";
  const strictPriorityTieBreak =
    simulationScenario.algorithmParams.strictPriorityTieBreak ?? "fifo";
  const mlfqQueueLevels = clampInteger(
    simulationScenario.algorithmParams.queueLevels ?? 3,
    2,
    3,
  );
  const mlfqMode =
    simulationScenario.algorithmParams.mlfqMode === "simplified"
      ? "simplified"
      : "classic";
  const mlfqBaseQuantum = clampInteger(
    simulationScenario.algorithmParams.timeQuantum ?? 2,
    1,
    2,
  );
  const snapshotInterval = clampInteger(
    simulationScenario.algorithmParams.snapshotInterval ?? 1,
    1,
    1,
  );

  let currentProcess: ProcessRuntime | null = null;
  let currentSegmentStart = 0;
  let currentSegmentLevel: number | null = null;
  let busyTicks = 0;
  let contextSwitches = 0;
  let time = 0;
  let remainingQuantum =
    simulationScenario.algorithm === "roundRobin"
      ? quantum
      : simulationScenario.algorithm === "mlfq"
        ? quantumForLevel(mlfqBaseQuantum, 0)
        : 1;
  let completedCount = 0;
  let idleSegmentStart: number | null = null;
  let lastEvent: ScheduleEvent | null = null;
  let lastSnapshotTime = -1;

  const isLcfs = simulationScenario.algorithm === "lcfs";
  const isStrictPriority = simulationScenario.algorithm === "strictPriority";

  function preemptCurrentProcess(reason: string): void {
    if (!currentProcess) {
      return;
    }

    const currentLevel = currentProcess.queueLevel ?? 0;
    if (simulationScenario.algorithm === "mlfq" && mlfqMode === "classic") {
      currentProcess.mlfqRemainingQuantum = Math.max(0, remainingQuantum);
    }
    currentProcess.status = "preempted";
    pushSegment(time);
    // For LCFS we want the newly arrived processes to be on top of the stack.
    // Since arrivals are enqueued before we call preemptCurrentProcess,
    // push the preempted process to the front so it does not become the
    // immediate top element (pop) and re-acquire the CPU.
    if (simulationScenario.algorithm === "lcfs") {
      currentProcess.status = "ready";
      currentProcess.queueLevel = 0;
      readyQueue.unshift(currentProcess);
    } else {
      enqueueReadyProcess(
        currentProcess,
        simulationScenario.algorithm,
        readyQueue,
        mlfqQueueLevels,
      );
    }
    const preemptEvent: ScheduleEvent = {
      time,
      type: "preempt",
      processId: currentProcess.id,
      processName: currentProcess.name,
      algorithm: simulationScenario.algorithm,
      fromStatus: "running",
      toStatus: "preempted",
      reason,
    };
    events.push(preemptEvent);
    lastEvent = preemptEvent;
    currentProcess = null;
    currentSegmentLevel = null;
    remainingQuantum =
      simulationScenario.algorithm === "roundRobin"
        ? quantum
        : simulationScenario.algorithm === "mlfq"
          ? mlfqMode === "classic"
            ? 0
            : quantumForLevel(mlfqBaseQuantum, currentLevel)
          : 1;
    currentSegmentStart = time;
  }

  function maybeSnapshot(force: boolean) {
    if (
      !force &&
      snapshots.length > 0 &&
      time - lastSnapshotTime < snapshotInterval
    ) {
      return;
    }

    snapshots.push(
      createSnapshot(
        time,
        currentProcess,
        readyQueue,
        remainingQuantum,
        lastEvent,
        processes,
        busyTicks,
        contextSwitches,
        events,
        simulationScenario.algorithm,
        mlfqBaseQuantum,
        mlfqMode,
      ),
    );
    lastSnapshotTime = time;
  }

  function pushSegment(endTime: number): void {
    if (!currentProcess) {
      return;
    }

    const segmentQueueLevel =
      simulationScenario.algorithm === "mlfq"
        ? (currentSegmentLevel ?? currentProcess.queueLevel ?? 0)
        : currentProcess.queueLevel;

    segments.push({
      processId: currentProcess.id,
      processName: currentProcess.name,
      start: currentSegmentStart,
      end: endTime,
      color: currentProcess.color,
      queueLevel: segmentQueueLevel,
    });
  }

  function pushIdleSegment(endTime: number): void {
    if (idleSegmentStart === null) {
      return;
    }

    segments.push({
      processId: null,
      processName: "Idle",
      start: idleSegmentStart,
      end: endTime,
      color: 'var(--data-16)',
      idle: true,
    });

    idleSegmentStart = null;
  }

  function enqueueArrivals(atTime: number): boolean {
    const arrivals: ProcessRuntime[] = [];
    while (pending.length && pending[0].arrivalTime <= atTime) {
      arrivals.push(pending.shift() as ProcessRuntime);
    }

    if (isLcfs && lcfsTieBreak === "id") {
      arrivals.sort((left, right) => right.id.localeCompare(left.id));
    }

    for (const process of arrivals) {
      process.queueLevel = 0;
      if (simulationScenario.algorithm === "mlfq" && mlfqMode === "classic") {
        process.mlfqRemainingQuantum = quantumForLevel(mlfqBaseQuantum, 0);
      }
      enqueueReadyProcess(
        process,
        simulationScenario.algorithm,
        readyQueue,
        mlfqQueueLevels,
      );

      const arrivalEvent: ScheduleEvent = {
        time: atTime,
        type: "arrival",
        processId: process.id,
        processName: process.name,
        algorithm: simulationScenario.algorithm,
        fromStatus: "pending",
        toStatus: "ready",
        reason: `Process ${process.name} arrived and joined the ready queue.`,
      };
      events.push(arrivalEvent);
      lastEvent = arrivalEvent;
    }

    return arrivals.length > 0;
  }

  enqueueArrivals(time);
  maybeSnapshot(true);

  while (completedCount < processes.length && time <= maxTicks) {
    if (!currentProcess && readyQueue.length === 0) {
      idleSegmentStart ??= time;
      time += 1;
      enqueueArrivals(time);
      maybeSnapshot(false);
      continue;
    }

    if (!currentProcess) {
      const dispatch = dispatchProcess(
        simulationScenario.algorithm,
        time,
        currentProcess,
        readyQueue,
        remainingQuantum,
        events,
        mlfqBaseQuantum,
        mlfqQueueLevels,
        mlfqMode,
        strictPriorityTieBreak,
      );
      currentProcess = dispatch.nextCurrent;
      remainingQuantum = dispatch.nextQuantum;
      currentSegmentLevel = currentProcess?.queueLevel ?? null;
      currentSegmentStart = dispatch.currentSegmentNeedsReset
        ? time
        : currentSegmentStart;
      contextSwitches += dispatch.contextSwitches;

      if (
        dispatch.contextSwitches > 0 &&
        lastEvent?.processId &&
        lastEvent.processId !== currentProcess?.id
      ) {
        const contextSwitchEvent: ScheduleEvent = {
          time,
          type: "contextSwitch",
          processId: currentProcess?.id ?? null,
          processName: currentProcess?.name ?? null,
          algorithm: simulationScenario.algorithm,
          reason: `Context switch to ${currentProcess?.name ?? "idle"}.`,
        };
        events.push(contextSwitchEvent);
        lastEvent = contextSwitchEvent;
      }

      if (currentProcess) {
        currentSegmentLevel = currentProcess.queueLevel ?? null;
        currentSegmentStart = time;
        const startEvent: ScheduleEvent = {
          time,
          type: "start",
          processId: currentProcess.id,
          processName: currentProcess.name,
          algorithm: simulationScenario.algorithm,
          fromStatus: "ready",
          toStatus: "running",
          reason: `Process ${currentProcess.name} begins execution.`,
        };
        events.push(startEvent);
        lastEvent = startEvent;
      }
    }

    if (!currentProcess) {
      maybeSnapshot(false);
      continue;
    }

    if (currentProcess.startedAt === null) {
      currentProcess.startedAt = time;
      currentProcess.responseTime = time - currentProcess.arrivalTime;
    }

    busyTicks += 1;
    currentProcess.executedTime += 1;
    currentProcess.remainingTime -= 1;
    remainingQuantum -= 1;
    if (simulationScenario.algorithm === "mlfq" && mlfqMode === "classic") {
      currentProcess.mlfqRemainingQuantum = Math.max(0, remainingQuantum);
    }
    time += 1;

    const arrivedNow = enqueueArrivals(time);

    if (
      isLcfs &&
      lcfsMode === "preemptive" &&
      arrivedNow &&
      currentProcess.remainingTime > 0
    ) {
      preemptCurrentProcess(
        `New arrival preempts ${currentProcess.name} in LCFS preemptive mode.`,
      );
    }

    if (
      isStrictPriority &&
      currentProcess.remainingTime > 0 &&
      shouldPreemptStrictPriority(currentProcess, readyQueue)
    ) {
      preemptCurrentProcess(
        `A higher-priority process preempts ${currentProcess.name}.`,
      );
    }

    if (
      simulationScenario.algorithm === "mlfq" &&
      currentProcess.remainingTime > 0 &&
      remainingQuantum > 0 &&
      shouldPreemptMlfq(currentProcess, readyQueue)
    ) {
      preemptCurrentProcess(
        `A higher-level queue preempts ${currentProcess.name}.`,
      );
    }

    if (!currentProcess) {
      const dispatch = dispatchProcess(
        simulationScenario.algorithm,
        time,
        currentProcess,
        readyQueue,
        remainingQuantum,
        events,
        mlfqBaseQuantum,
        mlfqQueueLevels,
        mlfqMode,
        strictPriorityTieBreak,
      );
      currentProcess = dispatch.nextCurrent;
      remainingQuantum = dispatch.nextQuantum;
      if (dispatch.currentSegmentNeedsReset) {
        currentSegmentStart = time;
      }
      contextSwitches += dispatch.contextSwitches;

      if (currentProcess) {
        pushIdleSegment(time);
        const startEvent: ScheduleEvent = {
          time,
          type: "start",
          processId: currentProcess.id,
          processName: currentProcess.name,
          algorithm: simulationScenario.algorithm,
          fromStatus: "ready",
          toStatus: "running",
          reason: `Process ${currentProcess.name} takes the CPU.`,
        };
        events.push(startEvent);
        lastEvent = startEvent;
      }

      maybeSnapshot(false);
      continue;
    }

    if (currentProcess.remainingTime <= 0) {
      pushSegment(time);
      finalizeProcess(currentProcess, time);
      completedCount += 1;
      const finishEvent: ScheduleEvent = {
        time,
        type: "finish",
        processId: currentProcess.id,
        processName: currentProcess.name,
        algorithm: simulationScenario.algorithm,
        fromStatus: "running",
        toStatus: "finished",
        reason: `Process ${currentProcess.name} completed execution.`,
      };
      events.push(finishEvent);
      lastEvent = finishEvent;
      currentProcess = null;
      remainingQuantum =
        simulationScenario.algorithm === "mlfq" ? mlfqBaseQuantum : quantum;
      currentSegmentStart = time;
      currentSegmentLevel = null;
      pushIdleSegment(time);
    } else if (remainingQuantum <= 0 && simulationScenario.algorithm === "mlfq") {
      const currentLevel = currentProcess.queueLevel ?? 0;
      const nextLevel = Math.min(currentLevel + 1, mlfqQueueLevels - 1);
      currentProcess.queueLevel = nextLevel;
      if (mlfqMode === "classic") {
        currentProcess.mlfqRemainingQuantum = quantumForLevel(mlfqBaseQuantum, nextLevel);
      }
      currentProcess.status = "preempted";
      pushSegment(time);
      enqueueReadyProcess(
        currentProcess,
        simulationScenario.algorithm,
        readyQueue,
        mlfqQueueLevels,
      );
      const quantumExpiredEvent: ScheduleEvent = {
        time,
        type: "quantumExpired",
        processId: currentProcess.id,
        processName: currentProcess.name,
        algorithm: simulationScenario.algorithm,
        fromStatus: "running",
        toStatus: "preempted",
        reason: `Time quantum expired for ${currentProcess.name}; demoted to queue level ${nextLevel + 1}.`,
      };
      events.push(quantumExpiredEvent);
      lastEvent = quantumExpiredEvent;
      currentProcess = null;
      remainingQuantum = mlfqMode === "classic"
        ? 0
        : quantumForLevel(mlfqBaseQuantum, nextLevel);
      currentSegmentStart = time;
      currentSegmentLevel = null;
      pushIdleSegment(time);
    } else if (remainingQuantum <= 0 && simulationScenario.algorithm === "roundRobin") {
      if (readyQueue.length > 0) {
        currentProcess.status = "preempted";
        pushSegment(time);
        enqueueReadyProcess(
          currentProcess,
          simulationScenario.algorithm,
          readyQueue,
          mlfqQueueLevels,
        );
        const preemptEvent: ScheduleEvent = {
          time,
          type: "preempt",
          processId: currentProcess.id,
          processName: currentProcess.name,
          algorithm: simulationScenario.algorithm,
          fromStatus: "running",
          toStatus: "preempted",
          reason: `Time quantum expired for ${currentProcess.name}; it returns to the ready queue.`,
        };
        events.push(preemptEvent);
        lastEvent = preemptEvent;
        currentProcess = null;
        remainingQuantum = quantum;
        currentSegmentStart = time;
        currentSegmentLevel = null;
      } else {
        remainingQuantum = quantum;
      }
    }

    maybeSnapshot(false);
  }

  if (currentProcess) {
    pushSegment(time);
  } else if (idleSegmentStart !== null) {
    pushIdleSegment(time);
  }

  // ensure final snapshot present
  maybeSnapshot(true);

  const finalMetrics = createMetrics(
    processes,
    time,
    busyTicks,
    contextSwitches,
    events,
  );

  return {
    snapshots,
    events,
    segments,
    finalMetrics,
    processStates: processes,
    totalTime: time,
    supported: true,
  };
}

export function createSeededScenarioProcesses(
  seed: number,
  count: number,
): Scenario["processes"] {
  const random = seededRandom(seed);
  const palette = [
    'var(--data-1)',
    'var(--data-2)',
    'var(--data-3)',
    'var(--data-4)',
    'var(--data-6)',
    'var(--data-5)',
  ];

  return Array.from({ length: count }, (_, index) => {
    const arrivalTime =
      index === 0 ? 0 : clampInteger(Math.round(random() * 6), 0, 0);
    const burstTime = clampInteger(Math.round(2 + random() * 6), 1, 3);
    const priority = clampInteger(Math.round(1 + random() * 4), 1, 1);

    return {
      id: `P${index + 1}`,
      name: `P${index + 1}`,
      arrivalTime,
      burstTime,
      priority,
      color: palette[index % palette.length],
      group: index % 2 === 0 ? "A" : "B",
    };
  });
}
