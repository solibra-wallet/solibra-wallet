import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "src",
  build: {
    outDir: "../dist",
    target: "esnext",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        inject: "./src/inject/inject.ts",
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
