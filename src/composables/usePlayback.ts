import { ref, computed, watch } from 'vue';

export function usePlayback(
  snapshotsRef: any,
  options: { intervalMs?: number; loop?: { value: boolean } } = {},
) {
  const intervalMs = options.intervalMs ?? 750;
  const index = ref(0);
  const playing = ref(false);
  const speed = ref(1);
  let timer: number | undefined;
  const total = computed(() => (snapshotsRef?.value ? snapshotsRef.value.length : 0));

  function clearTimer() {
    if (timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  }

  function startTimer() {
    clearTimer();
    if (!playing.value) return;
    timer = window.setInterval(() => {
      if (index.value < Math.max(total.value - 1, 0)) {
        index.value += 1;
      } else {
        if (options.loop?.value && total.value > 0) {
          index.value = 0;
          return;
        }

        pause();
      }
    }, Math.max(20, Math.round(intervalMs / Math.max(0.001, speed.value))));
  }

  function play() {
    if (total.value === 0) return;
    playing.value = true;
    startTimer();
  }

  function pause() {
    playing.value = false;
    clearTimer();
  }

  function toggle() {
    if (playing.value) {
      pause();
    } else {
      play();
    }
  }

  function stepForward() {
    if (index.value < Math.max(total.value - 1, 0)) index.value += 1;
  }

  function stepBack() {
    if (index.value > 0) index.value -= 1;
  }

  function seek(i: number) {
    const maxIndex = Math.max(total.value - 1, 0);
    index.value = Math.max(0, Math.min(i, maxIndex));
  }

  watch(snapshotsRef, () => {
    const len = snapshotsRef?.value?.length ?? 0;
    if (index.value >= len) {
      index.value = Math.max(0, len - 1);
    }
  });

  watch(speed, () => {
    if (playing.value) startTimer();
  });

  return {
    index,
    playing,
    speed,
    total,
    play,
    pause,
    toggle,
    stepForward,
    stepBack,
    seek,
  };
}
