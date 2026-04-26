// ============================================================================
// Cookie Consent — GDPR-compliant cookie management
// ============================================================================
// Controls which cookies/scripts are loaded based on user consent.
//
// Categories:
//   - NECESSARY (always active, no consent needed):
//     • Cloudflare (__cf_bm, __cflb) — CDN, security, DDoS protection
//     • reCAPTCHA (_GRECAPTCHA) — form spam protection
//     • cookie_consent (our own) — stores user's cookie preference
//
//   - ANALYTICS (requires consent):
//     • Google Analytics 4 (_ga, _ga_*) — traffic analysis
//
// Flow:
//   1. On page load, check localStorage for saved preference
//   2. If no preference → show banner
//   3. If "all" → load GA4 immediately
//   4. If "necessary" → don't load GA4
//   5. User can change preference via footer link (future enhancement)
//
// GA4 is loaded dynamically — script tag injected only after consent.
// This ensures zero tracking cookies before explicit user action.
// ============================================================================

const CONSENT_KEY = "cookie_consent";
const GA4_ID = "G-FT6JSLJ4X3";

export function initCookieConsent() {
  const banner = document.getElementById("cookie-consent");
  const acceptBtn = document.getElementById("cookie-accept");
  const rejectBtn = document.getElementById("cookie-reject");

  if (!banner || !acceptBtn || !rejectBtn) return;

  const savedConsent = localStorage.getItem(CONSENT_KEY);

  if (savedConsent === "all") {
    // User previously accepted — load GA4, don't show banner
    loadGA4();
    return;
  }

  if (savedConsent === "necessary") {
    // User previously rejected analytics — don't show banner, don't load GA4
    return;
  }

  // No saved preference — show banner
  showBanner(banner);

  acceptBtn.addEventListener("click", () => {
    localStorage.setItem(CONSENT_KEY, "all");
    hideBanner(banner);
    loadGA4();
  });

  rejectBtn.addEventListener("click", () => {
    localStorage.setItem(CONSENT_KEY, "necessary");
    hideBanner(banner);
  });
}

// ---------------------------------------------------------------------------
// BANNER VISIBILITY
// ---------------------------------------------------------------------------
function showBanner(banner) {
  // Small delay so banner animates in after page load
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
// GA4 DYNAMIC LOADING
// ---------------------------------------------------------------------------
// Injects gtag.js script + config only when user consents.
// Called once — subsequent page loads check localStorage directly.
// ---------------------------------------------------------------------------
function loadGA4() {
  // Prevent double-loading
  if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) {
    return;
  }

  // Create and inject gtag.js script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA4_ID);
}
