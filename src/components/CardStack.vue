<template>
  <div
    v-if="displayItems.length"
    class="card-stack"
    ref="container"
    role="img"
    :aria-label="ariaLabel"
    :style="{ height: String(P.height) + 'px' }"
  >
    <div
      v-for="(item, i) in displayItems"
      :key="item.id"
      class="card"
      :data-id="item.id"
      :style="cardInlineStyle(i)"
    >
      <div class="card-inner" :style="{ background: item.color || '#334155' }">
        <div class="card-title">{{ item.title }}</div>
        <div class="card-sub">{{ item.subtitle }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComputedRef } from "vue";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import gsap from "gsap";
import Flip from "gsap/Flip";
gsap.registerPlugin(Flip);

type Item = { id: string; title: string; subtitle?: string; color?: string };

const props = defineProps<{
  items: Item[] | Item;
  maxVisible?: number;
  ariaLabel?: string;
  variant?: "compact" | "balanced" | "showcase";
}>();

const maxVisible = props.maxVisible ?? 5;
const incoming = computed(() =>
  Array.isArray(props.items) ? props.items.slice(0, maxVisible) : [],
);

const container = ref<HTMLElement | null>(null);

// Presets now include card dimensions and are used reactively
const PRESETS = {
  compact: {
    X_STEP: 6,
    Y_STEP: 8,
    ROT_STEP: -1.2,
    SCALE_STEP: 0.01,
    duration: 0.22,
    height: 200,
    cardWidth: 120,
    cardHeight: 180,
  },
  balanced: {
    X_STEP: 12,
    Y_STEP: 14,
    ROT_STEP: -2.5,
    SCALE_STEP: 0.015,
    duration: 0.36,
    height: 300,
    cardWidth: 150,
    cardHeight: 240,
  },
  showcase: {
    X_STEP: 36,
    Y_STEP: 28,
    ROT_STEP: -6,
    SCALE_STEP: 0.035,
    duration: 0.45,
    height: 420,
    cardWidth: 220,
    cardHeight: 320,
  },
} as const;

const P = computed(() => PRESETS[props.variant ?? "balanced"]) as ComputedRef<
  (typeof PRESETS)[keyof typeof PRESETS]
>;

const displayItems = ref<Item[]>([...incoming.value]);

function cardInlineStyle(idx: number) {
  const offset = Math.min(idx, maxVisible - 1);
  const x = offset * P.value.X_STEP;
  const y = offset * P.value.Y_STEP;
  const rot = offset * P.value.ROT_STEP;
  const scale = 1 - offset * P.value.SCALE_STEP;
  return {
    width: `${P.value.cardWidth}px`,
    height: `${P.value.cardHeight}px`,
    transform: `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${rot}deg) scale(${scale})`,
    zIndex: String(100 - offset),
  };
}

// helper: map id -> DOM rect
function snapshotRectsMap(): Record<string, DOMRect> {
  const map: Record<string, DOMRect> = {};
  if (!container.value) return map;
  const els = Array.from(
    container.value.querySelectorAll<HTMLElement>(".card"),
  );
  for (const el of els) {
    const id = el.dataset.id;
    if (id) map[id] = el.getBoundingClientRect();
  }
  return map;
}

onMounted(async () => {
  await nextTick();
  if (!container.value) return;
  const els = Array.from(
    container.value.querySelectorAll<HTMLElement>(".card"),
  );
  // entrance: gentle staggered reveal
  gsap.set(els, { opacity: 0, y: 8, scale: 0.98, transformOrigin: "50% 100%" });
  gsap.to(els, {
    opacity: 1,
    y: (i) => i * P.value.Y_STEP,
    x: (i) => i * P.value.X_STEP,
    scale: 1,
    stagger: 0.05,
    duration: P.value.duration,
    ease: "power3.out",
  });
});

// Keep previous id order
let prevIds: string[] = displayItems.value.map((d) => d.id);

