import { defineConfig } from "vite";
import { resolve } from "path";

// ============================================================================
// Strip HTML comments from production builds
// ============================================================================
// Source HTML carries section markers and dev notes (<!-- HERO -->,
// <!-- TRUST BAR --> etc.) that are useful while reading the codebase but
// leak our scaffolding into DevTools on the live site. This plugin runs
// only on `vite build`, walks the final HTML, and drops every <!-- … -->
// block; `vite dev` keeps them so source remains explorable in the editor.
// ============================================================================
const stripHtmlComments = () => ({
  name: "strip-html-comments",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler(html) {
      return html.replace(/<!--[\s\S]*?-->/g, "");
    },
  },
});

export default defineConfig({
  plugins: [stripHtmlComments()],
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
