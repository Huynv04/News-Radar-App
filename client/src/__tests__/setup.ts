// Setup file chạy trước tất cả unit tests
// Cung cấp các polyfill và matchers cần thiết cho jsdom

import '@testing-library/jest-dom';
import { beforeAll, afterAll } from 'vitest';

// Polyfill cho matchMedia (jsdom không hỗ trợ)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Tắt console.error cho PropTypes warnings trong môi trường test
const originalError = console.error.bind(console.error);
beforeAll(() => {
  console.error = (msg: string, ...args: unknown[]) => {
    if (typeof msg === 'string' && msg.includes('Warning:')) return;
    originalError(msg, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

