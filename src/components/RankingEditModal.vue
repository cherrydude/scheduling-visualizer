<template>
  <teleport to="body">
    <section
      v-if="modelValue"
      class="modal-overlay"
      @click.self="$emit('close')"
    >
      <div
        class="modal panel algorithm-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Anwendungsfall anpassen"
      >
        <div class="section-header">
          <div>
            <h2>Anwendungsfall anpassen</h2>
            <p class="subtitle subtitle-meta">
              Lege fest, welche Kennzahlen fuer diesen Fall wichtiger sind.
            </p>
          </div>
          <button
            class="secondary-button"
            type="button"
            @click="$emit('close')"
          >
            Schliessen
          </button>
        </div>

        <div class="modal-layout algorithm-modal-layout">
          <form class="form-grid algorithm-form" @submit.prevent="submit">
            <label
              class="algorithm-field"
              v-for="(v, key) in localWeights"
              :key="key"
            >
              <span>{{ formatKey(key) }} ({{ Math.round(v * 100) }}%)</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                v-model.number="localWeights[key]"
              />
            </label>

            <div class="button-row submit-row">
              <button class="primary-button" type="submit">Übernehmen</button>
            </div>
          </form>

          <aside class="modal-help panel soft-panel algorithm-info-panel">
            <h3>Vergleichslogik</h3>
            <p>
              Definiere die relative Bedeutung der Kennzahlen fuer diesen
              Anwendungsfall. Hoehere Werte bedeuten groessere Gewichtung.
            </p>

            <h4>Antwortzeit</h4>
            <p>Schnelle Reaktion bei interaktiven Systemen und UI-Workloads.</p>

            <h4>Turnaround</h4>
            <p>
              Kurzlebigkeit / durchschnittliche Fertigstellungszeit der
              Prozesse.
            </p>

            <h4>Wartezeit</h4>
            <p>Wie lange Prozesse insgesamt warteten (niedriger ist besser).</p>

            <h4>Durchsatz</h4>
            <p>
              Anzahl abgeschlossener Prozesse pro Zeiteinheit (hoeher ist
              besser).
            </p>

            <h4>Kontextwechsel</h4>
            <p>
              Signalisiert Preemption- und Scheduling-Overhead; niedriger ist
              besser.
            </p>

            <h4>Präemptions</h4>
            <p>
              Hilft bei Fällen, in denen häufige Unterbrechungen unerwünscht
              sind.
            </p>

            <h4>Fairness</h4>
            <p>
              Jain's Index: Gleichmaessigkeit der CPU-Verteilung (hoeher ist
              besser).
            </p>
          </aside>
        </div>
      </div>
    </section>
  </teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";

const props = defineProps<{
  modelValue: boolean;
  initialWeights: Record<string, number>;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", payload: Record<string, number>): void;
}>();

const localWeights = reactive<Record<string, number>>({
  averageResponseTime: 0,
  averageTurnaroundTime: 0.4,
  averageWaitingTime: 0.3,
  throughput: 0.2,
  fairnessIndex: 0.1,
  contextSwitches: 0,
  preemptionCount: 0,
});

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    Object.assign(localWeights, props.initialWeights ?? localWeights);
  },
);

function submit() {
  emit("confirm", { ...localWeights });
  emit("close");
}

function formatKey(key: string) {
  if (key === "averageResponseTime") return "Antwortzeit";
  if (key === "averageTurnaroundTime") return "Durchlaufzeit";
  if (key === "averageWaitingTime") return "Wartezeit";
  if (key === "throughput") return "Durchsatz";
  if (key === "contextSwitches") return "Kontextwechsel";
  if (key === "preemptionCount") return "Präemptions";
  if (key === "fairnessIndex") return "Fairness";
  return key;
}
</script>

<style scoped>
.modal {
  max-width: 880px;
  margin: 0 auto;
}
.algorithm-modal-layout {
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.75fr);
}
.algorithm-form {
  align-content: start;
}
.algorithm-field {
  width: min(100%, 560px);
  margin-bottom: 8px;
}
.submit-row {
  justify-content: flex-start;
}
.algorithm-info-panel {
  display: grid;
  gap: 0.75rem;
  align-content: start;
}
.algorithm-info-panel h3,
.algorithm-info-panel h4 {
  margin: 0;
}
.algorithm-info-list {
  margin: 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.4rem;
  color: var(--muted);
}
.algorithm-info-note {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
}
@media (max-width: 900px) {
  .algorithm-modal-layout {
    grid-template-columns: 1fr;
  }
}
</style>
