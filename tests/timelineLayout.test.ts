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
});