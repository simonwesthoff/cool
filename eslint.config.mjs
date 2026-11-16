import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // The domain layer is plain TypeScript: no framework or UI imports.
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/*",
                "react",
                "react/*",
                "react-dom",
                "react-dom/*",
                "next-intl",
                "next-intl/*",
              ],
              message:
                "The domain layer must not depend on Next.js, React or next-intl.",
            },
            {
              group: ["@/app", "@/app/*", "@/components", "@/components/*"],
              message: "The domain layer must not import UI code.",
            },
          ],
        },
      ],
    },
  },
  {
    // UI code calls the domain layer, never the database directly.
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/server/db",
                "@/server/db/*",
                "drizzle-orm",
                "drizzle-orm/*",
                "postgres",
              ],
              message:
                "UI code must call the domain layer instead of the database.",
            },
          ],
        },
      ],
    },
  },
  {
    // No hardcoded user-facing text in JSX; use next-intl messages.
    files: ["src/app/**/*.tsx", "src/components/**/*.tsx"],
    ignores: ["**/*.test.tsx"],
    rules: {
      "react/jsx-no-literals": [
        "error",
        {
          noStrings: true,
          allowedStrings: [
            "·",
            "–",
            "—",
            "/",
            "|",
            ":",
            "×",
            "%",
            "kg",
            "‹",
            "›",
            "▲",
            "▼",
            "▲▼",
          ],
          ignoreProps: true,
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/server/db/migrations/**",
  ]),
]);

export default eslintConfig;
