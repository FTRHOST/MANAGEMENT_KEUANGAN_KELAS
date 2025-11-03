module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'next/core-web-vitals'
  ],
  plugins: ['react', 'react-hooks'],
  rules: {
    // Add any custom rules here
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
