// ============================================================================
// Navigation Module
// ============================================================================
// Handles:
// 1. Mobile menu toggle (hamburger → fullscreen overlay)
// 2. Scroll-aware header (transparent → glass on scroll)
// 3. Close menu on link click
// 4. Close menu on Escape key
// 5. Trap focus inside mobile menu when open (a11y)
// ============================================================================

export function initNavigation() {
  const header = document.getElementById("site-header");
  const hamburger = document.querySelector(".nav__hamburger");
  const mobileMenu = document.getElementById("mobile-menu");
  const body = document.body;

  if (!header || !hamburger || !mobileMenu) return;

  // Cache all clickable links inside mobile menu
  const mobileLinks = mobileMenu.querySelectorAll(
    ".mobile-menu__link, .mobile-menu__cta"
  );

  // ------------------------------------------------------------------
  // 1. MOBILE MENU TOGGLE
  // ------------------------------------------------------------------
  const openMenu = () => {
    hamburger.setAttribute("aria-expanded", "true");
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    body.classList.add("menu-open");

    // Stop Lenis smooth scroll while menu is open
    if (window.__lenis) window.__lenis.stop();

    // Focus first link for keyboard users
    requestAnimationFrame(() => {
      const firstLink = mobileMenu.querySelector(".mobile-menu__link");
      if (firstLink) firstLink.focus();
    });
  };

  const closeMenu = () => {
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    body.classList.remove("menu-open");

    // Resume Lenis
    if (window.__lenis) window.__lenis.start();

    // Return focus to hamburger
    hamburger.focus();
  };

  const toggleMenu = () => {
    const isOpen = hamburger.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  };

  hamburger.addEventListener("click", toggleMenu);

  // ------------------------------------------------------------------
  // 2. CLOSE ON LINK CLICK + SCROLL TO TARGET
  // ------------------------------------------------------------------
  // Problem: body.menu-open { overflow: hidden } + Lenis.stop() blocks
  // any scrolling while menu is open. Native anchor navigation and
  // Lenis.scrollTo() both fail silently.
  // Fix: Close menu first (unlocks body + starts Lenis), then scroll.
  // ------------------------------------------------------------------
  mobileLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetSection = targetId ? document.querySelector(targetId) : null;

      // Close menu immediately (unlocks scroll + starts Lenis)
      closeMenu();

      // Scroll to target after menu transition starts
      if (targetSection) {
        // Small delay so menu close animation begins first
        requestAnimationFrame(() => {
          if (window.__lenis) {
            window.__lenis.scrollTo(targetSection, {
              offset: -80,
              duration: 1.2,
            });
          } else {
            targetSection.scrollIntoView({ behavior: "smooth" });
          }
        });
      }
    });
  });

  // ------------------------------------------------------------------
  // 3. CLOSE ON ESCAPE KEY
  // ------------------------------------------------------------------
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      closeMenu();
    }
  });

  // ------------------------------------------------------------------
  // 4. SCROLL-AWARE HEADER
  // ------------------------------------------------------------------
  // Adds .is-scrolled class after scrolling past threshold
  const SCROLL_THRESHOLD = 50;
  let lastKnownScroll = 0;
  let ticking = false;

  const updateHeader = () => {
    if (lastKnownScroll > SCROLL_THRESHOLD) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      lastKnownScroll = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    },
    { passive: true }
  );

  // Run once on load (in case page loads scrolled)
  lastKnownScroll = window.scrollY;
  updateHeader();

  // ------------------------------------------------------------------
  // 5. SET CURRENT YEAR IN FOOTER
  // ------------------------------------------------------------------
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}
