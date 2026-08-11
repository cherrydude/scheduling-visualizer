import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('accessibility (static checks)', () => {
  it('WelcomeModal.vue contains dialog role and aria-modal', () => {
    const path = resolve(__dirname, '../src/components/WelcomeModal.vue');
    const src = readFileSync(path, 'utf8');
    expect(src).toContain('role="dialog"');
    expect(src).toContain('aria-modal="true"');
  });

  it('AlgorithmPickerModal.vue contains dialog role and aria-modal', () => {
    const path = resolve(__dirname, '../src/components/AlgorithmPickerModal.vue');
    const src = readFileSync(path, 'utf8');
    expect(src).toContain('role="dialog"');
    expect(src).toContain('aria-modal="true"');
    expect(src).toContain('ref="modalRoot"');
  });

  it('Gantt.vue contains aria-labelledby, title and desc', () => {
    const path = resolve(__dirname, '../src/components/Gantt.vue');
    const src = readFileSync(path, 'utf8');
    expect(src).toContain('aria-labelledby');
    expect(src).toContain('<title');
    expect(src).toContain('<desc');
  });
});
