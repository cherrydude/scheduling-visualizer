<template>
  <section v-if="modelValue" class="modal-overlay" @click.self="$emit('close')">
    <div
      class="modal panel algorithm-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="modalTitle"
    >
      <div class="section-header">
        <div>
          <h2>{{ modalTitle }}</h2>
          <p class="subtitle subtitle-meta" v-if="scenarioTitle || runLabel">
            <span v-if="scenarioTitle">Szenario: {{ scenarioTitle }}</span>
            <span v-if="runLabel">Run: {{ runLabel }}</span>
          </p>
        </div>
        <button class="secondary-button" type="button" @click="$emit('close')">
          Schliessen
        </button>
      </div>

      <div class="modal-layout algorithm-modal-layout">
        <form class="form-grid algorithm-form" @submit.prevent="submitForm">
          <label class="algorithm-field">
            <span>Algorithmus</span>
            <select v-model="algorithm" class="algorithm-control">
              <option value="roundRobin">Round Robin</option>
              <option value="lcfs">LCFS</option>
              <option value="strictPriority">Strict Priority</option>
              <option value="mlfq">MLFQ</option>
            </select>
          </label>

          <label v-if="algorithm === 'roundRobin'" class="algorithm-field">
            <span>Zeitscheibe (Quantum)</span>
            <input
              v-model.number="timeQuantum"
              class="algorithm-control"
              type="number"
              min="1"
            />
          </label>

          <template v-else-if="algorithm === 'lcfs'">
            <label class="algorithm-field">
              <span>Variante</span>
              <select v-model="lcfsMode" class="algorithm-control">
                <option value="preemptive">Preemptive</option>
                <option value="nonPreemptive">Non-preemptive</option>
              </select>
            </label>

            <label class="algorithm-field">
              <span>Tie-Break</span>
              <select v-model="lcfsTieBreak" class="algorithm-control">
                <option value="stack">Stack-Reihenfolge</option>
                <option value="id">Prozess-ID</option>
              </select>
            </label>
          </template>

          <template v-else>
            <p class="subtitle">
              Fuer diesen Algorithmus sind im aktuellen Stand keine
              zusaetzlichen Einstellwerte aktiv.
            </p>
          </template>

          <div class="button-row submit-row">
            <button class="primary-button" type="submit">
              {{ confirmLabel }}
            </button>
          </div>
        </form>

        <aside class="modal-help panel soft-panel algorithm-info-panel">
          <h3>{{ algorithmInfo.title }}</h3>
          <p>{{ algorithmInfo.description }}</p>

          <h4>Parameterwirkung</h4>
          <ul class="algorithm-info-list">
            <li v-for="item in algorithmInfo.parameterImpact" :key="item">
              {{ item }}
            </li>
          </ul>

          <p class="algorithm-info-note">{{ algorithmInfo.note }}</p>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { AlgorithmType } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  scenarioTitle?: string;
  modalTitle?: string;
  runLabel?: string;
  initialAlgorithm?: AlgorithmType;
  initialAlgorithmParams?: {
    timeQuantum: number;
    snapshotInterval: number;
    queueLevels: number;
    lcfsMode?: "preemptive" | "nonPreemptive";
    lcfsTieBreak?: "stack" | "id";
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
        lcfsMode?: "preemptive" | "nonPreemptive";
        lcfsTieBreak?: "stack" | "id";
      };
    },
  ): void;
}>();

const algorithm = ref<AlgorithmType>("roundRobin");
const timeQuantum = ref(2);
const snapshotInterval = ref(1);
const queueLevels = ref(3);
const lcfsMode = ref<"preemptive" | "nonPreemptive">("preemptive");
const lcfsTieBreak = ref<"stack" | "id">("stack");

const confirmLabel = computed(
  () => props.confirmLabel ?? "Algorithmus anwenden",
);

const modalTitle = computed(() => props.modalTitle ?? "Algorithmus anwenden");

