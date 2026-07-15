<template>
  <div class="burger-shell" ref="menuRef">
    <button class="burger-button" type="button" aria-label="Menue" @click="toggleMenu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <div v-if="open" class="burger-panel panel">
      <div class="burger-section">
        <div class="section-heading">
          <strong>Szenarien</strong>
          <button class="secondary-button compact" type="button" @click="$emit('create')">+</button>
        </div>

        <div v-if="scenarios.length" class="scenario-list">
          <button
            v-for="scenario in scenarios"
            :key="scenario.id"
            type="button"
            class="scenario-item"
            :class="{ active: scenario.id === activeScenarioId }"
            @click="$emit('select', scenario.id)"
          >
            <span class="scenario-title">{{ scenario.title }}</span>
            <span class="scenario-meta">{{ scenario.appliedAlgorithm ? scenario.appliedAlgorithm.algorithm : 'kein Algo' }}</span>
          </button>
        </div>

        <div v-if="activeScenarioId" class="scenario-actions">
          <button type="button" class="link-item" @click="$emit('duplicate', activeScenarioId)">Duplizieren</button>
          <button type="button" class="link-item" @click="$emit('rename', activeScenarioId)">Umbenennen</button>
          <button type="button" class="link-item danger" @click="$emit('delete', activeScenarioId)">Loeschen</button>
        </div>

        <p v-else class="menu-note">Noch kein Szenario angelegt.</p>
      </div>

      <div class="burger-section">
        <div class="section-heading">
          <strong>Information</strong>
        </div>

        <button type="button" class="link-item" @click="$emit('about')">Über mich</button>
        <button type="button" class="link-item" @click="$emit('knowledge')">Wissen</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { ScenarioRecord } from '@/composables/useScenarioWorkspace';

defineProps<{
  scenarios: ScenarioRecord[];
  activeScenarioId: string | null;
}>();

defineEmits<{
  (e: 'create'): void;
  (e: 'select', id: string): void;
  (e: 'duplicate', id: string): void;
  (e: 'rename', id: string): void;
  (e: 'delete', id: string): void;
  (e: 'about'): void;
  (e: 'knowledge'): void;
}>();

const open = ref(false);
const menuRef = ref<HTMLElement | null>(null);

function toggleMenu() {
  open.value = !open.value;
}

function closeMenu(ev: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(ev.target as Node)) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu);
});
</script>

<style scoped>
.burger-shell {
  position: relative;
  z-index: 200;
}

.burger-button {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.8);
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 0 11px;
  cursor: pointer;
}

.burger-button span {
  display: block;
  width: 100%;
  height: 2px;
  border-radius: 999px;
  background: #e2e8f0;
}

.burger-panel {
  position: absolute;
  top: 52px;
  left: 0;
  width: 320px;
  padding: 16px;
  z-index: 999;
  display: grid;
  gap: 16px;
}

.burger-section {
  display: grid;
  gap: 10px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compact {
  padding: 4px 10px;
  min-width: 34px;
}

.scenario-list {
  display: grid;
  gap: 8px;
}

.scenario-item,
.link-item {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.02);
  color: #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
}

.scenario-item.active {
  border-color: rgba(96, 165, 250, 0.6);
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.2) inset;
}

.scenario-title,
.scenario-meta {
  display: block;
}

.scenario-meta,
.menu-note {
  font-size: 12px;
  color: #94a3b8;
}

.scenario-actions {
  display: grid;
  gap: 8px;
}

.burger-section + .burger-section {
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  padding-top: 12px;
}

.danger {
  color: #fca5a5;
}
</style>