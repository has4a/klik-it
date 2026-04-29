// ============================================================================
// Animations — IntersectionObserver scroll reveals + vanilla FAQ accordion
// ============================================================================
// Why no GSAP:
//   The previous build imported gsap + gsap/ScrollTrigger purely to drive
//   fade-up-on-enter reveals. That added ~50 kB gzipped to the hot path
//   for animations a 5-line IntersectionObserver + CSS transitions match
//   visually. Section-specific stagger lives in _reveal.scss via
//   :nth-child rules; this module just toggles .is-revealed when an
//   element scrolls into view.
//
// Vanilla JS controls:
//   ✓ Scroll reveals — IntersectionObserver toggles .is-revealed
//   ✓ FAQ open/close — explicit pixel-height animation via inline transition
//
// CSS controls:
//   ✓ Hero staggered entrance (CSS keyframes on load)
//   ✓ All [data-reveal] transitions, including section-specific stagger
//   ✓ FAQ icon rotation, background, border (CSS transitions on [open])
//   ✓ Hover effects, focus states
// ============================================================================

export function initAnimations() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Snap reveal elements visible without animating; CSS @media query
    // also catches this, but the class keeps post-reveal hover transitions
    // working consistently.
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.classList.add("is-revealed");
    });
    initFAQAccordion();
    return;
  }

  initScrollReveals();
  initFAQAccordion();
}

// ============================================================================
// SCROLL REVEALS — IntersectionObserver + .is-revealed class
// ============================================================================
// Each [data-reveal] element is observed once; when it crosses ~88% down
// the viewport (rootMargin: -12% bottom), .is-revealed is added and the
// observer stops watching it. CSS in _reveal.scss handles the actual
// fade/translate transition and section-specific stagger via :nth-child.
// ============================================================================
function initScrollReveals() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  // Older browsers / no IO: snap everything visible immediately.
  if (typeof IntersectionObserver === "undefined") {
    items.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    },
    {
      // Mirrors the previous GSAP "top 88%" trigger — element animates
      // as soon as its top edge crosses 88% down the viewport.
      rootMargin: "0px 0px -12% 0px",
    }
  );

  items.forEach((el) => observer.observe(el));
}

// ============================================================================
// FAQ ACCORDION — Vanilla pixel-height transition
// ============================================================================
// Why not GSAP / not CSS-only:
//  - GSAP fromTo with clearProps had a subpixel snap at end of open (the
//    "padding kick" the user reported).
//  - CSS-only grid-template-rows: 0fr ↔ 1fr depended on browser support
//    for fr-unit interpolation AND on overriding <details> UA hiding —
//    fragile across browsers.
//
// Approach: explicit pixel measurement + plain inline transition, then
// settle to height: auto with transition disabled so there's no snap and
// content reflows naturally on resize.
// ============================================================================
function initFAQAccordion() {
  const items = document.querySelectorAll(".faq__item");
  if (!items.length) return;

  const OPEN_DURATION = 400;
  const CLOSE_DURATION = 350;
  const OPEN_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
  const CLOSE_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

  items.forEach((item) => {
    const summary = item.querySelector(".faq__question");
    const answer = item.querySelector(".faq__answer");
    if (!summary || !answer) return;

    // Pre-opened items: leave at natural auto height. CSS handles closed
    // default (height: 0) so no init work needed for closed items.
    if (item.hasAttribute("open")) {
      answer.style.height = "auto";
    }

    let isAnimating = false;

    summary.addEventListener("click", (e) => {
      // Block native <details> toggle; we control the [open] timing.
      e.preventDefault();
      if (isAnimating) return;
      isAnimating = true;

      const wasOpen = item.hasAttribute("open");

      if (wasOpen) {
        closeAnswer();
      } else {
        openAnswer();
      }

      function openAnswer() {
        // Add [open] first so the browser un-hides the answer's content
        // and we can measure its natural height.
        item.setAttribute("open", "");
        answer.style.height = "auto";
        const targetHeight = answer.scrollHeight;
        answer.style.height = "0px";

        // Force reflow so the next height assignment becomes a transition,
        // not a discrete change.
        // eslint-disable-next-line no-unused-expressions
        answer.offsetHeight;

        requestAnimationFrame(() => {
          answer.style.transition = `height ${OPEN_DURATION}ms ${OPEN_EASE}`;
          answer.style.height = `${targetHeight}px`;
        });

        const onEnd = (event) => {
          if (event.propertyName !== "height") return;
          // Settle to auto without animating — disable transition first so
          // the px → auto swap is instant and invisible (no end-of-animation
          // snap).
          answer.style.transition = "none";
          answer.style.height = "auto";
          // eslint-disable-next-line no-unused-expressions
          answer.offsetHeight;
          answer.style.transition = "";
          isAnimating = false;
          answer.removeEventListener("transitionend", onEnd);
        };
        answer.addEventListener("transitionend", onEnd);
      }

      function closeAnswer() {
        // Lock current height in pixels so the transition has a numeric
        // start point (height: auto can't transition without interpolate-
        // size, which is not universally supported).
        const currentHeight = answer.scrollHeight;
        answer.style.height = `${currentHeight}px`;

        // eslint-disable-next-line no-unused-expressions
        answer.offsetHeight;

        requestAnimationFrame(() => {
          answer.style.transition = `height ${CLOSE_DURATION}ms ${CLOSE_EASE}`;
          answer.style.height = "0px";
        });

        const onEnd = (event) => {
          if (event.propertyName !== "height") return;
          // Remove [open] AFTER the animation finishes so CSS [open] rules
          // (background, border, icon rotation) all reverse together.
          item.removeAttribute("open");
          answer.style.transition = "";
          isAnimating = false;
          answer.removeEventListener("transitionend", onEnd);
        };
        answer.addEventListener("transitionend", onEnd);
      }
    });
  });
}
