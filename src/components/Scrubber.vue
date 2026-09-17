<template>
  <div class="scrubber">
    <label for="scrubber-range">Zeitpunkt</label>
    <input
      id="scrubber-range"
      class="scrubber-range"
      type="range"
      :min="0"
      :max="Math.max(total, 0)"
      :value="currentTime"
      :aria-valuetext="`Zeit ${currentTime} von ${total}`"
      @input="onInput"
    />
    <div id="scrubber-info" class="scrubber-info" aria-live="polite">
      <span>{{ currentTime }}</span>
      <span> | </span>
      <span>{{ total }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ total: number; currentTime: number }>();
const emit = defineEmits<{ (e: "seek", time: number): void }>();

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const value = Number(target.value || 0);
  emit("seek", value);
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
  color: var(--muted);
  font-size: 13px;
}
</style>
