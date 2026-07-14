<template>
  <div
    v-if="visible"
    class="tooltip"
    :style="{ left: `${x}px`, top: `${y}px` }"
    role="note"
  >
    <strong>{{ title }}</strong>
    <div class="sub">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  x: number;
  y: number;
  visible: boolean;
  title: string;
  subtitle?: string;
}>();
</script>

<style scoped>
.tooltip {
  position: fixed;
  background: rgba(15, 23, 42, 0.95);
  color: #e6eef8;
  padding: 8px 10px;
  border-radius: 6px;
  pointer-events: none;
  transform: translate(-50%, -110%);
  box-shadow: 0 4px 18px rgba(2,6,23,0.45);
  font-size: 13px;
  z-index: 1200;
}
.tooltip .sub {
  color: #cbd5e1;
  font-size: 12px;
  margin-top: 4px;
}
</style>
