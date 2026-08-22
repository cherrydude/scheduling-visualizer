<template>
  <div ref="root" class="gantt-gsap-root">
    <div
      data-tour="playback-controls"
      class="controls"
      :class="{ 'controls--disabled': !controlsEnabled }"
    >
      <button
        @click="handlePlay"
        data-tour="play"
        aria-label="Play"
        title="Visualisierung starten oder fortsetzen"
        :disabled="!controlsEnabled"
      >
        Start
      </button>
      <button
        @click="handlePause"
        aria-label="Pause"
        title="Visualisierung anhalten"
        :disabled="!controlsEnabled"
      >
        Pause
      </button>
      <button
        @click="handleStep(-1)"
        aria-label="Step Back"
        title="Einen Takt zurück"
        :disabled="!controlsEnabled"
      >
        ←
      </button>
      <button
        @click="handleStep(1)"
        aria-label="Step Forward"
        title="Einen Takt vor"
        :disabled="!controlsEnabled"
      >
        →
      </button>
      <button
        @click="handleReset"
        aria-label="Reset"
        title="Visualisierung zurücksetzen"
        :disabled="!controlsEnabled"
      >
        Reset
      </button>
      <label class="loop-control">
        <input
          type="checkbox"
          v-model="loopPlayback"
          :disabled="!controlsEnabled"
          title="Visualisierung im Endlosmodus laufen lassen"
        />
        Endlos
      </label>
      <input
        type="range"
        step="1"
        :min="0"
        :max="timelineMax"
        v-model.number="sliderTime"
        :disabled="!controlsEnabled"
        title="Zeitpunkt manuell wählen"
      />
      <span class="time-label">{{ sliderTime }}</span>
    </div>

    <Gantt
      :segments="segments"
      :tickMarks="tickMarks"
      :cellWidth="cellWidth"
      :chartHeight="renderChartHeight"
      :segmentHeight="segmentHeight"
      :viewBox="renderViewBox"
      :offsetX="offsetX"
      :currentTime="currentTime"
      :layoutVariant="props.layoutVariant"
      :layoutPhase="props.layoutPhase"
      :algorithm="props.algorithm"
      :queueLevels="props.queueLevels"
      :preemptedProcessId="props.preemptedProcessId"
      :preemptTime="props.preemptTime"
      :stretchWidth="props.stretchWidth"
      @segmentEnter="onSegmentEnter"
      @segmentLeave="onSegmentLeave"
      @segmentClick="onSegmentClick"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  watch,
} from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Gantt from "./Gantt.vue";
import type { TimelineSegment } from "@/types";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps<{
  segments: TimelineSegment[];
  tickMarks?: number[];
  cellWidth?: number;
  chartHeight?: number;
  segmentHeight?: number;
  viewBox?: string;
  offsetX?: number;
  tickSize?: number;
  currentTime?: number;
  transitionFromSegments?: TimelineSegment[] | null;
  loop?: boolean;
  activeId?: string | null;
  controlsEnabled?: boolean;
  introAnimation?: boolean;
  layoutVariant?: "push" | "smooth";
  layoutPhase?: "preview" | "activation" | "settle" | "running";
  algorithm?: string;
  queueLevels?: number;
  preemptedProcessId?: string | null;
  preemptTime?: number | null;
  stretchWidth?: boolean;
}>();

const emit = defineEmits([
  "seek",
  "play",
  "pause",
  "reset",
  "step",
  "update:loop",
] as const);

const root = ref<HTMLElement | null>(null);
const tl: { current?: GSAPTimeline } = {};
let ctx: ReturnType<typeof gsap.context> | null = null;
const loopPlayback = ref(!!props.loop);
let onWheel: ((ev: WheelEvent) => void) | null = null;
const preemptMode = ref<"flyin" | "flip" | "overlay">("flyin");
const launchMorphPending = ref(false);

const sliderTime = computed({
  get: () => props.currentTime ?? 0,
  set: (value: number) => {
    emit("seek", Number(value) || 0);
  },
});

