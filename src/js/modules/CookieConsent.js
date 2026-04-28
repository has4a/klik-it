// ============================================================================
// Cookie Consent — GDPR-compliant cookie management
// ============================================================================
// Controls which cookies/scripts are loaded based on user consent.
//
// Categories:
//   - NECESSARY (always active, no consent needed):
//     • Cloudflare (__cf_bm, __cflb) — CDN, security, DDoS protection
//     • reCAPTCHA (_GRECAPTCHA) — form spam protection (legitimate interest)
//     • cookie_consent (our own) — stores user's cookie preference
//
//   - ANALYTICS (requires consent):
//     • Google Analytics 4 (_ga, _ga_*) — traffic analysis
//
// Flow:
//   1. On page load, read saved consent from localStorage (banner-independent).
//      If "all" → load GA4. If "necessary" or null → no analytics.
//   2. If banner element exists on this page AND no preference saved → show banner.
//   3. If banner exists, attach Accept/Reject handlers (always — also needed
//      when user reopens via the footer "Nastavenia cookies" button).
//   4. If a #cookie-reopen trigger exists, wire it to re-show the banner so
//      the user can change their mind at any time (GDPR requirement).
//   5. Switching from "all" → "necessary" disables GA4 at runtime and clears
//      its cookies on the current domain — required for proper consent
//      withdrawal, not just future-loads opt-out.
//
// GA4 is loaded dynamically — script tag injected only after consent.
// This ensures zero tracking cookies before explicit user action.
// ============================================================================

const CONSENT_KEY = "cookie_consent";
const GA4_ID = "G-FT6JSLJ4X3";

export function initCookieConsent() {
  // -------------------------------------------------------------------------
  // 1. Apply saved consent (independent of any banner UI on this page)
  // -------------------------------------------------------------------------
  const savedConsent = localStorage.getItem(CONSENT_KEY);
  if (savedConsent === "all") {
    loadGA4();
  }

  // -------------------------------------------------------------------------
  // 2. Banner UI (only if the dialog markup exists on the current page)
  // -------------------------------------------------------------------------
  const banner = document.getElementById("cookie-consent");
  const acceptBtn = document.getElementById("cookie-accept");
  const rejectBtn = document.getElementById("cookie-reject");

  if (banner && acceptBtn && rejectBtn) {
    // Always attach click handlers — they need to be live both on first
    // visit AND when the banner is reopened from the footer trigger.
    acceptBtn.addEventListener("click", () => {
      const previous = localStorage.getItem(CONSENT_KEY);
      localStorage.setItem(CONSENT_KEY, "all");
      hideBanner(banner);
      if (previous !== "all") loadGA4();
    });

    rejectBtn.addEventListener("click", () => {
      const previous = localStorage.getItem(CONSENT_KEY);
      localStorage.setItem(CONSENT_KEY, "necessary");
      hideBanner(banner);
      // If GA4 was loaded under a previous "all" consent, withdraw it now.
      if (previous === "all") disableGA4();
    });

    // Show on first visit only. Reopen path is handled below.
    if (!savedConsent) showBanner(banner);
  }

  // -------------------------------------------------------------------------
  // 3. Footer "Nastavenia cookies" trigger — lets the user revisit choice
  // -------------------------------------------------------------------------
  const reopenBtn = document.getElementById("cookie-reopen");
  if (reopenBtn && banner) {
    reopenBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showBanner(banner);
    });
  }
}

// ---------------------------------------------------------------------------
// BANNER VISIBILITY
// ---------------------------------------------------------------------------
function showBanner(banner) {
  // rAF so the visibility change happens on the next paint, not synchronously
  // — gives the browser time to settle initial layout before the slide-up.
  requestAnimationFrame(() => {
    banner.setAttribute("aria-hidden", "false");
    banner.classList.add("is-visible");
  });
}

function hideBanner(banner) {
  banner.classList.remove("is-visible");
  banner.setAttribute("aria-hidden", "true");
}

// ---------------------------------------------------------------------------
// GA4 — DYNAMIC LOADING
// ---------------------------------------------------------------------------
// Injects gtag.js + config only when consent === "all".
// ---------------------------------------------------------------------------
function loadGA4() {
  // Idempotent: don't double-inject if already present.
  if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA4_ID);

  // Clear any opt-out flag set by a previous reject in this session
  // (e.g. user toggled reject -> accept on the same page).
  if (window[`ga-disable-${GA4_ID}`]) {
    window[`ga-disable-${GA4_ID}`] = false;
  }
}

// ---------------------------------------------------------------------------
// GA4 — RUNTIME WITHDRAWAL
// ---------------------------------------------------------------------------
// Standard Google opt-out flag plus active cookie deletion. Without the
// cookie clear, _ga/_ga_* would persist (with their long expiry) and ID
// the visitor on the very next consent reload. Sets the flag for the
// current page lifetime; the cleared cookies stay cleared across reloads
// because the new "necessary" consent skips loadGA4().
// ---------------------------------------------------------------------------
function disableGA4() {
  window[`ga-disable-${GA4_ID}`] = true;

  const measurementSuffix = GA4_ID.replace(/^G-/, "");
  const cookieNames = ["_ga", `_ga_${measurementSuffix}`];
  const host = window.location.hostname;

  cookieNames.forEach((name) => {
    // Try multiple domain variants — _ga is typically set on the registrable
    // domain (.example.com) but local/dev hosts may differ.
    [host, `.${host}`, `.${host.replace(/^www\./, "")}`].forEach((domain) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
    });
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  });
}
