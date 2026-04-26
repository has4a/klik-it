// ============================================================================
// Forms — Validation & Async Submit
// ============================================================================
// - Client-side validation with per-field error messages
// - Honeypot spam check
// - Async submit with loading spinner
// - Success/error status display
// - Analytics tracking on submit
// - Respects novalidate (replaces native validation)
// ============================================================================

import { trackFormSubmit } from "./Analytics.js";

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
