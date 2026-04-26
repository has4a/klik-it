// ============================================================================
// Main JS — Orchestrator
// ============================================================================
// - SCSS import (Vite)
// - Navigation (module)
// - GSAP scroll reveals + FAQ animations (module)
// - Stat counters, floating contact, analytics
// - Active nav link tracking
// - Lenis smooth scroll (optional)
// ============================================================================

import "../scss/main.scss";
import { initNavigation } from "./modules/Navigation.js";
import { initThemeToggle } from "./modules/ThemeToggle.js";
import { initForms } from "./modules/Forms.js";
import { initAnalytics } from "./modules/Analytics.js";
import { initCookieConsent } from "./modules/CookieConsent.js";
import { initAnimations } from "./modules/Animations.js";

// ---------------------------------------------------------------------------
// DOM READY
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // --- Theme Toggle (init early to prevent flash) ---
  try {
    initThemeToggle();
  } catch (e) {
    console.error("[Klik_IT] Theme toggle init failed:", e);
  }

  // --- Navigation ---
  try {
    initNavigation();
  } catch (e) {
    console.error("[Klik_IT] Navigation init failed:", e);
  }

  // --- Forms ---
  try {
    initForms();
  } catch (e) {
    console.error("[Klik_IT] Forms init failed:", e);
  }

  // --- GSAP Animations (scroll reveals + FAQ) ---
  try {
    initAnimations();
  } catch (e) {
    console.error("[Klik_IT] GSAP animations init failed:", e);
    // Fallback: show all reveal elements if GSAP fails
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => el.classList.add("is-visible"));
  }

  // --- Active Nav Link ---
  try {
    initActiveNav();
  } catch (e) {
    console.error("[Klik_IT] Active nav init failed:", e);
  }

  // --- Stat Counter Animation ---
  try {
    initCounters();
  } catch (e) {
    console.error("[Klik_IT] Counter init failed:", e);
  }

  // --- Floating Contact Widget ---
  try {
    initFloatingContact();
  } catch (e) {
    console.error("[Klik_IT] Floating contact init failed:", e);
  }

  // --- Cookie Consent (init early — controls GA4 loading) ---
  try {
    initCookieConsent();
  } catch (e) {
    console.error("[Klik_IT] Cookie consent init failed:", e);
  }

  // --- Analytics (init after consent — gtag may not be available yet) ---
  try {
    initAnalytics();
  } catch (e) {
    console.info("[Klik_IT] Analytics init failed:", e);
  }

  // --- Lenis Smooth Scroll ---
  try {
    initLenis();
  } catch (e) {
    // Lenis is optional — if not installed, skip silently
    console.info("[Klik_IT] Lenis not available, using native scroll.");
  }
});

// ---------------------------------------------------------------------------
// ACTIVE NAV LINK — Highlights current section in nav
// ---------------------------------------------------------------------------
function initActiveNav() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav__link");

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === `#${id}`
            );
          });
        }
      });
    },
    {
      // Trigger when section is in the top half of viewport
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

// ---------------------------------------------------------------------------
// STAT COUNTERS — Animated count-up on scroll reveal
// ---------------------------------------------------------------------------
// Progressive enhancement: HTML contains real values (for SEO + noscript).
// JS sets them to 0 on init, then animates back when section scrolls into view.
// ---------------------------------------------------------------------------
function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) return;

  // Respect prefers-reduced-motion — keep original values, no animation
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) return;

  // Set all counters to 0 (JS is available, will animate later)
  counters.forEach((el) => {
    const suffix = el.dataset.suffix || "";
    el.textContent = "0" + suffix;
  });

  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const duration = target > 50 ? 1800 : 1200;
    const start = performance.now();

    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic — fast start, smooth landing
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

// ---------------------------------------------------------------------------
// FLOATING CONTACT WIDGET
// ---------------------------------------------------------------------------
// - Shows after scrolling past hero section
// - Toggle panel on button click
// - Close on Escape, click outside, or option click
// ---------------------------------------------------------------------------
function initFloatingContact() {
  const widget = document.getElementById("floating-contact");
  const btn = document.getElementById("floating-contact-btn");
  const panel = document.getElementById("floating-contact-panel");

  if (!widget || !btn || !panel) return;

  // --- Show/hide based on scroll position ---
  // Hidden when hero is in view (redundant at top)
  // Hidden when contact section is in view (redundant near form)
  const hero = document.getElementById("home");
  const contactSection = document.getElementById("contact");

  let heroVisible = true;
  let contactVisible = false;

  const updateVisibility = () => {
    const shouldShow = !heroVisible && !contactVisible;
    widget.classList.toggle("is-visible", shouldShow);
  };

  if (hero) {
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0.1 }
    );
    heroObserver.observe(hero);
  } else {
    heroVisible = false;
  }

  if (contactSection) {
    const contactObserver = new IntersectionObserver(
      ([entry]) => {
        contactVisible = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0.1 }
    );
    contactObserver.observe(contactSection);
  }

  updateVisibility();

  // --- Toggle panel ---
  const openPanel = () => {
    btn.setAttribute("aria-expanded", "true");
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
  };

  const closePanel = () => {
    btn.setAttribute("aria-expanded", "false");
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  };

  const togglePanel = () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    isOpen ? closePanel() : openPanel();
  };

  btn.addEventListener("click", togglePanel);

  // --- Close on Escape ---
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) {
      closePanel();
      btn.focus();
    }
  });

  // --- Close on click outside ---
  document.addEventListener("click", (e) => {
    if (panel.classList.contains("is-open") && !widget.contains(e.target)) {
      closePanel();
    }
  });

  // --- Close panel on option click (with small delay for tap state) ---
  const formOption = panel.querySelector(".floating-contact__option--form");
  if (formOption) {
    formOption.addEventListener("click", (e) => {
      e.preventDefault();
      closePanel();
      // Scroll to contact section
      if (contactSection) {
        if (window.__lenis) {
          window.__lenis.scrollTo(contactSection, {
            offset: -80,
            duration: 1.2,
          });
        } else {
          contactSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// LENIS SMOOTH SCROLL
// ---------------------------------------------------------------------------
// Requires: npm install lenis
// ---------------------------------------------------------------------------
async function initLenis() {
  const { default: Lenis } = await import("lenis");

  // Don't init if reduced motion is preferred
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) return;

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  // Animation loop
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Make anchor links work with Lenis
  // Skip mobile menu links — Navigation.js handles those explicitly
  // to coordinate with menu close timing
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      if (anchor.closest(".mobile-menu") || anchor.closest(".floating-contact"))
        return;

      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, {
          offset: -80,
          duration: 1.2,
        });
      }
    });
  });

  window.__lenis = lenis;
}
