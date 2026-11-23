/* ==========================================================================
   YuTara Land Marketplace — Clean Vanilla JavaScript
   Modular, well-commented sections for fast inspection & live debugging:
     1. Storage Keys & Helper Utilities
     2. Shared Navigation, FAQ Accordion & Password Toggles
     3. Reusable Property Card Builder
     4. Home Page (Hero Spotlight Switcher & Search)
     5. Marketplace Page (Sidebar Filters, Sort, Mobile Toggle & Pagination)
     6. Property Details Page (Lightbox, Copy Coords, Modal & Related Lots)
     7. Reservation Checkout Page (Simulated MVP Demo)
     8. Login Page (Role Sign-In & 1-Click Demo Roles)
     9. 4-Step Registration Page
    10. Contact Page
    11. MVP Workflow Hub (Buyer Tracker, Seller Intake & Agency Queue)
    12. Bootstrap on DOMContentLoaded
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. STORAGE KEYS, DIAGNOSTIC REPORTER & HELPER UTILITIES
   -------------------------------------------------------------------------- */
const STORAGE_KEYS = {
  properties: "yutara_v5_properties",
  saved: "yutara_v5_saved",
  transactions: "yutara_v5_transactions",
  inquiries: "yutara_v5_inquiries",
  accounts: "yutara_v5_accounts",
  session: "yutara_v5_session"
};

/* --------------------------------------------------------------------------
   EASY-TO-DEBUG ANIMATION CONTROLLER
   Usage in Browser DevTools Console or URL (?debugAnim=slow | ?debugAnim=off):
     YuTaraAnimDebug.slow()   -> slows all animations 5x for visual inspection
     YuTaraAnimDebug.off()    -> disables all animations to debug layout
     YuTaraAnimDebug.normal() -> restores default 180ms/260ms transitions
     YuTaraAnimDebug.status() -> prints current animation mode & [data-anim] count
   -------------------------------------------------------------------------- */
const YuTaraAnimDebug = {
  mode: "normal",
  setMode: function (mode) {
    this.mode = mode;
    document.body.classList.remove("anim-debug-slow", "anim-debug-off");
    if (mode === "slow") {
      document.body.classList.add("anim-debug-slow");
    } else if (mode === "off") {
      document.body.classList.add("anim-debug-off");
    }
    console.info("[YuTaraAnimDebug] Animation mode set to:", mode);
    return mode;
  },
  slow: function () {
    return this.setMode("slow");
  },
  off: function () {
    return this.setMode("off");
  },
  normal: function () {
    return this.setMode("normal");
  },
  status: function () {
    const nodes = document.querySelectorAll("[data-anim]");
    const summary = {
      mode: this.mode,
      animatedElements: nodes.length,
      keyframes: Array.from(nodes).map(function (el) {
        return el.getAttribute("data-anim");
      })
    };
    console.info("[YuTaraAnimDebug] Status:", summary);
    return summary;
  }
};
window.YuTaraAnimDebug = YuTaraAnimDebug;

function initAnimationDebugFromUrl() {
  const mode = getQueryParam("debugAnim");
  if (mode === "slow" || mode === "off" || mode === "normal") {
    YuTaraAnimDebug.setMode(mode);
  }
}

function replayTabAnimation(panel) {
  if (!panel) return;
  panel.classList.remove("anim-tab-enter");
  // Trigger predictable single reflow so the named CSS keyframe replays cleanly
  void panel.offsetWidth;
  panel.classList.add("anim-tab-enter");
}

let toastTimer = null;

function reportDiagnostic(layer, component, operation, err) {
  console.warn(
    "[YuTara Diagnostic] Layer=" +
      layer +
      " | Component=" +
      component +
      " | Operation=" +
      operation +
      " | Reason=" +
      (err && err.message ? err.message : String(err))
  );
}

function lockFormSubmission(form) {
  if (!form) return false;
  if (form.getAttribute("data-submitting") === "true") {
    return true;
  }
  form.setAttribute("data-submitting", "true");
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
  }
  setTimeout(function () {
    form.removeAttribute("data-submitting");
    if (submitBtn) {
      submitBtn.disabled = false;
    }
  }, 600);
  return false;
}

function showToast(message) {
  let toast = document.getElementById("yutara-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "yutara-toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2600);
}

function formatPeso(amount) {
  return "₱" + Number(amount || 0).toLocaleString("en-PH");
}

function formatPropertyPrice(prop) {
  if (prop.priceLabel) return prop.priceLabel;
  if (!prop.price || Number(prop.price) <= 0) return "Negotiable (For Sale)";
  return formatPeso(prop.price);
}

function formatPricePerSqm(prop) {
  if (!prop.price || Number(prop.price) <= 0) {
    return prop.priceNote || "Price negotiable for serious buyers";
  }
  const perSqm = Math.round(Number(prop.price) / Math.max(Number(prop.area), 1));
  return formatPeso(perSqm) + " / sqm" + (prop.priceNote ? " • " + prop.priceNote : "");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getProperties() {
  const raw = localStorage.getItem(STORAGE_KEYS.properties);
  if (!raw) return DEFAULT_PROPERTIES.slice();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROPERTIES.slice();
  } catch (err) {
    reportDiagnostic("DataStore", "Properties", "getProperties", err);
    return DEFAULT_PROPERTIES.slice();
  }
}

function saveProperties(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(list));
  } catch (err) {
    reportDiagnostic("DataStore", "Properties", "saveProperties", err);
  }
}

function getSavedIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    reportDiagnostic("DataStore", "SavedListings", "getSavedIds", err);
    return [];
  }
}

function toggleSavedProperty(propertyId) {
  const id = Number(propertyId);
  const saved = getSavedIds();
  const index = saved.indexOf(id);

  if (index >= 0) {
    saved.splice(index, 1);
  } else {
    saved.push(id);
  }

  try {
    localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(saved));
  } catch (err) {
    reportDiagnostic("DataStore", "SavedListings", "toggleSavedProperty", err);
  }
  return saved.includes(id);
}

function getTransactions() {
  const raw = localStorage.getItem(STORAGE_KEYS.transactions);
  if (!raw) return DEFAULT_TRANSACTIONS.slice();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TRANSACTIONS.slice();
  } catch (err) {
    reportDiagnostic("DataStore", "Transactions", "getTransactions", err);
    return DEFAULT_TRANSACTIONS.slice();
  }
}

function saveTransactions(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(list));
  } catch (err) {
    reportDiagnostic("DataStore", "Transactions", "saveTransactions", err);
  }
}

function getInquiries() {
  const fallback = typeof DEFAULT_INQUIRIES !== "undefined" ? DEFAULT_INQUIRIES.slice() : [];
  const raw = localStorage.getItem(STORAGE_KEYS.inquiries);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (err) {
    reportDiagnostic("DataStore", "Inquiries", "getInquiries", err);
    return fallback;
  }
}

function saveInquiries(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.inquiries, JSON.stringify(list));
  } catch (err) {
    reportDiagnostic("DataStore", "Inquiries", "saveInquiries", err);
  }
}

function getDefaultSeededAccounts() {
  const builtIn = typeof DEMO_ACCOUNTS !== "undefined" ? DEMO_ACCOUNTS : [];
  return builtIn.map(function (b) {
    return {
      id: "DEMO-" + b.key,
      name: b.name,
      email: b.email,
      password: b.password,
      role: b.role,
      status: "APPROVED",
      builtIn: true
    };
  });
}

function getAllAccounts() {
  const raw = localStorage.getItem(STORAGE_KEYS.accounts);
  if (!raw) return getDefaultSeededAccounts();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultSeededAccounts();
  } catch (err) {
    reportDiagnostic("DataStore", "Accounts", "getAllAccounts", err);
    return getDefaultSeededAccounts();
  }
}

function saveAllAccounts(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(list));
  } catch (err) {
    reportDiagnostic("DataStore", "Accounts", "saveAllAccounts", err);
  }
}

function getCustomAccounts() {
  return getAllAccounts().filter(function (acc) {
    return !acc.builtIn;
  });
}

function saveCustomAccounts(customList) {
  const builtIns = getAllAccounts().filter(function (acc) {
    return acc.builtIn;
  });
  saveAllAccounts(builtIns.concat(customList));
}

function ensurePropertyDocuments(prop) {
  if (prop && prop.documents && prop.documents.tct && prop.documents.taxDec && prop.documents.ownerId) {
    return prop.documents;
  }
  return {
    tct: {
      label: "Clean Transfer Certificate of Title (TCT / OCT)",
      refNo: "Missing — Not Yet Submitted",
      submitted: false,
      legitimate: false
    },
    taxDec: {
      label: "Updated Real Property Tax Declaration & Clearance",
      refNo: "Missing — Not Yet Submitted",
      submitted: false,
      legitimate: false
    },
    ownerId: {
      label: "Verified Owner Government ID & Deed / Authority",
      refNo: "Missing — Not Yet Submitted",
      submitted: false,
      legitimate: false
    }
  };
}

function hasAllLegitimateDocs(prop) {
  const docs = ensurePropertyDocuments(prop);
  return Boolean(
    docs.tct.submitted &&
      docs.tct.legitimate &&
      docs.taxDec.submitted &&
      docs.taxDec.legitimate &&
      docs.ownerId.submitted &&
      docs.ownerId.legitimate
  );
}

function getInitials(name) {
  const parts = String(name || "YU").trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name || "YU").slice(0, 2).toUpperCase();
}

function getSession() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.session) ||
      localStorage.getItem("yutara_v4_session") ||
      localStorage.getItem("yutara_v3_session");
    return JSON.parse(raw || "null");
  } catch (err) {
    reportDiagnostic("DataStore", "AuthSession", "getSession", err);
    return null;
  }
}

function setSession(userObj) {
  try {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(userObj));
    localStorage.removeItem("yutara_v4_session");
    localStorage.removeItem("yutara_v3_session");
  } catch (err) {
    reportDiagnostic("DataStore", "AuthSession", "setSession", err);
  }
}

function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.session);
  localStorage.removeItem("yutara_v4_session");
  localStorage.removeItem("yutara_v3_session");
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

function resetDemoData() {
  localStorage.removeItem(STORAGE_KEYS.properties);
  localStorage.removeItem(STORAGE_KEYS.saved);
  localStorage.removeItem(STORAGE_KEYS.transactions);
  localStorage.removeItem(STORAGE_KEYS.inquiries);
  localStorage.removeItem(STORAGE_KEYS.accounts);
  localStorage.removeItem(STORAGE_KEYS.session);
  localStorage.removeItem("yutara_v4_session");
  localStorage.removeItem("yutara_v3_session");
  window.location.reload();
}

/* --------------------------------------------------------------------------
   2. SHARED NAVIGATION, FAQ ACCORDION & PASSWORD TOGGLES
   -------------------------------------------------------------------------- */
function initNavbar() {
  const toggleBtn = document.getElementById("menu-toggle");
  const navbar = document.getElementById("main-navbar");
  if (toggleBtn && navbar) {
    toggleBtn.addEventListener("click", function () {
      navbar.classList.toggle("open");
    });
  }

  const navActions = document.getElementById("nav-actions");
  const session = getSession();
  if (session) {
    const isAdminSession = session.role === "Admin";
    const isVerifierSession =
      session.role === "Lucky Seven Land Verifier" || session.role === "Agency";
    const pathLower = (window.location.pathname || "").toLowerCase();
    const pageFile = pathLower.split("/").pop() || "index.html";

    // Admin & Lucky Seven Verifier go STRAIGHT to their dedicated Dashboard (no separate Home or Marketplace)
    if (isAdminSession || isVerifierSession) {
      const restrictedPublicPages = [
        "",
        "index.html",
        "marketplace.html",
        "services.html",
        "about.html",
        "contact.html"
      ];
      if (restrictedPublicPages.indexOf(pageFile) >= 0) {
        window.location.replace(getPostLoginDestination(session.role));
        return;
      }

      // On detail inspection pages (e.g., property.html), remove Home & Marketplace links so only Dashboard + Log Out remain
      document.querySelectorAll(".nav-links a").forEach(function (link) {
        link.remove();
      });
      const brandLink = document.querySelector(".brand");
      if (brandLink) {
        brandLink.setAttribute("href", getPostLoginDestination(session.role));
      }
    } else {
      // Standard User: after logging in, remove Services, About Us, and Contact Us from the navbar
      document.querySelectorAll(".nav-links a").forEach(function (link) {
        const href = (link.getAttribute("href") || "").toLowerCase();
        if (
          href.indexOf("services.html") >= 0 ||
          href.indexOf("about.html") >= 0 ||
          href.indexOf("contact.html") >= 0
        ) {
          link.remove();
        }
      });
    }

    if (navActions) {
      const workspaceLabel = isAdminSession
        ? "← Back to Admin Dashboard"
        : isVerifierSession
        ? "← Back to Lucky Seven Dashboard"
        : "My Account Listings";
      navActions.innerHTML =
        '<a href="' +
        (isAdminSession || isVerifierSession
          ? escapeHtml(getPostLoginDestination(session.role))
          : "tracker.html") +
        '" class="btn btn-primary btn-sm">' +
        escapeHtml(workspaceLabel) +
        "</a>" +
        '<button type="button" class="btn btn-outline btn-sm" id="logout-btn">Log Out</button>';

      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", requestLogoutConfirmation);
      }
    }
  }

  const sidebarLogoutBtn = document.getElementById("sidebar-logout-btn");
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener("click", requestLogoutConfirmation);
  }

  const resetBtn = document.getElementById("reset-demo-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (confirm("Reset all demo listings, accounts, bookings, and login session?")) {
        resetDemoData();
      }
    });
  }
}

function initFaqAccordion() {
  const questions = document.querySelectorAll(".faq-question");
  questions.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const parentItem = btn.closest(".faq-item");
      if (!parentItem) return;
      const isOpen = parentItem.classList.toggle("open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });
}

function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll("[data-toggle-password]");
  toggleButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const targetId = btn.getAttribute("data-toggle-password");
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.textContent = isPassword ? "Hide" : "Show";
      btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    });
  });
}

