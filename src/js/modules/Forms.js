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
// reCAPTCHA v3 INTEGRATION (legacy, not Enterprise):
//   Script is lazy-loaded on first focusin (privacy: no _GRECAPTCHA cookie
//   until the user engages the form). At submit time, grecaptcha.execute()
//   produces a token attached to FormData as `recaptcha_token`.
//
//   Backend (api/send-email.php) verifies via the legacy siteverify
//   endpoint (https://www.google.com/recaptcha/api/siteverify) and rejects
//   scores below 0.5 — but ONLY if RECAPTCHA_SECRET is set in the PHP
//   config. The secret is intentionally NOT committed to git; paste it
//   into the deployed PHP file directly (FTP). Until that secret is
//   filled in, the backend skips verify silently and the honeypot is the
//   only spam guard.
//
//   Admin: https://www.google.com/recaptcha/admin → klikit.sk site.
// ============================================================================

import { trackFormSubmit } from "./Analytics.js";

// reCAPTCHA v3 site key for klikit.sk (public, safe to ship).
// Backend verify uses the matching secret set in api/send-email.php →
// RECAPTCHA_SECRET (kept out of git; pasted into the deployed file).
const RECAPTCHA_SITE_KEY = "6LfgvAcrAAAAAJRFkaFf4NHOixZXljjdkgG77f0d";

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
  if (document.querySelector('script[src*="recaptcha/api.js"]')) return;

  const script = document.createElement("script");
  script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
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

    // reCAPTCHA v3 token — best-effort. If grecaptcha hasn't finished
    // loading (unlikely after focusin lazy-load + filling the form), we
    // skip the token and let the backend fall back to honeypot-only.
    if (window.grecaptcha && typeof window.grecaptcha.execute === "function") {
      try {
        await new Promise((resolve) => window.grecaptcha.ready(resolve));
        const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
          action: "contact_submit",
        });
        if (token) formData.append("recaptcha_token", token);
      } catch {
        // grecaptcha errored — proceed without token; honeypot still active
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
      "Odoslanie zlyhalo. Skúste to znova alebo nás kontaktujte na hello@mgtech.sk."
    );
    trackFormSubmit("error");
  } finally {
    // Remove loading state
    btn.classList.remove("is-loading");
    btn.disabled = false;
  }
}
