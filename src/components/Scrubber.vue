<template>
  <div class="scrubber">
    <input
      class="scrubber-range"
      type="range"
      :min="0"
      :max="Math.max(total - 1, 0)"
      :value="index"
      @input="onInput"
    />
    <div class="scrubber-info">
      <span>{{ index }}</span>
      <span>/</span>
      <span>{{ total }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ total: number; index: number }>();
const emit = defineEmits<[('seek', (index: number) => void)]>();

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const value = Number(target.value || 0);
  emit('seek', value);
}
</script>

<style scoped>
.scrubber {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
}
.scrubber-range {
  flex: 1;
}
.scrubber-info {
  min-width: 72px;
  text-align: right;
  color: #94a3b8;
  font-size: 13px;
}
</style>
