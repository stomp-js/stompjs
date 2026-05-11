import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['node_modules/**', 'esm6/**', 'bundles/**', 'coverage/**'] },
  tseslint.configs.eslintRecommended,
  ...tseslint.configs.recommended,
  {
    // Typed linting — enables rules that require type information.
    // Keep limited to src/ to avoid pulling test files / configs into the type-check graph.
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },
  prettierConfig,
  {
    rules: {
      'no-console': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-empty-function': 'off',
      // Surface `any` usage without failing the build — there are still some legitimate
      // ones (timer handles, DOM-free socket interface) and migration is incremental.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-this-alias': 'off', // Consider later
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unused-vars': 'off', // Consider later
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          // Type aliases may use camelCase (e.g. setupReplyQueueFnType is public API)
          selector: 'typeAlias',
          format: ['PascalCase', 'camelCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
        {
          // Object literal properties are often protocol/API-defined (e.g. STOMP headers
          // like 'correlation-id', 'auto-delete') and must not be forced to camelCase.
          selector: 'objectLiteralProperty',
          format: null,
        },
      ],
    },
  },
);
