/* ==========================================================================
   YuTara Core — Session Auth & Login-Required Guard Modals (js/core/auth.js)
   Uses sessionStorage so closing the tab/browser automatically logs out.
   Provides logout confirmation modal, Log In Required modal, and RBAC routing.
   ========================================================================== */

function clearLegacyPersistentSessions() {
  try {
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem("yutara_v5_session");
    localStorage.removeItem("yutara_v4_session");
    localStorage.removeItem("yutara_v3_session");
  } catch (err) {
    reportDiagnostic("DataStore", "AuthSession", "clearLegacyPersistentSessions", err);
  }
}

function getSession() {
  try {
    // Active login lives in sessionStorage so closing the tab/browser automatically logs out
    clearLegacyPersistentSessions();
    const raw = sessionStorage.getItem(STORAGE_KEYS.session);
    return JSON.parse(raw || "null");
  } catch (err) {
    reportDiagnostic("DataStore", "AuthSession", "getSession", err);
    return null;
  }
}

function setSession(userObj) {
  try {
    clearLegacyPersistentSessions();
    sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify(userObj));
  } catch (err) {
    reportDiagnostic("DataStore", "AuthSession", "setSession", err);
  }
}

function logoutUser() {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.session);
  } catch (err) {
    reportDiagnostic("DataStore", "AuthSession", "logoutUser", err);
  }
  clearLegacyPersistentSessions();
  if (window.location.pathname.indexOf("tracker.html") >= 0) {
    window.location.href = "login.html";
  } else {
    window.location.reload();
  }
}

function requestLogoutConfirmation() {
  const session = getSession();
  const accountLabel = session
    ? "Signed in as " + session.name + " (" + session.role + ")"
    : "Your current demo session will be closed.";

  let modal = document.getElementById("yutara-logout-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "yutara-logout-modal";
    modal.className = "logout-modal-overlay hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "logout-modal-title");
    modal.setAttribute("data-anim", "ytOverlayFade");
    modal.innerHTML =
      '<div class="logout-modal-box" data-anim="ytModalPop">' +
      '  <div class="logout-modal-icon" aria-hidden="true">' +
      '    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>' +
      '      <polyline points="16 17 21 12 16 7"></polyline>' +
      '      <line x1="21" y1="12" x2="9" y2="12"></line>' +
      "    </svg>" +
      "  </div>" +
      '  <h2 class="logout-modal-title" id="logout-modal-title">Log Out</h2>' +
      '  <p class="logout-modal-message">Are you sure you want to log out?</p>' +
      '  <p class="logout-modal-account" id="logout-modal-account"></p>' +
      '  <div class="logout-modal-actions">' +
      '    <button type="button" class="btn btn-outline" id="logout-cancel-btn">Cancel</button>' +
      '    <button type="button" class="btn btn-primary" id="logout-confirm-btn">Yes, Log Out</button>' +
      "  </div>" +
      "</div>";
    document.body.appendChild(modal);

    const cancelBtn = document.getElementById("logout-cancel-btn");
    const confirmBtn = document.getElementById("logout-confirm-btn");

    function closeLogoutModal() {
      modal.classList.add("hidden");
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeLogoutModal);
    }
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        closeLogoutModal();
        logoutUser();
      });
    }
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeLogoutModal();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        closeLogoutModal();
      }
    });
  }

  const accEl = document.getElementById("logout-modal-account");
  if (accEl) {
    accEl.textContent = accountLabel;
  }
  modal.classList.remove("hidden");
  const cancelBtnFocus = document.getElementById("logout-cancel-btn");
  if (cancelBtnFocus) {
    cancelBtnFocus.focus();
  }
}

