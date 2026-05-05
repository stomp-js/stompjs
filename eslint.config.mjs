import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['node_modules/**', 'esm6/**', 'bundles/**', 'coverage/**'] },
  tseslint.configs.eslintRecommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      'no-console': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-empty-function': 'off',
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
