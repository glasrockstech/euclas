import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '.tools/**'] },
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['packages/contracts/**/*.ts', 'packages/baseline/**/*.ts'],
    languageOptions: { parserOptions: { project: './tsconfig.json', tsconfigRootDir: import.meta.dirname } },
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
    rules: {
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-check': true, 'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true }],
    },
  },
);
