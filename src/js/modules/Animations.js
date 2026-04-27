// ============================================================================
// Animations — GSAP ScrollTrigger + vanilla FAQ height animator
// ============================================================================
// GSAP controls:
//   ✓ All [data-reveal] scroll entrance animations
//   ✓ Staggered card grids with distinct animations per section
//
// Vanilla JS controls:
//   ✓ FAQ open/close — explicit pixel-height animation via inline transition
//
// CSS controls:
//   ✓ Hero staggered entrance (CSS keyframes on load)
//   ✓ FAQ icon rotation, background, border (CSS transitions on [open])
//   ✓ Hover effects, focus states, transitions
//   ✓ Theme toggle, nav glass, floating contact
//   ✓ Counter animation (rAF)
//
// After reveal: GSAP adds .is-revealed class and clears inline styles
// so CSS hover transitions can take over cleanly.
// ============================================================================

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      el.classList.add("is-revealed");
    });
    return;
  }

  // GSAP defaults — consistent feel across all animations
  gsap.defaults({
    ease: "power3.out",
    duration: 0.8,
  });

  initScrollReveals();
  initFAQAccordion();
}

// ============================================================================
// SCROLL REVEALS
// ============================================================================
function initScrollReveals() {
  // ------------------------------------------------------------------
  // SOLO elements — section headers, descriptions, standalone blocks
  // ------------------------------------------------------------------
  const batchContainers = [
    ".services__grid",
    ".process__steps",
    ".testimonials__grid",
    ".faq__list",
  ];

  const isBatchChild = (el) => batchContainers.some((sel) => el.closest(sel));

  const soloElements = [];
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    if (!isBatchChild(el)) soloElements.push(el);
  });

  if (soloElements.length) {
    gsap.set(soloElements, { opacity: 0, y: 30 });

    soloElements.forEach((el) => {
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.7,
        clearProps: "transform",
        onComplete: () => el.classList.add("is-revealed"),
      });
    });
  }

  // ------------------------------------------------------------------
  // SERVICE CARDS — fade up + subtle scale
  // ------------------------------------------------------------------
  const serviceCards = gsap.utils.toArray(".services__grid [data-reveal]");

  if (serviceCards.length) {
    gsap.set(serviceCards, { opacity: 0, y: 40, scale: 0.97 });

    ScrollTrigger.batch(serviceCards, {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.08,
          duration: 0.65,
          ease: "power2.out",
          onComplete: function () {
            batch.forEach((el) => {
              gsap.set(el, { clearProps: "transform,opacity" });
              el.classList.add("is-revealed");
            });
          },
        });
      },
    });
  }

  // ------------------------------------------------------------------
  // PROCESS STEPS — slide from left, sequential (emphasizes flow)
  // ------------------------------------------------------------------
  const processSteps = gsap.utils.toArray(".process__steps [data-reveal]");

  if (processSteps.length) {
    gsap.set(processSteps, { opacity: 0, x: -30 });

    ScrollTrigger.batch(processSteps, {
      start: "top 85%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          x: 0,
          stagger: 0.12,
          duration: 0.7,
          ease: "power2.out",
          onComplete: function () {
            batch.forEach((el) => {
              gsap.set(el, { clearProps: "transform,opacity" });
              el.classList.add("is-revealed");
            });
          },
        });
      },
    });
  }

  // ------------------------------------------------------------------
  // TESTIMONIAL CARDS — fade up, gentle
  // ------------------------------------------------------------------
  const testimonialCards = gsap.utils.toArray(
    ".testimonials__grid [data-reveal]"
  );

  if (testimonialCards.length) {
    gsap.set(testimonialCards, { opacity: 0, y: 30 });

    ScrollTrigger.batch(testimonialCards, {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "power2.out",
          onComplete: function () {
            batch.forEach((el) => {
              gsap.set(el, { clearProps: "transform,opacity" });
              el.classList.add("is-revealed");
            });
          },
        });
      },
    });
  }

  // ------------------------------------------------------------------
  // FAQ ITEMS — fade up, tight stagger
  // ------------------------------------------------------------------
  const faqItems = gsap.utils.toArray(".faq__list [data-reveal]");

  if (faqItems.length) {
    gsap.set(faqItems, { opacity: 0, y: 20 });

    ScrollTrigger.batch(faqItems, {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          duration: 0.6,
          ease: "power2.out",
          onComplete: function () {
            batch.forEach((el) => {
              gsap.set(el, { clearProps: "transform,opacity" });
              el.classList.add("is-revealed");
            });
          },
        });
      },
    });
  }
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
