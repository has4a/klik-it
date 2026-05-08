// ============================================================================
// Forms — Validation & Async Submit
// ============================================================================
// - Client-side validation with per-field error messages
// - Honeypot spam check
// - Async submit with loading spinner
// - Success/error status display
// - Analytics tracking on submit
// - Respects novalidate (replaces native validation)
// - Lazy-loads reCAPTCHA on first form focus (privacy: defers the
//   _GRECAPTCHA cookie until the user actually engages the form)
//
// reCAPTCHA Enterprise INTEGRATION (2026-05):
//   Script is lazy-loaded on first focusin (privacy: no _GRECAPTCHA cookie
//   until the user engages the form). At submit time,
//   grecaptcha.enterprise.execute() produces a token attached to FormData
//   as `recaptcha_token`.
//
//   Backend (api/send-email.php) verifies via the Enterprise assessments
//   API (https://recaptchaenterprise.googleapis.com/v1/projects/<PROJECT>/
//   assessments?key=<API_KEY>) and rejects scores below 0.5 — but ONLY if
//   RECAPTCHA_API_KEY is set in the PHP config. Until that API key is
//   filled in, the backend skips verify silently and the honeypot is the
//   only spam guard. Set the API key before launch.
//
//   This is reCAPTCHA Enterprise (Google Cloud), NOT legacy reCAPTCHA v3
//   (recaptcha.google.com/admin). The two have different scripts, JS APIs,
//   verify endpoints, and request payloads — don't mix them up.
// ============================================================================

import { trackFormSubmit } from "./Analytics.js";

// reCAPTCHA Enterprise — site key for klikit.sk (public, safe to ship).
// Project: klik-it-495707. Backend verify uses an API key set in
// api/send-email.php → RECAPTCHA_API_KEY (created in Google Cloud
// Console → APIs & Services → Credentials, restricted to the
// reCAPTCHA Enterprise API).
const RECAPTCHA_SITE_KEY = "6Le1HN8sAAAAAG9SzzplhKHBJAnSd68awtzsGREP";

const MESSAGES = {
  name: {
    required: "Prosím, zadajte vaše meno.",
    minLength: "Meno musí mať aspoň 2 znaky.",
  },
  email: {
    required: "Prosím, zadajte váš e-mail.",
    invalid: "Prosím, zadajte platný e-mail.",
  },
  phone: {
    invalid: "Prosím, zadajte platné telefónne číslo.",
  },
  message: {
    required: "Prosím, napíšte nám správu.",
    minLength: "Správa musí mať aspoň 10 znakov.",
  },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s+\-().]{7,20}$/;

