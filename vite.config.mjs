import { defineConfig } from "vite";
import { resolve } from "node:path";

// Static multi-page funnel build (plain HTML pages + funnel modules).
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        checkout: resolve(import.meta.dirname, "checkout.html"),
        "growth-accelerator": resolve(import.meta.dirname, "growth-accelerator.html"),
        foundation: resolve(import.meta.dirname, "foundation.html"),
        "thank-you": resolve(import.meta.dirname, "thank-you.html"),
      },
    },
  },
});
