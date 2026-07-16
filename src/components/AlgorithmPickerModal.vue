<template>
  <section v-if="modelValue" class="modal-overlay" @click.self="$emit('close')">
    <div
      class="modal panel algorithm-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Algorithmus anwenden"
    >
      <div class="section-header">
        <div>
          <h2>Algorithmus anwenden</h2>
          <p class="subtitle" v-if="scenarioTitle">
            Szenario: {{ scenarioTitle }}
          </p>
        </div>
        <button class="secondary-button" type="button" @click="$emit('close')">
          Schliessen
        </button>
      </div>

      <form class="form-grid" @submit.prevent="submitForm">
        <label>
          <span>Algorithmus</span>
          <select v-model="algorithm">
            <option value="roundRobin">Round Robin</option>
            <option value="lcfs">LCFS</option>
            <option value="strictPriority">Strict Priority</option>
            <option value="mlfq">MLFQ</option>
          </select>
        </label>

        <label>
          <span>Zeitscheibe</span>
          <input v-model.number="timeQuantum" type="number" min="1" />
        </label>

        <label>
          <span>Snapshot-Intervall</span>
          <input v-model.number="snapshotInterval" type="number" min="1" />
        </label>

        <label>
          <span>Queue-Stufen</span>
          <input v-model.number="queueLevels" type="number" min="1" />
        </label>

        <div class="button-row submit-row">
          <button class="primary-button" type="submit">
            Algorithmus anwenden
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { AlgorithmType } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  scenarioTitle?: string;
  initialAlgorithm?: AlgorithmType;
  initialAlgorithmParams?: {
    timeQuantum: number;
    snapshotInterval: number;
    queueLevels: number;
  };
  confirmLabel?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "confirm",
    payload: {
      algorithm: AlgorithmType;
      algorithmParams: {
        timeQuantum: number;
        snapshotInterval: number;
        queueLevels: number;
      };
    },
  ): void;
}>();

const algorithm = ref<AlgorithmType>("roundRobin");
const timeQuantum = ref(2);
const snapshotInterval = ref(1);
const queueLevels = ref(3);

function submitForm() {
  emit("confirm", {
    algorithm: algorithm.value,
    algorithmParams: {
      timeQuantum: Math.max(1, Math.floor(timeQuantum.value || 1)),
      snapshotInterval: Math.max(1, Math.floor(snapshotInterval.value || 1)),
      queueLevels: Math.max(1, Math.floor(queueLevels.value || 1)),
    },
  });
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      return;
    }

    algorithm.value = props.initialAlgorithm ?? "roundRobin";
    timeQuantum.value = props.initialAlgorithmParams?.timeQuantum ?? 2;
    snapshotInterval.value =
      props.initialAlgorithmParams?.snapshotInterval ?? 1;
    queueLevels.value = props.initialAlgorithmParams?.queueLevels ?? 3;
  },
);
</script>

<style scoped>
.algorithm-modal {
  max-width: 540px;
  margin: 0 auto;
}

.subtitle {
  margin: 4px 0 0;
  color: #94a3b8;
}
</style>
