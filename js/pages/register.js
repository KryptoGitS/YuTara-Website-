/* ==========================================================================
   YuTara Page — 4-Step User Registration (js/pages/register.js -> register.html)
   --------------------------------------------------------------------------
   QUICK DEBUG INDEX:
   1. renderStep()           — Updates active/done stepper circles & panels
   2. Next / Previous Steps  — Validates inputs & duplicate email check
   3. Submit Registration    — Strictly creates a User account (never Admin)
   ========================================================================== */

function initRegisterPage() {
  const form = document.getElementById("register-form");
  if (!form) return;

  let currentStep = 1;
  const totalSteps = 4;
  const feedback = document.getElementById("reg-feedback");

  /* 1. RENDER CURRENT STEP */
  function renderStep() {
    for (let i = 1; i <= totalSteps; i++) {
      const panel = document.getElementById("reg-step-" + i);
      const pill = document.getElementById("step-pill-" + i);
      panel.classList.toggle("hidden", i !== currentStep);

      pill.classList.remove("active", "done");
      pill.removeAttribute("aria-current");
      if (i === currentStep) {
        pill.classList.add("active");
        pill.setAttribute("aria-current", "step");
      }
      if (i < currentStep) pill.classList.add("done");
    }

    document.getElementById("reg-prev-btn").classList.toggle("hidden", currentStep === 1);
    document.getElementById("reg-next-btn").classList.toggle("hidden", currentStep === totalSteps);
    document.getElementById("reg-submit-btn").classList.toggle("hidden", currentStep !== totalSteps);

    if (currentStep === 4) {
      document.getElementById("review-name").textContent = document.getElementById("reg-name").value.trim();
      document.getElementById("review-email").textContent = document.getElementById("reg-email").value.trim();
      document.getElementById("review-phone").textContent = document.getElementById("reg-phone").value.trim();
      document.getElementById("review-role").textContent = "User (Buyer & Landowner)";
      document.getElementById("review-id-type").textContent = document.getElementById("reg-id-type").value;
    }
  }

  /* 2. STEP NAVIGATION & VALIDATION */
  document.getElementById("reg-next-btn").addEventListener("click", function () {
    feedback.classList.add("hidden");

    if (currentStep === 1) {
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const phone = document.getElementById("reg-phone").value.trim();
      const pass = document.getElementById("reg-password").value;

      if (!name || !email || !email.includes("@") || !phone || pass.length < 6) {
        feedback.className = "alert alert-error";
        feedback.textContent =
          "Please enter your full name, a valid email address, mobile number, and password (at least 6 characters).";
        feedback.classList.remove("hidden");
        return;
      }

      if (accountEmailExists(email)) {
        feedback.className = "alert alert-error";
        feedback.textContent =
          "An account with this email address already exists. Please log in or use a different email.";
        feedback.classList.remove("hidden");
        return;
      }
    }

    if (currentStep === 3 && !document.getElementById("reg-face-check").checked) {
      feedback.className = "alert alert-error";
      feedback.textContent = "Please confirm the face verification step to continue.";
      feedback.classList.remove("hidden");
      return;
    }

    if (currentStep < totalSteps) {
      currentStep++;
      renderStep();
    }
  });

  document.getElementById("reg-prev-btn").addEventListener("click", function () {
    feedback.classList.add("hidden");
    if (currentStep > 1) {
      currentStep--;
      renderStep();
    }
  });

  /* 3. SUBMIT USER REGISTRATION */
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (lockFormSubmission(form)) return;

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const role = "User"; // Public registration strictly creates User accounts only
    const pass = document.getElementById("reg-password").value;

    if (accountEmailExists(email)) {
      feedback.className = "alert alert-error";
      feedback.textContent = "An account with this email address already exists.";
      feedback.classList.remove("hidden");
      return;
    }

    const customList = getCustomAccounts();
    customList.unshift({
      id: "ACC-" + Date.now(),
      name: name,
      email: email,
      password: pass,
      role: role,
      status: "APPROVED",
      builtIn: false
    });
    saveCustomAccounts(customList);

    setSession({ name: name, email: email, role: role });
    feedback.className = "alert alert-success";
    feedback.innerHTML =
      "<strong>Registration Submitted!</strong> Redirecting you straight to the Panabo City Marketplace...";
    feedback.classList.remove("hidden");
    showToast("Account created — opening Marketplace");

    setTimeout(function () {
      window.location.href = getPostLoginDestination(role);
    }, 650);
  });

  renderStep();
}

document.addEventListener("DOMContentLoaded", initRegisterPage);
