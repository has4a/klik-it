// ============================================================================
// Theme Toggle Module
// ============================================================================
// Handles dark/light mode switching:
// 1. Checks localStorage for saved preference
// 2. Falls back to system preference (prefers-color-scheme)
// 3. Defaults to dark mode
// 4. Toggles .light-mode class on <html>
// 5. Persists choice to localStorage
// 6. Smooth transition between themes (CSS handles via transition on body)
// ============================================================================

const STORAGE_KEY = "klikit-theme";
const LIGHT_CLASS = "light-mode";

export function initThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const html = document.documentElement;

  // ------------------------------------------------------------------
  // 1. DETERMINE INITIAL THEME
  // ------------------------------------------------------------------
  const savedTheme = localStorage.getItem(STORAGE_KEY);

  if (savedTheme === "light") {
    html.classList.add(LIGHT_CLASS);
  } else if (savedTheme === "dark") {
    html.classList.remove(LIGHT_CLASS);
  } else {
    // No saved preference — check system preference
    const prefersLight = window.matchMedia(
      "(prefers-color-scheme: light)"
    ).matches;
    if (prefersLight) {
      html.classList.add(LIGHT_CLASS);
    }
  }

  // ------------------------------------------------------------------
  // 2. TOGGLE ON CLICK
  // ------------------------------------------------------------------
  toggle.addEventListener("click", () => {
    const isCurrentlyLight = html.classList.contains(LIGHT_CLASS);

    if (isCurrentlyLight) {
      html.classList.remove(LIGHT_CLASS);
      localStorage.setItem(STORAGE_KEY, "dark");
      toggle.setAttribute("aria-label", "Prepnúť na svetlú tému");
    } else {
      html.classList.add(LIGHT_CLASS);
      localStorage.setItem(STORAGE_KEY, "light");
      toggle.setAttribute("aria-label", "Prepnúť na tmavú tému");
    }
  });

  // ------------------------------------------------------------------
  // 3. UPDATE ARIA LABEL BASED ON CURRENT STATE
  // ------------------------------------------------------------------
  const isLight = html.classList.contains(LIGHT_CLASS);
  toggle.setAttribute(
    "aria-label",
    isLight ? "Prepnúť na tmavú tému" : "Prepnúť na svetlú tému"
  );

  // ------------------------------------------------------------------
  // 4. LISTEN FOR SYSTEM PREFERENCE CHANGES
  // ------------------------------------------------------------------
  // If user hasn't manually chosen a theme, follow system changes
  window
    .matchMedia("(prefers-color-scheme: light)")
    .addEventListener("change", (e) => {
      // Only follow system if user hasn't made a manual choice
      if (!localStorage.getItem(STORAGE_KEY)) {
        if (e.matches) {
          html.classList.add(LIGHT_CLASS);
        } else {
          html.classList.remove(LIGHT_CLASS);
        }
      }
    });
}