function getSafeNextPath(candidate) {
  if (!candidate || typeof candidate !== "string") return "";
  const trimmed = candidate.trim();
  if (/^[a-zA-Z0-9_-]+\.html([?#][a-zA-Z0-9_=&%./#-]*)?$/.test(trimmed)) {
    return trimmed;
  }
  return "";
}

function getCurrentRelativeUrl() {
  const path = (window.location.pathname || "").split("/").pop() || "index.html";
  return path + (window.location.search || "") + (window.location.hash || "");
}

function buildLoginUrl(nextUrl) {
  const safeNext = getSafeNextPath(nextUrl || getCurrentRelativeUrl());
  if (safeNext && safeNext.indexOf("login.html") !== 0 && safeNext.indexOf("register.html") !== 0) {
    return "login.html?next=" + encodeURIComponent(safeNext);
  }
  return "login.html";
}

function openLoginRequiredModal(actionDescription, nextUrl) {
  const actionText = actionDescription || "continue with this action";
  const loginHref = buildLoginUrl(nextUrl);

  let modal = document.getElementById("yutara-login-required-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "yutara-login-required-modal";
    modal.className = "logout-modal-overlay hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "auth-guard-title");
    modal.setAttribute("data-anim", "ytOverlayFade");
    modal.innerHTML =
      '<div class="logout-modal-box auth-guard-box" data-anim="ytModalPop">' +
      '  <button type="button" class="auth-guard-close" id="auth-guard-close-btn" aria-label="Close">' +
      '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '      <line x1="18" y1="6" x2="6" y2="18"></line>' +
      '      <line x1="6" y1="6" x2="18" y2="18"></line>' +
      "    </svg>" +
      "  </button>" +
      '  <div class="auth-guard-icon" aria-hidden="true">' +
      '    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">' +
      '      <rect x="4" y="11" width="16" height="10" rx="2.5" ry="2.5"></rect>' +
      '      <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>' +
      '      <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"></circle>' +
      "    </svg>" +
      "  </div>" +
      '  <h2 class="auth-guard-title" id="auth-guard-title">Log In Required</h2>' +
      '  <p class="auth-guard-message" id="auth-guard-message"></p>' +
      '  <p class="auth-guard-subtext">Sign in to your YuTara account or register a free account to continue.</p>' +
      '  <div class="auth-guard-divider" aria-hidden="true"></div>' +
      '  <div class="auth-guard-actions">' +
      '    <a href="login.html" class="btn btn-primary auth-guard-btn-login" id="auth-guard-login-btn">' +
      '      <svg class="auth-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '        <circle cx="12" cy="8" r="4"></circle>' +
      '        <path d="M4 20c0-3.8 3.6-6.5 8-6.5s8 2.7 8 6.5"></path>' +
      "      </svg>" +
      "      <span>Log In Now &rarr;</span>" +
      "    </a>" +
      '    <a href="register.html" class="btn btn-outline auth-guard-btn-register" id="auth-guard-register-btn">' +
      '      <svg class="auth-btn-icon" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '        <circle cx="9.5" cy="8" r="3.8"></circle>' +
      '        <path d="M2.5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"></path>' +
      '        <path d="M19 8v6M16 11h6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path>' +
      "      </svg>" +
      "      <span>Create Account</span>" +
      "    </a>" +
      "  </div>" +
      '  <button type="button" class="auth-guard-dismiss" id="auth-guard-dismiss-btn">Cancel</button>' +
      "</div>";
    document.body.appendChild(modal);

    function closeGuardModal() {
      modal.classList.add("hidden");
    }

    const closeXBtn = document.getElementById("auth-guard-close-btn");
    if (closeXBtn) {
      closeXBtn.addEventListener("click", closeGuardModal);
    }
    const dismissBtn = document.getElementById("auth-guard-dismiss-btn");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", closeGuardModal);
    }
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeGuardModal();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        closeGuardModal();
      }
    });
  }

  const msgEl = document.getElementById("auth-guard-message");
  if (msgEl) {
    msgEl.textContent = "You must log in first to " + actionText + ".";
  }
  const loginBtn = document.getElementById("auth-guard-login-btn");
  if (loginBtn) {
    loginBtn.setAttribute("href", loginHref);
  }

  modal.classList.remove("hidden");
  if (loginBtn) {
    loginBtn.focus();
  }
}

function requireLoginForAction(actionDescription, nextUrl) {
  if (getSession()) return true;
  openLoginRequiredModal(actionDescription, nextUrl);
  return false;
}

function resetDemoData() {
  localStorage.removeItem(STORAGE_KEYS.properties);
  localStorage.removeItem("yutara_v6_properties");
  localStorage.removeItem(STORAGE_KEYS.saved);
  localStorage.removeItem(STORAGE_KEYS.transactions);
  localStorage.removeItem(STORAGE_KEYS.inquiries);
  localStorage.removeItem(STORAGE_KEYS.messages);
  localStorage.removeItem(STORAGE_KEYS.accounts);
  try {
    sessionStorage.removeItem(STORAGE_KEYS.session);
  } catch (err) {
    reportDiagnostic("DataStore", "AuthSession", "resetDemoData", err);
  }
  clearLegacyPersistentSessions();
  window.location.reload();
}

function getDefaultTabForRole(role) {
  if (role === "Admin") return "panel-accounts";
  return "panel-buyer";
}

function getPostLoginDestination(role) {
  if (role === "Admin") return "tracker.html?tab=panel-accounts";
  const nextParam = getSafeNextPath(getQueryParam("next"));
  if (nextParam && nextParam.indexOf("panel-accounts") < 0) {
    return nextParam;
  }
  // Standard User goes straight to the Marketplace after logging in
  return "marketplace.html";
}