// Watch incoming and perform targeted animation when it is a simple rotate (top->back)
watch(
  incoming,
  async (next) => {
    const nextIds = next.map((d) => d.id);
    // identical
    if (
      prevIds.length === nextIds.length &&
      prevIds.every((v, i) => v === nextIds[i])
    ) {
      return;
    }

    // detect left-rotate: next === prev.slice(1).concat(prev[0])
    const isRotate =
      prevIds.length === nextIds.length &&
      prevIds
        .slice(1)
        .concat(prevIds[0])
        .every((v, i) => v === nextIds[i]);

    const firstRects = snapshotRectsMap();

    if (isRotate) {
      // quick path: animate only prev top and new top (which was at index 1)
      const prevTopId = prevIds[0];
      const newTopId = nextIds[0];

      // apply DOM update to new order, but keep offsets via FLIP technique on the two animated elements
      displayItems.value = [...next];
      await nextTick();

      if (!container.value) {
        prevIds = nextIds;
        return;
      }

      const newEls = Array.from(
        container.value.querySelectorAll<HTMLElement>(".card"),
      );
      const elById: Record<string, HTMLElement> = {};
      for (const el of newEls) elById[el.dataset.id!] = el;

      // capture last rects after DOM update
      const lastRects: Record<string, DOMRect> = {};
      for (const el of newEls)
        lastRects[el.dataset.id!] = el.getBoundingClientRect();

      const animatedEls: HTMLElement[] = [];
      for (const id of [prevTopId, newTopId]) {
        const el = elById[id];
        const first = firstRects[id];
        const last = lastRects[id];
        if (el && first && last) {
          // place element visually where it was before DOM reorder
          gsap.set(el, { x: first.left - last.left, y: first.top - last.top });
          animatedEls.push(el);
        }
      }

      // animate only those two into their new positions (others remain static)
      gsap.to(animatedEls, {
        x: 0,
        y: (i, el) => {
          const id = (el as HTMLElement).dataset.id!;
          const idx = nextIds.indexOf(id);
          return idx * P.value.Y_STEP;
        },
        rotation: (i, el) => {
          const id = (el as HTMLElement).dataset.id!;
          const idx = nextIds.indexOf(id);
          return idx * P.value.ROT_STEP;
        },
        scale: (i, el) => {
          const id = (el as HTMLElement).dataset.id!;
          const idx = nextIds.indexOf(id);
          return 1 - idx * P.value.SCALE_STEP;
        },
        duration: P.value.duration,
        ease: "power2.out",
        onComplete: () => {
          // clear temporary transforms
          newEls.forEach((el) => gsap.set(el, { clearProps: "x,y" }));
        },
      });

      prevIds = nextIds;
      return;
    }

    // fallback: use GSAP Flip for smooth reordering
    if (!container.value) {
      displayItems.value = [...next];
      prevIds = nextIds;
      return;
    }

    const els = Array.from(
      container.value.querySelectorAll<HTMLElement>(".card"),
    );
    const state = Flip.getState(els);

    // commit new order
    displayItems.value = [...next];
    await nextTick();

    const newEls = Array.from(
      container.value.querySelectorAll<HTMLElement>(".card"),
    );
    Flip.from(state, {
      duration: P.value.duration,
      ease: "power3.out",
      stagger: 0.02,
      absolute: true,
      onComplete: () => {
        // clear transform props
        newEls.forEach((el) => gsap.set(el, { clearProps: "transform" }));
        prevIds = nextIds;
      },
    });
  },
  { immediate: true },
);
</script>

<style scoped>
.card-stack {
  width: 100%;
  position: relative;
  perspective: 900px;
  pointer-events: none;
  display: block;
  /* height is now controlled via inline style from preset */
}
.card {
  position: absolute;
  left: 50%;
  transform-origin: center bottom;
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.55);
  will-change: transform, opacity;
}
.card-inner {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  color: #fbfdff;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 14px;
  box-sizing: border-box;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.03),
    rgba(0, 0, 0, 0.06)
  );
  border: 1px solid rgba(255, 255, 255, 0.03);
}
.card-title {
  font-weight: 700;
  font-size: 14px;
}
.card-sub {
  font-size: 12px;
  opacity: 0.9;
}
</style>