// sync incoming prop -> local
watch(
  () => props.loop,
  (v) => {
    loopPlayback.value = !!v;
  },
);

// emit changes to parent (v-model:loop)
watch(loopPlayback, (v) => {
  emit("update:loop", v);
});

const segments = computed(() => props.segments ?? []);
const timelineMax = computed(() => {
  if (props.tickMarks && props.tickMarks.length) {
    return Math.max(...props.tickMarks);
  }

  if (!segments.value.length) return 0;
  return Math.max(...segments.value.map((s) => s.end));
});

const tickMarks = computed(() => {
  const t = timelineMax.value;
  return Array.from({ length: Math.max(1, t + 1) }, (_, i) => i);
});

const cellWidth = props.cellWidth ?? 40;
const chartHeight = props.chartHeight ?? 260;
const segmentHeight = props.segmentHeight ?? 32;
const viewBox = props.viewBox ?? `0 0 1200 ${chartHeight}`;
const offsetX = props.offsetX ?? 80;
const isMlfqLayout = computed(() => props.algorithm === "mlfq");
const mlfqLevelCount = computed(() => Math.max(2, props.queueLevels ?? 3));
const laneGap = 14;
const laneTop = 28;
const laneStride = segmentHeight + laneGap;
const renderChartHeight = computed(() =>
  Math.max(
    chartHeight,
    isMlfqLayout.value
      ? laneTop + (mlfqLevelCount.value - 1) * laneStride + segmentHeight + 22
      : chartHeight,
  ),
);
const renderViewBox = computed(() => {
  const width = Number.parseFloat(viewBox.split(" ")[2] ?? "1200") || 1200;
  return `0 0 ${width} ${renderChartHeight.value}`;
});
const controlsEnabled = computed(() => props.controlsEnabled !== false);
const introAnimation = computed(() => props.introAnimation !== false);
const prefersReducedMotion =
  typeof window !== "undefined" &&
  (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false);
const shouldAnimate = computed(
  () => !prefersReducedMotion && introAnimation.value,
);
const debugPreemption = import.meta.env.DEV;

function hasGsapTargets(target: unknown): boolean {
  return Array.isArray(target) ? target.length > 0 : Boolean(target);
}

function logPreemptionDebug(
  message: string,
  details?: Record<string, unknown>,
) {
  if (!debugPreemption) return;

  if (details) {
    console.debug(`[Gantt preempt] ${message}`, details);
    return;
  }

  console.debug(`[Gantt preempt] ${message}`);
}

watch(
  () => props.layoutPhase,
  (phase, previousPhase) => {
    if (phase === "activation" || phase === "settle") {
      launchMorphPending.value = true;
      return;
    }

    if (
      phase === "running" &&
      launchMorphPending.value &&
      previousPhase !== "running"
    ) {
      launchMorphPending.value = false;
      void nextTick(() => {
        runLaunchMorph();
      });
      return;
    }

    if (phase === "preview") {
      launchMorphPending.value = false;
    }
  },
  { immediate: true },
);

