<template>
  <section v-if="modelValue" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal panel welcome-modal" role="dialog" aria-modal="true" aria-label="Scheduling Visualizer">
      <div class="welcome-copy">
        <p class="eyebrow">Scheduling Visualizer</p>
        <h2>Scheduling Visualizer</h2>
        <p>by Marten Kirschenhofer</p>
      </div>

      <button class="primary-button" type="button" @click="$emit('close')">
        Los geht's
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();

defineEmits<{
  (e: 'close'): void;
}>();
</script>

<style scoped>
.welcome-modal {
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
}

.welcome-copy h2 {
  margin: 0;
  font-size: 30px;
}

.welcome-copy p {
  margin: 8px 0 0;
  color: #cbd5e1;
}
</style>