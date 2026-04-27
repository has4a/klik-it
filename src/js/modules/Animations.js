// ============================================================================
// Animations — GSAP ScrollTrigger
// ============================================================================
// GSAP controls:
//   ✓ All [data-reveal] scroll entrance animations
//   ✓ Staggered card grids with distinct animations per section
//
// CSS controls:
//   ✓ Hero staggered entrance (CSS keyframes on load)
//   ✓ FAQ open/close animation (grid-template-rows: 0fr ↔ 1fr trick)
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
  // FAQ open/close animation is now CSS-only (grid-template-rows trick
  // in _faq.scss); no JS-driven height/padding tween required.
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

