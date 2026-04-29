import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [], // Tento riadok sme pridali
  base: "/",
  build: {
    rollupOptions: {
      // Multi-page build: process both the main site and the 404 page so
      // Vite resolves the shared script/style entry inside each one and
      // emits dist/index.html + dist/404.html with hashed asset URLs.
      input: {
        main: resolve(__dirname, "index.html"),
        404: resolve(__dirname, "404.html"),
      },
    },
  },
});
