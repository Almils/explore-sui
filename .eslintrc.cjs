// .eslintrc.cjs
module.exports = {
    root: true,
    extends: ['next/core-web-vitals'],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // We use SDKs and 3p libs that return loosely-typed shapes; don’t block builds.
      '@typescript-eslint/no-explicit-any': 'off',
      // We intentionally use <a> in a few places where Link isn’t ideal (but we’ll fix one below).
      '@next/next/no-html-link-for-pages': 'warn',
    },
    overrides: [
      {
        files: ['src/app/api/**'],
        rules: {
          '@typescript-eslint/no-explicit-any': 'off',
        },
      },
    ],
  };
  