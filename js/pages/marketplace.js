/* ==========================================================================
   YuTara Page — Marketplace Directory (js/pages/marketplace.js -> marketplace.html)
   Sidebar filtering, quick barangay chips, sorting, and pagination.
   ========================================================================== */

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

document.addEventListener("DOMContentLoaded", initMarketplacePage);
