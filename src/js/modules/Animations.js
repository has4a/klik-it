// ============================================================================
// Animations — GSAP ScrollTrigger + FAQ height animations
// ============================================================================
// GSAP controls:
//   ✓ All [data-reveal] scroll entrance animations
//   ✓ Staggered card grids with distinct animations per section
//   ✓ FAQ smooth open/close height animation
//
// CSS controls:
//   ✓ Hero staggered entrance (CSS keyframes on load)
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
  initFAQAnimations();
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
// FAQ — Smooth height + padding animation
// ============================================================================
function initFAQAnimations() {
  const items = document.querySelectorAll(".faq__item");
  if (!items.length) return;

  items.forEach((item) => {
    const summary = item.querySelector(".faq__question");
    const answer = item.querySelector(".faq__answer");
    const icon = item.querySelector(".faq__icon");

    if (!summary || !answer) return;

    // Mark as JS-controlled
    item.classList.add("faq--js");

    // Temporarily open to measure natural padding (browser hides content when closed)
    const wasOpen = item.hasAttribute("open");
    if (!wasOpen) item.setAttribute("open", "");

    const computedStyle = window.getComputedStyle(answer);
    const naturalPaddingBottom = computedStyle.paddingBottom;
    const naturalPaddingTop = computedStyle.paddingTop;

    // Restore and set initial closed state
    if (!wasOpen) {
      item.removeAttribute("open");
      gsap.set(answer, {
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        opacity: 0,
        overflow: "hidden",
      });
    } else {
      gsap.set(answer, { overflow: "hidden" });
    }

    let isAnimating = false;

    summary.addEventListener("click", (e) => {
      e.preventDefault();
      if (isAnimating) return;
      isAnimating = true;

      const isOpen = item.hasAttribute("open");

      if (isOpen) {
        // --- CLOSE ---
        gsap.to(answer, {
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          opacity: 0,
          duration: 0.35,
          ease: "power2.inOut",
          onComplete: () => {
            item.removeAttribute("open");
            isAnimating = false;
          },
        });

        if (icon) {
          gsap.to(icon, {
            rotation: 0,
            duration: 0.3,
            ease: "power2.inOut",
          });
        }
      } else {
        // --- OPEN ---
        item.setAttribute("open", "");

        gsap.fromTo(
          answer,
          {
            height: 0,
            paddingTop: 0,
            paddingBottom: 0,
            opacity: 0,
          },
          {
            height: "auto",
            paddingTop: naturalPaddingTop,
            paddingBottom: naturalPaddingBottom,
            opacity: 1,
            duration: 0.4,
            ease: "power3.out",
            onComplete: () => {
              // Clear height/padding so content reflows naturally on resize.
              // Keep overflow:hidden — clearing it caused content to spill
              // past the shrinking box during the next close animation.
              gsap.set(answer, {
                clearProps: "height,paddingTop,paddingBottom",
              });
              isAnimating = false;
            },
          }
        );

        if (icon) {
          gsap.to(icon, {
            rotation: 180,
            duration: 0.3,
            ease: "power2.inOut",
          });
        }
      }
    });
  });
}
