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
      // Multi-page build: all HTML entries must be listed here so Vite
      // processes them and copies the output into dist/. Anything missing
      // from this list silently never reaches the deploy — which was the
      // launch-day bug where /cookies-policy.html and /privacy-policy.html
      // 404'd on klikit.sk.
      input: {
        main: resolve(__dirname, "index.html"),
        404: resolve(__dirname, "404.html"),
        "cookies-policy": resolve(__dirname, "cookies-policy.html"),
        "privacy-policy": resolve(__dirname, "privacy-policy.html"),
      },
    },
  },
});
