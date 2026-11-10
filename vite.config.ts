/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Simula um navegador (document, window, localStorage) dentro do Node.
    environment: 'jsdom',
    setupFiles: ['./src/testes/preparar.ts'],
  },
});
