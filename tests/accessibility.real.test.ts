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

  it("Gantt.vue contains aria-labelledby, title and desc", () => {
    const path = resolve(__dirname, "../src/components/Gantt.vue");
    const src = readFileSync(path, "utf8");
    expect(src).toContain("aria-labelledby");
    expect(src).toContain("<title");
    expect(src).toContain("<desc");
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
