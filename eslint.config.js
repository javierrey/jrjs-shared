// @ts-nocheck
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import config from './compact-lint.config.js'; // std, compact

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node } } },
  { files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'] },
  { ignores: ['**/ignore/', '**/exclude/', '*_ignore_*', '**/_keep/'] },
  { ...config },
  { rules: {} },
];
