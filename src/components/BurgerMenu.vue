<template>
  <div class="burger-shell" ref="menuRef">
    <button
      class="burger-button"
      type="button"
      aria-label="Menue"
      @click="toggleMenu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        class="burger-panel panel"
        :style="panelStyle"
      >
        <div class="burger-section">
          <div class="section-heading">
            <strong>Szenarien</strong>
            <button
              class="secondary-button compact"
              type="button"
              title="Neues Szenario anlegen"
              @click="handleCreate"
            >
              +
            </button>
          </div>

          <div v-if="scenarios.length" class="scenario-list">
            <button
              v-for="scenario in scenarios"
              :key="scenario.id"
              type="button"
              class="scenario-item"
              :class="{ active: scenario.id === activeScenarioId }"
              title="Dieses Szenario laden"
              @click="handleSelect(scenario.id)"
            >
              <span class="scenario-title">{{ scenario.title }}</span>
              <span class="scenario-meta">{{
                scenario.runs.length
                  ? `${scenario.runs.length} Run(s)`
                  : "0 Run(s)"
              }}</span>
            </button>
          </div>

          <div v-if="activeScenarioId" class="scenario-actions">
            <button
              type="button"
              class="link-item"
              title="Szenario duplizieren"
              @click="handleDuplicate(activeScenarioId)"
            >
              Duplizieren
            </button>
            <button
              type="button"
              class="link-item"
              title="Szenario umbenennen"
              @click="handleRename(activeScenarioId)"
            >
              Umbenennen
            </button>
            <button
              type="button"
              class="link-item danger"
              title="Szenario löschen"
              @click="handleDelete(activeScenarioId)"
            >
              Löschen
            </button>
          </div>

          <p v-else class="menu-note">Noch kein Szenario angelegt.</p>
        </div>

        <div class="burger-section">
          <div class="section-heading">
            <strong>Information</strong>
          </div>

          <button type="button" class="link-item" @click="handleAbout">
            Über mich
          </button>
          <button type="button" class="link-item" title="Hilfe und Wissen öffnen" @click="handleKnowledge">
            Wissen
          </button>
        </div>

        
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { ScenarioRecord } from "@/composables/useScenarioWorkspace";

defineProps<{
  scenarios: ScenarioRecord[];
  activeScenarioId: string | null;
}>();

const emit = defineEmits<{
  (e: "create"): void;
  (e: "select", id: string): void;
  (e: "duplicate", id: string): void;
  (e: "rename", id: string): void;
  (e: "delete", id: string): void;
  (e: "about"): void;
  (e: "knowledge"): void;
}>();

const open = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const panelStyle = ref<Record<string, string>>({});

function toggleMenu() {
  open.value = !open.value;
  // when opening, position panel near the button
  if (open.value && menuRef.value) {
    const rect = menuRef.value.getBoundingClientRect();
    panelStyle.value = {
      position: "fixed",
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      width: `320px`,
      zIndex: "3000",
    };
  }
}

function closeMenu() {
  open.value = false;
}

function handleCreate() {
  closeMenu();
  emit("create");
}

function handleSelect(id: string) {
  closeMenu();
  emit("select", id);
}

function handleDuplicate(id: string | null) {
  if (!id) return;
  closeMenu();
  emit("duplicate", id);
}

function handleRename(id: string | null) {
  if (!id) return;
  closeMenu();
  emit("rename", id);
}

function handleDelete(id: string | null) {
  if (!id) return;
  closeMenu();
  emit("delete", id);
}

function handleAbout() {
  closeMenu();
  emit("about");
}

function handleKnowledge() {
  closeMenu();
  emit("knowledge");
}

function closeOnDocumentClick(ev: MouseEvent) {
  const target = ev.target as Node;
  const clickedOutsideMenu = menuRef.value && !menuRef.value.contains(target);
  const clickedOutsidePanel =
    panelRef.value && !panelRef.value.contains(target);
  if (
    (clickedOutsideMenu && (!panelRef.value || clickedOutsidePanel)) ||
    (!menuRef.value && (!panelRef.value || clickedOutsidePanel))
  ) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", closeOnDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeOnDocumentClick);
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
  background: var(--text);
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
  color: var(--text);
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
  color: var(--muted);
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
  color: var(--danger);
}
</style>
