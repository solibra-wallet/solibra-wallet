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
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      input: {
        ["popup"]: "src/ui/popup/popup.html",
        ["popout"]: "src/ui/popout/popout.html",
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
