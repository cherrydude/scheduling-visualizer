<template>
  <section v-if="modelValue" class="modal-overlay" @click.self="$emit('close')">
    <div
      ref="modalRoot"
      class="modal panel welcome-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Scheduling Visualizer"
    >
      <div class="welcome-copy">
        <p class="eyebrow">Scheduling Visualizer</p>
        <h2>Loslegen in 3 Schritten</h2>
        <p>
          Wähle ein Szenario, starte einen Algorithmus und beobachte direkt,
          wie sich CPU-Belegung, Queue und Kennzahlen verändern.
        </p>
      </div>

      <ul class="welcome-tips">
        <li>Über das Burgermenü kannst du Szenarien laden, duplizieren oder neu anlegen.</li>
        <li>Der Algorithmus-Dialog bestimmt, wie Preemption, Queue-Level und Fairness sichtbar werden.</li>
        <li>Play, Schritt-Tasten und Slider helfen dir beim genauen Nachvollziehen des Ablaufs.</li>
      </ul>

      <div class="welcome-actions">
        <button class="primary-button" type="button" @click="$emit('close')">
          Ohne Infos fortfahren
        </button>
        <button class="secondary-button" type="button" @click="$emit('open-help')">
          Wissen / Demo-Tour öffnen
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();

defineEmits<{
  (e: 'close'): void;
  (e: 'open-help'): void;
}>();

import { ref } from 'vue';
import { useFocusTrap } from '@/composables/useFocusTrap';

const modalRoot = ref<HTMLElement | null>(null);
useFocusTrap(modalRoot);
</script>

<style scoped>
.welcome-modal {
  max-width: 620px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}

.welcome-copy h2 {
  margin: 0;
  font-size: 28px;
}

.welcome-copy p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.welcome-tips {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.45rem;
  color: var(--text);
  line-height: 1.5;
}

.welcome-actions {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}
</style>