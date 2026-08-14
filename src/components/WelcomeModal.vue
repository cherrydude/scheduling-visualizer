<template>
  <section v-if="modelValue" class="modal-overlay" @click.self="$emit('close')">
    <div
      ref="modalRoot"
      class="modal panel welcome-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-desc"
      @keydown.esc.prevent="$emit('close')"
    >
      <header class="welcome-header">
        <div>
          <p class="eyebrow">Scheduling Visualizer</p>
          <h2 id="welcome-title">Willkommen zur Scheduling-Visualizer</h2>
        </div>
        <button
          class="icon-button"
          type="button"
          aria-label="Dialog schließen"
          @click="$emit('close')"
        >
          ×
        </button>
      </header>

      <p id="welcome-desc">
        Interaktive Visualisierung präemptiver Scheduling-Algorithmen — erstelle
        Szenarien, starte Beispiel-Läufe und vergleiche Kennzahlen.
      </p>

      <div class="welcome-actions">
        <button
          class="secondary-button"
          type="button"
          @click="$emit('create-scenario')"
        >
          Szenario erstellen
        </button>
        <button class="primary-button" type="button" @click="$emit('start-demo')">
          Beispiel starten
        </button>
        <button class="link-button" type="button" @click="$emit('open-help')">
          So liest du die Visualisierung
        </button>
      </div>

      <div class="welcome-shortcuts">
        <strong>Tastenkürzel</strong>
        <div>Leertaste = Play/Pause · ← / → = Schritt · R = Reset</div>
      </div>

      <label class="checkbox">
        <input type="checkbox" v-model="dontShowAgain" />
        <span>Diese Meldung nicht mehr anzeigen</span>
      </label>

      <div class="welcome-footer">
        <button class="secondary-button" type="button" @click="$emit('close')">
          Schließen
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useFocusTrap } from '@/composables/useFocusTrap';

const props = defineProps<{ modelValue: boolean }>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'start-demo'): void;
  (e: 'create-scenario'): void;
  (e: 'open-help'): void;
}>();

const modalRoot = ref<HTMLElement | null>(null);
const dontShowAgain = ref(false);

useFocusTrap(modalRoot, () => emit('close'));

watchEffect(() => {
  if (!props.modelValue) {
    dontShowAgain.value = false;
  }
});
</script>

<style scoped>
.welcome-modal {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: flex-start;
  padding: 1.5rem 1.5rem 1.25rem;
  border-radius: 18px;
}

.welcome-header {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.welcome-header h2 {
  margin: 0;
  font-size: clamp(1.5rem, 2vw, 2rem);
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.8;
}

.welcome-modal > p {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.welcome-actions {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-start;
  align-items: center;
}

.primary-button,
.secondary-button,
.link-button,
.icon-button {
  font: inherit;
}

.primary-button,
.secondary-button {
  border-radius: 12px;
  padding: 0.78rem 1.1rem;
  min-height: 44px;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.primary-button {
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
}

.primary-button:hover,
.secondary-button:hover,
.link-button:hover,
.icon-button:hover {
  opacity: 0.96;
}

.link-button {
  background: transparent;
  border: none;
  padding: 0.2rem 0;
  color: var(--link);
  text-decoration: underline;
  cursor: pointer;
}

.welcome-shortcuts {
  width: 100%;
  display: grid;
  gap: 0.35rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.welcome-shortcuts div {
  color: var(--muted);
  line-height: 1.5;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--muted);
  margin-top: 0.25rem;
}

.welcome-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: -4px;
}

.icon-button {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
}
</style>