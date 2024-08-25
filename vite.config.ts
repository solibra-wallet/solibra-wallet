import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "src",
  build: {
    outDir: "../dist",
    target: "esnext",
    rollupOptions: {
      input: {
        ["popup/popup"]: "src/popup/index.html",
        ["popup/main"]: "src/popup/main.tsx",
        content: "./src/content/content.ts",
        injected: "./src/injected/injected.ts",
        background: "./src/background/background.ts",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
    sourcemap: false,
    minify: false,
  },
  publicDir: "../public",
});