/* --------------------------------------------------------------------------
   3. REUSABLE PROPERTY CARD HTML BUILDER (ICON-DRIVEN & VISUAL-FIRST)
   -------------------------------------------------------------------------- */
const SVG_ICONS = {
  mapPin:
    '<svg class="svg-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  ruler:
    '<svg class="svg-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"></path><path d="m14.5 12.5 2-2"></path><path d="m11.5 9.5 2-2"></path><path d="m8.5 6.5 2-2"></path><path d="m17.5 15.5 2-2"></path></svg>',
  house:
    '<svg class="svg-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  checkCircle:
    '<svg class="svg-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
};

function getCategoryBadgeClass(type) {
  if (type === "Commercial" || type === "Industrial") {
    return "brown";
  }
  return "";
}

function createPropertyCardHTML(prop) {
  const savedIds = getSavedIds();
  const isSaved = savedIds.includes(prop.id);
  const promotedBadge = prop.promoted
    ? '<span class="badge badge-promoted">Featured</span>'
    : "";
  const statusBadge = prop.badgeText
    ? '<span class="badge badge-with-icon ' + escapeHtml(prop.badgeStyle || "badge-green") + '">' + SVG_ICONS.checkCircle + " " + escapeHtml(prop.badgeText) + "</span>"
    : '<span class="badge badge-with-icon badge-green">' + SVG_ICONS.checkCircle + " Verified</span>";

  const categoryColorClass = getCategoryBadgeClass(prop.type);
  const tagsSource = prop.cardTags && prop.cardTags.length > 0 ? prop.cardTags : (prop.highlights || []).slice(0, 3);
  const quickTags = tagsSource.map(function (tag) {
    return '<span class="tag-pill-icon">' + SVG_ICONS.checkCircle + " " + escapeHtml(tag) + "</span>";
  }).join("");

  return (
    '<article class="property-card anim-fade-up anim-card" data-anim="ytFadeInUp">' +
    '  <div class="property-thumb">' +
    '    <img src="' + escapeHtml(prop.image) + '" alt="' + escapeHtml(prop.title) + '" onerror="this.src=\'assets/property-hero.png\'" />' +
    '    <div class="thumb-badges">' + promotedBadge + statusBadge + "</div>" +
    '    <button type="button" class="save-icon-btn ' + (isSaved ? "saved" : "") + '" data-save-id="' + prop.id + '" title="Save property">' +
    (isSaved ? "&#9829;" : "&#9825;") +
    "</button>" +
    "  </div>" +
    '  <div class="property-body">' +
    '    <div class="prop-icon-row">' +
    '      <span class="prop-icon-pill ' + categoryColorClass + '" title="Property Type">' + SVG_ICONS.house + " " + escapeHtml(prop.type) + "</span>" +
    '      <span class="prop-icon-pill" title="Lot Area">' + SVG_ICONS.ruler + " " + Number(prop.area).toLocaleString() + " sqm</span>" +
    "    </div>" +
    '    <h3 class="property-title">' + escapeHtml(prop.title) + "</h3>" +
    '    <div class="property-location-line">' + SVG_ICONS.mapPin + " <span>Brgy. " + escapeHtml(prop.barangay) + ", " + escapeHtml(prop.city) + "</span></div>" +
    (quickTags ? '<div class="card-tags">' + quickTags + "</div>" : "") +
    '    <div class="property-price-row">' +
    '      <div class="property-price">' + escapeHtml(formatPropertyPrice(prop)) + "</div>" +
    '      <div class="property-note">' + escapeHtml(prop.priceNote || prop.roadAccess) + "</div>" +
    "    </div>" +
    '    <a href="property.html?id=' + prop.id + '" class="btn btn-primary btn-sm btn-full">View Details &rarr;</a>' +
    "  </div>" +
    "</article>"
  );
}

function bindSaveButtons(container, onToggleCallback) {
  if (!container) return;
  const buttons = container.querySelectorAll("[data-save-id]");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-save-id");
      const nowSaved = toggleSavedProperty(id);
      btn.classList.toggle("saved", nowSaved);
      btn.innerHTML = nowSaved ? "&#9829;" : "&#9825;";
      showToast(nowSaved ? "Saved property to your list" : "Removed from saved properties");
      if (typeof onToggleCallback === "function") {
        onToggleCallback();
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. HOME PAGE (index.html) — Hero Spotlight Switcher & Search
   -------------------------------------------------------------------------- */
function initHomePage() {
  const featuredGrid = document.getElementById("featured-grid");
  if (featuredGrid) {
    const properties = getProperties().slice(0, 3);
    featuredGrid.innerHTML = properties.map(createPropertyCardHTML).join("");
    bindSaveButtons(featuredGrid);
  }

  // Interactive Hero Spotlight Switcher (Brgy. New Pandan <-> Brgy. Gredu)
  const spotlightTabs = document.querySelectorAll("[data-spotlight-id]");
  if (spotlightTabs.length > 0) {
    const allProps = getProperties();

    function renderSpotlight(propId) {
      const prop = allProps.find(function (p) { return p.id === Number(propId); }) || allProps[0];
      if (!prop) return;

      document.getElementById("spotlight-img").src = prop.image;
      document.getElementById("spotlight-img").alt = prop.title;
      document.getElementById("spotlight-badge").innerHTML = SVG_ICONS.checkCircle + " " + escapeHtml(prop.badgeText || "Verified");
      document.getElementById("spotlight-badge").className = "badge badge-with-icon " + (prop.badgeStyle || "badge-green");
      const catBadge = document.getElementById("spotlight-cat");
      if (catBadge) {
        catBadge.innerHTML = SVG_ICONS.house + " " + escapeHtml(prop.type);
      }
      const areaEl = document.getElementById("spotlight-area-val");
      if (areaEl) {
        areaEl.textContent = Number(prop.area).toLocaleString() + " sqm";
      }
      const typeEl = document.getElementById("spotlight-type-val");
      if (typeEl) {
        typeEl.textContent = prop.type;
      }
      document.getElementById("spotlight-title").textContent = prop.title;
      const locTextEl = document.getElementById("spotlight-loc-text");
      if (locTextEl) {
        locTextEl.textContent = "Brgy. " + prop.barangay + ", " + prop.city;
      }
      document.getElementById("spotlight-price").textContent = formatPropertyPrice(prop);
      document.getElementById("spotlight-meta").textContent =
        (prop.cardTags || []).join(" • ");
      document.getElementById("spotlight-link").href = "property.html?id=" + prop.id;

      spotlightTabs.forEach(function (tab) {
        tab.classList.toggle("active", Number(tab.getAttribute("data-spotlight-id")) === prop.id);
      });
    }

    spotlightTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        renderSpotlight(tab.getAttribute("data-spotlight-id"));
      });
    });

    renderSpotlight(2);
  }

  const searchForm = document.getElementById("home-search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const location = document.getElementById("home-location").value.trim();
      const type = document.getElementById("home-type").value;
      const min = document.getElementById("home-min").value.trim();
      const max = document.getElementById("home-max").value.trim();

      const params = new URLSearchParams();
      if (location) params.set("location", location);
      if (type) params.set("type", type);
      if (min) params.set("min", min);
      if (max) params.set("max", max);

      window.location.href = "marketplace.html" + (params.toString() ? "?" + params.toString() : "");
    });
  }

  document.querySelectorAll("[data-home-chip]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      const brgy = chip.getAttribute("data-home-chip");
      window.location.href = brgy
        ? "marketplace.html?location=" + encodeURIComponent(brgy)
        : "marketplace.html";
    });
  });
}

/* --------------------------------------------------------------------------
   5. MARKETPLACE PAGE (marketplace.html) — Sidebar Filter, Sort & Pagination
   -------------------------------------------------------------------------- */
function initMarketplacePage() {
  const grid = document.getElementById("marketplace-grid");
  if (!grid) return;

  const locationInput = document.getElementById("filter-location");
  const barangaySelect = document.getElementById("filter-barangay");
  const typeSelect = document.getElementById("filter-type");
  const minInput = document.getElementById("filter-min");
  const maxInput = document.getElementById("filter-max");
  const sortSelect = document.getElementById("filter-sort");
  const savedOnlyCheck = document.getElementById("filter-saved-only");
  const savedCountLabel = document.getElementById("saved-count-badge");
  const countText = document.getElementById("results-count");
  const resetBtn = document.getElementById("reset-filters-btn");
  const chips = document.querySelectorAll("[data-filter-chip]");
  const paginationContainer = document.getElementById("pagination-controls");
  const mobileFilterBtn = document.getElementById("mobile-filter-btn");
  const filterSidebar = document.getElementById("filter-sidebar");

  // Populate Barangay Dropdown in Sidebar
  if (barangaySelect) {
    const optionsHtml = ['<option value="">All Panabo Barangays</option>'].concat(
      PANABO_BARANGAYS.map(function (b) {
        return '<option value="' + escapeHtml(b) + '">Brgy. ' + escapeHtml(b) + "</option>";
      })
    );
    barangaySelect.innerHTML = optionsHtml.join("");
  }

  // Mobile Collapsible Filter Panel Toggle
  if (mobileFilterBtn && filterSidebar) {
    mobileFilterBtn.addEventListener("click", function () {
      const isOpen = filterSidebar.classList.toggle("open");
      mobileFilterBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      const labelSpan = mobileFilterBtn.querySelector(".mobile-filter-label");
      if (labelSpan) {
        labelSpan.textContent = isOpen ? "Hide Property Filters" : "Show Property Filters";
      }
    });
  }

  // Pagination state (4 items per page by default, or showAll = true)
  const ITEMS_PER_PAGE = 4;
  let currentPage = 1;
  let showAllMode = false;

  // Read URL Query Parameters
  const urlLocation = getQueryParam("location");
  if (urlLocation) {
    locationInput.value = urlLocation;
    if (barangaySelect) {
      const matchBrgy = PANABO_BARANGAYS.find(function (b) {
        return b.toLowerCase() === urlLocation.trim().toLowerCase();
      });
      if (matchBrgy) {
        barangaySelect.value = matchBrgy;
      }
    }
  }
  if (getQueryParam("type")) typeSelect.value = getQueryParam("type");
  if (getQueryParam("min")) minInput.value = getQueryParam("min");
  if (getQueryParam("max")) maxInput.value = getQueryParam("max");

  function syncActiveChips() {
    const activeTarget = (
      (barangaySelect && barangaySelect.value) ||
      locationInput.value.trim()
    ).toLowerCase();

    chips.forEach(function (chip) {
      const target = (chip.getAttribute("data-filter-chip") || "").toLowerCase();
      chip.classList.toggle("active", activeTarget === target);
    });
  }

  function updateSavedCount() {
    if (savedCountLabel) {
      savedCountLabel.textContent = "(" + getSavedIds().length + ")";
    }
  }

  function renderPagination(totalItems) {
    if (!paginationContainer) return;

    if (totalItems <= ITEMS_PER_PAGE) {
      paginationContainer.innerHTML = "";
      return;
    }

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    let html = "";
    if (!showAllMode) {
      html +=
        '<button type="button" class="page-btn" data-page="prev" ' +
        (currentPage === 1 ? "disabled" : "") +
        ">&larr; Prev</button>";

      for (let p = 1; p <= totalPages; p++) {
        html +=
          '<button type="button" class="page-btn ' +
          (p === currentPage ? "active" : "") +
          '" data-page="' +
          p +
          '">Page ' +
          p +
          "</button>";
      }

      html +=
        '<button type="button" class="page-btn" data-page="next" ' +
        (currentPage === totalPages ? "disabled" : "") +
        ">Next &rarr;</button>";

      html +=
        '<button type="button" class="page-btn" data-page="all">Load All (' +
        totalItems +
        ")</button>";
    } else {
      html +=
        '<button type="button" class="page-btn active" data-page="paginate">Showing All ' +
        totalItems +
        " Listings (Switch to Pages)</button>";
    }

    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll("[data-page]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const action = btn.getAttribute("data-page");
        if (action === "prev" && currentPage > 1) {
          currentPage--;
        } else if (action === "next" && currentPage < totalPages) {
          currentPage++;
        } else if (action === "all") {
          showAllMode = true;
        } else if (action === "paginate") {
          showAllMode = false;
          currentPage = 1;
        } else {
          currentPage = Number(action) || 1;
          showAllMode = false;
        }
        filterProperties(false);
      });
    });
  }

  function filterProperties(resetPage) {
    if (resetPage !== false) {
      currentPage = 1;
    }

    const allProperties = getProperties();
    const savedIds = getSavedIds();
    const keyword = locationInput.value.trim().toLowerCase();
    const selectedBarangay = barangaySelect ? barangaySelect.value.trim().toLowerCase() : "";
    const type = typeSelect.value;
    const minPrice = Number(minInput.value) || 0;
    const maxPrice = Number(maxInput.value) || Infinity;
    const hasPriceFilter = minPrice > 0 || maxPrice < Infinity;
    const onlySaved = savedOnlyCheck && savedOnlyCheck.checked;
    const sortBy = sortSelect ? sortSelect.value : "featured";

    let filtered = allProperties.filter(function (prop) {
      const highlightText = (prop.highlights || []).join(" ").toLowerCase();
      const textMatch =
        !keyword ||
        prop.barangay.toLowerCase().includes(keyword) ||
        prop.title.toLowerCase().includes(keyword) ||
        prop.description.toLowerCase().includes(keyword) ||
        highlightText.includes(keyword);
      const barangayMatch =
        !selectedBarangay || prop.barangay.toLowerCase() === selectedBarangay;
      const typeMatch = !type || prop.type === type;
      const priceMatch =
        !hasPriceFilter ||
        (Number(prop.price) > 0 && prop.price >= minPrice && prop.price <= maxPrice);
      const savedMatch = !onlySaved || savedIds.includes(prop.id);

      return textMatch && barangayMatch && typeMatch && priceMatch && savedMatch;
    });

    // Apply Sort Order
    if (sortBy === "price-asc") {
      filtered.sort(function (a, b) {
        return (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER);
      });
    } else if (sortBy === "price-desc") {
      filtered.sort(function (a, b) {
        return (b.price || 0) - (a.price || 0);
      });
    } else if (sortBy === "area-desc") {
      filtered.sort(function (a, b) {
        return Number(b.area) - Number(a.area);
      });
    }

    syncActiveChips();
    updateSavedCount();

    if (filtered.length === 0) {
      countText.textContent = "Showing 0 of " + allProperties.length + " properties in Panabo City";
      grid.innerHTML =
        '<div class="card empty-state-card">' +
        "  <h3>No matching properties found</h3>" +
        "  <p>Try clearing your filters or selecting another Panabo City barangay.</p>" +
        "</div>";
      if (paginationContainer) paginationContainer.innerHTML = "";
      return;
    }

    const visibleItems = showAllMode
      ? filtered
      : filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    countText.textContent =
      "Showing " +
      visibleItems.length +
      " of " +
      filtered.length +
      " matching properties in Panabo City";

    grid.innerHTML = visibleItems.map(createPropertyCardHTML).join("");
    bindSaveButtons(grid, function () {
      updateSavedCount();
      if (onlySaved) filterProperties(false);
    });

    renderPagination(filtered.length);
  }

  [locationInput, typeSelect, minInput, maxInput, sortSelect, savedOnlyCheck].forEach(function (el) {
    if (el) {
      el.addEventListener("input", function () {
        filterProperties(true);
      });
      el.addEventListener("change", function () {
        filterProperties(true);
      });
    }
  });

  if (barangaySelect) {
    barangaySelect.addEventListener("change", function () {
      locationInput.value = barangaySelect.value;
      filterProperties(true);
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      const targetBrgy = chip.getAttribute("data-filter-chip") || "";
      locationInput.value = targetBrgy;
      if (barangaySelect) {
        barangaySelect.value = targetBrgy;
      }
      filterProperties(true);
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      locationInput.value = "";
      if (barangaySelect) barangaySelect.value = "";
      typeSelect.value = "";
      minInput.value = "";
      maxInput.value = "";
      if (sortSelect) sortSelect.value = "featured";
      if (savedOnlyCheck) savedOnlyCheck.checked = false;
      showAllMode = false;
      filterProperties(true);
      showToast("Filters reset");
    });
  }

  filterProperties(true);
}

