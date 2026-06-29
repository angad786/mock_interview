document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const submitBtn = document.getElementById("submitBtn");
  const banner = document.getElementById("formBanner");
  const bannerSuccess = document.getElementById("formBannerSuccess");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const params = new URLSearchParams(window.location.search);
  if (params.get("registered") === "1") {
    bannerSuccess.textContent = "Registration successful! Please log in with your new account.";
    bannerSuccess.classList.add("show");
  }

  if (localStorage.getItem("examPortalToken")) {
    window.location.href = "dashboard.html";
    return;
  }

  function clearErrors() {
    document.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = "";
      el.classList.remove("show");
    });
    document.querySelectorAll(".field-input").forEach((el) => el.classList.remove("has-error"));
    banner.classList.remove("show");
    bannerSuccess.classList.remove("show");
  }

  function showFieldError(fieldName, message) {
    const el = document.getElementById(`err-${fieldName}`);
    if (el) {
      el.textContent = message;
      el.classList.add("show");
    }
    const input = document.getElementById(fieldName);
    if (input) input.classList.add("has-error");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      showFieldError("email", "Email is required.");
      return;
    }

    if (!password) {
      showFieldError("password", "Password is required.");
      return;
    }

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span> Logging in…';

    try {
      const { ok, data } = await apiPost("/auth/login", { email, password });

      if (!ok) {
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err) => showFieldError(err.field, err.message));
        }
        banner.textContent = data.message || "Login failed. Please check your credentials.";
        banner.classList.add("show");
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        return;
      }

      localStorage.setItem("examPortalToken", data.token);
      localStorage.setItem("examPortalUser", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error(err);
      banner.textContent = "Could not reach the server. Please try again.";
      banner.classList.add("show");
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
});
