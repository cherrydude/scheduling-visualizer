// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/vue';
import AppShell from '@/AppShell.vue';

describe('welcome modal persistence', () => {
  const STORAGE_KEY = 'scheduling-visualizer.welcome-seen';

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('does not persist a dismissal when the modal is closed without opting in', async () => {
    render(AppShell);

    const closeButton = await screen.findByRole('button', { name: 'Dialog schließen' });
    await fireEvent.click(closeButton);

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('persists the dismissal when the checkbox is checked', async () => {
    render(AppShell);

    const checkbox = await screen.findByRole('checkbox', {
      name: 'Diese Meldung nicht mehr anzeigen',
    });
    await fireEvent.click(checkbox);

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('1');
  });
});
