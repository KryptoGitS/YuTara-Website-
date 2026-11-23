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
   1. STORAGE KEYS & HELPER UTILITIES
   -------------------------------------------------------------------------- */
const STORAGE_KEYS = {
  properties: "yutara_v3_properties",
  saved: "yutara_v3_saved",
  transactions: "yutara_v3_transactions",
  session: "yutara_v3_session"
};

let toastTimer = null;

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
    return DEFAULT_PROPERTIES.slice();
  }
}

function saveProperties(list) {
  localStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(list));
}

function getSavedIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
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

  localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(saved));
  return saved.includes(id);
}

function getTransactions() {
  const raw = localStorage.getItem(STORAGE_KEYS.transactions);
  if (!raw) return DEFAULT_TRANSACTIONS.slice();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_TRANSACTIONS.slice();
  } catch (err) {
    return DEFAULT_TRANSACTIONS.slice();
  }
}

function saveTransactions(list) {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(list));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
  } catch (err) {
    return null;
  }
}

function setSession(userObj) {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(userObj));
}

function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.session);
  window.location.reload();
}

function resetDemoData() {
  localStorage.removeItem(STORAGE_KEYS.properties);
  localStorage.removeItem(STORAGE_KEYS.saved);
  localStorage.removeItem(STORAGE_KEYS.transactions);
  localStorage.removeItem(STORAGE_KEYS.session);
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
  if (navActions && session) {
    navActions.innerHTML =
      '<span class="user-pill">' +
      escapeHtml(session.name) +
      " (" +
      escapeHtml(session.role) +
      ")</span>" +
      '<button type="button" class="btn btn-outline btn-sm" id="logout-btn">Log Out</button>';

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logoutUser);
    }
  }

  const resetBtn = document.getElementById("reset-demo-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (confirm("Reset all demo listings, bookings, and login session?")) {
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
    '<article class="property-card">' +
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
    const sender = document.getElementById("modal-name").value.trim();
    const phone = document.getElementById("modal-phone").value.trim();
    if (!sender || !phone) {
      modalStatus.className = "alert alert-error";
      modalStatus.textContent = "Please enter both your name and mobile number.";
      modalStatus.classList.remove("hidden");
      return;
    }
    modalStatus.className = "alert alert-success";
    modalStatus.textContent =
      "Demo request recorded for " + sender + ". An affiliated agency coordinator will follow up in the live version.";
    modalStatus.classList.remove("hidden");
    showToast("Inquiry recorded for " + sender);
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
   8. LOGIN PAGE (login.html)
   -------------------------------------------------------------------------- */
function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const statusBox = document.getElementById("login-status");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const role = document.getElementById("login-role").value;

    if (!email || password.length < 4) {
      statusBox.className = "alert alert-error";
      statusBox.textContent = "Enter a valid email and a password of at least 4 characters.";
      statusBox.classList.remove("hidden");
      return;
    }

    const displayName = email.split("@")[0];
    setSession({ name: displayName, email: email, role: role });
    window.location.href = "tracker.html";
  });

  document.querySelectorAll("[data-demo-role]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const role = btn.getAttribute("data-demo-role");
      const name = btn.getAttribute("data-demo-name");
      setSession({ name: name, email: role.toLowerCase() + "@yutara.demo", role: role });
      window.location.href = "tracker.html";
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
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const role = document.getElementById("reg-role").value;

    setSession({ name: name, email: email, role: role });
    feedback.className = "alert alert-success";
    feedback.innerHTML =
      "<strong>Registration Submitted (Simulated MVP Review)!</strong> You are signed in as " +
      escapeHtml(name) +
      '. <a href="tracker.html" class="inline-action-link">Go to MVP Workflows &rarr;</a>';
    feedback.classList.remove("hidden");
    showToast("Account submitted for demo review");
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
    const feedback = document.getElementById("contact-feedback");
    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const message = document.getElementById("contact-message").value.trim();

    if (!name || !email.includes("@") || message.length < 10) {
      feedback.className = "alert alert-error";
      feedback.textContent = "Please enter your name, a valid email, and a message (at least 10 characters).";
      feedback.classList.remove("hidden");
      return;
    }

    feedback.className = "alert alert-success";
    feedback.textContent =
      "Thank you, " + name + "! Your inquiry has been recorded for demo testing (Official Email: YutaraPanabo@gmail.com).";
    feedback.classList.remove("hidden");
    form.reset();
    showToast("Inquiry sent");
  });
}

/* --------------------------------------------------------------------------
   11. MVP WORKFLOW HUB (tracker.html — Buyer Tracker, Seller Intake, Agency)
   -------------------------------------------------------------------------- */
