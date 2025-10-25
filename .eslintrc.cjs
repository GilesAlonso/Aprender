/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "out/",
    "build/",
    "coverage/",
    "next-env.d.ts"
  ],
  extends: [
    "next/core-web-vitals",
    "next/typescript",
    "plugin:testing-library/react",
    "prettier"
  ],
  plugins: ["testing-library", "vitest-globals"],
  env: {
    browser: true,
    es2022: true
  },
  overrides: [
    {
      files: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
      env: {
        "vitest-globals/env": true
      }
    }
  ],
  rules: {
    "testing-library/prefer-screen-queries": "warn",
    "testing-library/prefer-user-event": "warn",
    "testing-library/no-node-access": "off",
    "testing-library/no-container": "off"
  }
};