export function initForms() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const submitBtn = document.getElementById("submit-btn");
  const statusEl = document.getElementById("form-status");

  // Lazy-load reCAPTCHA on first interaction with any field in the form.
  // focusin bubbles, so a single listener catches focus on every input or
  // textarea inside the contact form. once:true auto-removes the listener
  // after firing.
  form.addEventListener("focusin", loadRecaptcha, { once: true });

  // Validate on submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear previous state
    clearAllErrors(form);
    hideStatus(statusEl);

    // Honeypot check
    const honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value) {
      // Bot detected — silently "succeed"
      showStatus(statusEl, "success", "Ďakujeme! Správa bola odoslaná.");
      form.reset();
      return;
    }

    // Validate fields
    const errors = validateForm(form);
    if (errors.length > 0) {
      showErrors(errors);
      // Focus first errored field
      const firstError = form.querySelector(".has-error");
      if (firstError) firstError.focus();
      return;
    }

    // Submit
    await submitForm(form, submitBtn, statusEl);
  });

  // Live validation on blur (after first submit attempt)
  const fields = form.querySelectorAll("input, textarea");
  fields.forEach((field) => {
    field.addEventListener("blur", () => {
      // Only validate if field has been touched (has error class or value)
      if (field.classList.contains("has-error") || field.value.trim()) {
        clearFieldError(field);
        const error = validateField(field);
        if (error) showFieldError(field, error);
      }
    });

    // Clear error on input
    field.addEventListener("input", () => {
      if (field.classList.contains("has-error")) {
        clearFieldError(field);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// RECAPTCHA — Lazy script injection
// ---------------------------------------------------------------------------
// Idempotent: a re-entrant call (or re-init across hot-reloads) won't
// double-inject. once:true on the focusin listener already prevents
// multiple invocations during a single page lifetime; this guard is
// belt + braces for edge cases.
// ---------------------------------------------------------------------------
function loadRecaptcha() {
  if (document.querySelector('script[src*="recaptcha/enterprise.js"]')) return;

  const script = document.createElement("script");
  // Enterprise endpoint — `enterprise.js`, not the legacy `api.js`.
  script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
  script.async = true;
  document.head.appendChild(script);
}

// ---------------------------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------------------------
function validateForm(form) {
  const errors = [];
  const fields = form.querySelectorAll(
    "input:not([type='hidden']):not([name='website']), textarea"
  );

  fields.forEach((field) => {
    const error = validateField(field);
    if (error) errors.push(error);
  });

  return errors;
}

function validateField(field) {
  const name = field.name;
  const value = field.value.trim();

  switch (name) {
    case "name":
      if (!value) return { field, message: MESSAGES.name.required };
      if (value.length < 2) return { field, message: MESSAGES.name.minLength };
      break;

    case "email":
      if (!value) return { field, message: MESSAGES.email.required };
      if (!EMAIL_REGEX.test(value))
        return { field, message: MESSAGES.email.invalid };
      break;

    case "phone":
      // Phone is optional, but if filled, validate format
      if (value && !PHONE_REGEX.test(value))
        return { field, message: MESSAGES.phone.invalid };
      break;

    case "message":
      if (!value) return { field, message: MESSAGES.message.required };
      if (value.length < 10)
        return { field, message: MESSAGES.message.minLength };
      break;
  }

  return null;
}

// ---------------------------------------------------------------------------
// ERROR DISPLAY
// ---------------------------------------------------------------------------
function showErrors(errors) {
  errors.forEach(({ field, message }) => {
    showFieldError(field, { field, message });
  });
}

function showFieldError(field, error) {
  field.classList.add("has-error");
  const errorEl = document.getElementById(`${field.name}-error`);
  if (errorEl) {
    errorEl.textContent = error.message;
    errorEl.classList.add("is-active");
  }
}

function clearFieldError(field) {
  field.classList.remove("has-error");
  const errorEl = document.getElementById(`${field.name}-error`);
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("is-active");
  }
}

function clearAllErrors(form) {
  form
    .querySelectorAll(".has-error")
    .forEach((el) => el.classList.remove("has-error"));
  form.querySelectorAll(".form-field__error").forEach((el) => {
    el.textContent = "";
    el.classList.remove("is-active");
  });
}

// ---------------------------------------------------------------------------
// STATUS DISPLAY
// ---------------------------------------------------------------------------
function showStatus(el, type, message) {
  if (!el) return;
  el.className = `form-status is-${type}`;
  el.textContent = message;
}

function hideStatus(el) {
  if (!el) return;
  el.className = "form-status";
  el.textContent = "";
}

// ---------------------------------------------------------------------------
// ASYNC SUBMIT
// ---------------------------------------------------------------------------
async function submitForm(form, btn, statusEl) {
  // Loading state
  btn.classList.add("is-loading");
  btn.disabled = true;

  try {
    const formData = new FormData(form);

    // reCAPTCHA Enterprise token — best-effort. If grecaptcha.enterprise
    // hasn't finished loading (unlikely after focusin lazy-load + filling
    // the form), we skip the token and let the backend fall back to
    // honeypot-only.
    const ent = window.grecaptcha && window.grecaptcha.enterprise;
    if (ent && typeof ent.execute === "function") {
      try {
        await new Promise((resolve) => ent.ready(resolve));
        const token = await ent.execute(RECAPTCHA_SITE_KEY, {
          action: "contact_submit",
        });
        if (token) formData.append("recaptcha_token", token);
      } catch {
        // grecaptcha.enterprise errored — proceed without token; honeypot still active
      }
    }

    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      showStatus(
        statusEl,
        "success",
        "Ďakujeme! Vaša správa bola odoslaná. Ozveme sa vám do 24 hodín."
      );
      form.reset();
      trackFormSubmit("success");
    } else {
      throw new Error(`Server responded with ${response.status}`);
    }
  } catch (error) {
    console.error("[Klik_IT] Form submit error:", error);
    showStatus(
      statusEl,
      "error",
      "Odoslanie zlyhalo. Skúste to znova alebo nás kontaktujte na info@klikit.sk."
    );
    trackFormSubmit("error");
  } finally {
    // Remove loading state
    btn.classList.remove("is-loading");
    btn.disabled = false;
  }
}
