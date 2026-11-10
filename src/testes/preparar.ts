// Roda antes de cada arquivo de teste.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  // Desmonta a tela do teste anterior e desfaz os fetch falsos e o localStorage.
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});
