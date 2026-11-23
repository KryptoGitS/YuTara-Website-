/* ==========================================================================
   YuTara Core — Shared Navigation, Property Cards & Common UI (js/core/ui.js)
   --------------------------------------------------------------------------
   QUICK DEBUG INDEX:
   1. initNavbar()             — Auth-aware header, RBAC nav rules & guest guards
   2. initFaqAccordion()       — Expand/collapse FAQ items on homepage
   3. initPasswordToggles()    — Text & eye-icon password visibility toggles
   4. createPropertyCardHTML() — Reusable property card template
   5. bindSaveButtons()        — Auth-guarded heart bookmark buttons
   ========================================================================== */

/* 1. SHARED NAVBAR & GUEST ACTION GUARDS */
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

    // Admin goes straight to the Admin Portal (no public Home or Marketplace tabs)
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
      // Signed-in User: keep navbar focused on Home & Marketplace
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
      const workspaceHref = isAdminSession
        ? escapeHtml(getPostLoginDestination(session.role))
        : "tracker.html";
      const workspaceLabel = isAdminSession
        ? "← Back to Admin Dashboard"
        : "My Account Listings";

      navActions.innerHTML = `
        <a href="${workspaceHref}" class="btn btn-primary btn-sm">${escapeHtml(workspaceLabel)}</a>
        <button type="button" class="btn btn-outline btn-sm" id="logout-btn">Log Out</button>
      `;

      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", requestLogoutConfirmation);
      }
    }
  } else {
    // Guest user: intercept workspace & reservation links with Log In Required modal
    document.querySelectorAll('a[href^="tracker.html"], a[href^="reservation.html"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (getSession()) return;
        event.preventDefault();
        const href = link.getAttribute("href") || "";
        const textLower = (link.textContent || "").toLowerCase();

        let actionLabel = "access your account listings and workspace";
        if (
          href.indexOf("panel-seller") >= 0 ||
          textLower.indexOf("add land") >= 0 ||
          textLower.indexOf("documents") >= 0
        ) {
          actionLabel = "list land for sale";
        } else if (href.indexOf("reservation.html") >= 0) {
          actionLabel = "reserve this property";
        }
        openLoginRequiredModal(actionLabel, href);
      });
    });
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

/* 2. FAQ ACCORDION */
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

/* 3. PASSWORD VISIBILITY TOGGLES */
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll("[data-toggle-password]");
  toggleButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const targetId = btn.getAttribute("data-toggle-password");
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      if (btn.hasAttribute("data-toggle-icon")) {
        btn.classList.toggle("is-visible", isPassword);
      } else {
        btn.textContent = isPassword ? "Hide" : "Show";
      }
      btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
      btn.setAttribute("aria-pressed", isPassword ? "true" : "false");
    });
  });
}

/* 4. REUSABLE PROPERTY CARD HTML BUILDER */
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
  const savedIds = getSession() ? getSavedIds() : [];
  const isSaved = savedIds.includes(prop.id);

  const promotedBadge = prop.promoted
    ? '<span class="badge badge-promoted">Featured</span>'
    : "";

  const statusBadge = prop.badgeText
    ? `<span class="badge badge-with-icon ${escapeHtml(prop.badgeStyle || "badge-green")}">${SVG_ICONS.checkCircle} ${escapeHtml(prop.badgeText)}</span>`
    : `<span class="badge badge-with-icon badge-green">${SVG_ICONS.checkCircle} Verified</span>`;

  const categoryColorClass = getCategoryBadgeClass(prop.type);
  const tagsSource =
    prop.cardTags && prop.cardTags.length > 0
      ? prop.cardTags
      : (prop.highlights || []).slice(0, 3);

  const quickTags = tagsSource
    .map(function (tag) {
      return `<span class="tag-pill-icon">${SVG_ICONS.checkCircle} ${escapeHtml(tag)}</span>`;
    })
    .join("");

  return `
    <article class="property-card anim-fade-up anim-card" data-anim="ytFadeInUp">
      <div class="property-thumb">
        <img src="${escapeHtml(prop.image)}" alt="${escapeHtml(prop.title)}" onerror="this.src='assets/Amiya-Lot-For-Sale-Davao-City-Lot-For-Sale-1.jpg'" />
        <div class="thumb-badges">${promotedBadge}${statusBadge}</div>
        <button type="button" class="save-icon-btn ${isSaved ? "saved" : ""}" data-save-id="${prop.id}" title="Save property">
          ${isSaved ? "&#9829;" : "&#9825;"}
        </button>
      </div>
      <div class="property-body">
        <div class="prop-icon-row">
          <span class="prop-icon-pill ${categoryColorClass}" title="Property Type">${SVG_ICONS.house} ${escapeHtml(prop.type)}</span>
          <span class="prop-icon-pill" title="Lot Area">${SVG_ICONS.ruler} ${Number(prop.area).toLocaleString()} sqm</span>
        </div>
        <h3 class="property-title">${escapeHtml(prop.title)}</h3>
        <div class="property-location-line">${SVG_ICONS.mapPin} <span>Brgy. ${escapeHtml(prop.barangay)}, ${escapeHtml(prop.city)}</span></div>
        ${quickTags ? `<div class="card-tags">${quickTags}</div>` : ""}
        <div class="property-price-row">
          <div class="property-price">${escapeHtml(formatPropertyPrice(prop))}</div>
          <div class="property-note">${escapeHtml(prop.priceNote || prop.roadAccess)}</div>
        </div>
        <a href="property.html?id=${prop.id}" class="btn btn-primary btn-sm btn-full">View Details &rarr;</a>
      </div>
    </article>
  `;
}

/* 5. SAVE / BOOKMARK BUTTON BINDING */
function bindSaveButtons(container, onToggleCallback) {
  if (!container) return;
  const buttons = container.querySelectorAll("[data-save-id]");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!requireLoginForAction("save this property")) return;
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

document.addEventListener("DOMContentLoaded", function () {
  initAnimationDebugFromUrl();
  initNavbar();
  initFaqAccordion();
  initPasswordToggles();
});
