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
        popup: "src/popup/index.html",
      },
      output: {
        entryFileNames: "popup/[name].js",
      },
    },
    sourcemap: false,
    minify: false,
  },
  publicDir: "../public",
});
