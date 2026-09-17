import { test, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

test("static accessibility markers exist in Gantt and motion gating present", () => {
  const root = join(__dirname, "..");
  const ganttPath = join(root, "src", "components", "Gantt.vue");
  const gsapPath = join(root, "src", "components", "GanttWithGsap.vue");
  const ganttSrc = readFileSync(ganttPath, "utf8");
  const gsapSrc = readFileSync(gsapPath, "utf8");

  // Gantt should include title+desc and an aria-describedby linked summary
  expect(ganttSrc).toContain('title :id="titleId"');
  expect(ganttSrc).toContain('desc :id="descId"');
  expect(ganttSrc).toMatch(/aria-describedby="summaryId"|aria-describedby=\"/);
  expect(ganttSrc).toContain('class="visually-hidden"');

  // Motion gating should respect prefers-reduced-motion (variable or media query)
  expect(gsapSrc).toMatch(/prefers-reduced-motion|prefersReducedMotion/);
  expect(ganttSrc).toContain('aria-label="segmentAriaLabel(segment)"');
  expect(gsapSrc).toContain("playback-time-status");
});
