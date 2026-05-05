import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      'no-console': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-empty-function': 'off',
      // tslint:recommended had no-any: false
      '@typescript-eslint/no-explicit-any': 'off',
      // tslint:recommended did not include ban-ts-comment
      '@typescript-eslint/ban-ts-comment': 'off',
      // tslint v6 had no-unused-variable disabled (deferred to TypeScript compiler)
      '@typescript-eslint/no-unused-vars': 'off',
      // tslint:recommended did not include no-this-assignment
      '@typescript-eslint/no-this-alias': 'off',
    },
  },
);
