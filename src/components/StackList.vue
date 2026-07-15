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
        :class="{ top: i === 0, active: props.activeId && item.id === props.activeId }"
        :style="itemStyle(item)"
        role="listitem"
      >
        <div class="color" :style="{ background: item.color || '#475569' }" aria-hidden="true"></div>
        <div class="content">
          <div class="title">{{ item.title }}</div>
          <div class="sub">{{ item.subtitle }}</div>
        </div>
        <div class="id">{{ item.id }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Item = { id: string; title: string; subtitle?: string; color?: string }

const props = defineProps<{
  items: Item[] | any;
  maxVisible?: number;
  activeId?: string | null;
}>()

const max = props.maxVisible ?? 6
const visibleItems = computed(() => (Array.isArray(props.items) ? props.items.slice(0, max) : []))

function hexToRgb(hex?: string) {
  if (!hex) return "70,86,105"; // fallback  #465869-ish
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+ c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}

const itemStyle = (item: Item) => {
  const isActive = props.activeId && item.id === props.activeId;
  if (!isActive) return {};
  return {
    ['--active-color']: item.color ?? '#475569',
    ['--active-rgb']: hexToRgb(item.color),
  } as Record<string, string>;
}
</script>

<style scoped>
.stack-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stack-header h3 { margin: 0 0 6px 0; font-size: 14px; }
.items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.02);
  transition: transform 220ms ease, opacity 220ms ease;
}
.item.top { background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.03)); transform: translateY(-2px); }
.color { width: 12px; height: 36px; border-radius: 6px; flex-shrink: 0; }
.content { display: flex; flex-direction: column; }
.title { font-weight: 700; font-size: 13px; }
.sub { font-size: 12px; opacity: 0.85; }
.id { margin-left: auto; font-size: 12px; opacity: 0.8 }

.item.active {
  outline: 2px solid var(--active-color);
  box-shadow: 0 10px 30px rgba(var(--active-rgb), 0.18);
}

@media (prefers-reduced-motion: reduce) {
  .item.active { box-shadow: none; }
}
</style>
