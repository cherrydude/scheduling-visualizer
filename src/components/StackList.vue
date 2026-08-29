<template>
  <div class="stack-list" role="list" aria-label="Process queue">
    <div class="stack-header">
      <slot name="header">
        <h3>Queue</h3>
      </slot>
    </div>

    <ul class="items">
      <li
        v-for="(item, i) in visibleItems"
        :key="item.id"
        class="item"
        :class="itemClasses(item, i)"
        :style="itemStyle(item)"
        role="listitem"
      >
        <div
          class="color"
          :style="{ background: item.color || 'var(--surface-light)' }"
          aria-hidden="true"
        ></div>
        <div class="content">
          <div class="title-row">
            <div class="title">{{ item.title }}</div>
            <span
              v-if="item.level !== undefined && item.level !== null"
              class="level-badge"
            >
              L{{ item.level + 1 }}
            </span>
            <span class="state-badge">{{ statusLabel(item) }}</span>
          </div>
          <div class="sub">{{ item.subtitle }}</div>
        </div>
        <div class="id">{{ item.id }}</div>
      </li>
    </ul>

    <p v-if="props.contextText" class="stack-context">
      {{ props.contextText }}
    </p>

    <p v-if="props.quantumSummaryText" class="stack-quantum-summary">
      {{ props.quantumSummaryText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type ItemStatus = "active" | "ready" | "preempted" | "arrived" | "finished";
type Item = {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
  status?: ItemStatus;
  level?: number | null;
  waitingTicks?: number;
};

const props = defineProps<{
  items: Item[] | any;
  maxVisible?: number;
  activeId?: string | null;
  contextText?: string;
  quantumSummaryText?: string;
}>();

const visibleItems = computed(() => {
  if (!Array.isArray(props.items)) {
    return [];
  }

  if (
    typeof props.maxVisible === "number" &&
    Number.isFinite(props.maxVisible) &&
    props.maxVisible >= 0
  ) {
    return props.items.slice(0, props.maxVisible);
  }

  return props.items;
});

function itemStatus(item: Item): ItemStatus {
  if (item.status) {
    return item.status;
  }

  if (props.activeId && item.id === props.activeId) {
    return "active";
  }

  return "ready";
}

function statusLabel(item: Item): string {
  switch (itemStatus(item)) {
    case "active":
      return "läuft jetzt";
    case "arrived":
      return "neu eingetroffen";
    case "finished":
      return "abgeschlossen";
    case "preempted":
      return "präemptiert";
    default:
      return "wartet in der Queue";
  }
}

function hexToRgb(hex?: string) {
  if (!hex) return "70,86,105"; // fallback  #465869-ish
  if (hex.trim().startsWith("var(") && typeof window !== "undefined") {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(
        hex.trim().slice(4, -1).trim(),
      );
      if (v) hex = v.trim();
    } catch (e) {
      // ignore and parse as-is
    }
  }
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  if (!Number.isFinite(bigint)) return "70,86,105";
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}

const itemStyle = (item: Item) => {
  const isActive = props.activeId && item.id === props.activeId;
  if (!isActive) return {};
  return {
    ["--active-color"]: item.color ?? "var(--surface-light)",
    ["--active-rgb"]: hexToRgb(item.color),
  } as Record<string, string>;
};

function itemClasses(item: Item, index: number) {
  const status = itemStatus(item);
  return {
    top: index === 0,
    active: status === "active",
    arrived: status === "arrived",
    finished: status === "finished",
    ready: status === "ready",
    preempted: status === "preempted",
  };
}
</script>

<style scoped>
.stack-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stack-header h3 {
  margin: 0 0 6px 0;
  font-size: 14px;
}
.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  transition:
    transform 220ms ease,
    opacity 220ms ease;
}
.item.top {
  transform: translateY(-2px);
}
.color {
  width: 12px;
  height: 36px;
  border-radius: 6px;
  flex-shrink: 0;
}
.content {
  display: flex;
  flex-direction: column;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.title {
  font-weight: 700;
  font-size: 13px;
}
.sub {
  font-size: 12px;
  opacity: 0.85;
}
.id {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.8;
}
.state-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid rgba(148, 163, 184, 0.16);
  color: var(--muted);
  background: rgba(148, 163, 184, 0.08);
}

.risk-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  font-size: 0.68rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  border: 1px solid rgba(245, 158, 11, 0.38);
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}

.risk-badge.critical {
  color: #fb7185;
  border-color: rgba(251, 113, 133, 0.42);
  background: rgba(251, 113, 133, 0.14);
}

.level-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid rgba(125, 211, 252, 0.24);
  color: var(--accent);
  background: rgba(125, 211, 252, 0.08);
}

.item.active {
  background: linear-gradient(
    180deg,
    rgba(56, 189, 248, 0.18),
    rgba(2, 6, 23, 0.18)
  );
  border-color: rgba(56, 189, 248, 0.5);
  outline: 2px solid var(--active-color);
  box-shadow: 0 10px 30px rgba(var(--active-rgb), 0.18);
}

.item.active .state-badge {
  color: var(--on-primary);
  background: linear-gradient(135deg, var(--accent), var(--interactive));
  border-color: rgba(125, 211, 252, 0.65);
}

.item.ready .state-badge {
  color: var(--muted);
}

.item.arrived {
  border-style: solid;
  border-color: rgba(125, 211, 252, 0.45);
  background: rgba(125, 211, 252, 0.09);
}

.item.arrived .state-badge {
  color: var(--accent);
  background: rgba(125, 211, 252, 0.14);
  border-color: rgba(125, 211, 252, 0.34);
}

.item.preempted {
  border-style: dashed;
  border-color: rgba(251, 191, 36, 0.42);
  background: rgba(251, 191, 36, 0.08);
}

.item.preempted .state-badge {
  color: var(--warning);
  background: rgba(251, 191, 36, 0.14);
  border-color: rgba(251, 191, 36, 0.38);
}

.item.finished {
  border-style: solid;
  border-color: rgba(52, 211, 153, 0.42);
  background: rgba(52, 211, 153, 0.08);
}

.item.finished .state-badge {
  color: #10b981;
  background: rgba(16, 185, 129, 0.14);
  border-color: rgba(16, 185, 129, 0.34);
}

.stack-context {
  margin: 0.15rem 0 0;
  padding-top: 0.65rem;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.45;
}

.stack-quantum-summary {
  margin: 0;
  color: var(--accent);
  font-size: 0.82rem;
  line-height: 1.35;
}

@media (prefers-reduced-motion: reduce) {
  .item.active {
    box-shadow: none;
  }
}
</style>
