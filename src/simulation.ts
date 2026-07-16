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
  const averageResponseTime = completedProcesses.length
    ? completedProcesses.reduce(
        (sum, process) => sum + (process.responseTime ?? 0),
        0,
      ) / completedProcesses.length
    : null;

  const cpuUtilization = currentTime > 0 ? busyTicks / currentTime : 0;
  const idleShare = 1 - cpuUtilization;

  const fairnessValues = completedProcesses
    .map((process) => process.executedTime || process.burstTime)
    .filter((value) => value > 0);
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
    fairnessIndex,
    completedCount: completedProcesses.length,
  };
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
): SimulationSnapshot {
  return {
    time,
    currentProcessId: currentProcess?.id ?? null,
    currentProcessName: currentProcess?.name ?? null,
    readyQueue: readyQueue.map((process) => process.name),
    remainingQuantum,
    lastEvent,
    metrics: createMetrics(processes, time, busyTicks, contextSwitches),
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

  const nextCurrent = readyQueue.shift() ?? null;
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
    nextQuantum: remainingQuantum,
    segmentStart: time,
    contextSwitches: 1,
    currentSegmentNeedsReset: true,
  };
}

export function simulateScenario(scenario: Scenario): SimulationRun {
  if (scenario.algorithm !== "roundRobin") {
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
        fairnessIndex: null,
        completedCount: 0,
      },
      processStates: createRuntime(scenario.processes),
      totalTime: 0,
      supported: false,
      note: `Der Algorithmus ${scenario.algorithm} ist fuer den ersten MVP-Schritt noch nicht implementiert.`,
    };
  }

  const processes = createRuntime(scenario.processes);
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
  const quantum = clampInteger(scenario.algorithmParams.timeQuantum ?? 2, 1, 2);
  const snapshotInterval = clampInteger(
    scenario.algorithmParams.snapshotInterval ?? 1,
    1,
    1,
  );

  let currentProcess: ProcessRuntime | null = null;
  let currentSegmentStart = 0;
  let busyTicks = 0;
  let contextSwitches = 0;
  let time = 0;
  let remainingQuantum = quantum;
  let completedCount = 0;
  let idleSegmentStart: number | null = null;
  let lastEvent: ScheduleEvent | null = null;
  let lastSnapshotTime = -1;

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
      ),
    );
    lastSnapshotTime = time;
  }

  function pushSegment(endTime: number): void {
    if (!currentProcess) {
      return;
    }

    segments.push({
      processId: currentProcess.id,
      processName: currentProcess.name,
      start: currentSegmentStart,
      end: endTime,
      color: currentProcess.color,
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
      color: "#64748b",
      idle: true,
    });

    idleSegmentStart = null;
  }

  function enqueueArrivals(atTime: number): void {
    while (pending.length && pending[0].arrivalTime <= atTime) {
      const process = pending.shift() as ProcessRuntime;
      process.status = "ready";
      readyQueue.push(process);

      const arrivalEvent: ScheduleEvent = {
        time: atTime,
        type: "arrival",
        processId: process.id,
        processName: process.name,
        algorithm: scenario.algorithm,
        fromStatus: "pending",
        toStatus: "ready",
        reason: `Process ${process.name} arrived and joined the ready queue.`,
      };
      events.push(arrivalEvent);
      lastEvent = arrivalEvent;
    }
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
        scenario.algorithm,
        time,
        currentProcess,
        readyQueue,
        remainingQuantum,
        events,
      );
      currentProcess = dispatch.nextCurrent;
      remainingQuantum = dispatch.nextQuantum;
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
          algorithm: scenario.algorithm,
          reason: `Context switch to ${currentProcess?.name ?? "idle"}.`,
        };
        events.push(contextSwitchEvent);
        lastEvent = contextSwitchEvent;
      }

      if (currentProcess) {
        currentSegmentStart = time;
        const startEvent: ScheduleEvent = {
          time,
          type: "start",
          processId: currentProcess.id,
          processName: currentProcess.name,
          algorithm: scenario.algorithm,
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
    time += 1;

    enqueueArrivals(time);

    if (currentProcess.remainingTime <= 0) {
      pushSegment(time);
      finalizeProcess(currentProcess, time);
      completedCount += 1;
      const finishEvent: ScheduleEvent = {
        time,
        type: "finish",
        processId: currentProcess.id,
        processName: currentProcess.name,
        algorithm: scenario.algorithm,
        fromStatus: "running",
        toStatus: "finished",
        reason: `Process ${currentProcess.name} completed execution.`,
      };
      events.push(finishEvent);
      lastEvent = finishEvent;
      currentProcess = null;
      remainingQuantum = quantum;
      currentSegmentStart = time;
      pushIdleSegment(time);
    } else if (remainingQuantum <= 0) {
      if (readyQueue.length > 0) {
        currentProcess.status = "preempted";
        pushSegment(time);
        readyQueue.push(currentProcess);
        const preemptEvent: ScheduleEvent = {
          time,
          type: "preempt",
          processId: currentProcess.id,
          processName: currentProcess.name,
          algorithm: scenario.algorithm,
          fromStatus: "running",
          toStatus: "preempted",
          reason: `Time quantum expired for ${currentProcess.name}; it returns to the ready queue.`,
        };
        events.push(preemptEvent);
        lastEvent = preemptEvent;
        currentProcess = null;
        remainingQuantum = quantum;
        currentSegmentStart = time;
      } else {
        remainingQuantum = quantum;
      }
    }

    if (!currentProcess) {
      const dispatch = dispatchProcess(
        scenario.algorithm,
        time,
        currentProcess,
        readyQueue,
        remainingQuantum,
        events,
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
          algorithm: scenario.algorithm,
          fromStatus: "ready",
          toStatus: "running",
          reason: `Process ${currentProcess.name} takes the CPU.`,
        };
        events.push(startEvent);
        lastEvent = startEvent;
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
    "#7dd3fc",
    "#60a5fa",
    "#34d399",
    "#fbbf24",
    "#f87171",
    "#a78bfa",
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
