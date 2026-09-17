import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("accessibility (static checks)", () => {
  it("WelcomeModal.vue contains dialog role and aria-modal", () => {
    const path = resolve(__dirname, "../src/components/WelcomeModal.vue");
    const src = readFileSync(path, "utf8");
    expect(src).toContain('role="dialog"');
    expect(src).toContain('aria-modal="true"');
  });

  it("AlgorithmPickerModal.vue contains dialog role and aria-modal", () => {
    const path = resolve(
      __dirname,
      "../src/components/AlgorithmPickerModal.vue",
    );
    const src = readFileSync(path, "utf8");
    expect(src).toContain('role="dialog"');
    expect(src).toContain('aria-modal="true"');
    expect(src).toContain('ref="modalRoot"');
  });

  it("GanttWithGsap renders the accessible Gantt view", () => {
    const wrapperPath = resolve(
      __dirname,
      "../src/components/GanttWithGsap.vue",
    );
    const path = resolve(__dirname, "../src/components/Gantt.vue");
    const wrapperSrc = readFileSync(wrapperPath, "utf8");
    const src = readFileSync(path, "utf8");

    expect(wrapperSrc).toContain('import Gantt from "./Gantt.vue"');
    expect(wrapperSrc).toContain("<Gantt");
    expect(src).toContain("aria-labelledby");
    expect(src).toContain("<title");
    expect(src).toContain("<desc");
    expect(src).toContain('aria-label="segmentAriaLabel(segment)"');
  });

  it("AppShell generator modal exposes dialog semantics and trap activation", () => {
    const path = resolve(__dirname, "../src/AppShell.vue");
    const src = readFileSync(path, "utf8");
    expect(src).toContain('role="dialog"');
    expect(src).toContain('aria-modal="true"');
    expect(src).toContain(
      "useFocusTrap(generatorModalRef, cancelGeneratorEdit)",
    );
  });

  it("BurgerMenu exposes accessible menu semantics and labels", () => {
    const path = resolve(__dirname, "../src/components/BurgerMenu.vue");
    const src = readFileSync(path, "utf8");

    expect(src).toContain("aria-expanded");
    expect(src).toContain('aria-controls="burger-menu-panel"');
    expect(src).toContain('aria-haspopup="menu"');
    expect(src).toContain('aria-label="Neues Szenario anlegen"');
    expect(src).toContain('aria-label="Szenario duplizieren"');
    expect(src).toContain('aria-label="Szenario umbenennen"');
    expect(src).toContain('aria-label="Szenario löschen"');
    expect(src).toContain('role="menuitem"');
    expect(src).toContain("Szenario laden:");
  });

  it("ComparisonPanel announces ranking status live and keeps text labels", () => {
    const path = resolve(__dirname, "../src/components/ComparisonPanel.vue");
    const src = readFileSync(path, "utf8");

    expect(src).toContain('role="status"');
    expect(src).toContain('aria-live="polite"');
    expect(src).toContain("statusLabel(row.id)");
    expect(src).toContain('role="tablist"');
    expect(src).toContain('role="tab"');
    expect(src).toContain("aria-selected");
    expect(src).toContain('role="tabpanel"');
  });

  it("RankingEditModal uses the shared focus trap", () => {
    const path = resolve(__dirname, "../src/components/RankingEditModal.vue");
    const src = readFileSync(path, "utf8");

    expect(src).toContain('ref="modalRoot"');
    expect(src).toContain("useFocusTrap(modalRoot");
    expect(src).toContain('aria-labelledby="ranking-edit-title"');
  });

  it("interactive time controls expose labels and values", () => {
    const ganttPath = resolve(__dirname, "../src/components/GanttWithGsap.vue");
    const scrubberPath = resolve(__dirname, "../src/components/Scrubber.vue");
    const ganttSrc = readFileSync(ganttPath, "utf8");
    const scrubberSrc = readFileSync(scrubberPath, "utf8");

    expect(ganttSrc).toContain('for="playback-time-slider"');
    expect(ganttSrc).toContain('aria-describedby="playback-time-status"');
    expect(scrubberSrc).toContain('for="scrubber-range"');
    expect(scrubberSrc).toContain("aria-valuetext");
  });

  it("dialogs support Escape-to-close and focused modal trapping", () => {
    const welcomePath = resolve(
      __dirname,
      "../src/components/WelcomeModal.vue",
    );
    const algorithmPath = resolve(
      __dirname,
      "../src/components/AlgorithmPickerModal.vue",
    );
    const focusTrapPath = resolve(
      __dirname,
      "../src/composables/useFocusTrap.ts",
    );

    const welcomeSrc = readFileSync(welcomePath, "utf8");
    const algorithmSrc = readFileSync(algorithmPath, "utf8");
    const focusTrapSrc = readFileSync(focusTrapPath, "utf8");

    expect(welcomeSrc).toContain("@keydown.esc.prevent");
    expect(algorithmSrc).toContain("@keydown.esc.prevent");
    expect(focusTrapSrc).toMatch(/event\.key\s*===\s*['"]Escape['"]/);
    expect(focusTrapSrc).toMatch(/event\.key\s*!==\s*['"]Tab['"]/);
  });
});
