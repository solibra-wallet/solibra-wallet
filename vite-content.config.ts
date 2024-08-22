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
        content: "./src/content/content.ts",
        injected: "./src/content/injected.ts",
        ["wallet-standard"]: "./src/wallet-standard/initialize.ts",
      },
      output: {
        entryFileNames: "content/[name].js",
      },
    },
    sourcemap: false,
    minify: false,
  },
});
