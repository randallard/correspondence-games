/**
 * @fileoverview Vitest setup file for test environment configuration
 * @module test/setup
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Cleanup after each test automatically
 * Prevents memory leaks and test pollution
 */
afterEach(() => {
  cleanup();
});

/**
 * Extend Vitest matchers with Jest DOM matchers
 * This allows using .toBeInTheDocument(), .toHaveClass(), etc.
 */
expect.extend({});

/**
 * Mock window.matchMedia for tests
 * Many components rely on matchMedia for responsive behavior
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

/**
 * Mock navigator.clipboard for testing copy functionality
 */
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: async (text: string) => {
      // Store text for testing
      (navigator.clipboard as any).lastText = text;
    },
    readText: async () => {
      return (navigator.clipboard as any).lastText || '';
    },
  },
});

/**
 * Mock crypto.randomUUID for consistent test UUIDs
 */
if (!globalThis.crypto) {
  (globalThis as any).crypto = {};
}

let uuidCounter = 0;
Object.defineProperty(globalThis.crypto, 'randomUUID', {
  writable: true,
  value: () => {
    uuidCounter++;
    return `test-uuid-${uuidCounter.toString().padStart(4, '0')}`;
  },
});
