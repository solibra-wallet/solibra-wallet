import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "crypto"],
      globals: {
        Buffer: true,
      },
    }),
  ],
  root: "src",
  build: {
    outDir: "../dist",
    target: "esnext",
    emptyOutDir: false,
    rollupOptions: {
      input: {
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
