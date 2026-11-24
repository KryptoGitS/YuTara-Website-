/* ==========================================================================
   YuTara Page — Homepage (js/pages/home.js -> index.html)
   --------------------------------------------------------------------------
   QUICK DEBUG INDEX:
   1. Featured Properties Grid (#featured-grid — renders top 3 Panabo listings)
   2. Hero Spotlight Switcher  ([data-spotlight-id] — switches Brgy. New Pandan / Gredu)
   3. Quick Search Bar         (#home-search-form -> marketplace.html?location=...)
   4. Quick Barangay Chips     ([data-home-chip] -> marketplace.html?location=...)
   5. Promotional Video Player (#yutara-promo-video — play overlay & hero CTA trigger)
   ========================================================================== */

function initHomePage() {
  // Step 1: Render the top 3 Featured Properties on the homepage
  const featuredGrid = document.getElementById("featured-grid");
  if (featuredGrid) {
    const properties = getProperties().slice(0, 3);
    featuredGrid.innerHTML = properties.map(createPropertyCardHTML).join("");
    bindSaveButtons(featuredGrid);
  }

  // Step 2: Interactive Hero Spotlight Switcher (Brgy. New Pandan <-> Brgy. Gredu)
  const spotlightTabs = document.querySelectorAll("[data-spotlight-id]");
  if (spotlightTabs.length > 0) {
    const allProps = getProperties();

    function renderSpotlight(propId) {
      const prop =
        allProps.find(function (p) {
          return p.id === Number(propId);
        }) || allProps[0];
      if (!prop) return;

      const imgEl = document.getElementById("spotlight-img");
      const badgeEl = document.getElementById("spotlight-badge");
      const catBadge = document.getElementById("spotlight-cat");
      const areaEl = document.getElementById("spotlight-area-val");
      const typeEl = document.getElementById("spotlight-type-val");
      const titleEl = document.getElementById("spotlight-title");
      const locTextEl = document.getElementById("spotlight-loc-text");
      const priceEl = document.getElementById("spotlight-price");
      const metaEl = document.getElementById("spotlight-meta");
      const linkEl = document.getElementById("spotlight-link");

      if (imgEl) {
        imgEl.src = prop.image;
        imgEl.alt = prop.title;
      }
      if (badgeEl) {
        badgeEl.innerHTML = `${SVG_ICONS.checkCircle} ${escapeHtml(prop.badgeText || "Verified")}`;
        badgeEl.className = `badge badge-with-icon ${prop.badgeStyle || "badge-green"}`;
      }
      if (catBadge) {
        catBadge.innerHTML = `${SVG_ICONS.house} ${escapeHtml(prop.type)}`;
      }
      if (areaEl) {
        areaEl.textContent = `${Number(prop.area).toLocaleString()} sqm`;
      }
      if (typeEl) {
        typeEl.textContent = prop.type;
      }
      if (titleEl) {
        titleEl.textContent = prop.title;
      }
      if (locTextEl) {
        locTextEl.textContent = `Brgy. ${prop.barangay}, ${prop.city}`;
      }
      if (priceEl) {
        priceEl.textContent = formatPropertyPrice(prop);
      }
      if (metaEl) {
        metaEl.textContent = (prop.cardTags || []).join(" • ");
      }
      if (linkEl) {
        linkEl.href = `property.html?id=${prop.id}`;
      }

      spotlightTabs.forEach(function (tab) {
        tab.classList.toggle("active", Number(tab.getAttribute("data-spotlight-id")) === prop.id);
      });
    }

    spotlightTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        renderSpotlight(tab.getAttribute("data-spotlight-id"));
      });
    });

    // Default hero spotlight shows Listing #2 (Brgy. New Pandan)
    renderSpotlight(2);
  }

  // Step 3: Hero Quick Search Form -> Redirects with URL parameters to marketplace.html
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

      window.location.href = `marketplace.html${params.toString() ? "?" + params.toString() : ""}`;
    });
  }

  // Step 4: Quick Barangay Chips under the search bar
  document.querySelectorAll("[data-home-chip]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      const brgy = chip.getAttribute("data-home-chip");
      window.location.href = brgy
        ? `marketplace.html?location=${encodeURIComponent(brgy)}`
        : "marketplace.html";
    });
  });

  // Step 5: Promotional Video Player (#yutara-promo-video)
  const promoStage = document.getElementById("promo-video-stage");
  const promoVideo = document.getElementById("yutara-promo-video");
  const promoPlayBtn = document.getElementById("promo-play-btn");
  const heroWatchBtn = document.getElementById("hero-watch-promo-btn");

  if (promoStage && promoVideo && promoPlayBtn) {
    // Hide browser bottom bar while custom poster overlay is shown; enable on play
    promoVideo.controls = false;

    function startPromoPlayback() {
      promoStage.classList.add("has-started");
      promoVideo.controls = true;
      promoVideo.play().catch(function (err) {
        reportDiagnostic("HomeUI", "PromoVideo", "startPromoPlayback", err);
      });
    }

    promoPlayBtn.addEventListener("click", startPromoPlayback);

    promoVideo.addEventListener("play", function () {
      promoStage.classList.add("has-started");
      promoVideo.controls = true;
    });

    promoVideo.addEventListener("ended", function () {
      promoVideo.controls = false;
      promoStage.classList.remove("has-started");
      promoVideo.load();
    });

    if (heroWatchBtn) {
      heroWatchBtn.addEventListener("click", function (event) {
        event.preventDefault();
        const sectionEl = document.getElementById("promo-video");
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        startPromoPlayback();
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", initHomePage);
