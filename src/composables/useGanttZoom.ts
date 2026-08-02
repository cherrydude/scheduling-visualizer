import {
  computed,
  onBeforeUnmount,
  ref,
  watchEffect,
  type Ref,
  unref,
} from "vue";

type GanttZoomOptions = {
  baseCellWidth?: number;
  minCellWidth?: number;
  viewportPadding?: number;
  minViewportWidth?: number;
};

export function useGanttZoom(
  targetRef: Ref<HTMLElement | null>,
  timelineLength: Ref<number> | number,
  options: GanttZoomOptions = {},
) {
  const viewportWidth = ref(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );
  const baseCellWidth = options.baseCellWidth ?? 40;
  const minCellWidth = options.minCellWidth ?? 12;
  const viewportPadding = options.viewportPadding ?? 96;
  const minViewportWidth = options.minViewportWidth ?? 320;

  let observer: ResizeObserver | null = null;

  watchEffect(
    (onCleanup) => {
    const element = targetRef.value;

    if (!element) {
      viewportWidth.value = 0;
      return;
    }

    const updateViewportWidth = () => {
      viewportWidth.value = Math.floor(element.clientWidth);
    };

    updateViewportWidth();

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    observer = new ResizeObserver(updateViewportWidth);
    observer.observe(element);
      onCleanup(() => {
        observer?.disconnect();
        observer = null;
      });
    },
    { flush: "post" },
  );

  onBeforeUnmount(() => {
    observer?.disconnect();
  });

  const cellWidth = computed(() => {
    const length = Math.max(1, Math.floor(unref(timelineLength)));
    const availableWidth = Math.max(
      viewportWidth.value - viewportPadding,
      minViewportWidth,
    );
    const fittedWidth = Math.floor(availableWidth / length);

    return Math.max(minCellWidth, Math.min(baseCellWidth, fittedWidth));
  });

  return {
    viewportWidth,
    cellWidth,
  };
}