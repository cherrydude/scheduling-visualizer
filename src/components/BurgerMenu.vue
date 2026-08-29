<template>
  <div class="burger-shell" ref="menuRef">
    <button
      class="burger-button"
      data-tour="burger-button"
      type="button"
      aria-label="Menü öffnen"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-controls="burger-menu-panel"
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
        id="burger-menu-panel"
        class="burger-panel panel"
        role="menu"
        aria-label="Szenario-Menü"
        :style="panelStyle"
      >
        <div class="burger-section">
          <div class="section-heading">
            <strong>Szenarien</strong>
            <button
              class="secondary-button compact"
              type="button"
              data-tour="open-generator"
              aria-label="Neues Szenario anlegen"
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
              role="menuitem"
              :class="{ active: scenario.id === activeScenarioId }"
              :aria-label="`Szenario laden: ${scenario.title}`"
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
              aria-label="Szenario duplizieren"
              title="Szenario duplizieren"
              @click="handleDuplicate(activeScenarioId)"
            >
              Duplizieren
            </button>
            <button
              type="button"
              class="link-item"
              aria-label="Szenario umbenennen"
              title="Szenario umbenennen"
              @click="handleRename(activeScenarioId)"
            >
              Umbenennen
            </button>
            <button
              type="button"
              class="link-item danger"
              aria-label="Szenario löschen"
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
            <strong>Datenmanagement</strong>
          </div>

          <button
            v-if="activeScenarioId"
            type="button"
            class="link-item"
            aria-label="Szenario exportieren"
            title="Szenario als JSON exportieren"
            @click="handleExport"
          >
            Szenario exportieren
          </button>
          <button
            type="button"
            class="link-item"
            aria-label="Szenarien importieren"
            title="Szenario aus JSON-Datei importieren"
            @click="triggerFileInput"
          >
            Szenarien importieren
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleFileChange"
          />
        </div>

        <div class="burger-section">
          <div class="section-heading">
            <strong>Information</strong>
          </div>

          <!--           <button
            type="button"
            class="link-item"
            aria-label="Wissen und Hilfe öffnen"
            title="Hilfe und Wissen öffnen"
            @click="handleKnowledge"
          >
            Wissen
          </button> -->
          <button
            type="button"
            class="link-item"
            aria-label="Einführung starten"
            @click="handleTour"
          >
            Einführung starten
          </button>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { ScenarioRecord } from "@/composables/useScenarioWorkspace";

const props = defineProps<{
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
  (e: "tour"): void;
  (e: "export-scenario", id: string): void;
  (e: "import-scenario", result: { success: boolean; message: string }): void;
}>();

const open = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
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

function handleTour() {
  closeMenu();
  emit("tour");
}

function handleExport() {
  closeMenu();
  if (props.activeScenarioId) {
    emit("export-scenario", props.activeScenarioId);
  }
}

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const jsonString = e.target?.result as string;
      emit("import-scenario", { success: true, message: jsonString });
      closeMenu();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Fehler beim Lesen der Datei";
      emit("import-scenario", { success: false, message: errorMsg });
    }
  };

  reader.onerror = () => {
    emit("import-scenario", {
      success: false,
      message: "Datei konnte nicht gelesen werden",
    });
  };

  reader.readAsText(file);

  // Reset file input für erneute Auswahl
  target.value = "";
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
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.scenario-item:hover,
.link-item:hover {
  border-color: rgba(96, 165, 250, 0.3);
}

.scenario-item.active {
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(96, 165, 250, 0.17),
    rgba(96, 165, 250, 0.08)
  );
  border-color: rgba(96, 165, 250, 0.9);
  border-width: 1px;
  border-style: solid;
  box-shadow:
    0 0 0 1px rgba(96, 165, 250, 0.28),
    0 8px 20px rgba(37, 99, 235, 0.12);
  transform: translateY(-1px);
}

.scenario-item.active::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, #60a5fa, #2563eb);
}

.scenario-item.active .scenario-title {
  font-weight: 700;
  color: var(--text);
}

.scenario-item.active .scenario-meta {
  color: var(--accent);
  font-weight: 600;
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

html[data-theme="light"] .scenario-item.active {
  background: linear-gradient(
    180deg,
    rgba(96, 165, 250, 0.25),
    rgba(59, 130, 246, 0.09)
  );
  border-color: rgba(29, 78, 216, 0.95) !important;
  border-width: 1px !important;
  border-style: solid !important;
  box-shadow:
    0 0 0 2px rgba(37, 99, 235, 0.18),
    0 10px 22px rgba(37, 99, 235, 0.12),
    inset 0 0 0 1px rgba(37, 99, 235, 0.18);
}

html[data-theme="light"] .scenario-item.active::before {
  background: linear-gradient(180deg, #3b82f6, #1d4ed8);
}

html[data-theme="light"] .scenario-item.active .scenario-title {
  color: #0f172a;
}

html[data-theme="light"] .scenario-item.active .scenario-meta {
  color: #1d4ed8;
}

html[data-theme="dark"] .scenario-item.active {
  background: linear-gradient(
    180deg,
    rgba(96, 165, 250, 0.18),
    rgba(96, 165, 250, 0.07)
  );
  border-color: rgba(125, 211, 252, 0.95);
  box-shadow:
    0 0 0 1px rgba(125, 211, 252, 0.28),
    0 8px 20px rgba(14, 116, 144, 0.2);
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