// trigger a GSAP flare when a preemption occurs
watch(
  () => [props.preemptedProcessId, props.preemptTime, props.currentTime],
  ([pid, ptime, ct]) => {
    if (props.layoutPhase !== "running") {
      logPreemptionDebug("skip: not in running phase", {
        layoutPhase: props.layoutPhase,
        pid,
        preemptTime: ptime,
        currentTime: ct,
      });
      return;
    }

    if (!pid || ptime === null || ptime === undefined) {
      logPreemptionDebug("skip: missing preemption payload", {
        pid,
        preemptTime: ptime,
        currentTime: ct,
      });
      return;
    }
    const pTimeNum = Number(ptime);
    const ctNum = Number(ct);
    // tolerance of +/- 1 tick to account for timing/rounding differences
    if (Number.isNaN(ctNum) || Math.abs(ctNum - pTimeNum) > 1) {
      logPreemptionDebug("skip: time mismatch", {
        pid,
        preemptTime: pTimeNum,
        currentTime: ctNum,
      });
      return;
    }

    // find preempt pulse elements and apply a GSAP flare that runs
    // independently of the numeric timeline. Ensure the effect
    // lasts at least 2 seconds so it's always noticeable.
    const rootEl = root.value;
    if (!rootEl) return;
    const pulses = Array.from(
      rootEl.querySelectorAll<SVGElement>(".preempt-pulse"),
    );
    if (!shouldAnimate.value) {
      logPreemptionDebug(
        "skip animation due to prefers-reduced-motion or introAnimation=false",
      );
      return;
    }
    logPreemptionDebug("flare targets", {
      count: pulses.length,
      pid,
      ptime: pTimeNum,
    });
    const flareScaleDuration = 0.7; // seconds per scale tween
    const flareRepeat = 2; // repeats -> contributes to total duration
    const flareFadeDuration = 0.6; // fade out after scale tweens
    const computedMs =
      (flareScaleDuration * (flareRepeat + 1) + flareFadeDuration) * 1000;
    const totalFlareMs = Math.max(3000, Math.round(computedMs));

    pulses.forEach((el) => {
      const pulseTl = gsap.timeline({ overwrite: false });
      pulseTl.fromTo(
        el,
        { scale: 0.98, opacity: 0.95, filter: "blur(0px)" },
        {
          scale: 1.22,
          opacity: 0.95,
          duration: flareScaleDuration,
          ease: "power2.out",
          yoyo: true,
          repeat: flareRepeat,
        },
      );
      pulseTl.to(
        el,
        {
          filter: "blur(6px)",
          duration: flareScaleDuration,
          yoyo: true,
          repeat: flareRepeat,
          ease: "power2.out",
        },
        0,
      );
      pulseTl.to(
        el,
        { opacity: 0, duration: flareFadeDuration, ease: "power1.out" },
        ">",
      );
      gsap.delayedCall(totalFlareMs / 1000, () => {});
    });

    // run the selected full-sequence animation variant (flyin / flip / overlay)
    try {
      runPreemptVariant(preemptMode.value, rootEl, Number(ptime));
    } catch {}
  },
);

function runPreemptVariant(mode: string, rootEl: HTMLElement, ptime: number) {
  const svgEl = rootEl.querySelector(".gantt-svg") as SVGElement | null;
  if (!svgEl) return;

  const segs = segments.value;
  const preemptedPid = props.preemptedProcessId;
  if (!preemptedPid) return;

  const victim = segs.find(
    (s) => s.processId === preemptedPid && s.start <= ptime && ptime < s.end,
  );
  const incoming = segs.find(
    (s) => s.processId === props.activeId && s.start <= ptime && ptime < s.end,
  );

  if (!victim || !incoming) {
    logPreemptionDebug("skip: missing victim/incoming segment", {
      preemptedPid,
      activeId: props.activeId,
      ptime,
      victimFound: Boolean(victim),
      incomingFound: Boolean(incoming),
    });
    return;
  }

  const victimKey = `${victim.processName}-${victim.start}-${victim.end}`;
  const incomingKey = `${incoming.processName}-${incoming.start}-${incoming.end}`;
  if (victimKey === incomingKey) {
    logPreemptionDebug("skip: identical victim/incoming segment", {
      victimKey,
      incomingKey,
      ptime,
      mode,
    });
    return;
  }
  const victimWrap = svgEl.querySelector(
    `[data-id="${victimKey}"]`,
  ) as SVGGElement | null;
  const incomingWrap = svgEl.querySelector(
    `[data-id="${incomingKey}"]`,
  ) as SVGGElement | null;

  if (!victimWrap || !incomingWrap) {
    logPreemptionDebug("skip: missing DOM targets", {
      victimKey,
      incomingKey,
      victimWrap: Boolean(victimWrap),
      incomingWrap: Boolean(incomingWrap),
    });
    return;
  }

  const dx = Math.max(1, (victim.end - ptime) * cellWidth);

  if (mode === "flyin") {
    doCutOutAndFlyIn(
      svgEl,
      victim,
      incoming,
      ptime,
      dx,
      victimWrap,
      incomingWrap,
    );
  } else if (mode === "flip") {
    doFlipPush(svgEl, victim, incoming, ptime, dx);
  } else {
    doOverlay(svgEl, victim, incoming, ptime, dx);
  }
}

