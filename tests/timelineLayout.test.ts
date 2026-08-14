import { describe, expect, it } from "vitest";
import { createTimelineLayout } from "@/utils/timelineLayout";

describe("createTimelineLayout", () => {
  it("stretches short force-fit timelines to the available width", () => {
    const layout = createTimelineLayout({
      timelineLength: 12,
      containerWidth: 2169,
      padding: 140,
      maxCellWidth: 44,
      forceFit: true,
    });

    expect(layout.mode).toBe("fit");
    expect(layout.shouldScroll).toBe(false);
    expect(layout.cellWidth).toBeGreaterThan(44);
  });

  it("keeps longer force-fit timelines capped", () => {
    const layout = createTimelineLayout({
      timelineLength: 48,
      containerWidth: 2169,
      padding: 140,
      maxCellWidth: 44,
      forceFit: true,
    });

    expect(layout.mode).toBe("fit");
    expect(layout.shouldScroll).toBe(false);
    expect(layout.cellWidth).toBe(44);
  });

  it("expands the svg width for long force-fit timelines instead of clipping them", () => {
    const layout = createTimelineLayout({
      timelineLength: 70,
      containerWidth: 1200,
      padding: 140,
      maxCellWidth: 44,
      forceFit: true,
    });

    expect(layout.cellWidth).toBe(44);
    expect(layout.svgWidth).toBeGreaterThan(1200);
    expect(layout.svgWidth).toBeGreaterThan(70 * 44 + 80 + 12);
  });

  it("keeps the final tick fully visible for a long timeline", () => {
    const layout = createTimelineLayout({
      timelineLength: 45,
      containerWidth: 1200,
      padding: 140,
      maxCellWidth: 44,
      forceFit: true,
    });

    expect(layout.svgWidth).toBeGreaterThan(45 * 44 + 80 + 12);
  });
});