/* ==========================================================================
   YuTara Page — Login (js/pages/login.js -> login.html)
   Account sign-in, remembered email, ?next= return notice, and demo accounts.
   ========================================================================== */

function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const statusBox = document.getElementById("login-status");
  const emailInput = document.getElementById("login-email");
  const rememberCheck = document.getElementById("login-remember");

  const nextRedirect = getSafeNextPath(getQueryParam("next"));
  if (nextRedirect && statusBox) {
    statusBox.className = "alert alert-warning";
    statusBox.textContent = "Please log in to your YuTara account to continue.";
    statusBox.classList.remove("hidden");
  }

  // Restore remembered email if previously checked
  try {
    const rememberedEmail = localStorage.getItem("yutara_remember_email");
    if (rememberedEmail && emailInput) {
      emailInput.value = rememberedEmail;
      if (rememberCheck) rememberCheck.checked = true;
    }
  } catch (err) {
    reportDiagnostic("AuthUI", "LoginPage", "restoreRememberedEmail", err);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (lockFormSubmission(form)) return;

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const roleEl = document.getElementById("login-role");
    const selectedRole = roleEl ? roleEl.value : "User";

    if (!email || password.length < 4) {
      statusBox.className = "alert alert-error";
      statusBox.textContent = "Please enter a valid email address and password (at least 4 characters).";
      statusBox.classList.remove("hidden");
      return;
    }

    try {
      if (rememberCheck && rememberCheck.checked) {
        localStorage.setItem("yutara_remember_email", email);
      } else {
        localStorage.removeItem("yutara_remember_email");
      }
    } catch (err) {
      reportDiagnostic("AuthUI", "LoginPage", "saveRememberedEmail", err);
    }

    const allAccounts = getAllAccounts();
    const matchedAccount = allAccounts.find(function (acc) {
      return acc.email.toLowerCase() === email.toLowerCase();
    });

    if (matchedAccount) {
      if (matchedAccount.status === "SUSPENDED") {
        statusBox.className = "alert alert-error";
        statusBox.textContent =
          "This account (" +
          matchedAccount.email +
          ") is currently suspended by an Administrator.";
        statusBox.classList.remove("hidden");
        return;
      }
      if (password !== matchedAccount.password) {
        statusBox.className = "alert alert-error";
        statusBox.textContent =
          "Incorrect email or password. Please check your credentials and try again.";
        statusBox.classList.remove("hidden");
        return;
      }
      setSession({
        name: matchedAccount.name,
        email: matchedAccount.email,
        role: matchedAccount.role
      });
      window.location.href = getPostLoginDestination(matchedAccount.role);
      return;
    }

    const displayName =
      selectedRole === "Admin"
        ? "YuTara System Admin"
        : email.split("@")[0];
    setSession({ name: displayName, email: email, role: selectedRole });
    window.location.href = getPostLoginDestination(selectedRole);
  });

  document.querySelectorAll("[data-demo-role]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const role = btn.getAttribute("data-demo-role");
      const name = btn.getAttribute("data-demo-name");
      const email = btn.getAttribute("data-demo-email") || role.toLowerCase().replace(/\s+/g, "") + "@yutara.ph";
      const allAccounts = getAllAccounts();
      const matched = allAccounts.find(function (acc) {
        return acc.email.toLowerCase() === email.toLowerCase();
      });
      if (matched && matched.status === "SUSPENDED") {
        statusBox.className = "alert alert-error";
        statusBox.textContent = "This account is currently suspended by an Administrator.";
        statusBox.classList.remove("hidden");
        return;
      }
      const effectiveRole = matched ? matched.role : role;
      const effectiveName = matched ? matched.name : name;
      setSession({ name: effectiveName, email: email, role: effectiveRole });
      window.location.href = getPostLoginDestination(effectiveRole);
    });
  });
}

document.addEventListener("DOMContentLoaded", initLoginPage);