function doCutOutAndFlyIn(
  svgEl: SVGElement,
  victim: TimelineSegment,
  incoming: TimelineSegment,
  ptime: number,
  dx: number,
  victimWrap: SVGGElement,
  incomingWrap: SVGGElement,
) {
  const victimY = getLaneY(victim.processId);
  const incomingY = getLaneY(incoming.processId);
  const cutX = offsetX + ptime * cellWidth;
  const cutWidth = Math.max((victim.end - ptime) * cellWidth, 6);
  const victimKey = `${victim.processName}-${victim.start}-${victim.end}`;
  const incomingKey = `${incoming.processName}-${incoming.start}-${incoming.end}`;

  const cutPiece = createOverlayPiece(svgEl, victim, cutX, victimY, cutWidth);
  const incomingClone = incomingWrap.cloneNode(true) as SVGGElement;

  logPreemptionDebug("run cutout/flyin", {
    victimKey,
    incomingKey,
    ptime,
    dx,
    victimY,
    incomingY,
  });

  incomingClone.classList.add("preempt-flyin");
  incomingClone.style.pointerEvents = "none";
  incomingClone.style.opacity = "0";
  incomingClone.style.transform = "translateY(-44px) scale(0.96)";
  svgEl.appendChild(incomingClone);

  if (hasGsapTargets(victimWrap)) {
    gsap.to(victimWrap, { opacity: 0.66, duration: 0.12, ease: "power1.out" });
  }

  const tl = gsap.timeline();
  tl.to(cutPiece, {
    y: victimY - 44,
    opacity: 0,
    scale: 0.92,
    duration: 0.56,
    ease: "power2.out",
    onComplete: () => {
      try {
        cutPiece.remove();
      } catch {}
    },
  });

  tl.to(
    incomingClone,
    {
      y: incomingY,
      opacity: 1,
      scale: 1,
      duration: 0.68,
      ease: "back.out(1.35)",
      onComplete: () => {
        try {
          incomingClone.remove();
        } catch {}
      },
    },
    ">-0.2",
  );

  const pushTargets = Array.from(
    svgEl.querySelectorAll<SVGGElement>(".bar-wrap"),
  ).filter(
    (wrap) =>
      Number(wrap.getAttribute("data-lane-index") ?? "-1") >=
      getLaneIndex(victim.processId),
  );

  tl.to(
    pushTargets as any,
    {
      x: dx * 0.32,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
      stagger: 0.015,
    },
    0.1,
  );
}

function doFlipPush(
  svgEl: SVGElement,
  victim: TimelineSegment,
  incoming: TimelineSegment,
  ptime: number,
  dx: number,
) {
  // FLIP-style: capture rects, animate to new positions via transforms
  const barWraps = Array.from(svgEl.querySelectorAll<SVGGElement>(".bar-wrap"));
  const before = barWraps.map((el) => el.getBoundingClientRect());

  // compute target offsets (simulate insertion)
  const targets = barWraps.map((g) => {
    const id = g.getAttribute("data-id") || "";
    const parts = id.split("-");
    const start = Number(parts[parts.length - 2]);
    const extra = start >= ptime ? dx : 0;
    return extra;
  });

  // apply transforms from delta and animate to 0
  barWraps.forEach((el, i) => {
    const delta = targets[i];
    el.style.transform = `translateX(${delta}px)`;
  });

  if (barWraps.length) {
    gsap.to(barWraps as any, {
      x: 0,
      duration: 0.7,
      ease: "power2.out",
      stagger: 0.02,
      onComplete: () => {
        barWraps.forEach((el) => (el.style.transform = ""));
      },
    });
  }
}