function initTrackerPage() {
  const tabContainer = document.getElementById("workflow-tabs");
  if (!tabContainer) return;

  const tabBtns = tabContainer.querySelectorAll("[data-tab]");
  function activateTab(targetId) {
    tabBtns.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === targetId);
    });
    document.querySelectorAll(".tab-panel").forEach(function (panel) {
      panel.classList.toggle("hidden", panel.id !== targetId);
    });
  }

  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateTab(btn.getAttribute("data-tab"));
    });
  });

  const brgySelect = document.getElementById("seller-barangay");
  if (brgySelect) {
    brgySelect.innerHTML = PANABO_BARANGAYS.map(function (b) {
      return '<option value="' + escapeHtml(b) + '">' + escapeHtml(b) + "</option>";
    }).join("");
  }

  function renderWorkflows() {
    const transactions = getTransactions();
    const buyerList = document.getElementById("buyer-tracker-list");
    const agencyList = document.getElementById("agency-queue-list");

    const totalEscrow = transactions.reduce(function (sum, tx) {
      return sum + Number(tx.reservationFee || 0);
    }, 0);
    const pendingCount = transactions.filter(function (tx) {
      return tx.stageIndex < MILESTONE_STEPS.length - 1;
    }).length;
    const completedCount = transactions.length - pendingCount;

    document.getElementById("stat-active").textContent = transactions.length;
    document.getElementById("stat-pending").textContent = pendingCount;
    document.getElementById("stat-completed").textContent = completedCount;
    document.getElementById("stat-escrow").textContent = formatPeso(totalEscrow);

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
          '<div class="card mb-2">' +
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

    agencyList.innerHTML = transactions
      .map(function (tx, idx) {
        const isDone = tx.stageIndex >= MILESTONE_STEPS.length - 1;
        return (
          '<div class="card mb-2">' +
          '  <div class="agency-card-row">' +
          "    <div>" +
          "      <h3>" + escapeHtml(tx.id) + " — " + escapeHtml(tx.propertyTitle) + "</h3>" +
          "      <p>Buyer: " + escapeHtml(tx.buyerName) + " &bull; Current Stage: <strong>" + escapeHtml(MILESTONE_STEPS[tx.stageIndex]) + "</strong></p>" +
          "    </div>" +
          '    <button type="button" class="btn btn-primary btn-sm" data-advance-idx="' + idx + '" ' + (isDone ? "disabled" : "") + ">" +
          (isDone ? "Completed ✓" : "Advance to Next Milestone &rarr;") +
          "    </button>" +
          "  </div>" +
          "</div>"
        );
      })
      .join("");

    agencyList.querySelectorAll("[data-advance-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const index = Number(btn.getAttribute("data-advance-idx"));
        const list = getTransactions();
        if (list[index] && list[index].stageIndex < MILESTONE_STEPS.length - 1) {
          list[index].stageIndex += 1;
          saveTransactions(list);
          renderWorkflows();
          showToast("Milestone updated to: " + MILESTONE_STEPS[list[index].stageIndex]);
        }
      });
    });
  }

  const sellerForm = document.getElementById("seller-intake-form");
  if (sellerForm) {
    sellerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const feedback = document.getElementById("seller-feedback");
      const title = document.getElementById("seller-title").value.trim();
      const type = document.getElementById("seller-type").value;
      const barangay = document.getElementById("seller-barangay").value;
      const price = Number(document.getElementById("seller-price").value);
      const area = Number(document.getElementById("seller-area").value);
      const roadAccess = document.getElementById("seller-road").value;
      const description = document.getElementById("seller-desc").value.trim();

      if (!title || price <= 0 || area <= 0) {
        feedback.className = "alert alert-error";
        feedback.textContent = "Please provide a property title, positive price, and positive lot area.";
        feedback.classList.remove("hidden");
        return;
      }

      const list = getProperties();
      const nextId = list.reduce(function (max, item) { return Math.max(max, item.id); }, 0) + 1;
      const session = getSession();

      list.unshift({
        id: nextId,
        title: title,
        type: type,
        barangay: barangay,
        city: "Panabo City",
        province: "Davao del Norte",
        price: price,
        priceLabel: formatPeso(price),
        priceNote: "Newly submitted demo listing",
        area: area,
        roadAccess: roadAccess,
        badgeText: "New Listing",
        badgeStyle: "badge-green",
        promoted: false,
        seller: session ? session.name : "Verified Demo Seller",
        latitude: "7.3100",
        longitude: "125.6820",
        image: "assets/property-hero.png",
        cardTags: [type + " Lot", "MVP Review", "Panabo City"],
        highlights: [
          Number(area).toLocaleString() + " SQM Lot Area",
          roadAccess,
          "Submitted for MVP Document Review"
        ],
        description: description || "Submitted through the YuTara seller intake form for MVP demonstration."
      });

      saveProperties(list);
      sellerForm.reset();

      feedback.className = "alert alert-success";
      feedback.innerHTML =
        "<strong>Listing Added to Local Demo Marketplace!</strong> " +
        '<a href="marketplace.html" class="inline-action-link">View in Marketplace &rarr;</a>';
      feedback.classList.remove("hidden");
      showToast("New listing published to Marketplace");
    });
  }

  renderWorkflows();
}

/* --------------------------------------------------------------------------
   12. BOOTSTRAP ON PAGE LOAD
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
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
