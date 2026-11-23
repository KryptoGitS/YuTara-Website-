/* ==========================================================================
   YuTara Page — Homepage (js/pages/home.js -> index.html)
   Featured property cards, interactive hero spotlight switcher, and search bar.
   ========================================================================== */

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

document.addEventListener("DOMContentLoaded", initHomePage);