function doOverlay(
  svgEl: SVGElement,
  victim: TimelineSegment,
  incoming: TimelineSegment,
  ptime: number,
  dx: number,
) {
  // Overlay: animate incoming flying over and transiently nudge affected elements
  const victimY = getLaneY(victim.processId);
  const incomingY = getLaneY(incoming.processId);
  const cutPiece = createOverlayPiece(
    svgEl,
    victim,
    offsetX + ptime * cellWidth,
    victimY,
    Math.max((victim.end - ptime) * cellWidth, 6),
  );
  const incomingClone = createOverlayPiece(
    svgEl,
    incoming,
    incoming.start * cellWidth + offsetX,
    incomingY - 40,
    Math.max((incoming.end - incoming.start) * cellWidth, 6),
  );

  const affected = Array.from(
    svgEl.querySelectorAll<SVGGElement>(".bar-wrap"),
  ).filter(
    (wrap) =>
      Number(wrap.getAttribute("data-lane-index") ?? "-1") >=
      getLaneIndex(victim.processId),
  );

  if (!affected.length) {
    logPreemptionDebug("skip overlay: no affected bar wraps", {
      victimProcessId: victim.processId,
      ptime,
    });
    return;
  }

  logPreemptionDebug("run overlay", {
    victimProcessId: victim.processId,
    incomingProcessId: incoming.processId,
    ptime,
    dx,
    affectedCount: affected.length,
  });

  if (hasGsapTargets(cutPiece)) {
    gsap.fromTo(
      cutPiece as any,
      { y: victimY, opacity: 0.96 },
      {
        y: victimY - 36,
        opacity: 0,
        duration: 0.58,
        ease: "power2.out",
        onComplete: () => {
          try {
            cutPiece.remove();
          } catch {}
        },
      },
    );
  }
  if (hasGsapTargets(incomingClone)) {
    gsap.fromTo(
      incomingClone as any,
      { y: incomingY - 40, opacity: 0 },
      {
        y: incomingY,
        opacity: 0.96,
        duration: 0.62,
        ease: "back.out(1.2)",
        onComplete: () => {
          try {
            incomingClone.remove();
          } catch {}
        },
      },
    );
  }
  if (affected.length) {
    gsap.to(affected as any, {
      x: dx * 0.6,
      duration: 0.5,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
    });
  }
}

function createOverlayPiece(
  svgEl: SVGElement,
  segment: TimelineSegment,
  x: number,
  y: number,
  width: number,
) {
  const clone = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  clone.setAttribute("x", String(x));
  clone.setAttribute("y", String(y));
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(segmentHeight));
  clone.setAttribute("rx", "7");
  clone.setAttribute(
    "fill",
    segment.idle ? "url(#idleGradient)" : segment.color,
  );
  clone.setAttribute("opacity", "0");
  clone.classList.add("preempt-overlay-piece");
  svgEl.appendChild(clone);
  return clone;
}

function createMorphPiece(
  svgEl: SVGElement,
  segment: TimelineSegment,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const clone = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  clone.setAttribute("x", String(x));
  clone.setAttribute("y", String(y));
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("rx", "7");
  clone.setAttribute(
    "fill",
    segment.idle ? "url(#idleGradient)" : segment.color,
  );
  clone.setAttribute("opacity", "0.92");
  clone.classList.add("launch-morph-piece");
  svgEl.appendChild(clone);
  return clone;
}

function getLaneIndex(pid?: string | null): number {
  if (!pid) return 0;
  if (isMlfqLayout.value) {
    const matching = segments.value.find(
      (segment) => segment.processId === pid,
    );
    if (matching) {
      return Math.min(
        mlfqLevelCount.value - 1,
        Math.max(0, matching.queueLevel ?? 0),
      );
    }
  }
  const ordered = Array.from(
    new Set(segments.value.map((segment) => segment.processId).filter(Boolean)),
  ) as string[];
  return Math.max(0, ordered.indexOf(pid));
}

