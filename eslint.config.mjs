import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "data/**",
    "public/**",
  ]),
  {
    rules: {
      // The data layer intentionally reads `any`-shaped SQLite rows; they are
      // narrowed immediately by the mappers in lib/data/mappers.ts.
      "@typescript-eslint/no-explicit-any": "off",
      // Client components use effects to hydrate browser-only state and sync
      // imperative UI state; the project does not enable the React Compiler.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
