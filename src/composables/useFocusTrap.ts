import { onMounted, onBeforeUnmount, ref, watch } from 'vue';

export function useFocusTrap(
  containerRef: { value: HTMLElement | null },
  onEscape?: () => void,
) {
  const previouslyFocused = ref<HTMLElement | null>(null);
  let active = false;

  function getFocusable(): HTMLElement[] {
    const el = containerRef.value;
    if (!el) return [];

    return Array.from(
      el.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((node) => !node.hasAttribute('disabled'));
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    if (event.key !== 'Tab' || !containerRef.value) {
      return;
    }

    const focusable = getFocusable();
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement as HTMLElement | null;

    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function activate(): void {
    if (active || !containerRef.value) return;

    previousFocus();
    const focusable = getFocusable();
    (focusable[0] as HTMLElement | undefined)?.focus();

    const main = document.querySelector('main') as HTMLElement | null;
    if (main) {
      try {
        main.setAttribute('aria-hidden', 'true');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if ('inert' in main) main.inert = true;
      } catch {}
    }

    document.addEventListener('keydown', handleKeydown);
    active = true;
  }

  function previousFocus(): void {
    previouslyFocused.value = document.activeElement as HTMLElement | null;
  }

  function deactivate(): void {
    if (!active) return;

    document.removeEventListener('keydown', handleKeydown);

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

    active = false;
  }

  watch(
    () => containerRef.value,
    (el) => {
      if (el) {
        activate();
      } else {
        deactivate();
      }
    },
    { flush: 'post' },
  );

  onMounted(() => {
    if (containerRef.value) {
      activate();
    }
  });

  onBeforeUnmount(() => {
    deactivate();
  });
}
