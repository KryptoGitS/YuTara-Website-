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
  properties: "yutara_v6_properties",
  saved: "yutara_v6_saved",
  transactions: "yutara_v6_transactions",
  inquiries: "yutara_v6_inquiries",
  accounts: "yutara_v6_accounts",
  messages: "yutara_v6_messages",
  session: "yutara_v6_session"
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

function getMessages() {
  const raw = localStorage.getItem(STORAGE_KEYS.messages);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    reportDiagnostic("DataStore", "Messages", "getMessages", err);
    return [];
  }
}

function saveMessages(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(list));
  } catch (err) {
    reportDiagnostic("DataStore", "Messages", "saveMessages", err);
  }
}

function addMessage(propertyId, transactionId, senderName, senderEmail, message) {
  const messages = getMessages();
  const newMsg = {
    id: "MSG-" + Math.floor(1000 + Math.random() * 9000),
    propertyId: Number(propertyId),
    transactionId: transactionId || null,
    senderName: senderName,
    senderEmail: senderEmail,
    message: message,
    createdAt: new Date().toISOString().slice(0, 16),
    read: false
  };
  messages.push(newMsg);
  saveMessages(messages);
  return newMsg;
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
  localStorage.removeItem(STORAGE_KEYS.messages);
  localStorage.removeItem(STORAGE_KEYS.accounts);
  localStorage.removeItem(STORAGE_KEYS.session);
  localStorage.removeItem("yutara_v5_session");
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
    const pathLower = (window.location.pathname || "").toLowerCase();
    const pageFile = pathLower.split("/").pop() || "index.html";

    // Admin goes STRAIGHT to the Admin Dashboard (no separate Home or Marketplace)
    if (isAdminSession) {
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
        : "My Account Listings";
      navActions.innerHTML =
        '<a href="' +
        (isAdminSession
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

    // All lands appear on the Marketplace immediately upon submission.
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

  /* ===== Buyer-Seller Message Thread ===== */
  const msgThread = document.getElementById("msg-thread");
  const msgForm = document.getElementById("msg-form");
  const msgText = document.getElementById("msg-text");
  const msgStatus = document.getElementById("msg-status");
  const msgSendBtn = document.getElementById("msg-send-btn");
  const msgLoginPrompt = document.getElementById("msg-login-prompt");
  const msgWithParty = document.getElementById("msg-with-party");
  const session = getSession();
  const currentUserEmail = session && session.email ? session.email.toLowerCase() : "";
  const currentUserName = session && session.name ? session.name : "";

  // Determine who the other party is (seller of this listing)
  const sellerName = prop.seller || "Property Owner";
  const sellerEmail = prop.ownerEmail || "";
  if (msgWithParty) msgWithParty.textContent = sellerName;

  function renderMessages() {
    if (!msgThread) return;
    const allMessages = getMessages();
    const propMsgs = allMessages.filter(function (m) {
      return m.propertyId === prop.id;
    });

    // Sort oldest first
    propMsgs.sort(function (a, b) {
      return a.createdAt.localeCompare(b.createdAt);
    });

    if (propMsgs.length === 0) {
      msgThread.innerHTML =
        '<div class="msg-empty">No messages yet. Start the conversation below.</div>';
    } else {
      msgThread.innerHTML = propMsgs.map(function (m) {
        const isMine = m.senderEmail && m.senderEmail.toLowerCase() === currentUserEmail;
        const bubbleClass = isMine ? "msg-mine" : "msg-theirs";
        const senderLabel = isMine ? "You" : m.senderName || "Unknown";
        const formattedTime = String(m.createdAt || "").replace("T", " ");
        return (
          '<div class="msg-bubble ' + bubbleClass + '">' +
          '  <div class="msg-header"><strong>' + escapeHtml(senderLabel) + '</strong><span class="msg-time">' + escapeHtml(formattedTime) + "</span></div>" +
          '  <div class="msg-body">' + escapeHtml(m.message) + "</div>" +
          "</div>"
        );
      }).join("");
    }
    msgThread.scrollTop = msgThread.scrollHeight;
  }

  if (msgForm && msgText && msgSendBtn) {
    if (session) {
      if (msgLoginPrompt) msgLoginPrompt.classList.add("hidden");
      msgForm.classList.remove("hidden");

      msgForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (lockFormSubmission(msgForm)) return;

        const text = msgText.value.trim();
        if (!text) return;

        // Find if there's an existing transaction for this buyer-seller-property pair
        const transactions = getTransactions();
        const relatedTx = transactions.find(function (t) {
          return t.propertyId === prop.id &&
                 ((t.buyerEmail && t.buyerEmail.toLowerCase() === currentUserEmail) ||
                  (t.sellerEmail && t.sellerEmail.toLowerCase() === currentUserEmail));
        });

        const newMsg = addMessage(
          prop.id,
          relatedTx ? relatedTx.id : null,
          currentUserName,
          currentUserEmail,
          text
        );

        msgText.value = "";
        renderMessages();
        showToast("Message sent");

        // Scroll to bottom
        setTimeout(function () {
          msgThread.scrollTop = msgThread.scrollHeight;
        }, 100);
      });
    } else {
      if (msgLoginPrompt) msgLoginPrompt.classList.remove("hidden");
      if (msgForm) msgForm.classList.add("hidden");
    }
  }

  renderMessages();
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
        setSession({ name: "Juan Dela Cruz", email: "user@yutara.ph", role: "User" });
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

    const session = getSession();
    const buyerEmail = session && session.email ? session.email : "";
    const sellerEmail = prop.ownerEmail || "";

    const transactions = getTransactions();
    const newTx = {
      id: "TX-" + Math.floor(1000 + Math.random() * 9000),
      propertyId: prop.id,
      propertyTitle: prop.title,
      location: "Brgy. " + prop.barangay + ", " + prop.city,
      buyerName: buyerName,
      buyerEmail: buyerEmail,
      sellerName: prop.seller,
      sellerEmail: sellerEmail,
      salePrice: prop.price,
      priceLabel: formatPropertyPrice(prop),
      reservationFee: 25000,
      stageIndex: 0,
      approvalStatus: "pending",
      status: "pending_approval",
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
      "<strong>Reservation Request Sent (" +
      escapeHtml(newTx.id) +
      ")!</strong> No real money was collected. Your request is now with <strong>" +
      escapeHtml(prop.seller) +
      "</strong> for approval. You will be notified once the seller accepts.<br />" +
      '<a href="tracker.html" class="inline-action-link inline-block-link">View My Reservations &rarr;</a>';
    feedback.classList.remove("hidden");
    form.reset();
    showToast("Reservation request " + newTx.id + " sent to seller");
  });
}

