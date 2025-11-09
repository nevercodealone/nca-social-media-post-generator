import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    env: {
      // Mock API keys for testing
      GOOGLE_GEMINI_API_KEY: 'mock-google-key',
      ANTHROPIC_API_KEY: 'mock-anthropic-key',
      // Mock model configuration for testing
      GOOGLE_GEMINI_MODELS: 'gemini-2.5-pro,gemini-2.5-flash',
      ANTHROPIC_MODELS: 'claude-3-haiku-20240307,claude-3-sonnet-20240229',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/scripts/**', // Browser modules tested separately
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});