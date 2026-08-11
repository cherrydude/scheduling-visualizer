import { onMounted, onBeforeUnmount, ref } from 'vue';

export function useFocusTrap(containerRef: { value: HTMLElement | null }) {
  const previouslyFocused = ref<HTMLElement | null>(null);

  onMounted(() => {
    const el = containerRef.value;
    previouslyFocused.value = document.activeElement as HTMLElement | null;
    if (!el) return;

    // set initial focus to the first focusable element inside the modal
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    (focusable[0] as HTMLElement | undefined)?.focus();

    // mark main content as inert/aria-hidden to screen readers
    const main = document.querySelector('main') as HTMLElement | null;
    if (main) {
      try {
        main.setAttribute('aria-hidden', 'true');
        // use inert where available
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if ('inert' in main) main.inert = true;
      } catch {}
    }
  });

  onBeforeUnmount(() => {
    const main = document.querySelector('main') as HTMLElement | null;
    if (main) {
      try {
        main.removeAttribute('aria-hidden');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if ('inert' in main) main.inert = false;
      } catch {}
    }

    try {
      previouslyFocused.value?.focus();
    } catch {}
  });
}
