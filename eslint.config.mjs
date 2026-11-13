// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

// ESLint flat config. `npm run lint` runs it with --max-warnings 0, so any warning fails CI.
// The site scripts are classic browser scripts (no modules, no build step); tests and tools are Node ES modules.
import js from '@eslint/js';
import globals from 'globals';

const rules = {
  // CONTRIBUTING: no eval-like code (the CSP forbids it anyway), strict equality, no dead variables.
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none' }],
  eqeqeq: ['error', 'smart'],
};

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/', '.qa/', '.coverage/'] },
  js.configs.recommended,
  {
    files: ['site/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      // merkle.js and demo-core.js also export through `module` for the Node tests.
      globals: { ...globals.browser, module: 'readonly' },
    },
    rules,
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules,
  },
  {
    // End-to-end tests pass callbacks to page.evaluate(), which run in the browser.
    files: ['tests/e2e/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
