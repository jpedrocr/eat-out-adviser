import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import next from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  // Ficheiros ignorados
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/coverage/**", "**/.turbo/**"],
  },

  // Regras base JavaScript
  js.configs.recommended,

  // TypeScript com type-aware linting
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.config.ts", "*.config.js", "*.config.mjs"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React
  {
    plugins: { react },
    rules: {
      ...react.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // React Hooks
  {
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // Acessibilidade JSX (fundamental para este projecto)
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.configs.strict.rules,
    },
  },

  // Next.js
  {
    plugins: { "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },

  // Ficheiros de configuracao em subdirectorios (sem type-checking)
  {
    files: ["packages/*/drizzle.config.ts"],
    ...tseslint.configs.disableTypeChecked,
  },

  // Desactivar regras que conflituam com Prettier
  prettier,
);
