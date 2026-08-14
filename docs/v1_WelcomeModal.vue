<template>
  <section
    class="welcome-modal-overlay"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="'welcome-title'"
    :aria-describedby="'welcome-desc'"
    @keydown.esc="close"
    v-if="modelValue"
  >
    <div class="welcome-modal panel" ref="dialog" tabindex="-1">
      <header class="modal-header">
        <h2 id="welcome-title">Willkommen zur Scheduling‑Visualizer</h2>
        <button class="icon-button" aria-label="Schliessen" @click="close">×</button>
      </header>

      <div class="modal-body">
        <p id="welcome-desc">
          Interaktive Visualisierung präemptiver Scheduling‑Algorithmen — erstelle Szenarien, wende Algorithmen an und vergleiche Kennzahlen.
        </p>

        <div class="modal-actions">
          <button class="primary-button" @click="createScenario">Loslegen — Szenario erstellen</button>
          <button class="secondary-button" @click="loadSample">Beispiel‑Szenario laden</button>
          <button class="link-button" @click="openTour">Kurz‑Tour ansehen</button>
        </div>

        <div class="modal-shortcuts" aria-hidden="false">
          <strong>Tastenkürzel</strong>
          <div class="keys">Leertaste = Play/Pause · ← / → = Schritt · R = Reset</div>
        </div>

        <label class="checkbox">
          <input type="checkbox" v-model="dontShowAgain" /> Diese Meldung nicht mehr anzeigen
        </label>
      </div>

      <footer class="modal-footer">
        <a href="/about" class="muted-link">Weitere Infos</a>
        <button class="secondary-button" @click="close">Schliessen</button>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue','create','load-sample','open-tour']);

const dialog = ref<HTMLElement | null>(null);
const dontShowAgain = ref(false);

const STORAGE_KEY = 'scheduling-visualizer.showWelcome';

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'false') {
    // ask parent to hide
    emit('update:modelValue', false);
  }
});

watch(() => props.modelValue, async (visible) => {
  if (visible) {
    await nextTick();
    dialog.value?.focus();
  }
});

function close() {
  if (dontShowAgain.value) {
    localStorage.setItem(STORAGE_KEY, 'false');
  }
  emit('update:modelValue', false);
}

function createScenario() {
  emit('create');
  close();
}

function loadSample() {
  emit('load-sample');
  close();
}

function openTour() {
  emit('open-tour');
  // keep open? close after opening tour if you navigate
}
</script>

<style scoped>
.welcome-modal-overlay {
  position: fixed; inset: 0; display:flex; align-items:center; justify-content:center;
  background: rgba(0,0,0,0.45);
}
.welcome-modal { width: 720px; max-width: calc(100% - 32px); background: var(--panel-bg); padding: 1.25rem; border-radius: 8px; outline: none; }
.modal-header { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; }
.modal-body { margin-top:0.5rem; }
.modal-actions { display:flex; gap:0.5rem; margin:1rem 0; flex-wrap:wrap; }
.primary-button { /* style to match app */ }
.checkbox { display:flex; gap:0.5rem; align-items:center; margin-top:0.5rem; }
</style>