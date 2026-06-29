/**
 * Registration form controller.
 *
 * Mandatory-location enforcement happens at THREE layers:
 *  1. UI layer: submit button stays disabled until lat/lng + text are present.
 *  2. Client validation: re-checked on submit (covers any DOM tampering).
 *  3. Server validation: routes/auth.js rejects the request if location
 *     fields are missing or malformed — the real enforcement boundary,
 *     since client-side checks can always be bypassed.
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const submitBtn = document.getElementById("submitBtn");
  const banner = document.getElementById("formBanner");
  let imageAccessGranted = false;

  const fields = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    mobile: document.getElementById("mobile"),
    password: document.getElementById("password"),
    locationText: document.getElementById("locationText"),
    latitude: document.getElementById("latitude"),
    longitude: document.getElementById("longitude"),
  };

  function showFieldError(fieldName, message) {
    const el = document.getElementById(`err-${fieldName}`);
    if (el) {
      el.textContent = message;
      el.classList.add("show");
    }
    if (fields[fieldName]) fields[fieldName].classList.add("has-error");
  }

  function clearFieldErrors() {
    document.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = "";
      el.classList.remove("show");
    });
    document.querySelectorAll(".field-input").forEach((el) => el.classList.remove("has-error"));
  }

  function showBanner(message) {
    banner.textContent = message;
    banner.classList.add("show");
  }
  function hideBanner() {
    banner.classList.remove("show");
  }

  function hasLocation() {
    return (
      fields.latitude.value.trim() !== "" &&
      fields.longitude.value.trim() !== "" &&
      fields.locationText.value.trim() !== ""
    );
  }

  function hasRequiredAccess() {
    return hasLocation() && imageAccessGranted;
  }

  // Re-check submit-button eligibility whenever relevant fields change.
  function refreshSubmitState() {
    const requiredFilled =
      fields.fullName.value.trim() &&
      fields.email.value.trim() &&
      fields.mobile.value.trim() &&
      fields.password.value.trim().length >= 6 &&
      hasRequiredAccess();
    submitBtn.disabled = !requiredFilled;
  }

  [fields.fullName, fields.email, fields.mobile, fields.password, fields.locationText].forEach((input) => {
    input.addEventListener("input", refreshSubmitState);
  });
  document.addEventListener("location-captured", refreshSubmitState);
  document.addEventListener("image-access-granted", () => {
    imageAccessGranted = true;
    refreshSubmitState();
  });
  document.addEventListener("image-access-denied", () => {
    imageAccessGranted = false;
    refreshSubmitState();
  });

  function validateClientSide() {
    let valid = true;
    clearFieldErrors();
    hideBanner();

    if (!fields.fullName.value.trim()) {
      showFieldError("fullName", "Full name is required.");
      valid = false;
    }

    const emailVal = fields.email.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      showFieldError("email", "Email is required.");
      valid = false;
    } else if (!emailPattern.test(emailVal)) {
      showFieldError("email", "Please enter a valid email address.");
      valid = false;
    }

    if (!fields.password.value || fields.password.value.length < 6) {
      showFieldError("password", "Password must be at least 6 characters.");
      valid = false;
    }

    const mobileVal = fields.mobile.value.trim();
    const mobilePattern = /^[6-9]\d{9}$/;
    if (!mobileVal) {
      showFieldError("mobile", "Mobile number is required.");
      valid = false;
    } else if (!mobilePattern.test(mobileVal)) {
      showFieldError("mobile", "Please enter a valid 10-digit Indian mobile number.");
      valid = false;
    }

    if (!fields.locationText.value.trim()) {
      showFieldError("locationText", "Address/area is required.");
      valid = false;
    }

    if (!hasLocation()) {
      showBanner(
        "Location is mandatory to register. Please allow location and camera access, then fill in the address field."
      );
      valid = false;
    }

    if (!imageAccessGranted) {
      showBanner("Camera access is required before registration can continue.");
      valid = false;
    }

    return valid;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateClientSide()) {
      return;
    }

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span> Creating account…';

    const payload = {
      fullName: fields.fullName.value.trim(),
      email: fields.email.value.trim(),
      mobile: fields.mobile.value.trim(),
      password: fields.password.value,
      locationText: fields.locationText.value.trim(),
      latitude: fields.latitude.value,
      longitude: fields.longitude.value,
    };

    try {
      const { ok, data } = await apiPost("/auth/register", payload);

      if (!ok) {
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err) => showFieldError(err.field, err.message));
        }
        showBanner(data.message || "Registration failed. Please check the form and try again.");
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        refreshSubmitState();
        return;
      }

      // Success — redirect to login with a friendly message.
      window.location.href = "login.html?registered=1";
    } catch (err) {
      console.error(err);
      showBanner("Could not reach the server. Please check your connection and try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      refreshSubmitState();
    }
  });

  refreshSubmitState();
});