/* --------------------------------------------------------------------------
   6. PROPERTY DETAILS PAGE (property.html) — Lightbox, Copy Coords, Related
   -------------------------------------------------------------------------- */
function initPropertyDetailPage() {
  const container = document.getElementById("property-detail-root");
  if (!container) return;

  const idParam = Number(getQueryParam("id")) || 1;
  const allProperties = getProperties();
  const prop = allProperties.find(function (item) {
    return item.id === idParam;
  }) || allProperties[0];

  const isSaved = getSavedIds().includes(prop.id);

  document.getElementById("detail-img").src = prop.image;
  document.getElementById("detail-img").alt = prop.title;
  document.getElementById("detail-title").textContent = prop.title;
  document.getElementById("detail-location").textContent =
    "Brgy. " + prop.barangay + ", " + prop.city + ", " + prop.province;
  document.getElementById("detail-price").textContent = formatPropertyPrice(prop);
  document.getElementById("detail-price-sqm").textContent = formatPricePerSqm(prop);
  document.getElementById("detail-area").textContent = Number(prop.area).toLocaleString() + " sqm";
  document.getElementById("detail-type").textContent = prop.type;
  document.getElementById("detail-road").textContent = prop.roadAccess;
  document.getElementById("detail-seller").textContent = prop.seller;
  document.getElementById("detail-desc").textContent = prop.description;
  document.getElementById("detail-coords").textContent =
    "Coordinates: " + prop.latitude + ", " + prop.longitude;

  const highlightsList = document.getElementById("detail-highlights");
  if (highlightsList) {
    const items = prop.highlights && prop.highlights.length > 0
      ? prop.highlights
      : ["Clean title screening in MVP", prop.roadAccess];
    highlightsList.innerHTML = items.map(function (item) {
      return "<li><span>&#10003;</span> " + escapeHtml(item) + "</li>";
    }).join("");
  }

  // Copy Coordinates button
  const copyBtn = document.getElementById("copy-coords-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      const coordStr = prop.latitude + ", " + prop.longitude;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(coordStr);
      }
      showToast("Copied coordinates: " + coordStr);
    });
  }

  // Photo Lightbox Zoom
  const photoTrigger = document.getElementById("detail-photo-trigger");
  const lightbox = document.getElementById("photo-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");

  if (photoTrigger && lightbox && lightboxImg) {
    photoTrigger.addEventListener("click", function () {
      lightboxImg.src = prop.image;
      lightboxImg.alt = prop.title;
      lightbox.classList.remove("hidden");
    });
    if (lightboxClose) {
      lightboxClose.addEventListener("click", function () {
        lightbox.classList.add("hidden");
      });
    }
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lightbox.classList.add("hidden");
    });
  }

  // Related Panabo Properties at bottom
  const relatedGrid = document.getElementById("related-grid");
  if (relatedGrid) {
    const related = allProperties.filter(function (p) { return p.id !== prop.id; }).slice(0, 3);
    relatedGrid.innerHTML = related.map(createPropertyCardHTML).join("");
    bindSaveButtons(relatedGrid);
  }

  const reserveLink = document.getElementById("reserve-property-link");
  if (reserveLink) {
    reserveLink.href = "reservation.html?id=" + prop.id;
  }

  const saveBtn = document.getElementById("detail-save-btn");
  function updateSaveButton(saved) {
    saveBtn.textContent = saved ? "Saved Listing ✓" : "Save Listing";
  }
  updateSaveButton(isSaved);
  saveBtn.addEventListener("click", function () {
    const nowSaved = toggleSavedProperty(prop.id);
    updateSaveButton(nowSaved);
    showToast(nowSaved ? "Saved property to your list" : "Removed from saved properties");
  });

  // Inquiry / Site Visit Modal
  const modal = document.getElementById("action-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalForm = document.getElementById("modal-form");
  const modalStatus = document.getElementById("modal-status");
  const closeModalBtn = document.getElementById("close-modal-btn");

  function openModal(titleText) {
    modalTitle.textContent = titleText + " — Brgy. " + prop.barangay;
    modalStatus.classList.add("hidden");
    modalForm.reset();
    modal.classList.remove("hidden");
  }

  document.getElementById("site-visit-btn").addEventListener("click", function () {
    openModal("Request Site Visit");
  });

  document.getElementById("contact-seller-btn").addEventListener("click", function () {
    openModal("Contact Seller (" + prop.seller + ")");
  });

  closeModalBtn.addEventListener("click", function () {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", function (event) {
    if (event.target === modal) modal.classList.add("hidden");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      modal.classList.add("hidden");
      if (lightbox) lightbox.classList.add("hidden");
    }
  });

  modalForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (lockFormSubmission(modalForm)) return;

    const sender = document.getElementById("modal-name").value.trim();
    const phone = document.getElementById("modal-phone").value.trim();
    const notesEl = document.getElementById("modal-notes");
    const notes = notesEl ? notesEl.value.trim() : "";

    if (!sender || !phone) {
      modalStatus.className = "alert alert-error";
      modalStatus.textContent = "Please enter both your name and mobile number.";
      modalStatus.classList.remove("hidden");
      return;
    }

    const inquiries = getInquiries();
    const newInq = {
      id: "INQ-" + Math.floor(1000 + Math.random() * 9000),
      type: modalTitle.textContent.indexOf("Site Visit") >= 0 ? "Request Site Visit" : "Seller Inquiry",
      propertyTitle: prop.title + " (Brgy. " + prop.barangay + ")",
      senderName: sender,
      contactInfo: phone,
      message: notes || "Requested site inspection and title document review.",
      status: "Open",
      createdAt: new Date().toISOString().slice(0, 10)
    };
    inquiries.unshift(newInq);
    saveInquiries(inquiries);

    modalStatus.className = "alert alert-success";
    modalStatus.innerHTML =
      "<strong>Inquiry Recorded (" +
      escapeHtml(newInq.id) +
      ")!</strong> Saved for " +
      escapeHtml(sender) +
      '. <a href="tracker.html?tab=panel-inquiries" class="inline-action-link">View in Dashboard Inquiries &rarr;</a>';
    modalStatus.classList.remove("hidden");
    showToast("Inquiry " + newInq.id + " recorded for " + sender);
  });
}

/* --------------------------------------------------------------------------
   7. RESERVATION CHECKOUT PAGE (reservation.html) — Simulated MVP Demo
   -------------------------------------------------------------------------- */
function initReservationPage() {
  const form = document.getElementById("reservation-form");
  if (!form) return;

  const idParam = Number(getQueryParam("id")) || 1;
  const allProperties = getProperties();
  const prop = allProperties.find(function (item) {
    return item.id === idParam;
  }) || allProperties[0];

  document.getElementById("res-prop-title").textContent = prop.title;
  document.getElementById("res-prop-location").textContent = "Brgy. " + prop.barangay + ", " + prop.city;
  document.getElementById("res-prop-price").textContent = formatPropertyPrice(prop);
  document.getElementById("res-back-link").href = "property.html?id=" + prop.id;

  const session = getSession();
  const buyerInput = document.getElementById("res-buyer-name");
  const quickLoginBox = document.getElementById("res-login-notice");

  if (session) {
    buyerInput.value = session.name;
    quickLoginBox.classList.add("hidden");
  } else {
    const quickBtn = document.getElementById("quick-demo-signin");
    if (quickBtn) {
      quickBtn.addEventListener("click", function () {
        setSession({ name: "Juan Dela Cruz", email: "buyer@yutara.demo", role: "Buyer" });
        window.location.reload();
      });
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (lockFormSubmission(form)) return;

    const feedback = document.getElementById("res-feedback");
    const buyerName = buyerInput.value.trim();
    const buyerPhone = document.getElementById("res-buyer-phone").value.trim();
    const agreed = document.getElementById("res-agree").checked;

    if (!buyerName || !buyerPhone || !agreed) {
      feedback.className = "alert alert-error";
      feedback.textContent = "Please complete all fields and confirm the MVP simulation notice.";
      feedback.classList.remove("hidden");
      return;
    }

    const transactions = getTransactions();
    const newTx = {
      id: "TX-" + Math.floor(1000 + Math.random() * 9000),
      propertyId: prop.id,
      propertyTitle: prop.title,
      location: "Brgy. " + prop.barangay + ", " + prop.city,
      buyerName: buyerName,
      sellerName: prop.seller,
      salePrice: prop.price,
      priceLabel: formatPropertyPrice(prop),
      reservationFee: 25000,
      stageIndex: 0,
      documents: [
        { name: "Reservation Request Form (Simulated)", status: "Submitted" },
        { name: "Clean Transfer Certificate of Title (TCT Copy)", status: "Requested" },
        { name: "Updated Real Property Tax Declaration", status: "Requested" }
      ]
    };

    transactions.unshift(newTx);
    saveTransactions(transactions);

    feedback.className = "alert alert-success";
    feedback.innerHTML =
      "<strong>Simulated Reservation Created (" +
      escapeHtml(newTx.id) +
      ")!</strong> No real money was collected. " +
      '<a href="tracker.html" class="inline-action-link">Open Transaction Tracker &rarr;</a>';
    feedback.classList.remove("hidden");
    form.reset();
    showToast("Simulated reservation " + newTx.id + " created");
  });
}

/* --------------------------------------------------------------------------
   8. LOGIN PAGE (login.html) — Admin, User & Lucky Seven Land Verifier
   -------------------------------------------------------------------------- */
function getDefaultTabForRole(role) {
  if (role === "Admin") return "panel-accounts";
  if (role === "Lucky Seven Land Verifier" || role === "Agency") return "panel-agency";
  return "panel-buyer";
}

function getPostLoginDestination(role) {
  if (role === "Admin") return "tracker.html?tab=panel-accounts";
  if (role === "Lucky Seven Land Verifier" || role === "Agency") return "tracker.html?tab=panel-agency";
  // Standard User goes straight to the Marketplace after logging in
  return "marketplace.html";
}

function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const statusBox = document.getElementById("login-status");
  const emailInput = document.getElementById("login-email");
  const rememberCheck = document.getElementById("login-remember");

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
      selectedRole === "Lucky Seven Land Verifier"
        ? "Lucky Seven Land Verifier"
        : selectedRole === "Admin"
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

/* --------------------------------------------------------------------------
   9. 4-STEP REGISTRATION PAGE (register.html)
   -------------------------------------------------------------------------- */
