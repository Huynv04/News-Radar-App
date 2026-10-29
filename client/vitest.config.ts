/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Môi trường giả lập browser cho React components
    environment: 'jsdom',
    // Tự động import testing utilities (không cần import trong mỗi file)
    globals: true,
    // Chạy file setup trước tất cả các test
    setupFiles: ['./src/__tests__/setup.ts'],
    // Bao gồm tất cả file test trong src/
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/features/**/*.{ts,tsx}', 'src/providers/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**'],
    },
  },
});

