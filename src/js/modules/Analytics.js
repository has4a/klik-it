// ============================================================================
// Analytics — GA4 Custom Event Tracking
// ============================================================================
// Tracks key user interactions:
// - CTA button clicks (which button, which section)
// - Form submissions (success/error)
// - Theme toggle usage
// - Scroll depth milestones (25%, 50%, 75%, 100%)
// - FAQ item opens
// - Floating contact widget interactions
// - Mobile menu opens
//
// All events use gtag() — requires GA4 script loaded in <head>.
// Fails silently if gtag is not available (no errors for visitors
// with ad blockers or missing GA4 script).
// ============================================================================

function track(eventName, params = {}) {
  // gtag is set on window dynamically by CookieConsent.js after user consent.
  // Before consent, this is a safe no-op.
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

export function initAnalytics() {
  // Always set up event listeners — track() checks gtag availability
  // at call time, so events will start flowing once GA4 loads.
  // This supports the consent flow: listeners are ready, GA4 loads later.

  trackCTAClicks();
  trackScrollDepth();
  trackThemeToggle();
  trackFAQ();
  trackMobileMenu();
  trackFloatingContact();
}

// ---------------------------------------------------------------------------
// CTA CLICKS — Track which buttons users click and from where
// ---------------------------------------------------------------------------
function trackCTAClicks() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(
      ".btn, .nav__cta, .mobile-menu__cta, .contact__submit"
    );
    if (!btn) return;

    // Find closest section for context
    const section = btn.closest("section");
    const sectionId = section ? section.id : "nav";

    track("cta_click", {
      button_text: btn.textContent.trim().slice(0, 50),
      section: sectionId,
      button_type: btn.classList.contains("btn--primary")
        ? "primary"
        : btn.classList.contains("btn--secondary")
        ? "secondary"
        : "other",
    });
  });
}

// ---------------------------------------------------------------------------
// SCROLL DEPTH — Milestones at 25%, 50%, 75%, 100%
// ---------------------------------------------------------------------------
function trackScrollDepth() {
  const milestones = [25, 50, 75, 100];
  const reached = new Set();

  const getScrollPercent = () => {
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 100;
    return Math.round((window.scrollY / docHeight) * 100);
  };

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const percent = getScrollPercent();
        milestones.forEach((milestone) => {
          if (percent >= milestone && !reached.has(milestone)) {
            reached.add(milestone);
            track("scroll_depth", { percent: milestone });
          }
        });
        ticking = false;
      });
    },
    { passive: true }
  );
}

// ---------------------------------------------------------------------------
// THEME TOGGLE
// ---------------------------------------------------------------------------
function trackThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const isLight = document.documentElement.classList.contains("light-mode");
    track("theme_toggle", {
      theme: isLight ? "light" : "dark",
    });
  });
}

// ---------------------------------------------------------------------------
// FAQ — Track which questions users open
// ---------------------------------------------------------------------------
function trackFAQ() {
  const items = document.querySelectorAll(".faq__item");
  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        const question = item.querySelector(".faq__question span");
        track("faq_open", {
          question: question ? question.textContent.trim().slice(0, 80) : "",
        });
      }
    });
  });
}

// ---------------------------------------------------------------------------
// MOBILE MENU
// ---------------------------------------------------------------------------
function trackMobileMenu() {
  const hamburger = document.querySelector(".nav__hamburger");
  if (!hamburger) return;

  hamburger.addEventListener("click", () => {
    const isOpen = hamburger.getAttribute("aria-expanded") === "true";
    if (!isOpen) {
      // Will be open after click
      track("mobile_menu_open");
    }
  });
}

// ---------------------------------------------------------------------------
// FLOATING CONTACT WIDGET
// ---------------------------------------------------------------------------
function trackFloatingContact() {
  const btn = document.getElementById("floating-contact-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    if (!isOpen) {
      track("floating_contact_open");
    }
  });

  // Track option clicks
  const options = document.querySelectorAll(".floating-contact__option");
  options.forEach((option) => {
    option.addEventListener("click", () => {
      const text = option.querySelector("span");
      track("floating_contact_click", {
        option: text ? text.textContent.trim() : "",
      });
    });
  });
}

// ---------------------------------------------------------------------------
// FORM TRACKING — Called from Forms.js, not auto-initialized
// ---------------------------------------------------------------------------
// Usage: import { trackFormSubmit } from './Analytics.js'
//        trackFormSubmit('success') or trackFormSubmit('error')
// ---------------------------------------------------------------------------
export function trackFormSubmit(status) {
  track("form_submit", { status });
}

// Expose track for potential external use
export { track };
