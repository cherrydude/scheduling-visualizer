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
          <h2 id="welcome-title">Willkommen zum Scheduling-Visualizer</h2>
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
        Szenarien, starte Beispiel-Läufe und vergleiche Kennzahlen. <br /><br />
        Starte direkt hier.
      </p>

      <div class="welcome-actions">
        <button
          class="secondary-button"
          type="button"
          @click="$emit('create-scenario')"
        >
          Szenario erstellen
        </button>
        <button
          class="primary-button"
          type="button"
          @click="$emit('start-tour')"
        >
          Beispiel-Tour starten
        </button>
        <button class="secondary-button" type="button" @click="$emit('close')">
          Schließen
        </button>
      </div>

      <div class="welcome-bottom">
        <label class="checkbox">
          <input type="checkbox" v-model="dontShowAgain" />
          <span>Diese Meldung nicht mehr anzeigen</span>
        </label>

        <div class="welcome-footer"></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect } from "vue";
import { useFocusTrap } from "@/composables/useFocusTrap";

const props = defineProps<{ modelValue: boolean }>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "start-demo"): void;
  (e: "start-tour"): void;
  (e: "create-scenario"): void;
  (e: "open-help"): void;
}>();

const modalRoot = ref<HTMLElement | null>(null);
const dontShowAgain = ref(false);
const STORAGE_KEY = "scheduling-visualizer.welcome-seen";

useFocusTrap(modalRoot, () => emit("close"));

watchEffect(() => {
  if (typeof window !== "undefined" && props.modelValue) {
    dontShowAgain.value = window.localStorage.getItem(STORAGE_KEY) === "1";
  }
});

watch(dontShowAgain, (checked) => {
  if (typeof window === "undefined") {
    return;
  }

  if (checked) {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
});
</script>

<style scoped>
.welcome-modal {
  max-width: 720px;
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
  white-space: nowrap;
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
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.primary-button {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
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

.welcome-bottom {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-left: 0;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--muted);
  margin-top: 0.25rem;
  margin-left: 0;
  white-space: nowrap;
}

.welcome-footer {
  width: auto;
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

@media (max-width: 700px) {
  .welcome-header h2 {
    white-space: normal;
  }
}
</style>
