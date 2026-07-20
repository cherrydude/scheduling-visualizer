<template>
  <div class="ranking-list">
    <ul v-if="rows && rows.length">
      <li v-for="(row, idx) in rows" :key="row.id" class="ranking-row">
        <div class="rank">{{ idx + 1 }}</div>
        <div class="meta">
          <strong>{{ row.label }}</strong>
          <small>Score: {{ row.score }}</small>
        </div>
      </li>
    </ul>

    <div v-else class="ranking-fallback">
      <div v-if="hasRuns" class="fallback-item">
        Runs sind vorhanden, aber kein Vergleich verfügbar (einige Algorithmen
        werden nicht unterstützt).
      </div>
      <div v-else>
        <div class="fallback-item">
          LCFS — bereit — Wird in Woche 2 integriert
        </div>
        <div class="fallback-item">
          Strict Priority — bereit — Wird in Woche 2 integriert
        </div>
        <div class="fallback-item">
          MLFQ — bereit — Wird in Woche 2 integriert
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { ComparisonRow } from "@/utils/compare";

const props = defineProps({
  rows: { type: Array as PropType<ComparisonRow[]>, required: false },
  hasRuns: { type: Boolean, required: false },
});

const hasRuns = props.hasRuns;
</script>

<style scoped>
.ranking-list {
  padding: 6px 0;
}
.ranking-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 0;
}
.rank {
  width: 20px;
  font-weight: bold;
}
.meta small {
  display: block;
  color: #6b7280;
}
.ranking-fallback {
  color: #374151;
}
.fallback-item {
  padding: 6px 0;
}
</style>
