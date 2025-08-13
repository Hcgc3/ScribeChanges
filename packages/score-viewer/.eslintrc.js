module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  globals: {
    process: 'readonly',
  },
  extends: [
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    // Adicione regras personalizadas aqui
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