const algorithmInfo = computed(() => {
  if (algorithm.value === "roundRobin") {
    return {
      title: "Round Robin",
      description:
        "Alle Prozesse erhalten reihum CPU-Zeit. Nach Ablauf des Quantums wird der laufende Prozess, falls nicht fertig, wieder hinten in die Ready Queue eingeordnet.",
      parameterImpact: [
        "Zeitscheibe (Quantum): Kleinere Werte erhoehen Reaktionsfaehigkeit, aber auch Kontextwechsel.",
        "Zeitscheibe (Quantum): Groessere Werte reduzieren Kontextwechsel, koennen aber lange Wartezeiten fuer andere Prozesse erzeugen.",
      ],
      note: "Snapshot-Intervall beeinflusst nur die Dichte der Visualisierungs-Snapshots. Queue-Stufen werden fuer Round Robin derzeit nicht verwendet.",
    };
  }

  if (algorithm.value === "lcfs") {
    return {
      title: "LCFS",
      description:
        "Last Come, First Served bevorzugt den zuletzt eingetroffenen Prozess. Neue Ankünfte werden wie bei einem Stack behandelt und koennen den laufenden Prozess je nach Variante direkt verdrängen.",
      parameterImpact: [
        "Variante: Preemptive LCFS unterbricht den laufenden Prozess bei neuer Ankunft, Non-preemptive erst nach Abschluss.",
        "Tie-Break: Stack-Reihenfolge bevorzugt die zuletzt eingefuegten Prozesse, ID sorgt fuer stabile, alphabetische Entscheidung bei Gleichstand.",
      ],
      note: "LCFS ist als Auswahl bereits vorhanden; die hier gewaehlten Optionen sind fuer die spaetere Simulationslogik vorgesehen.",
    };
  }

  if (algorithm.value === "strictPriority") {
    return {
      title: "Strict Priority",
      description:
        "Prozesse mit hoeherer Prioritaet werden strikt vor niedrigeren priorisiert. Das verbessert kritische Jobs, kann aber Starvation verursachen.",
      parameterImpact: [
        "Derzeit sind keine zusaetzlichen Steuerparameter aktiv.",
        "Snapshot-Intervall/Queue-Stufen sind momentan ohne Einfluss auf die Berechnung.",
      ],
      note: "Strict Priority ist vorbereitet und wird nach Round Robin vollstaendig integriert.",
    };
  }

  return {
    title: "MLFQ",
    description:
      "Multi-Level Feedback Queue verteilt Prozesse auf mehrere Warteschlangen je nach Laufverhalten und priorisiert kuerzere/interaktive Jobs.",
    parameterImpact: [
      "Queue-Stufen sind konzeptionell zentral fuer MLFQ, im aktuellen Build aber noch nicht aktiv.",
      "Snapshot-Intervall beeinflusst nur die Visualisierungsdichte.",
    ],
    note: "MLFQ ist als naechster Ausbaupfad vorgesehen; die Kernparameter werden mit der finalen MLFQ-Logik freigeschaltet.",
  };
});

function submitForm() {
  emit("confirm", {
    algorithm: algorithm.value,
    algorithmParams: {
      timeQuantum: Math.max(1, Math.floor(timeQuantum.value || 1)),
      snapshotInterval: Math.max(1, Math.floor(snapshotInterval.value || 1)),
      queueLevels: Math.max(1, Math.floor(queueLevels.value || 1)),
      lcfsMode: lcfsMode.value,
      lcfsTieBreak: lcfsTieBreak.value,
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
    lcfsMode.value = props.initialAlgorithmParams?.lcfsMode ?? "preemptive";
    lcfsTieBreak.value = props.initialAlgorithmParams?.lcfsTieBreak ?? "stack";
  },
);
</script>

<style scoped>
.algorithm-modal {
  max-width: 980px;
  margin: 0 auto;
}

.algorithm-modal-layout {
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
}

.algorithm-form {
  align-content: start;
}

.algorithm-form .submit-row {
  justify-content: flex-start;
}

.algorithm-field {
  width: min(100%, 560px);
}

.algorithm-control {
  min-height: 42px;
  padding: 0.58rem 0.72rem;
  border-radius: 11px;
}

.subtitle {
  margin: 4px 0 0;
  color: #94a3b8;
}

.subtitle-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1.1rem;
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
  color: #cbd5e1;
}

.algorithm-info-note {
  margin: 0;
  color: #94a3b8;
  font-size: 0.92rem;
}

@media (max-width: 1100px) {
  .algorithm-modal-layout {
    grid-template-columns: 1fr;
  }
}
</style>
