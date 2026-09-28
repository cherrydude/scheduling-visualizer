import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  server: {
    port: 3000,
  },

  build: {
    outDir: "dist",
  },

  resolve: {
    alias: {
      "@": "/src",
    },
  },

  test: {
    environment: "jsdom",

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",

      include: ["src/**/*.ts", "src/**/*.vue"],

      exclude: [
        "src/main.ts",
        "src/env.d.ts",
        "src/**/*.d.ts",
        "src/assets/**",
      ],
    },
  },
});
