<template>
  <section v-if="modelValue" class="modal-overlay" @click.self="$emit('close')">
      <div
        ref="modalRoot"
        class="modal panel algorithm-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="modalTitle"
        @keydown.esc.prevent="$emit('close')"
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
              <option value="sjf">Shortest Job First</option>
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
                <option value="preemptive">Präemptiv</option>
                <option value="nonPreemptive">Nicht-präemptiv</option>
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
            <template v-if="algorithm === 'strictPriority'">
              <label class="algorithm-field">
                <span>Tie-Break</span>
                <select v-model="strictPriorityTieBreak" class="algorithm-control">
                  <option value="fifo">FIFO</option>
                  <option value="arrivalTime">Früheste Ankunft</option>
                  <option value="remainingTime">Kürzeste Restzeit</option>
                  <option value="waitingTime">Längste Wartezeit</option>
                  <option value="id">Prozess-ID</option>
                </select>
              </label>

              <p class="subtitle">
                Kleine Prioritätszahlen werden zuerst behandelt. Gleichstand wird
                über die ausgewählte Tie-Break-Regel aufgelöst.
              </p>
              <p class="warning-note">
                Achtung: Bei dauerhaft höher priorisierten Ankünften kann
                Starvation für niedrige Prioritäten auftreten.
              </p>
            </template>
            <template v-else-if="algorithm === 'mlfq'">
              <label class="algorithm-field">
                <span>Queue-Stufen</span>
                <input
                  v-model.number="queueLevels"
                  class="algorithm-control"
                  type="number"
                  min="2"
                />
              </label>

              <label class="algorithm-field">
                <span>Basis-Quantum</span>
                <input
                  v-model.number="timeQuantum"
                  class="algorithm-control"
                  type="number"
                  min="1"
                />
              </label>

              <label class="algorithm-field">
                <span>Modus</span>
                <select v-model="mlfqMode" class="algorithm-control">
                  <option value="classic">Classic (Lehrbuch)</option>
                  <option value="simplified">Simplified</option>
                </select>
              </label>

              <p class="subtitle">
                Prozesse starten in der obersten Ebene. Bei Quantum-Ende werden
                sie in die nächstniedrigere Ebene verschoben.
              </p>
            </template>
            <template v-else-if="algorithm === 'sjf'">
              <label class="algorithm-field">
                <span>Modus</span>
                <select v-model="sjfMode" class="algorithm-control">
                  <option value="nonPreemptive">Nicht-präemptiv (SJF)</option>
                  <option value="preemptive">Präemptiv (SRTF)</option>
                </select>
              </label>

              <p class="subtitle">
                Bei SRTF wird ein laufender Prozess verdrängt, wenn ein neuer
                Prozess mit kürzerer Restlaufzeit eintrifft.
              </p>
              <p class="warning-note" v-if="sjfMode === 'preemptive'">
                Achtung: Lange Jobs können durch viele kurze Ankünfte stark
                verzögert werden (Starvation-Risiko).
              </p>
            </template>
            <p v-else class="subtitle">
              Für diesen Algorithmus sind im aktuellen Stand keine zusätzlichen
              Einstellwerte aktiv.
            </p>
          </template>

          <div class="button-row submit-row">
            <button class="primary-button" type="submit">
              {{ confirmLabel }}
            </button>
            <button
              v-if="showDeleteButton"
              class="danger-button"
              type="button"
              @click="$emit('delete-run')"
            >
              Run löschen
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
import { useFocusTrap } from "@/composables/useFocusTrap";
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
    sjfMode?: "nonPreemptive" | "preemptive";
    mlfqMode?: "classic" | "simplified";
    strictPriorityTieBreak?:
      | "fifo"
      | "arrivalTime"
      | "remainingTime"
      | "waitingTime"
      | "id";
    lcfsMode?: "preemptive" | "nonPreemptive";
    lcfsTieBreak?: "stack" | "id";
  };
  confirmLabel?: string;
  showDeleteButton?: boolean;
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
        sjfMode?: "nonPreemptive" | "preemptive";
        mlfqMode?: "classic" | "simplified";
        strictPriorityTieBreak?:
          | "fifo"
          | "arrivalTime"
          | "remainingTime"
          | "waitingTime"
          | "id";
        lcfsMode?: "preemptive" | "nonPreemptive";
        lcfsTieBreak?: "stack" | "id";
      };
    },
  ): void;
  (e: "delete-run"): void;
}>();

const algorithm = ref<AlgorithmType>("roundRobin");
const modalRoot = ref<HTMLElement | null>(null);
useFocusTrap(modalRoot, () => emit("close"));
const timeQuantum = ref(2);
const snapshotInterval = ref(1);
const queueLevels = ref(3);
const sjfMode = ref<"nonPreemptive" | "preemptive">("nonPreemptive");
const mlfqMode = ref<"classic" | "simplified">("classic");
const strictPriorityTieBreak = ref<
  "fifo" | "arrivalTime" | "remainingTime" | "waitingTime" | "id"