function getLaneY(pid?: string | null): number {
  return laneTop + getLaneIndex(pid) * laneStride;
}

function getSegmentKey(segment: TimelineSegment): string {
  return `${segment.processName}-${segment.start}-${segment.end}`;
}

function getProcessOrder(segmentsList: TimelineSegment[]): string[] {
  return Array.from(
    new Set(segmentsList.map((segment) => segment.processId).filter(Boolean)),
  ) as string[];
}

function getSegmentYFor(
  segment: TimelineSegment,
  segmentsList: TimelineSegment[],
): number {
  if (segment.idle) return 180;
  if (isMlfqLayout.value) {
    return (
      laneTop +
      Math.min(mlfqLevelCount.value - 1, Math.max(0, segment.queueLevel ?? 0)) *
        laneStride
    );
  }
  const order = getProcessOrder(segmentsList);
  const index = order.indexOf(segment.processId ?? "");
  return laneTop + Math.max(index, 0) * laneStride;
}

function getSegmentXFor(segment: TimelineSegment): number {
  return segment.start * cellWidth + offsetX;
}

function getSegmentWidthFor(segment: TimelineSegment): number {
  return Math.max((segment.end - segment.start) * cellWidth, 4);
}

function getSegmentTargetRect(segment: TimelineSegment): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: getSegmentXFor(segment),
    y: getSegmentYFor(segment, segments.value),
    width: getSegmentWidthFor(segment),
    height: segmentHeight,
  };
}

function getSegmentSourceRect(segment: TimelineSegment): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  const sourceSegments = props.transitionFromSegments ?? [];
  if (!sourceSegments.length || !segment.processId) {
    return null;
  }

  const sourceSegment = sourceSegments.find(
    (candidate) => candidate.processId === segment.processId,
  );

  if (!sourceSegment) {
    return null;
  }

  return {
    x: getSegmentXFor(sourceSegment),
    y: getSegmentYFor(sourceSegment, sourceSegments),
    width: getSegmentWidthFor(sourceSegment),
    height: segmentHeight,
  };
}

function runLaunchMorph() {
  const rootEl = root.value;
  const sourceSegments = props.transitionFromSegments ?? [];
  if (!rootEl || !sourceSegments.length || !segments.value.length) {
    return;
  }

  if (!shouldAnimate.value) return;

  const svgEl = rootEl.querySelector(".gantt-svg") as SVGElement | null;
  if (!svgEl) {
    return;
  }

  const targetWraps = Array.from(
    svgEl.querySelectorAll<SVGGElement>(".bar-wrap"),
  );
  if (!targetWraps.length) {
    return;
  }

  const sourceOpacity = 0.9;
  const morphPieces: SVGRectElement[] = [];
  const fadeTargets: SVGGElement[] = [];

  targetWraps.forEach((wrap) => {
    const key = wrap.getAttribute("data-id") ?? "";
    const targetSegment = segments.value.find(
      (segment) => getSegmentKey(segment) === key,
    );
    if (!targetSegment) {
      return;
    }

    const sourceRect = getSegmentSourceRect(targetSegment);
    if (!sourceRect) {
      return;
    }

    const targetRect = getSegmentTargetRect(targetSegment);
    const piece = createMorphPiece(
      svgEl,
      targetSegment,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
    );
    morphPieces.push(piece);
    fadeTargets.push(wrap);

    if (hasGsapTargets(wrap)) {
      gsap.set(wrap, { autoAlpha: 0 });
    }
    gsap.fromTo(
      piece,
      { opacity: sourceOpacity },
      {
        x: targetRect.x - sourceRect.x,
        y: targetRect.y - sourceRect.y,
        width: targetRect.width,
        height: targetRect.height,
        opacity: 0,
        duration: 0.58,
        ease: "power2.inOut",
        onComplete: () => {
          try {
            piece.remove();
          } catch {}
        },
      },
    );
  });

  if (!morphPieces.length) {
    return;
  }

  if (fadeTargets.length) {
    gsap.to(fadeTargets as any, {
      autoAlpha: 1,
      duration: 0.18,
      delay: 0.1,
      ease: "power1.out",
    });
  }
}