/* --------------------------------------------------------------------------
   8. LOGIN PAGE (login.html) — Admin & User Buyer / Seller
   -------------------------------------------------------------------------- */
function getDefaultTabForRole(role) {
  if (role === "Admin") return "panel-accounts";
  return "panel-buyer";
}

function getPostLoginDestination(role) {
  if (role === "Admin") return "tracker.html?tab=panel-accounts";
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
   11. WORKSPACE HUB (tracker.html — 2-Role RBAC: Admin & User Buyer/Seller)
   -------------------------------------------------------------------------- */
function initTrackerPage() {
  const tabContainer = document.getElementById("workflow-tabs");
  if (!tabContainer) return;

  const session = getSession();
  const currentRole = session && session.role ? session.role : "User";
  const currentName = session && session.name ? session.name : "Juan Dela Cruz";
  const currentEmail = session && session.email ? session.email : "user@yutara.ph";
  const isAdmin = currentRole === "Admin";
  const isStandardUser = !isAdmin;

  const tabBtns = tabContainer.querySelectorAll("[data-tab]");
  const rbacAlert = document.getElementById("rbac-alert");

  function isTabAllowedForRole(targetId) {
    if (isAdmin) {
      // Admin can ONLY modify accounts (panel-accounts) and edit/delete properties (panel-seller)
      return targetId === "panel-accounts" || targetId === "panel-seller";
    }
    // Standard User can view Marketplace, own account listings, and Add Land for Sale
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

    const heading = document.getElementById("dashboard-heading");
    const adminCrudCard = document.getElementById("admin-crud-card");
    const adminEditOnlyNotice = document.getElementById("admin-edit-only-notice");
    const tabBtnSeller = document.getElementById("tab-btn-seller");
    const tabBtnSellerLabel = document.getElementById("tab-btn-seller-label");

    if (avatarEl) avatarEl.textContent = getInitials(currentName);
    if (displayEl) displayEl.textContent = currentName;
    if (emailEl) emailEl.textContent = currentEmail;

    if (sidebarLogoImg) {
      sidebarLogoImg.src = "assets/yutara-logo.png";
      sidebarLogoImg.alt = "YuTara Logo";
      sidebarLogoImg.className = "sidebar-logo-img";
    }
    if (mobileTopbarLogo) mobileTopbarLogo.src = "assets/yutara-logo.png";

    if (isAdmin) {
      if (sidebarBrandLink) sidebarBrandLink.setAttribute("href", "tracker.html?tab=panel-accounts");
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
      if (adminCrudCard) adminCrudCard.classList.remove("hidden");
      if (adminEditOnlyNotice) adminEditOnlyNotice.classList.remove("hidden");
      const lifecycleBar = document.getElementById("seller-lifecycle-bar");
      const photoGroup = document.getElementById("seller-photo-group");
      if (lifecycleBar) lifecycleBar.classList.add("hidden");
      if (photoGroup) photoGroup.classList.add("hidden");
    } else {
      // Standard User: Marketplace + My Account Listings + Add Land for Sale
      if (sidebarBrandLink) sidebarBrandLink.setAttribute("href", "marketplace.html");
      if (mobileTopbarTitle) mobileTopbarTitle.textContent = "My Account Listings";
      if (brandSub) brandSub.textContent = "Yuta ba? YuTara!";
      if (groupTitle) groupTitle.textContent = "User Navigation";
      if (heading) heading.textContent = "Welcome back, " + currentName + "!";
      if (navHome) navHome.classList.add("hidden");
      if (navMarketplace) navMarketplace.classList.remove("hidden");
      if (navUserProps) navUserProps.classList.remove("hidden");
      if (navUserSell) navUserSell.classList.remove("hidden");
      if (navAdminAccounts) navAdminAccounts.classList.add("hidden");
      if (adminCrudCard) adminCrudCard.classList.add("hidden");
      if (adminEditOnlyNotice) adminEditOnlyNotice.classList.add("hidden");
      if (tabBtnSellerLabel) tabBtnSellerLabel.textContent = "Add Land for Sale";
      if (tabBtnSeller) tabBtnSeller.setAttribute("title", "Add Land for Sale");
      const lifecycleBarU = document.getElementById("seller-lifecycle-bar");
      const photoGroupU = document.getElementById("seller-photo-group");
      if (lifecycleBarU) lifecycleBarU.classList.remove("hidden");
      if (photoGroupU) photoGroupU.classList.remove("hidden");
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
  const sellerPhotoInput = document.getElementById("seller-photo-file");
  const sellerPhotoPreview = document.getElementById("seller-photo-preview");
  let pendingPhotoDataUrl = "";

  if (sellerPhotoInput) {
    sellerPhotoInput.addEventListener("change", function () {
      const file = sellerPhotoInput.files && sellerPhotoInput.files[0];
      if (!file) {
        pendingPhotoDataUrl = "";
        if (sellerPhotoPreview) sellerPhotoPreview.src = "assets/property-hero.png";
        return;
      }
      const reader = new FileReader();
      reader.onload = function (ev) {
        const img = new Image();
        img.onload = function () {
          const maxW = 640;
          const scale = img.width > maxW ? maxW / img.width : 1;
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            pendingPhotoDataUrl = canvas.toDataURL("image/jpeg", 0.78);
            if (sellerPhotoPreview) sellerPhotoPreview.src = pendingPhotoDataUrl;
          }
        };
        img.src = String(ev.target.result || "");
      };
      reader.readAsDataURL(file);
    });
  }

  function exitEditMode() {
    if (sellerForm) sellerForm.reset();
    if (editIdInput) editIdInput.value = "";
    pendingPhotoDataUrl = "";
    if (sellerPhotoPreview) sellerPhotoPreview.src = "assets/property-hero.png";
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
      if (formTag) formTag.textContent = "Add Land for Sale";
      if (formHeading) formHeading.textContent = "Add Land for Sale in Panabo City";
      if (formSubtitle) {
        formSubtitle.textContent =
          "Enter your Panabo City land details to publish your listing directly to the Marketplace.";
      }
      if (submitBtn) {
        submitBtn.innerHTML = "Submit Land for Sale &rarr;";
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

  function renderWorkflows() {
    const transactions = getTransactions();
    const buyerList = document.getElementById("buyer-tracker-list");

    if (!buyerList) return;

    // Filter transactions by user role for privacy
    let visibleTransactions = transactions;
    if (isStandardUser) {
      visibleTransactions = transactions.filter(function (tx) {
        return (tx.buyerEmail && tx.buyerEmail.toLowerCase() === currentEmail.toLowerCase()) ||
               (tx.sellerEmail && tx.sellerEmail.toLowerCase() === currentEmail.toLowerCase()) ||
               tx.buyerName === currentName ||
               tx.sellerName === currentName;
      });
    }

    if (visibleTransactions.length === 0) {
      buyerList.innerHTML =
        '<div class="card text-center">' +
        "  <h3>No reservations</h3>" +
        '  <p class="mb-2">You have no buyer or seller reservations yet.</p>' +
        (isStandardUser
          ? '  <a href="marketplace.html" class="btn btn-primary btn-sm">Explore Marketplace &rarr;</a>'
          : "") +
        "</div>";
      return;
    }

    buyerList.innerHTML = visibleTransactions
      .map(function (tx) {
        const isPending = tx.approvalStatus === "pending";
        const isRejected = tx.approvalStatus === "rejected";
        const isApproved = tx.approvalStatus === "approved" || !tx.approvalStatus;
        const isDone = tx.stageIndex >= MILESTONE_STEPS.length - 1;
        const percent = isPending || isRejected
          ? 0
          : Math.round(((tx.stageIndex + 1) / MILESTONE_STEPS.length) * 100);
        const stepsHtml = MILESTONE_STEPS.map(function (label, idx) {
          const done = isApproved && idx <= tx.stageIndex;
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
        const isSeller = (tx.sellerEmail && tx.sellerEmail.toLowerCase() === currentEmail.toLowerCase()) || tx.sellerName === currentName;

        const otherParty = isStandardUser
          ? (tx.buyerEmail && tx.buyerEmail.toLowerCase() === currentEmail.toLowerCase() || tx.buyerName === currentName
            ? "Seller: " + escapeHtml(tx.sellerName)
            : "Buyer: " + escapeHtml(tx.buyerName))
          : "Buyer: " + escapeHtml(tx.buyerName) + " &bull; Seller: " + escapeHtml(tx.sellerName);

        let statusBadgeHtml = "";
        if (isPending) {
          statusBadgeHtml = '<span class="badge badge-warning">Awaiting Seller Approval</span>';
        } else if (isRejected) {
          statusBadgeHtml = '<span class="badge badge-brown-soft">Rejected by Seller</span>';
        } else {
          statusBadgeHtml = '<span class="badge badge-green">' + escapeHtml(tx.id) + " &bull; " + escapeHtml(txPriceDisplay) + "</span>";
        }

        const msgBtnHtml =
          '<a href="property.html?id=' +
          Number(tx.propertyId || 1) +
          '#msg-section" class="btn btn-outline btn-sm">Message</a>';

        let actionButtonsHtml = "";
        if (isPending && isStandardUser && isSeller) {
          actionButtonsHtml =
            '  <div class="mt-2 flex-wrap-gap">' +
            '    <button type="button" class="btn btn-primary btn-sm" data-approve-tx-id="' + tx.id + '">Accept Reservation</button>' +
            '    <button type="button" class="btn btn-outline btn-sm" data-reject-tx-id="' + tx.id + '">Reject Reservation</button>' +
            "    " + msgBtnHtml +
            "  </div>";
        } else if (isApproved && isStandardUser && isSeller && !isDone) {
          actionButtonsHtml =
            '  <div class="mt-2 flex-wrap-gap">' +
            '    <button type="button" class="btn btn-primary btn-sm" data-seller-advance-tx-id="' + tx.id + '">Advance Stage &rarr;</button>' +
            "    " + msgBtnHtml +
            "  </div>";
        } else {
          actionButtonsHtml = '  <div class="mt-2 flex-wrap-gap">' + msgBtnHtml + "</div>";
        }

        return (
          '<div class="card mb-2 anim-fade-up" data-anim="ytFadeInUp">' +
          '  <div class="tx-card-header">' +
          '    <div><h3>' + escapeHtml(tx.propertyTitle) + '</h3><p class="text-no-margin">' + escapeHtml(tx.location) + " &bull; " + otherParty + "</p></div>" +
          statusBadgeHtml +
          "  </div>" +
          (isApproved && !isPending && !isRejected
            ? '  <div class="progress-header"><span>Progress: ' + escapeHtml(MILESTONE_STEPS[tx.stageIndex]) + "</span><span>" + percent + "%</span></div>" +
              '  <div class="progress-track"><div class="progress-fill" data-progress-width="' + percent + '"></div></div>' +
              '  <ul class="milestone-list">' + stepsHtml + "</ul>" +
              '  <div class="mt-2 doc-vault-box"><strong>Transaction Checklist:</strong><ul class="doc-vault-list">' + docsHtml + "</ul></div>"
            : "") +
          actionButtonsHtml +
          "</div>"
        );
      })
      .join("");

    buyerList.querySelectorAll("[data-progress-width]").forEach(function (bar) {
      bar.style.width = bar.getAttribute("data-progress-width") + "%";
    });

    buyerList.querySelectorAll("[data-approve-tx-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const txId = btn.getAttribute("data-approve-tx-id");
        const list = getTransactions();
        const tx = list.find(function (t) { return t.id === txId; });
        if (tx) {
          tx.approvalStatus = "approved";
          tx.status = "active";
          if (tx.stageIndex < 1) tx.stageIndex = 1;
          saveTransactions(list);
          renderWorkflows();
          showToast("Reservation " + txId + " accepted");
        }
      });
    });

    buyerList.querySelectorAll("[data-reject-tx-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const txId = btn.getAttribute("data-reject-tx-id");
        const list = getTransactions();
        const tx = list.find(function (t) { return t.id === txId; });
        if (tx) {
          tx.approvalStatus = "rejected";
          tx.status = "rejected";
          saveTransactions(list);
          renderWorkflows();
          showToast("Reservation " + txId + " rejected");
        }
      });
    });

    buyerList.querySelectorAll("[data-seller-advance-tx-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const txId = btn.getAttribute("data-seller-advance-tx-id");
        const list = getTransactions();
        const tx = list.find(function (t) { return t.id === txId; });
        if (tx && tx.stageIndex < MILESTONE_STEPS.length - 1) {
          tx.stageIndex += 1;
          saveTransactions(list);
          renderWorkflows();
          showToast("Milestone updated to: " + MILESTONE_STEPS[tx.stageIndex]);
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

      // Standard User publishing a new Panabo City land listing straight to Marketplace
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
        priceNote: "Direct owner listing",
        area: area,
        roadAccess: roadAccess,
        badgeText: "For Sale",
        badgeStyle: "badge-green",
        verificationStatus: "Active Listing",
        submittedByUser: true,
        submittedAt: new Date().toISOString().slice(0, 10),
        promoted: false,
        seller: currentName,
        ownerEmail: currentEmail,
        latitude: "7.3100",
        longitude: "125.6820",
        image: pendingPhotoDataUrl || "assets/property-hero.png",
        cardTags: [type + " Lot", "Direct Owner", "Panabo City"],
        highlights: [
          Number(area).toLocaleString() + " SQM Lot Area",
          roadAccess,
          "Direct buyer-seller communication & reservation available"
        ],
        description: description || "Listed directly by the landowner on YuTara Panabo City Marketplace."
      });

      saveProperties(list);
      exitEditMode();
      renderUserWorkspace();

      feedback.className = "alert alert-success";
      feedback.innerHTML =
        "<strong>Land Property #" +
        nextId +
        " Published to Marketplace!</strong> Your listing is now live in Panabo City. " +
        '<a href="marketplace.html" class="inline-action-link">View on Marketplace &rarr;</a>';
      feedback.classList.remove("hidden");
      showToast("Land #" + nextId + " is now live on Marketplace");
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
          ' yet. Add a Panabo City land parcel to list it on the Marketplace.</p>' +
          '  <button type="button" class="btn btn-primary btn-sm" id="user-empty-add-land-btn">+ Add Land for Sale</button>' +
          "</div>";
        const emptyAddBtn = document.getElementById("user-empty-add-land-btn");
        if (emptyAddBtn) {
          emptyAddBtn.addEventListener("click", function () {
            exitEditMode();
            activateTab("panel-seller");
          });
        }
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
      openEl.textContent = props.length;
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
          const statusClass = "badge-green";
          const statusLabel = prop.badgeText || "Active Listing";
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