>("fifo");
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
        "Zeitscheibe (Quantum): Kleinere Werte erhöhen Reaktionsfaehigkeit, aber auch Kontextwechsel.",
        "Zeitscheibe (Quantum): Grössere Werte reduzieren Kontextwechsel, können aber lange Wartezeiten für andere Prozesse erzeugen.",
      ],
    };
  }

  if (algorithm.value === "lcfs") {
    return {
      title: "LCFS",
      description:
        "Last Come, First Served bevorzugt den zuletzt eingetroffenen Prozess. Neue Ankünfte werden wie bei einem Stack behandelt und können den laufenden Prozess je nach Variante direkt verdrängen.",
      parameterImpact: [
        "Variante: Präemptiv LCFS unterbricht den laufenden Prozess bei neuer Ankunft, Nicht-präemptiv erst nach Abschluss.",
        "Tie-Break: Stack-Reihenfolge bevorzugt die zuletzt eingefügten Prozesse, ID sorgt für stabile, alphabetische Entscheidung bei Gleichstand.",
      ],
    };
  }

  if (algorithm.value === "sjf") {
    const isSrtf = sjfMode.value === "preemptive";
    return {
      title: isSrtf ? "Shortest Remaining Time First" : "Shortest Job First",
      description:
        isSrtf
          ? "SRTF ist die präemptive Variante von SJF. Trifft ein kürzerer Job ein, wird der laufende Prozess unterbrochen."
          : "SJF wählt den Prozess mit der kürzesten verbleibenden Laufzeit aus der Ready Queue und führt ihn ohne Unterbrechung zu Ende.",
      parameterImpact: [
        isSrtf
          ? "Kurze Jobs reagieren schneller, dafür steigen Kontextwechsel durch mögliche Verdrängungen."
          : "Kürzere Jobs werden bevorzugt und oft schneller abgeschlossen.",
        "Bei gleicher Restzeit entscheidet zuerst die frühere Ankunft, danach die Prozess-ID.",
      ],
      note: isSrtf
        ? "Die Verdrängung erfolgt nur bei strikt kürzerer Restlaufzeit. Achtung: Viele kurze Ankünfte können lange Jobs stark verzögern (Starvation-Risiko)."
        : "Nicht-präemptiv: Ein laufender Prozess wird nicht verdrängt.",
    };
  }

  if (algorithm.value === "strictPriority") {
    return {
      title: "Strict Priority",
      description:
        "Prozesse mit hoeherer Prioritaet werden strikt vor niedrigeren priorisiert. Das verbessert kritische Jobs, kann aber Starvation verursachen.",
      parameterImpact: [
        "Kleinere Prioritätszahlen werden zuerst behandelt.",
        "Der Tie-Break steuert, was bei gleicher Priorität als Nächstes läuft.",
      ],
      note: "Strict Priority ist präemptiv implementiert und reagiert auf höher priorisierte Ankünfte. Achtung: Bei dauerhaft hoher Last kann Starvation niedriger Prioritäten auftreten.",
    };
  }

  if (algorithm.value === "mlfq") {
    return {
      title: "MLFQ",
      description:
        "Multi-Level Feedback Queue verteilt Prozesse auf mehrere Ebenen. Kurze oder interaktive Prozesse bleiben oben, lange Jobs werden mit der Zeit nach unten verschoben.",
      parameterImpact: [
        "Queue-Stufen bestimmen, wie fein das Feedback-System aufgeteilt ist.",
        "Das Basis-Quantum wächst pro niedrigerer Ebene, damit lange Jobs seltener unterbrechen.",
        "Classic behält Rest-Quantum bei Präemption, Simplified setzt das Quantum bei erneuter Einplanung zurück.",
      ],
      note: "Die aktuelle Ebene wird im Queue-Panel sichtbar gemacht.",
    };
  }

  return {
    title: "MLFQ",
    description:
      "Multi-Level Feedback Queue verteilt Prozesse auf mehrere Warteschlangen je nach Laufverhalten und priorisiert kuerzere/interaktive Jobs.",
    parameterImpact: [
      "Queue-Stufen sind konzeptionell zentral für MLFQ.",
      "Snapshot-Intervall beeinflusst nur die Visualisierungsdichte.",
    ],
    note: "MLFQ nutzt Queue-Stufen und ein wachsendes Quantum pro Ebene.",
  };
});

function submitForm() {
  emit("confirm", {
    algorithm: algorithm.value,
    algorithmParams: {
      timeQuantum: Math.max(1, Math.floor(timeQuantum.value || 1)),
      snapshotInterval: Math.max(1, Math.floor(snapshotInterval.value || 1)),
      queueLevels: Math.max(1, Math.floor(queueLevels.value || 1)),
      sjfMode: sjfMode.value,
      mlfqMode: mlfqMode.value,
      strictPriorityTieBreak: strictPriorityTieBreak.value,
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
    sjfMode.value = props.initialAlgorithmParams?.sjfMode ?? "nonPreemptive";
    mlfqMode.value = props.initialAlgorithmParams?.mlfqMode ?? "classic";
    strictPriorityTieBreak.value =
      props.initialAlgorithmParams?.strictPriorityTieBreak ?? "fifo";
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
  color: var(--muted);
}

.warning-note {
  margin: 6px 0 0;
  color: #f59e0b;
  font-size: 0.9rem;
  line-height: 1.45;
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
  color: var(--muted);
}

.algorithm-info-note {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
}

@media (max-width: 1100px) {
  .algorithm-modal-layout {
    grid-template-columns: 1fr;
  }
}
</style>