function handlePlay() {
  if (!controlsEnabled.value) return;
  emit("play");
}

function handlePause() {
  if (!controlsEnabled.value) return;
  if (tl.current) tl.current.pause();
  emit("pause");
}

function handleReset() {
  if (!controlsEnabled.value) return;
  emit("reset");
}

function onSegmentEnter(segment: TimelineSegment, ev: PointerEvent) {
  // small hover animation
  const el = (ev.currentTarget as HTMLElement) || null;
  if (el) gsap.to(el, { scale: 1.02, duration: 0.18, yoyo: true, repeat: 1 });
}

function onSegmentLeave() {}
function onSegmentClick(segment: TimelineSegment) {
  // jump timeline to clicked segment start
  emit("seek", segment.start);
}

function handleStep(delta: number) {
  if (!controlsEnabled.value) return;
  // emit step delta to parent (parent should map to stepBackward/stepForward)
  emit("step", delta);
}

onMounted(() => {
  // build timeline: entry animation + numeric time tween
  ctx = gsap.context(() => {
    const rootEl = root.value;
    if (!rootEl) return;

    // animate bars (SVG rects inside Gantt) only when the intro animation is enabled
    const barSelector =
      ".gantt-svg rect:not(.preempt-pulse):not(.completed-overlay):not(.active-glow)";

    tl.current = gsap.timeline({ paused: true });
    const barTargets = rootEl.querySelectorAll(barSelector);
    if (barTargets.length) {
      gsap.set(barTargets, {
        clearProps: "transform,opacity,visibility,filter",
        autoAlpha: 1,
        x: 0,
        y: 0,
        scale: 1,
      });

      if (introAnimation.value) {
        tl.current.to(
          barTargets,
          {
            opacity: 1,
            duration: 0,
          },
          0,
        );
      }
    }

    onWheel = (ev: WheelEvent) => {
      ev.stopPropagation();
    };
    if (rootEl && onWheel) {
      rootEl.addEventListener("wheel", onWheel, { passive: true });
    }

    // restart timeline when complete if loop enabled
    if (tl.current) {
      tl.current.eventCallback("onComplete", () => {
        if (loopPlayback.value) {
          try {
            tl.current && tl.current.restart();
          } catch {}
        } else {
          // notify parent that playback paused/ended
          emit("pause");
        }
      });
    }
  }, root.value ?? undefined);

  // keep currentTime and timeline in sync when user drags the range
  // slider is fully controlled via the computed proxy above
});

onBeforeUnmount(() => {
  if (tl.current) {
    try {
      tl.current.kill();
    } catch {}
  }
  ScrollTrigger.getAll().forEach((s) => s.kill());
  try {
    if (root.value && onWheel)
      root.value.removeEventListener("wheel", onWheel as any);
  } catch {}
  try {
    if (ctx) ctx.revert();
  } catch {}
  // no resume timer to clear - flare runs independently
});
</script>

<style scoped>
.gantt-gsap-root {
  padding: 8px;
}
.controls {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.controls--disabled {
  opacity: 0.48;
  filter: saturate(0.65);
}

.controls--disabled button,
.controls--disabled input,
.controls--disabled select,
.controls--disabled label {
  cursor: not-allowed;
}
.time-label {
  min-width: 36px;
  text-align: center;
}
button {
  background: var(--surface);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 6px 8px;
  border-radius: 6px;
}
input[type="range"] {
  flex: 1;
}

.loop-control {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
}
</style>