function initRegisterPage() {
  const form = document.getElementById("register-form");
  if (!form) return;

  let currentStep = 1;
  const totalSteps = 4;
  const feedback = document.getElementById("reg-feedback");

  function renderStep() {
    for (let i = 1; i <= totalSteps; i++) {
      const panel = document.getElementById("reg-step-" + i);
      const pill = document.getElementById("step-pill-" + i);
      panel.classList.toggle("hidden", i !== currentStep);

      pill.classList.remove("active", "done");
      if (i === currentStep) pill.classList.add("active");
      if (i < currentStep) pill.classList.add("done");
    }

    document.getElementById("reg-prev-btn").classList.toggle("hidden", currentStep === 1);
    document.getElementById("reg-next-btn").classList.toggle("hidden", currentStep === totalSteps);
    document.getElementById("reg-submit-btn").classList.toggle("hidden", currentStep !== totalSteps);

    if (currentStep === 4) {
      document.getElementById("review-name").textContent = document.getElementById("reg-name").value;
      document.getElementById("review-email").textContent = document.getElementById("reg-email").value;
      document.getElementById("review-phone").textContent = document.getElementById("reg-phone").value;
      document.getElementById("review-role").textContent = document.getElementById("reg-role").value;
      document.getElementById("review-id-type").textContent = document.getElementById("reg-id-type").value;
    }
  }

  document.getElementById("reg-next-btn").addEventListener("click", function () {
    feedback.classList.add("hidden");

    if (currentStep === 1) {
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const phone = document.getElementById("reg-phone").value.trim();
      const pass = document.getElementById("reg-password").value;

      if (!name || !email || !phone || pass.length < 6) {
        feedback.className = "alert alert-error";
        feedback.textContent = "Please fill in all fields (password must be at least 6 characters).";
        feedback.classList.remove("hidden");
        return;
      }
    }

    if (currentStep === 3 && !document.getElementById("reg-face-check").checked) {
      feedback.className = "alert alert-error";
      feedback.textContent = "Please confirm the simulated face verification step to continue.";
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

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (lockFormSubmission(form)) return;

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const role = document.getElementById("reg-role").value;
    const pass = document.getElementById("reg-password").value;

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

/* --------------------------------------------------------------------------
   10. CONTACT PAGE (contact.html)
   -------------------------------------------------------------------------- */
function initContactPage() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (lockFormSubmission(form)) return;

    const feedback = document.getElementById("contact-feedback");
    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const topicEl = document.getElementById("contact-topic");
    const topic = topicEl ? topicEl.value : "General Inquiry";
    const message = document.getElementById("contact-message").value.trim();

    if (!name || !email.includes("@") || message.length < 10) {
      feedback.className = "alert alert-error";
      feedback.textContent = "Please enter your name, a valid email, and a message (at least 10 characters).";
      feedback.classList.remove("hidden");
      return;
    }

    const inquiries = getInquiries();
    const newInq = {
      id: "INQ-" + Math.floor(1000 + Math.random() * 9000),
      type: topic,
      propertyTitle: "Panabo City Marketplace Inquiry",
      senderName: name,
      contactInfo: email,
      message: message,
      status: "Open",
      createdAt: new Date().toISOString().slice(0, 10)
    };
    inquiries.unshift(newInq);
    saveInquiries(inquiries);

    feedback.className = "alert alert-success";
    feedback.innerHTML =
      "Thank you, <strong>" +
      escapeHtml(name) +
      "</strong>! Your inquiry (" +
      escapeHtml(newInq.id) +
      ") has been saved.";
    feedback.classList.remove("hidden");
    form.reset();
    showToast("Inquiry " + newInq.id + " sent");
  });
}

/* --------------------------------------------------------------------------
   11. WORKSPACE HUB (tracker.html — Strict 3-Role RBAC + Legitimate Docs Gate)
   -------------------------------------------------------------------------- */
function initTrackerPage() {
  const tabContainer = document.getElementById("workflow-tabs");
  if (!tabContainer) return;

  const session = getSession();
  const currentRole = session && session.role ? session.role : "User";
  const currentName = session && session.name ? session.name : "Juan Dela Cruz";
  const currentEmail = session && session.email ? session.email : "user@yutara.ph";
  const isAdmin = currentRole === "Admin";
  const isVerifier = currentRole === "Lucky Seven Land Verifier" || currentRole === "Agency";
  const isStandardUser = !isAdmin && !isVerifier;

  const tabBtns = tabContainer.querySelectorAll("[data-tab]");
  const rbacAlert = document.getElementById("rbac-alert");

  function isTabAllowedForRole(targetId) {
    if (isAdmin) {
      // Admin can ONLY modify accounts (panel-accounts) and edit/delete properties (panel-seller)
      return targetId === "panel-accounts" || targetId === "panel-seller";
    }
    if (isVerifier) {
      // Lucky Seven can ONLY verify land listings/properties with legitimate documents (panel-agency)
      return targetId === "panel-agency";
    }
    // Standard User can ONLY view Marketplace + his own account listings (panel-buyer & panel-seller)
    return targetId === "panel-buyer" || targetId === "panel-seller";
  }

  function applyRolePermissionsToUI() {
    const workspaceShell = document.getElementById("workspace-shell");
    const sidebarBrandLink = document.getElementById("sidebar-brand-link");
    const sidebarLogoImg = document.getElementById("sidebar-logo-img");
    const mobileTopbarLogo = document.getElementById("mobile-topbar-logo");
    const mobileTopbarTitle = document.getElementById("mobile-topbar-title");
    const brandSub = document.getElementById("sidebar-brand-sub");
    const groupTitle = document.getElementById("sidebar-group-title");
    const avatarEl = document.getElementById("sidebar-avatar");
    const displayEl = document.getElementById("active-account-display");
    const emailEl = document.getElementById("sidebar-profile-email");

    const navHome = document.getElementById("nav-item-home");
    const navMarketplace = document.getElementById("nav-item-marketplace");
    const navUserProps = document.getElementById("nav-item-user-props");
    const navUserSell = document.getElementById("nav-item-user-sell");
    const navAdminAccounts = document.getElementById("nav-item-admin-accounts");
    const navVerifierDesk = document.getElementById("nav-item-verifier-desk");

    const heading = document.getElementById("dashboard-heading");
    const adminCrudCard = document.getElementById("admin-crud-card");
    const adminEditOnlyNotice = document.getElementById("admin-edit-only-notice");
    const sellerDocsSection = document.getElementById("seller-docs-section");
    const tabBtnSeller = document.getElementById("tab-btn-seller");
    const tabBtnSellerLabel = document.getElementById("tab-btn-seller-label");
    const tabBtnAgency = document.getElementById("tab-btn-agency");

    if (avatarEl) avatarEl.textContent = getInitials(currentName);
    if (displayEl) displayEl.textContent = currentName;
    if (emailEl) emailEl.textContent = currentEmail;

    if (isAdmin) {
      if (workspaceShell) workspaceShell.classList.remove("theme-lucky-seven");
      if (sidebarBrandLink) sidebarBrandLink.setAttribute("href", "tracker.html?tab=panel-accounts");
      if (sidebarLogoImg) {
        sidebarLogoImg.src = "assets/yutara-logo.png";
        sidebarLogoImg.alt = "YuTara Logo";
        sidebarLogoImg.className = "sidebar-logo-img";
      }
      if (mobileTopbarLogo) mobileTopbarLogo.src = "assets/yutara-logo.png";
      if (mobileTopbarTitle) mobileTopbarTitle.textContent = "Admin Portal";
      if (brandSub) brandSub.textContent = "Admin Dashboard";
      if (groupTitle) groupTitle.textContent = "Admin Controls";
      if (navHome) navHome.classList.add("hidden");
      if (navMarketplace) navMarketplace.classList.add("hidden");
      if (navUserProps) navUserProps.classList.add("hidden");
      if (navAdminAccounts) navAdminAccounts.classList.remove("hidden");
      if (navUserSell) navUserSell.classList.remove("hidden");
      if (tabBtnSellerLabel) tabBtnSellerLabel.textContent = "Edit / Delete Properties";
      if (tabBtnSeller) tabBtnSeller.setAttribute("title", "Edit / Delete Properties");
      if (navVerifierDesk) navVerifierDesk.classList.add("hidden");
      if (adminCrudCard) adminCrudCard.classList.remove("hidden");
      if (adminEditOnlyNotice) adminEditOnlyNotice.classList.remove("hidden");
      if (sellerDocsSection) sellerDocsSection.classList.add("hidden");
    } else if (isVerifier) {
      if (workspaceShell) workspaceShell.classList.add("theme-lucky-seven");
      if (sidebarBrandLink) sidebarBrandLink.setAttribute("href", "tracker.html?tab=panel-agency");
      if (sidebarLogoImg) {
        sidebarLogoImg.src = "assets/lucky-seven-logo.jpg";
        sidebarLogoImg.alt = "Lucky Seven Property Management Solutions, Inc.";
        sidebarLogoImg.className = "sidebar-lucky-logo";
      }
      if (mobileTopbarLogo) mobileTopbarLogo.src = "assets/lucky-seven-logo.jpg";
      if (mobileTopbarTitle) mobileTopbarTitle.textContent = "Lucky Seven Verification";
      if (brandSub) brandSub.textContent = "Property Management Solutions, Inc.";
      if (groupTitle) groupTitle.textContent = "Verification Desk";
      if (navHome) navHome.classList.add("hidden");
      if (navMarketplace) navMarketplace.classList.add("hidden");
      if (navUserProps) navUserProps.classList.add("hidden");
      if (navUserSell) navUserSell.classList.add("hidden");
      if (navAdminAccounts) navAdminAccounts.classList.add("hidden");
      if (navVerifierDesk) navVerifierDesk.classList.remove("hidden");
      if (adminCrudCard) adminCrudCard.classList.add("hidden");
      if (adminEditOnlyNotice) adminEditOnlyNotice.classList.add("hidden");
      if (tabBtnSeller) tabBtnSeller.classList.add("hidden");
      if (tabBtnAgency) tabBtnAgency.classList.remove("hidden");
    } else {
      // Standard User: Marketplace + My Account Listings only
      if (workspaceShell) workspaceShell.classList.remove("theme-lucky-seven");
      if (sidebarBrandLink) sidebarBrandLink.setAttribute("href", "marketplace.html");
      if (sidebarLogoImg) {
        sidebarLogoImg.src = "assets/yutara-logo.png";
        sidebarLogoImg.alt = "YuTara Logo";
        sidebarLogoImg.className = "sidebar-logo-img";
      }
      if (mobileTopbarLogo) mobileTopbarLogo.src = "assets/yutara-logo.png";
      if (mobileTopbarTitle) mobileTopbarTitle.textContent = "My Account Listings";
      if (brandSub) brandSub.textContent = "Yuta ba? YuTara!";
      if (groupTitle) groupTitle.textContent = "User Navigation";
      if (heading) heading.textContent = "Welcome back, " + currentName + "!";
      if (navHome) navHome.classList.add("hidden");
      if (navMarketplace) navMarketplace.classList.remove("hidden");
      if (navUserProps) navUserProps.classList.remove("hidden");
      if (navUserSell) navUserSell.classList.remove("hidden");
      if (navAdminAccounts) navAdminAccounts.classList.add("hidden");
      if (navVerifierDesk) navVerifierDesk.classList.add("hidden");
      if (adminCrudCard) adminCrudCard.classList.add("hidden");
      if (adminEditOnlyNotice) adminEditOnlyNotice.classList.add("hidden");
      if (sellerDocsSection) sellerDocsSection.classList.remove("hidden");
      if (tabBtnAgency) tabBtnAgency.classList.add("hidden");
    }
  }

  // Desktop Collapsible Sidebar & Mobile Drawer Controls
  const workspaceShellEl = document.getElementById("workspace-shell");
  const collapseBtn = document.getElementById("sidebar-collapse-btn");
  const mobileDrawerBtn = document.getElementById("mobile-sidebar-btn");
  const mobileBackdrop = document.getElementById("sidebar-mobile-backdrop");
  const mobileLogoutBtn = document.getElementById("mobile-logout-btn");

  if (collapseBtn && workspaceShellEl) {
    collapseBtn.addEventListener("click", function () {
      const collapsed = workspaceShellEl.classList.toggle("sidebar-collapsed");
      collapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });
  }

  function closeMobileDrawer() {
    if (workspaceShellEl) workspaceShellEl.classList.remove("drawer-open");
  }

  if (mobileDrawerBtn && workspaceShellEl) {
    mobileDrawerBtn.addEventListener("click", function () {
      workspaceShellEl.classList.toggle("drawer-open");
    });
  }

  if (mobileBackdrop) {
    mobileBackdrop.addEventListener("click", closeMobileDrawer);
  }

  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", requestLogoutConfirmation);
  }

  function activateTab(targetId) {
    if (!isTabAllowedForRole(targetId)) {
      if (rbacAlert) {
        rbacAlert.textContent =
          "Access Restricted: Your current role (" +
          currentRole +
          ") is not authorized for that section.";
        rbacAlert.classList.remove("hidden");
      }
      targetId = getDefaultTabForRole(currentRole);
    }

    tabBtns.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === targetId);
    });
    document.querySelectorAll(".tab-panel").forEach(function (panel) {
      const isActive = panel.id === targetId;
      panel.classList.toggle("hidden", !isActive);
      if (isActive) {
        replayTabAnimation(panel);
      }
    });
  }

  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (rbacAlert) rbacAlert.classList.add("hidden");
      closeMobileDrawer();
      activateTab(btn.getAttribute("data-tab"));
    });
  });

  applyRolePermissionsToUI();

  const initialTab = getQueryParam("tab");
  if (initialTab && document.getElementById(initialTab)) {
    activateTab(initialTab);
  } else {
    const roleTab = getDefaultTabForRole(currentRole);
    if (document.getElementById(roleTab)) {
      activateTab(roleTab);
    }
  }

  const brgySelect = document.getElementById("seller-barangay");
  if (brgySelect) {
    brgySelect.innerHTML = PANABO_BARANGAYS.map(function (b) {
      return '<option value="' + escapeHtml(b) + '">' + escapeHtml(b) + "</option>";
    }).join("");
  }

  const sellerForm = document.getElementById("seller-intake-form");
  const editIdInput = document.getElementById("seller-edit-id");
  const formTag = document.getElementById("seller-form-tag");
  const formHeading = document.getElementById("seller-form-heading");
  const formSubtitle = document.getElementById("seller-form-subtitle");
  const submitBtn = document.getElementById("seller-submit-btn");
  const cancelEditBtn = document.getElementById("seller-cancel-edit-btn");

  function exitEditMode() {
    if (sellerForm) sellerForm.reset();
    if (editIdInput) editIdInput.value = "";
    if (isAdmin) {
      if (formTag) formTag.textContent = "Admin Property Editor (Edit Only)";
      if (formHeading) formHeading.textContent = "Select a Property Above to Edit";
      if (formSubtitle) {
        formSubtitle.textContent =
          "Administrators can edit or delete existing property listings. Choose any property above and click Edit.";
      }
      if (submitBtn) {
        submitBtn.innerHTML = "Select a Property to Edit First";
        submitBtn.disabled = true;
      }
    } else {
      if (formTag) formTag.textContent = "Submit Land Listing";
      if (formHeading) formHeading.textContent = "Submit a New Panabo City Land Listing";
      if (formSubtitle) {
        formSubtitle.textContent =
          "Enter your Panabo City parcel details and supporting legal documents for Lucky Seven Land Verifier screening.";
      }
      if (submitBtn) {
        submitBtn.innerHTML = "Publish Listing to Marketplace &rarr;";
        submitBtn.disabled = false;
      }
    }
    if (cancelEditBtn) cancelEditBtn.classList.add("hidden");
  }

  exitEditMode();

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", function () {
      exitEditMode();
      showToast("Cancelled property edit");
    });
  }

  const userGoSubmitBtn = document.getElementById("user-go-submit-btn");
  if (userGoSubmitBtn) {
    userGoSubmitBtn.addEventListener("click", function () {
      if (!isStandardUser) return;
      exitEditMode();
      activateTab("panel-seller");
    });
  }

  function loadPropertyIntoEditForm(targetId) {
    if (!isAdmin) return;
    const prop = getProperties().find(function (p) {
      return p.id === Number(targetId);
    });
    if (!prop) return;

    activateTab("panel-seller");
    if (editIdInput) editIdInput.value = String(prop.id);
    document.getElementById("seller-title").value = prop.title;
    document.getElementById("seller-type").value = prop.type;
    document.getElementById("seller-barangay").value = prop.barangay;
    document.getElementById("seller-price").value = prop.price || 0;
    document.getElementById("seller-area").value = prop.area;
    document.getElementById("seller-road").value = prop.roadAccess;
    document.getElementById("seller-desc").value = prop.description;

    if (formTag) formTag.textContent = "Admin Property Editor";
    if (formHeading) {
      formHeading.textContent = "Edit Property Listing #" + prop.id + " (" + prop.barangay + ")";
    }
    if (submitBtn) {
      submitBtn.innerHTML = "Save Property Changes &checkmark;";
      submitBtn.disabled = false;
    }
    if (cancelEditBtn) {
      cancelEditBtn.classList.remove("hidden");
    }
    if (sellerForm) {
      sellerForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    showToast("Loaded listing #" + prop.id + " for editing");
  }

  function deletePropertyListingById(targetId) {
    if (!isAdmin) return;
    const remaining = getProperties().filter(function (p) {
      return p.id !== Number(targetId);
    });
    if (remaining.length === 0) {
      localStorage.removeItem(STORAGE_KEYS.properties);
      showToast("Restored 6 default Panabo listings so Marketplace is never empty");
    } else {
      saveProperties(remaining);
      showToast("Deleted property listing #" + targetId);
    }
    if (editIdInput && Number(editIdInput.value) === Number(targetId)) {
      exitEditMode();
    }
    renderManagedProperties();
    renderAdminAccountsPortal();
    renderUserWorkspace();
  }

  function renderManagedProperties() {
    const container = document.getElementById("managed-properties-list");
    const countBadge = document.getElementById("managed-prop-count");
    if (!container) return;

    // Strict RBAC guard: Only Admin can view or use Property Edit/Delete Inventory
    if (!isAdmin) {
      container.innerHTML = "";
      return;
    }

    const properties = getProperties();
    if (countBadge) {
      countBadge.textContent = properties.length + " Listings";
    }

    container.innerHTML = properties
      .map(function (prop) {
        return (
          '<div class="card-soft mb-2 anim-fade-up" data-anim="ytFadeInUp">' +
          '  <div class="agency-card-row">' +
          '    <div class="table-prop-cell">' +
          '      <img src="' +
          escapeHtml(prop.image) +
          '" alt="' +
          escapeHtml(prop.title) +
          '" class="table-prop-thumb" onerror="this.src=\'assets/property-hero.png\'" />' +
          "      <div>" +
          "        <h3>#" +
          prop.id +
          " &mdash; " +
          escapeHtml(prop.title) +
          "</h3>" +
          '        <p class="text-no-margin">Brgy. ' +
          escapeHtml(prop.barangay) +
          " &bull; " +
          escapeHtml(prop.type) +
          " &bull; " +
          Number(prop.area).toLocaleString() +
          " sqm &bull; <strong>" +
          escapeHtml(formatPropertyPrice(prop)) +
          "</strong></p>" +
          "      </div>" +
          "    </div>" +
          '    <div class="flex-wrap-gap">' +
          '      <a href="property.html?id=' +
          prop.id +
          '" class="btn btn-outline btn-sm">View</a>' +
          '      <button type="button" class="btn btn-outline btn-sm" data-edit-prop-id="' +
          prop.id +
          '">Edit</button>' +
          '      <button type="button" class="btn btn-danger-outline btn-sm" data-delete-prop-id="' +
          prop.id +
          '">Delete</button>' +
          "    </div>" +
          "  </div>" +
          "</div>"
        );
      })
      .join("");

    container.querySelectorAll("[data-edit-prop-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        loadPropertyIntoEditForm(btn.getAttribute("data-edit-prop-id"));
      });
    });

    container.querySelectorAll("[data-delete-prop-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deletePropertyListingById(btn.getAttribute("data-delete-prop-id"));
      });
    });
  }

  /* ------------------------------------------------------------------------
     LUCKY SEVEN EXCLUSIVE DESK — REDESIGNED DOCUMENT VERIFICATION PORTAL
     Preserves exact 3-document legitimate verification criteria (hasAllLegitimateDocs)
     ------------------------------------------------------------------------ */
  const LS_ICONS = {
    mapPin:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    user:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    fileText:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
    receipt:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5v-11"></path></svg>',
    idCard:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"></rect><circle cx="8" cy="10" r="2"></circle><path d="M14 9h4"></path><path d="M14 13h4"></path><path d="M6 16c.6-1.5 1.8-2 2-2s1.4.5 2 2"></path></svg>',
    checkCircle:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    clock:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    shieldAlert:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    eye:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    externalLink:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
    shieldCheck:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>',
    shieldOff:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"></path><path d="M4.73 4.73 4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
  };

  const LS_DOC_META = {
    tct: { shortTitle: "TCT / OCT", icon: LS_ICONS.fileText, category: "Land Title Registry" },
    taxDec: { shortTitle: "Tax Clearance", icon: LS_ICONS.receipt, category: "Panabo City Assessor" },
    ownerId: { shortTitle: "Owner ID", icon: LS_ICONS.idCard, category: "Owner Identity Proof" }
  };

  const lsSearchInput = document.getElementById("ls-search-input");
  const lsBarangayFilter = document.getElementById("ls-filter-barangay");
  const lsStatusFilter = document.getElementById("ls-filter-status");
  const lsCompletenessFilter = document.getElementById("ls-filter-completeness");
  const lsResetFilterBtn = document.getElementById("ls-filter-reset");
  const lsResultsSummary = document.getElementById("ls-results-summary");

  if (lsBarangayFilter && lsBarangayFilter.options.length <= 1) {
    lsBarangayFilter.innerHTML =
      '<option value="">All Barangays</option>' +
      PANABO_BARANGAYS.map(function (b) {
        return '<option value="' + escapeHtml(b) + '">Brgy. ' + escapeHtml(b) + "</option>";
      }).join("");
  }

  function getPropertyVerificationState(prop) {
    const docs = ensurePropertyDocuments(prop);
    const docList = [docs.tct, docs.taxDec, docs.ownerId];
    const missingCount = docList.filter(function (d) { return !d.submitted; }).length;
    const validCount = docList.filter(function (d) { return d.submitted && d.legitimate; }).length;
    const allDocsLegit = hasAllLegitimateDocs(prop);
    const isVerified = prop.verificationStatus === "Verified by Lucky Seven" && allDocsLegit;

    if (isVerified) {
      return {
        key: "Verified",
        label: "Verified",
        pillClass: "status-verified",
        pillIcon: LS_ICONS.checkCircle,
        summaryClass: "sum-verified",
        summaryText: "Verified by Lucky Seven: All 3 required legal documents (TCT/OCT, Tax Clearance, Owner ID) are authenticated.",
        allDocsLegit: true,
        isVerified: true,
        missingCount: 0,
        validCount: 3
      };
    }
    if (allDocsLegit) {
      return {
        key: "Pending Review",
        label: "Pending Review",
        pillClass: "status-pending",
        pillIcon: LS_ICONS.clock,
        summaryClass: "sum-ready",
        summaryText: "3/3 submitted documents authenticated — Eligible for final Lucky Seven verification approval.",
        allDocsLegit: true,
        isVerified: false,
        missingCount: 0,
        validCount: 3
      };
    }
    if (missingCount > 0) {
      return {
        key: "Blocked",
        label: "Blocked",
        pillClass: "status-blocked",
        pillIcon: LS_ICONS.shieldAlert,
        summaryClass: "sum-blocked",
        summaryText:
          "Blocked: Missing " +
          missingCount +
          " required legal " +
          (missingCount === 1 ? "document" : "documents") +
          ". Cannot verify until all 3 legitimate documents are submitted.",
        allDocsLegit: false,
        isVerified: false,
        missingCount: missingCount,
        validCount: validCount
      };
    }
    return {
      key: "Incomplete Documents",
      label: "Incomplete Documents",
      pillClass: "status-pending",
      pillIcon: LS_ICONS.clock,
      summaryClass: "sum-blocked",
      summaryText:
        validCount +
        "/3 submitted documents authenticated — Review and verify all remaining documents before approval.",
      allDocsLegit: false,
      isVerified: false,
      missingCount: 0,
      validCount: validCount
    };
  }

  function buildLuckyDocumentPanelHTML(prop, docKey, doc) {
    const meta = LS_DOC_META[docKey] || { shortTitle: doc.label, icon: LS_ICONS.fileText };
    const stateClass = !doc.submitted
      ? "doc-state-missing"
      : doc.legitimate
      ? "doc-state-valid"
      : "doc-state-pending";
    const badgeClass = !doc.submitted
      ? "badge-missing"
      : doc.legitimate
      ? "badge-valid"
      : "badge-pending";
    const badgeLabel = !doc.submitted ? "Missing" : doc.legitimate ? "Valid" : "Pending";
    const shortRef = !doc.submitted ? "Not uploaded" : doc.refNo || "Submitted";

    return (
      '<div class="ls-doc-panel ls-doc-compact ' +
      stateClass +
      '">' +
      '  <div class="ls-doc-top">' +
      '    <label class="ls-doc-check-toggle" title="Toggle authenticity check">' +
      '      <input type="checkbox" data-doc-prop-id="' +
      prop.id +
      '" data-doc-key="' +
      docKey +
      '" ' +
      (doc.submitted && doc.legitimate ? "checked " : "") +
      (!doc.submitted ? "disabled " : "") +
      "/>" +
      '      <span class="ls-doc-short-title">' +
      escapeHtml(meta.shortTitle) +
      "</span>" +
      "    </label>" +
      '    <span class="ls-doc-badge ' +
      badgeClass +
      '">' +
      badgeLabel +
      "</span>" +
      "  </div>" +
      '  <div class="ls-doc-bottom">' +
      '    <span class="ls-doc-ref" title="' +
      escapeHtml(shortRef) +
      '">' +
      escapeHtml(shortRef) +
      "</span>" +
      '    <button type="button" class="ls-doc-inspect-link" data-open-doc-prop-id="' +
      prop.id +
      '" data-open-doc-key="' +
      docKey +
      '" title="Inspect document">View</button>' +
      "  </div>" +
      "</div>"
    );
  }

  function buildLuckyPropertyCardHTML(prop) {
    const docs = ensurePropertyDocuments(prop);
    const state = getPropertyVerificationState(prop);
    const shortStatusLabel =
      state.key === "Pending Review"
        ? "Ready"
        : state.key === "Incomplete Documents"
        ? "Pending"
        : state.label;

    const docPanelsHtml = ["tct", "taxDec", "ownerId"]
      .map(function (key) {
        return buildLuckyDocumentPanelHTML(prop, key, docs[key]);
      })
      .join("");

    const primaryAdminBtn = state.isVerified
      ? '<button type="button" class="btn btn-ls-danger btn-sm" data-open-revoke-prop-id="' +
        prop.id +
        '">' +
        LS_ICONS.shieldOff +
        " <span>Revoke</span></button>"
      : '<button type="button" class="btn btn-ls-verify btn-sm" data-verify-prop-id="' +
        prop.id +
        '" ' +
        (!state.allDocsLegit ? "disabled" : "") +
        ' title="' +
        (state.allDocsLegit ? "Verify this land property" : "Missing required documents") +
        '">' +
        LS_ICONS.shieldCheck +
        " <span>" +
        (state.allDocsLegit ? "Verify" : "Blocked") +
        "</span></button>";

    return (
      '<article class="ls-prop-card anim-fade-up" data-anim="ytFadeInUp">' +
      '  <div class="ls-prop-header">' +
      '    <div class="ls-prop-identity">' +
      '      <img src="' +
      escapeHtml(prop.image) +
      '" alt="' +
      escapeHtml(prop.title) +
      '" class="ls-prop-thumb" onerror="this.src=\'assets/property-hero.png\'" />' +
      "      <div>" +
      '        <h3 class="ls-prop-title">#' +
      prop.id +
      " " +
      escapeHtml(prop.title) +
      "</h3>" +
      '        <div class="ls-prop-meta-row">' +
      '          <span class="ls-meta-chip">' +
      LS_ICONS.mapPin +
      " " +
      escapeHtml(prop.barangay) +
      "</span>" +
      '          <span class="ls-meta-chip">' +
      LS_ICONS.user +
      " " +
      escapeHtml(prop.seller || "Owner") +
      "</span>" +
      '          <span class="ls-meta-chip">' +
      escapeHtml(formatPropertyPrice(prop)) +
      "</span>" +
      "        </div>" +
      "      </div>" +
      "    </div>" +
      '    <div class="ls-prop-badges">' +
      '      <span class="ls-status-pill ' +
      state.pillClass +
      '">' +
      state.pillIcon +
      " " +
      escapeHtml(shortStatusLabel) +
      "</span>" +
      "    </div>" +
      "  </div>" +
      '  <div class="ls-doc-grid">' +
      docPanelsHtml +
      "  </div>" +
      '  <div class="ls-card-footer">' +
      '    <div class="ls-action-group">' +
      '      <button type="button" class="btn btn-ls-navy btn-sm" data-open-doc-prop-id="' +
      prop.id +
      '" data-open-doc-key="tct">' +
      LS_ICONS.eye +
      " <span>Docs</span></button>" +
      '      <a href="property.html?id=' +
      prop.id +
      '" class="btn btn-ls-outline btn-sm">' +
      LS_ICONS.externalLink +
      " <span>Lot</span></a>" +
      "    </div>" +
      '    <div class="ls-action-group">' +
      primaryAdminBtn +
      "    </div>" +
      "  </div>" +
      "</article>"
    );
  }

  /* Dedicated Document Inspection & Review Modal Controller */
  let activeDocViewerPropId = null;
  let activeDocViewerKey = "tct";
  const docViewerModal = document.getElementById("ls-doc-viewer-modal");
  const docViewerCloseBtn = document.getElementById("ls-doc-modal-close");

  function closeDocumentViewerModal() {
    if (docViewerModal) docViewerModal.classList.add("hidden");
    activeDocViewerPropId = null;
  }

  function renderDocumentViewerContent() {
    if (!docViewerModal || !activeDocViewerPropId) return;
    const prop = getProperties().find(function (p) {
      return p.id === Number(activeDocViewerPropId);
    });
    if (!prop) {
      closeDocumentViewerModal();
      return;
    }

    const docs = ensurePropertyDocuments(prop);
    const activeDoc = docs[activeDocViewerKey] || docs.tct;
    const meta = LS_DOC_META[activeDocViewerKey] || LS_DOC_META.tct;

    const titleEl = document.getElementById("ls-doc-modal-title");
    const subEl = document.getElementById("ls-doc-modal-sub");
    const tabsEl = document.getElementById("ls-doc-tabs");
    const previewEl = document.getElementById("ls-doc-preview-pane");
    const statusWrap = document.getElementById("ls-doc-status-badge-wrap");
    const notesEl = document.getElementById("ls-doc-notes-input");
    const actionsEl = document.getElementById("ls-doc-review-actions");

    if (titleEl) titleEl.textContent = "#" + prop.id + " — " + prop.title;
    if (subEl) {
      subEl.textContent =
        "Brgy. " +
        prop.barangay +
        ", Panabo City • Owner: " +
        (prop.seller || "Panabo Landowner") +
        " • " +
        Number(prop.area || 0).toLocaleString() +
        " sqm";
    }

    if (tabsEl) {
      tabsEl.innerHTML = ["tct", "taxDec", "ownerId"]
        .map(function (key) {
          const d = docs[key];
          const m = LS_DOC_META[key];
          const dot = !d.submitted ? "● Missing" : d.legitimate ? "✓ Legit" : "• Pending";
          return (
            '<button type="button" class="ls-doc-tab-btn ' +
            (key === activeDocViewerKey ? "active" : "") +
            '" data-modal-doc-tab="' +
            key +
            '">' +
            m.icon +
            " <span>" +
            escapeHtml(m.shortTitle) +
            " (" +
            dot +
            ")</span></button>"
          );
        })
        .join("");

      tabsEl.querySelectorAll("[data-modal-doc-tab]").forEach(function (tBtn) {
        tBtn.addEventListener("click", function () {
          activeDocViewerKey = tBtn.getAttribute("data-modal-doc-tab");
          renderDocumentViewerContent();
        });
      });
    }

    if (previewEl) {
      if (!activeDoc.submitted) {
        previewEl.innerHTML =
          '<div class="ls-doc-preview-sheet preview-missing">' +
          '  <span class="ls-status-pill status-blocked">' +
          LS_ICONS.shieldAlert +
          " Document File Missing</span>" +
          "  <h3>No Document Submitted</h3>" +
          '  <p class="text-muted">' +
          escapeHtml(activeDoc.refNo || "The property owner has not uploaded this required legal document.") +
          "</p>" +
          '  <p class="text-muted">Lucky Seven cannot approve or mark a missing document legitimate under Panabo verification policy.</p>' +
          "</div>";
      } else {
        previewEl.innerHTML =
          '<div class="ls-doc-preview-sheet">' +
          "  <div>" +
          '    <div class="ls-preview-seal">' +
          LS_ICONS.shieldCheck +
          " " +
          escapeHtml(meta.category) +
          "</div>" +
          "    <h3>" +
          escapeHtml(activeDoc.label) +
          "</h3>" +
          '    <table class="ls-preview-meta-table">' +
          "      <tr><td>Reference No.</td><td>" +
          escapeHtml(activeDoc.refNo) +
          "</td></tr>" +
          "      <tr><td>Registered Owner</td><td>" +
          escapeHtml(prop.seller || "Panabo Landowner") +
          "</td></tr>" +
          "      <tr><td>Location</td><td>Brgy. " +
          escapeHtml(prop.barangay) +
          ", Panabo City</td></tr>" +
          "      <tr><td>Parcel Size</td><td>" +
          Number(prop.area || 0).toLocaleString() +
          " sqm (" +
          escapeHtml(prop.type) +
          ")</td></tr>" +
          "      <tr><td>Submission State</td><td>Submitted by Property Owner</td></tr>" +
          "    </table>" +
          "  </div>" +
          '  <div class="text-muted mt-2">Access restricted to authorized Lucky Seven Land Verifiers.</div>' +
          "</div>";
      }
    }

    if (statusWrap) {
      const badgeClass = !activeDoc.submitted
        ? "status-blocked"
        : activeDoc.legitimate
        ? "status-verified"
        : "status-pending";
      const badgeIcon = !activeDoc.submitted
        ? LS_ICONS.shieldAlert
        : activeDoc.legitimate
        ? LS_ICONS.checkCircle
        : LS_ICONS.clock;
      const badgeText = !activeDoc.submitted
        ? "Missing Document — Cannot Verify"
        : activeDoc.legitimate
        ? "Authenticated & Legitimate"
        : "Submitted — Pending Authenticity Check";

      statusWrap.innerHTML =
        '<span class="ls-status-pill ' +
        badgeClass +
        '">' +
        badgeIcon +
        " " +
        badgeText +
        "</span>";
    }

    if (notesEl) {
      notesEl.value = activeDoc.notes || "";
    }

    if (actionsEl) {
      const toggleLegitBtn = !activeDoc.submitted
        ? '<button type="button" class="btn btn-ls-verify btn-sm" disabled>Cannot Mark Missing Doc Legitimate</button>'
        : activeDoc.legitimate
        ? '<button type="button" class="btn btn-ls-danger btn-sm" id="ls-modal-unmark-legit-btn">Mark Pending / Unverified</button>'
        : '<button type="button" class="btn btn-ls-verify btn-sm" id="ls-modal-mark-legit-btn">Mark Document Legitimate &checkmark;</button>';

      actionsEl.innerHTML =
        toggleLegitBtn +
        '<button type="button" class="btn btn-ls-navy btn-sm" id="ls-modal-save-notes-btn">Save Verification Notes</button>';

      const markBtn = document.getElementById("ls-modal-mark-legit-btn");
      const unmarkBtn = document.getElementById("ls-modal-unmark-legit-btn");
      const saveNotesBtn = document.getElementById("ls-modal-save-notes-btn");

      function updateCurrentDoc(mutator, toastMsg) {
        if (!isVerifier) return;
        const list = getProperties();
        const target = list.find(function (p) {
          return p.id === Number(activeDocViewerPropId);
        });
        if (!target) return;
        target.documents = ensurePropertyDocuments(target);
        const docObj = target.documents[activeDocViewerKey];
        if (!docObj) return;
        mutator(target, docObj);
        if (!hasAllLegitimateDocs(target) && target.verificationStatus === "Verified by Lucky Seven") {
          target.verificationStatus = "Incomplete Documents";
          target.badgeText = "Incomplete Documents";
          target.badgeStyle = "badge-warning";
        }
        saveProperties(list);
        renderLuckyPropertyVerificationDesk();
        renderWorkflows();
        renderDocumentViewerContent();
        showToast(toastMsg);
      }

      if (markBtn) {
        markBtn.addEventListener("click", function () {
          updateCurrentDoc(function (_t, d) {
            if (d.submitted) d.legitimate = true;
            if (notesEl) d.notes = notesEl.value.trim();
          }, "Marked document as Legitimate ✓");
        });
      }
      if (unmarkBtn) {
        unmarkBtn.addEventListener("click", function () {
          updateCurrentDoc(function (_t, d) {
            d.legitimate = false;
            if (notesEl) d.notes = notesEl.value.trim();
          }, "Marked document as Pending Check");
        });
      }
      if (saveNotesBtn) {
        saveNotesBtn.addEventListener("click", function () {
          updateCurrentDoc(function (_t, d) {
            if (notesEl) d.notes = notesEl.value.trim();
          }, "Saved Lucky Seven verification notes");
        });
      }
    }
  }

  function openDocumentViewerModal(propId, initialDocKey) {
    if (!isVerifier || !docViewerModal) return;
    activeDocViewerPropId = Number(propId);
    activeDocViewerKey = initialDocKey || "tct";
    renderDocumentViewerContent();
    docViewerModal.classList.remove("hidden");
  }

  if (docViewerCloseBtn) {
    docViewerCloseBtn.addEventListener("click", closeDocumentViewerModal);
  }
  if (docViewerModal) {
    docViewerModal.addEventListener("click", function (event) {
      if (event.target === docViewerModal) closeDocumentViewerModal();
    });
  }

  /* Revoke Verification Confirmation Modal Controller */
  let pendingRevokePropId = null;
  const revokeModal = document.getElementById("ls-revoke-modal");
  const revokeCloseBtn = document.getElementById("ls-revoke-modal-close");
  const revokeCancelBtn = document.getElementById("ls-revoke-cancel-btn");
  const revokeConfirmBtn = document.getElementById("ls-revoke-confirm-btn");

  function closeRevokeModal() {
    if (revokeModal) revokeModal.classList.add("hidden");
    pendingRevokePropId = null;
    const reasonEl = document.getElementById("ls-revoke-reason");
    if (reasonEl) reasonEl.value = "";
  }

  function openRevokeConfirmModal(propId) {
    if (!isVerifier || !revokeModal) return;
    const prop = getProperties().find(function (p) {
      return p.id === Number(propId);
    });
    if (!prop) return;
    pendingRevokePropId = prop.id;
    const msgEl = document.getElementById("ls-revoke-modal-msg");
    if (msgEl) {
      msgEl.innerHTML =
        "Are you sure you want to revoke Lucky Seven verification for <strong>#" +
        prop.id +
        " — " +
        escapeHtml(prop.title) +
        "</strong>? Its public Marketplace badge will revert to Pending Review.";
    }
    revokeModal.classList.remove("hidden");
  }

  if (revokeCloseBtn) revokeCloseBtn.addEventListener("click", closeRevokeModal);
  if (revokeCancelBtn) revokeCancelBtn.addEventListener("click", closeRevokeModal);
  if (revokeModal) {
    revokeModal.addEventListener("click", function (event) {
      if (event.target === revokeModal) closeRevokeModal();
    });
  }
  if (revokeConfirmBtn) {
    revokeConfirmBtn.addEventListener("click", function () {
      if (!isVerifier || !pendingRevokePropId) return;
      const reasonEl = document.getElementById("ls-revoke-reason");
      const reason = reasonEl ? reasonEl.value.trim() : "";
      const list = getProperties();
      const target = list.find(function (p) {
        return p.id === Number(pendingRevokePropId);
      });
      if (target) {
        target.verificationStatus = "Pending Lucky Seven Review";
        target.badgeText = "Docs Submitted (Pending Review)";
        target.badgeStyle = "badge-warning";
        if (reason) target.revokeNote = reason;
        saveProperties(list);
        showToast("Revoked verification for Property #" + target.id);
      }
      closeRevokeModal();
      renderLuckyPropertyVerificationDesk();
      renderWorkflows();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (docViewerModal && !docViewerModal.classList.contains("hidden")) {
        closeDocumentViewerModal();
      }
      if (revokeModal && !revokeModal.classList.contains("hidden")) {
        closeRevokeModal();
      }
    }
  });

  function renderLuckyPropertyVerificationDesk() {
    const listEl = document.getElementById("lucky-property-verification-list");
    if (!listEl) return;

    // Strict RBAC guard: ONLY Lucky Seven Land Verifier can verify land listings
    if (!isVerifier) {
      listEl.innerHTML = "";
      return;
    }

    const properties = getProperties();

    // Always compute KPI statistics from actual full dataset
    const verifiedCount = properties.filter(function (p) {
      return getPropertyVerificationState(p).key === "Verified";
    }).length;
    const eligibleCount = properties.filter(function (p) {
      return getPropertyVerificationState(p).key === "Pending Review";
    }).length;
    const blockedCount = properties.filter(function (p) {
      const k = getPropertyVerificationState(p).key;
      return k === "Blocked" || k === "Incomplete Documents";
    }).length;

    const totalEl = document.getElementById("lucky-stat-total");
    const verEl = document.getElementById("lucky-stat-verified");
    const eligEl = document.getElementById("lucky-stat-eligible");
    const blkEl = document.getElementById("lucky-stat-blocked");

    if (totalEl) totalEl.textContent = properties.length;
    if (verEl) verEl.textContent = verifiedCount;
    if (eligEl) eligEl.textContent = eligibleCount;
    if (blkEl) blkEl.textContent = blockedCount;

    // Apply Search & Filter Toolbar criteria
    const query = lsSearchInput ? lsSearchInput.value.trim().toLowerCase() : "";
    const brgyFilter = lsBarangayFilter ? lsBarangayFilter.value.trim().toLowerCase() : "";
    const statusFilter = lsStatusFilter ? lsStatusFilter.value : "";
    const completenessFilter = lsCompletenessFilter ? lsCompletenessFilter.value : "";

    const filtered = properties.filter(function (prop) {
      const state = getPropertyVerificationState(prop);
      const docs = ensurePropertyDocuments(prop);
      const searchable = [
        prop.title,
        prop.barangay,
        prop.seller,
        prop.type,
        docs.tct.refNo,
        docs.taxDec.refNo,
        docs.ownerId.refNo
      ]
        .join(" ")
        .toLowerCase();

      const matchQuery = !query || searchable.indexOf(query) >= 0;
      const matchBrgy = !brgyFilter || String(prop.barangay || "").toLowerCase() === brgyFilter;
      const matchStatus = !statusFilter || state.key === statusFilter;
      const matchComplete =
        !completenessFilter ||
        (completenessFilter === "complete" && state.allDocsLegit) ||
        (completenessFilter === "incomplete" && !state.allDocsLegit);

      return matchQuery && matchBrgy && matchStatus && matchComplete;
    });

    if (lsResultsSummary) {
      lsResultsSummary.textContent = filtered.length + " / " + properties.length;
    }

    if (filtered.length === 0) {
      listEl.innerHTML =
        '<div class="ls-empty-state">' +
        "  <h3>No matching properties found</h3>" +
        '  <p class="text-muted mb-2">Adjust your search keyword, barangay, or document status filter to view more land listings.</p>' +
        '  <button type="button" class="btn btn-ls-navy btn-sm" id="ls-empty-clear-btn">Clear All Filters</button>' +
        "</div>";
      const clearBtn = document.getElementById("ls-empty-clear-btn");
      if (clearBtn) {
        clearBtn.addEventListener("click", resetLuckyFilters);
      }
      return;
    }

    listEl.innerHTML = filtered.map(buildLuckyPropertyCardHTML).join("");

    // Bind inline document authenticity checkboxes (strictly blocked for missing files)
    listEl.querySelectorAll("[data-doc-prop-id]").forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        if (!isVerifier) return;
        const propId = Number(checkbox.getAttribute("data-doc-prop-id"));
        const docKey = checkbox.getAttribute("data-doc-key");
        const list = getProperties();
        const target = list.find(function (p) {
          return p.id === propId;
        });
        if (!target) return;
        target.documents = ensurePropertyDocuments(target);
        if (!target.documents[docKey] || !target.documents[docKey].submitted) {
          checkbox.checked = false;
          showToast("Cannot check a missing document as legitimate");
          return;
        }
        target.documents[docKey].legitimate = checkbox.checked;
        if (!hasAllLegitimateDocs(target) && target.verificationStatus === "Verified by Lucky Seven") {
          target.verificationStatus = "Incomplete Documents";
          target.badgeText = "Incomplete Documents";
          target.badgeStyle = "badge-warning";
        }
        saveProperties(list);
        renderLuckyPropertyVerificationDesk();
        renderWorkflows();
      });
    });

    // Bind View Documents / Inspect Document buttons
    listEl.querySelectorAll("[data-open-doc-prop-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openDocumentViewerModal(
          btn.getAttribute("data-open-doc-prop-id"),
          btn.getAttribute("data-open-doc-key") || "tct"
        );
      });
    });

    // Bind Verify Land Property (strictly enforces hasAllLegitimateDocs)
    listEl.querySelectorAll("[data-verify-prop-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!isVerifier) return;
        const propId = Number(btn.getAttribute("data-verify-prop-id"));
        const list = getProperties();
        const target = list.find(function (p) {
          return p.id === propId;
        });
        if (!target) return;

        if (!hasAllLegitimateDocs(target)) {
          showToast(
            "Verification Blocked: All 3 legitimate documents are required before Lucky Seven can verify."
          );
          return;
        }

        target.verificationStatus = "Verified by Lucky Seven";
        target.badgeText = "Lucky Seven Verified";
        target.badgeStyle = "badge-green";
        saveProperties(list);
        renderLuckyPropertyVerificationDesk();
        renderWorkflows();
        showToast("Land Property #" + propId + " verified by Lucky Seven ✓");
      });
    });

    // Bind Revoke Verification (opens confirmation dialog to prevent accidental actions)
    listEl.querySelectorAll("[data-open-revoke-prop-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openRevokeConfirmModal(btn.getAttribute("data-open-revoke-prop-id"));
      });
    });
  }

  function resetLuckyFilters() {
    if (lsSearchInput) lsSearchInput.value = "";
    if (lsBarangayFilter) lsBarangayFilter.value = "";
    if (lsStatusFilter) lsStatusFilter.value = "";
    if (lsCompletenessFilter) lsCompletenessFilter.value = "";
    renderLuckyPropertyVerificationDesk();
  }

  [lsSearchInput, lsBarangayFilter, lsStatusFilter, lsCompletenessFilter].forEach(function (ctrl) {
    if (!ctrl) return;
    ctrl.addEventListener("input", renderLuckyPropertyVerificationDesk);
    ctrl.addEventListener("change", renderLuckyPropertyVerificationDesk);
  });

  if (lsResetFilterBtn) {
    lsResetFilterBtn.addEventListener("click", function () {
      resetLuckyFilters();
      showToast("Verification filters reset");
    });
  }

  // Clickable KPI Cards act as quick filters
  document.querySelectorAll("[data-ls-kpi-filter]").forEach(function (kpiBtn) {
    kpiBtn.addEventListener("click", function () {
      if (!isVerifier) return;
      const filterType = kpiBtn.getAttribute("data-ls-kpi-filter");
      resetLuckyFilters();
      if (filterType !== "all" && lsStatusFilter) {
        lsStatusFilter.value = filterType;
      }
      renderLuckyPropertyVerificationDesk();
    });
  });

  function renderWorkflows() {
    const transactions = getTransactions();
    const buyerList = document.getElementById("buyer-tracker-list");
    const agencyList = document.getElementById("agency-queue-list");
    const allProps = getProperties();

    if (buyerList) {
      if (transactions.length === 0) {
        buyerList.innerHTML =
          '<div class="card text-center">' +
          "  <h3>No active reservations</h3>" +
          '  <p class="mb-2">Open any Panabo City property listing in the Marketplace to reserve a parcel.</p>' +
          '  <a href="marketplace.html" class="btn btn-primary btn-sm">Explore Marketplace &rarr;</a>' +
          "</div>";
      } else {
        buyerList.innerHTML = transactions
          .map(function (tx) {
            const percent = Math.round(((tx.stageIndex + 1) / MILESTONE_STEPS.length) * 100);
            const stepsHtml = MILESTONE_STEPS.map(function (label, idx) {
              const done = idx <= tx.stageIndex;
              return (
                '<li class="milestone-item ' + (done ? "completed" : "") + '">' +
                "<span>" + (done ? "✓" : idx + 1) + "</span> " +
                escapeHtml(label) +
                "</li>"
              );
            }).join("");

            const docsHtml = (tx.documents || [])
              .map(function (doc) {
                return "<li><strong>" + escapeHtml(doc.name) + ":</strong> " + escapeHtml(doc.status) + "</li>";
              })
              .join("");

            const txPriceDisplay = tx.priceLabel || formatPeso(tx.salePrice);

            return (
              '<div class="card mb-2 anim-fade-up" data-anim="ytFadeInUp">' +
              '  <div class="tx-card-header">' +
              '    <div><h3>' + escapeHtml(tx.propertyTitle) + '</h3><p class="text-no-margin">' + escapeHtml(tx.location) + " &bull; Seller: " + escapeHtml(tx.sellerName) + "</p></div>" +
              '    <span class="badge badge-green">' + escapeHtml(tx.id) + " &bull; " + escapeHtml(txPriceDisplay) + "</span>" +
              "  </div>" +
              '  <div class="progress-header"><span>Progress: ' + escapeHtml(MILESTONE_STEPS[tx.stageIndex]) + "</span><span>" + percent + "%</span></div>" +
              '  <div class="progress-track"><div class="progress-fill" data-progress-width="' + percent + '"></div></div>' +
              '  <ul class="milestone-list">' + stepsHtml + "</ul>" +
              '  <div class="mt-2 doc-vault-box"><strong>Document Vault (MVP Preview):</strong><ul class="doc-vault-list">' + docsHtml + "</ul></div>" +
              "</div>"
            );
          })
          .join("");

        buyerList.querySelectorAll("[data-progress-width]").forEach(function (bar) {
          bar.style.width = bar.getAttribute("data-progress-width") + "%";
        });
      }
    }

    if (!agencyList) return;

    // Strict RBAC guard: ONLY Lucky Seven Land Verifier can operate the Verification Queue (NOT Admin, NOT User)
    if (!isVerifier) {
      agencyList.innerHTML = "";
      return;
    }

    if (transactions.length === 0) {
      agencyList.innerHTML =
        '<div class="card text-center">' +
        "  <h3>Lucky Seven reservation queue is empty</h3>" +
        "  <p>New buyer reservations will appear here for document milestone verification.</p>" +
        "</div>";
      return;
    }

    agencyList.innerHTML = transactions
      .map(function (tx, idx) {
        const linkedProp = allProps.find(function (p) {
          return p.id === Number(tx.propertyId);
        });
        const docsValid = linkedProp ? hasAllLegitimateDocs(linkedProp) : false;
        const nextStageIsVerification = tx.stageIndex >= 2;
        const blockedByDocs = nextStageIsVerification && !docsValid;
        const isDone = tx.stageIndex >= MILESTONE_STEPS.length - 1;
        const percent = Math.round(((tx.stageIndex + 1) / MILESTONE_STEPS.length) * 100);
        const txPriceDisplay = tx.priceLabel || formatPeso(tx.salePrice);

        return (
          '<article class="ls-prop-card anim-fade-up" data-anim="ytFadeInUp">' +
          '  <div class="ls-prop-header">' +
          "    <div>" +
          '      <h3 class="ls-prop-title">' + escapeHtml(tx.id) + " &bull; " + escapeHtml(tx.propertyTitle) + "</h3>" +
          '      <div class="ls-prop-meta-row">' +
          '        <span class="ls-meta-chip">' + LS_ICONS.mapPin + " " + escapeHtml(tx.location) + "</span>" +
          '        <span class="ls-meta-chip">' + LS_ICONS.user + " " + escapeHtml(tx.buyerName) + "</span>" +
          '        <span class="ls-meta-chip">' + escapeHtml(txPriceDisplay) + "</span>" +
          "      </div>" +
          "    </div>" +
          '    <span class="ls-status-pill ' + (isDone ? "status-verified" : "status-pending") + '">' +
          escapeHtml(MILESTONE_STEPS[tx.stageIndex]) +
          " (" + (tx.stageIndex + 1) + "/" + MILESTONE_STEPS.length + ")" +
          "    </span>" +
          "  </div>" +
          '  <div class="progress-track mt-2 mb-2"><div class="progress-fill" data-agency-progress-width="' + percent + '"></div></div>' +
          '  <div class="ls-card-footer">' +
          '    <span class="ls-results-count">' + percent + "% complete</span>" +
          '    <div class="ls-action-group">' +
          '      <button type="button" class="btn btn-ls-navy btn-sm" data-advance-idx="' + idx + '" ' + (isDone || blockedByDocs ? "disabled" : "") + ">" +
          (isDone ? "Done ✓" : blockedByDocs ? "Blocked" : "Advance &rarr;") +
          "      </button>" +
          '      <button type="button" class="btn btn-ls-outline btn-sm" data-reset-tx-idx="' + idx + '">Reset</button>' +
          "    </div>" +
          "  </div>" +
          "</article>"
        );
      })
      .join("");

    agencyList.querySelectorAll("[data-agency-progress-width]").forEach(function (bar) {
      bar.style.width = bar.getAttribute("data-agency-progress-width") + "%";
    });

    agencyList.querySelectorAll("[data-advance-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!isVerifier) return;
        const index = Number(btn.getAttribute("data-advance-idx"));
        const list = getTransactions();
        const tx = list[index];
        if (!tx || tx.stageIndex >= MILESTONE_STEPS.length - 1) return;

        const linkedProp = getProperties().find(function (p) {
          return p.id === Number(tx.propertyId);
        });
        if (tx.stageIndex >= 2 && (!linkedProp || !hasAllLegitimateDocs(linkedProp))) {
          showToast("Blocked: All 3 legitimate land documents are required to verify this transaction.");
          return;
        }

        tx.stageIndex += 1;
        saveTransactions(list);
        renderWorkflows();
        showToast("Milestone updated to: " + MILESTONE_STEPS[tx.stageIndex]);
      });
    });

    agencyList.querySelectorAll("[data-reset-tx-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!isVerifier) return;
        const index = Number(btn.getAttribute("data-reset-tx-idx"));
        const list = getTransactions();
        if (list[index]) {
          list[index].stageIndex = 0;
          saveTransactions(list);
          renderWorkflows();
          showToast("Reset transaction " + list[index].id + " to Stage 1");
        }
      });
    });
  }

  if (sellerForm) {
    sellerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (lockFormSubmission(sellerForm)) return;

      const feedback = document.getElementById("seller-feedback");
      const editingId = editIdInput && editIdInput.value ? Number(editIdInput.value) : 0;

      // Strict RBAC guard: Admin can ONLY edit existing properties, never publish new seller listings
      if (isAdmin && editingId <= 0) {
        feedback.className = "alert alert-error";
        feedback.textContent =
          "Admin Restriction: Click Edit on an existing property listing above to modify it.";
        feedback.classList.remove("hidden");
        return;
      }

      // Strict RBAC guard: Lucky Seven cannot submit or edit properties
      if (isVerifier) {
        feedback.className = "alert alert-error";
        feedback.textContent = "Lucky Seven Land Verifier can only verify land documents.";
        feedback.classList.remove("hidden");
        return;
      }

      const title = document.getElementById("seller-title").value.trim();
      const type = document.getElementById("seller-type").value;
      const barangay = document.getElementById("seller-barangay").value;
      const price = Number(document.getElementById("seller-price").value);
      const area = Number(document.getElementById("seller-area").value);
      const roadAccess = document.getElementById("seller-road").value.trim();
      const description = document.getElementById("seller-desc").value.trim();

      if (!title || isNaN(price) || price < 0 || area <= 0) {
        feedback.className = "alert alert-error";
        feedback.textContent = "Please provide a property title, valid price (0 or higher), and positive lot area.";
        feedback.classList.remove("hidden");
        return;
      }

      const list = getProperties();

      if (isAdmin && editingId > 0) {
        const targetIndex = list.findIndex(function (p) {
          return p.id === editingId;
        });
        if (targetIndex >= 0) {
          list[targetIndex].title = title;
          list[targetIndex].type = type;
          list[targetIndex].barangay = barangay;
          list[targetIndex].price = price;
          list[targetIndex].priceLabel = price > 0 ? formatPeso(price) : "Negotiable (For Sale)";
          list[targetIndex].area = area;
          list[targetIndex].roadAccess = roadAccess;
          list[targetIndex].description = description || list[targetIndex].description;
          saveProperties(list);
          exitEditMode();
          renderManagedProperties();
          renderAdminAccountsPortal();
          feedback.className = "alert alert-success";
          feedback.innerHTML =
            "<strong>Updated Property Listing #" +
            editingId +
            '!</strong> <a href="property.html?id=' +
            editingId +
            '" class="inline-action-link">View Updated Property &rarr;</a>';
          feedback.classList.remove("hidden");
          showToast("Updated property listing #" + editingId);
          return;
        }
      }

      // Standard User submitting their own account's new Panabo City land listing
      const tctInput = document.getElementById("seller-doc-tct");
      const taxInput = document.getElementById("seller-doc-tax");
      const idInput = document.getElementById("seller-doc-id");
      const tctVal = tctInput ? tctInput.value.trim() : "";
      const taxVal = taxInput ? taxInput.value.trim() : "";
      const idVal = idInput ? idInput.value.trim() : "";
      const hasAllSubmitted = Boolean(tctVal && taxVal && idVal);

      const nextId = list.reduce(function (max, item) { return Math.max(max, item.id); }, 0) + 1;

      list.unshift({
        id: nextId,
        title: title,
        type: type,
        barangay: barangay,
        city: "Panabo City",
        province: "Davao del Norte",
        price: price,
        priceLabel: price > 0 ? formatPeso(price) : "Negotiable (For Sale)",
        priceNote: "Newly submitted owner listing",
        area: area,
        roadAccess: roadAccess,
        badgeText: hasAllSubmitted ? "Docs Submitted (Pending Review)" : "Incomplete Documents",
        badgeStyle: "badge-warning",
        verificationStatus: hasAllSubmitted ? "Pending Lucky Seven Review" : "Incomplete Documents",
        promoted: false,
        seller: currentName,
        ownerEmail: currentEmail,
        latitude: "7.3100",
        longitude: "125.6820",
        image: "assets/property-hero.png",
        documents: {
          tct: {
            label: "Clean Transfer Certificate of Title (TCT / OCT)",
            refNo: tctVal || "Missing — TCT Copy Not Uploaded",
            submitted: Boolean(tctVal),
            legitimate: Boolean(tctVal)
          },
          taxDec: {
            label: "Updated Real Property Tax Declaration & Clearance",
            refNo: taxVal || "Missing — Tax Declaration Not Uploaded",
            submitted: Boolean(taxVal),
            legitimate: Boolean(taxVal)
          },
          ownerId: {
            label: "Verified Owner Government ID & Deed / Authority",
            refNo: idVal || "Missing — Owner ID Not Uploaded",
            submitted: Boolean(idVal),
            legitimate: Boolean(idVal)
          }
        },
        cardTags: [type + " Lot", hasAllSubmitted ? "Docs Submitted" : "Needs Legal Docs", "Panabo City"],
        highlights: [
          Number(area).toLocaleString() + " SQM Lot Area",
          roadAccess,
          hasAllSubmitted
            ? "Submitted with legal documents for Lucky Seven verification"
            : "Pending legitimate documents before Lucky Seven can verify"
        ],
        description: description || "Submitted through the YuTara account listing form."
      });

      saveProperties(list);
      exitEditMode();
      renderUserWorkspace();

      feedback.className = "alert alert-success";
      feedback.innerHTML =
        "<strong>Listing Added to Your Account &amp; Marketplace!</strong> " +
        (hasAllSubmitted
          ? "Sent to Lucky Seven Land Verifier with your legal document references. "
          : "Note: Missing legal document references — Lucky Seven cannot verify until complete. ") +
        '<a href="marketplace.html" class="inline-action-link">View in Marketplace &rarr;</a>';
      feedback.classList.remove("hidden");
      showToast("Listing added to your account & Marketplace");
    });
  }

  function renderUserWorkspace() {
    const savedEl = document.getElementById("user-stat-saved");
    const onSaleEl = document.getElementById("user-stat-onsale");
    const roleEl = document.getElementById("user-stat-role");
    const landGrid = document.getElementById("user-land-grid");

    const props = getProperties();
    // Strictly show ONLY listings owned by the signed-in user's account
    const myProps = props.filter(function (p) {
      const matchEmail =
        p.ownerEmail && p.ownerEmail.toLowerCase() === currentEmail.toLowerCase();
      const matchName =
        p.seller && p.seller.toLowerCase() === currentName.toLowerCase();
      return matchEmail || matchName;
    });

    if (savedEl) savedEl.textContent = getSavedIds().length;
    if (onSaleEl) onSaleEl.textContent = myProps.length;
    if (roleEl) roleEl.textContent = currentRole.toUpperCase();

    if (landGrid) {
      if (myProps.length === 0) {
        landGrid.innerHTML =
          '<div class="card text-center">' +
          "  <h3>No account listings yet</h3>" +
          '  <p class="mb-2">You have not published any land listings under ' +
          escapeHtml(currentEmail) +
          ' yet. Browse the Panabo City Marketplace or submit your own parcel.</p>' +
          '  <a href="marketplace.html" class="btn btn-primary btn-sm">Browse Marketplace &rarr;</a>' +
          "</div>";
      } else {
        landGrid.innerHTML = myProps.map(createPropertyCardHTML).join("");
        bindSaveButtons(landGrid, function () {
          if (savedEl) savedEl.textContent = getSavedIds().length;
        });
      }
    }
  }

  function renderAdminAccountsPortal() {
    const tbody = document.getElementById("admin-accounts-tbody");
    if (!tbody || !isAdmin) return;

    const props = getProperties();
    const allAccounts = getAllAccounts();

    const totalEl = document.getElementById("admin-stat-total");
    const openEl = document.getElementById("admin-stat-open");
    const accEl = document.getElementById("admin-stat-accounts");
    const pendEl = document.getElementById("admin-stat-pending");

    if (totalEl) totalEl.textContent = props.length;
    if (openEl) {
      openEl.textContent = props.filter(function (p) {
        return p.verificationStatus === "Verified by Lucky Seven";
      }).length;
    }
    if (accEl) accEl.textContent = allAccounts.length;
    if (pendEl) {
      pendEl.textContent = allAccounts.filter(function (a) {
        return a.status === "SUSPENDED";
      }).length;
    }

    tbody.innerHTML = allAccounts
      .map(function (acc, idx) {
        const isCurrentAdminSelf = acc.email.toLowerCase() === currentEmail.toLowerCase();
        const isSuspended = acc.status === "SUSPENDED";
        const statusBadgeClass = isSuspended ? "badge-brown-soft" : "badge-green";
        const roleSelectHtml =
          '<select class="account-inline-select" data-mod-role-idx="' +
          idx +
          '" ' +
          (isCurrentAdminSelf ? "disabled" : "") +
          ">" +
          '  <option value="User"' +
          (acc.role === "User" ? " selected" : "") +
          ">User</option>" +
          '  <option value="Admin"' +
          (acc.role === "Admin" ? " selected" : "") +
          ">Admin</option>" +
          '  <option value="Lucky Seven Land Verifier"' +
          (acc.role === "Lucky Seven Land Verifier" ? " selected" : "") +
          ">Lucky Seven Land Verifier</option>" +
          "</select>";

        const toggleStatusBtn = isCurrentAdminSelf
          ? '<span class="text-muted">Active Admin</span>'
          : '<button type="button" class="btn btn-outline btn-sm" data-toggle-status-idx="' +
            idx +
            '">' +
            (isSuspended ? "Activate" : "Suspend") +
            "</button>";

        const removeBtn = !acc.builtIn
          ? '<button type="button" class="btn btn-danger-outline btn-sm" data-remove-acc-idx="' +
            idx +
            '">Remove</button>'
          : "";

        return (
          "<tr>" +
          "  <td><strong>" +
          escapeHtml(acc.name) +
          "</strong></td>" +
          "  <td>" +
          escapeHtml(acc.email) +
          "</td>" +
          "  <td>" +
          roleSelectHtml +
          "</td>" +
          '  <td><span class="badge ' +
          statusBadgeClass +
          '">' +
          escapeHtml(acc.status || "APPROVED") +
          "</span></td>" +
          '  <td><div class="flex-wrap-gap">' +
          toggleStatusBtn +
          removeBtn +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");

    // Modify Account Role
    tbody.querySelectorAll("[data-mod-role-idx]").forEach(function (selectEl) {
      selectEl.addEventListener("change", function () {
        if (!isAdmin) return;
        const idx = Number(selectEl.getAttribute("data-mod-role-idx"));
        const list = getAllAccounts();
        if (!list[idx]) return;
        list[idx].role = selectEl.value;
        saveAllAccounts(list);
        renderAdminAccountsPortal();
        showToast("Updated role for " + list[idx].name + " to " + list[idx].role);
      });
    });

    // Toggle Account Status (APPROVED <-> SUSPENDED)
    tbody.querySelectorAll("[data-toggle-status-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!isAdmin) return;
        const idx = Number(btn.getAttribute("data-toggle-status-idx"));
        const list = getAllAccounts();
        if (!list[idx]) return;
        list[idx].status = list[idx].status === "SUSPENDED" ? "APPROVED" : "SUSPENDED";
        saveAllAccounts(list);
        renderAdminAccountsPortal();
        showToast("Account " + list[idx].email + " set to " + list[idx].status);
      });
    });

    // Remove Custom Account
    tbody.querySelectorAll("[data-remove-acc-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!isAdmin) return;
        const idx = Number(btn.getAttribute("data-remove-acc-idx"));
        const list = getAllAccounts();
        if (!list[idx] || list[idx].builtIn) return;
        const removed = list.splice(idx, 1);
        saveAllAccounts(list);
        renderAdminAccountsPortal();
        showToast("Removed account " + (removed[0] ? removed[0].email : ""));
      });
    });

    const listingsTbody = document.getElementById("admin-overview-listings-tbody");
    if (listingsTbody) {
      listingsTbody.innerHTML = props
        .map(function (prop) {
          const isVerified = prop.verificationStatus === "Verified by Lucky Seven";
          const statusClass = isVerified ? "badge-green" : "badge-brown-soft";
          const statusLabel = prop.verificationStatus || "Pending Lucky Seven Review";
          return (
            "<tr>" +
            '  <td><div class="table-prop-cell">' +
            '    <img src="' +
            escapeHtml(prop.image) +
            '" alt="' +
            escapeHtml(prop.title) +
            '" class="table-prop-thumb" onerror="this.src=\'assets/property-hero.png\'" />' +
            "    <div><strong>#" +
            prop.id +
            " &mdash; " +
            escapeHtml(prop.title) +
            '</strong><div class="text-muted">Owner: ' +
            escapeHtml(prop.seller || "Verified Landowner") +
            "</div></div>" +
            "  </div></td>" +
            "  <td><strong>Brgy. " +
            escapeHtml(prop.barangay) +
            ", Panabo City</strong><div class='mt-1'><span class='badge badge-brown-soft'>" +
            escapeHtml(prop.type) +
            "</span></div></td>" +
            "  <td><strong>" +
            escapeHtml(formatPropertyPrice(prop)) +
            "</strong><div class='text-muted'>" +
            Number(prop.area).toLocaleString() +
            " sqm &bull; " +
            escapeHtml(prop.roadAccess || "Direct Road Access") +
            "</div></td>" +
            '  <td><span class="badge ' +
            statusClass +
            '">' +
            escapeHtml(statusLabel) +
            "</span></td>" +
            '  <td><div class="flex-wrap-gap">' +
            '    <a href="property.html?id=' +
            prop.id +
            '" class="btn btn-outline btn-sm">View</a>' +
            '    <button type="button" class="btn btn-outline btn-sm" data-admin-edit-id="' +
            prop.id +
            '">Edit</button>' +
            '    <button type="button" class="btn btn-danger-outline btn-sm" data-admin-delete-id="' +
            prop.id +
            '">Delete</button>' +
            "  </div></td>" +
            "</tr>"
          );
        })
        .join("");

      listingsTbody.querySelectorAll("[data-admin-edit-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          loadPropertyIntoEditForm(btn.getAttribute("data-admin-edit-id"));
        });
      });

      listingsTbody.querySelectorAll("[data-admin-delete-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          deletePropertyListingById(btn.getAttribute("data-admin-delete-id"));
        });
      });
    }
  }

  const adminResetDataBtn = document.getElementById("admin-reset-data-btn");
  if (adminResetDataBtn) {
    adminResetDataBtn.addEventListener("click", function () {
      if (!isAdmin) return;
      resetDemoData();
    });
  }

  const provForm = document.getElementById("admin-provision-form");
  if (provForm) {
    provForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!isAdmin || lockFormSubmission(provForm)) return;

      const role = document.getElementById("prov-role").value;
      const name = document.getElementById("prov-name").value.trim();
      const email = document.getElementById("prov-email").value.trim();
      const password = document.getElementById("prov-pass").value.trim();

      if (!name || !email || password.length < 4) {
        showToast("Enter name, email, and at least 4-char password");
        return;
      }

      const list = getAllAccounts();
      list.push({
        id: "ACC-" + Date.now(),
        name: name,
        email: email,
        password: password,
        role: role,
        status: "APPROVED",
        builtIn: false
      });
      saveAllAccounts(list);
      provForm.reset();
      renderAdminAccountsPortal();
      showToast("Created " + role + " account for " + name);
    });
  }

  renderUserWorkspace();
  renderAdminAccountsPortal();
  renderLuckyPropertyVerificationDesk();
  renderWorkflows();
  renderManagedProperties();
}

/* --------------------------------------------------------------------------
   12. BOOTSTRAP ON PAGE LOAD
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  initAnimationDebugFromUrl();
  initNavbar();
  initFaqAccordion();
  initPasswordToggles();
  initHomePage();
  initMarketplacePage();
  initPropertyDetailPage();
  initReservationPage();
  initLoginPage();
  initRegisterPage();
  initContactPage();
  initTrackerPage();
});
