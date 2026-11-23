/* ==========================================================================
   YuTara Workspace — Listings & Add Land Form (js/pages/tracker-listings.js)
   --------------------------------------------------------------------------
   QUICK DEBUG INDEX:
   1. Photo Upload Compression   — Resizes uploaded land image to 640px JPEG
   2. exitEditMode()             — Resets form state for User (Add) vs Admin (Edit)
   3. loadPropertyIntoEditForm() — Populates existing listing into Admin editor
   4. deletePropertyListingById()— Deletes listing (restores defaults if empty)
   5. renderManagedProperties()  — Renders Admin property Edit/Delete inventory
   6. sellerForm Submit          — Saves Admin edits OR publishes new User land
   ========================================================================== */

function initTrackerListings(ctx) {
  const brgySelect = document.getElementById("seller-barangay");
  if (brgySelect) {
    brgySelect.innerHTML = PANABO_BARANGAYS.map(function (b) {
      return `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`;
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
  const DEFAULT_PREVIEW_IMG = "assets/Amiya-Lot-For-Sale-Davao-City-Lot-For-Sale-1.jpg";
  let pendingPhotoDataUrl = "";

  // Step 1: Compress uploaded photo via HTML5 Canvas so it fits cleanly in localStorage
  if (sellerPhotoInput) {
    sellerPhotoInput.addEventListener("change", function () {
      const file = sellerPhotoInput.files && sellerPhotoInput.files[0];
      if (!file) {
        pendingPhotoDataUrl = "";
        if (sellerPhotoPreview) sellerPhotoPreview.src = DEFAULT_PREVIEW_IMG;
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
          const drawCtx = canvas.getContext("2d");
          if (drawCtx) {
            drawCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
            pendingPhotoDataUrl = canvas.toDataURL("image/jpeg", 0.78);
            if (sellerPhotoPreview) sellerPhotoPreview.src = pendingPhotoDataUrl;
          }
        };
        img.src = String(ev.target.result || "");
      };
      reader.readAsDataURL(file);
    });
  }

  // Step 2: Reset form into default mode based on signed-in role
  function exitEditMode() {
    if (sellerForm) sellerForm.reset();
    if (editIdInput) editIdInput.value = "";
    pendingPhotoDataUrl = "";
    if (sellerPhotoPreview) sellerPhotoPreview.src = DEFAULT_PREVIEW_IMG;

    if (ctx.isAdmin) {
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

  // Step 3: Populate Admin Edit Form when clicking Edit on a listing
  function loadPropertyIntoEditForm(targetId) {
    if (!ctx.isAdmin) return;
    const prop = getProperties().find(function (p) {
      return p.id === Number(targetId);
    });
    if (!prop) return;

    ctx.activateTab("panel-seller");
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
      formHeading.textContent = `Edit Property Listing #${prop.id} (${prop.barangay})`;
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
    showToast(`Loaded listing #${prop.id} for editing`);
  }

  // Step 4: Admin Delete Property Handler
  function deletePropertyListingById(targetId) {
    if (!ctx.isAdmin) return;
    const remaining = getProperties().filter(function (p) {
      return p.id !== Number(targetId);
    });
    if (remaining.length === 0) {
      localStorage.removeItem(STORAGE_KEYS.properties);
      showToast("Restored default Panabo listings so Marketplace is never empty");
    } else {
      saveProperties(remaining);
      showToast(`Deleted property listing #${targetId}`);
    }
    if (editIdInput && Number(editIdInput.value) === Number(targetId)) {
      exitEditMode();
    }
    ctx.refreshAll();
  }

  // Step 5: Render Admin Property Inventory List
  function renderManagedProperties() {
    const container = document.getElementById("managed-properties-list");
    const countBadge = document.getElementById("managed-prop-count");
    if (!container) return;

    if (!ctx.isAdmin) {
      container.innerHTML = "";
      return;
    }

    const properties = getProperties();
    if (countBadge) {
      countBadge.textContent = `${properties.length} Listings`;
    }

    container.innerHTML = properties
      .map(function (prop) {
        return `
          <div class="card-soft mb-2 anim-fade-up" data-anim="ytFadeInUp">
            <div class="agency-card-row">
              <div class="table-prop-cell">
                <img src="${escapeHtml(prop.image)}" alt="${escapeHtml(prop.title)}" class="table-prop-thumb" onerror="this.src='${DEFAULT_PREVIEW_IMG}'" />
                <div>
                  <h3>#${prop.id} &mdash; ${escapeHtml(prop.title)}</h3>
                  <p class="text-no-margin">
                    Brgy. ${escapeHtml(prop.barangay)} &bull; ${escapeHtml(prop.type)} &bull; ${Number(prop.area).toLocaleString()} sqm &bull;
                    <strong>${escapeHtml(formatPropertyPrice(prop))}</strong>
                  </p>
                </div>
              </div>
              <div class="flex-wrap-gap">
                <a href="property.html?id=${prop.id}" class="btn btn-outline btn-sm">View</a>
                <button type="button" class="btn btn-outline btn-sm" data-edit-prop-id="${prop.id}">Edit</button>
                <button type="button" class="btn btn-danger-outline btn-sm" data-delete-prop-id="${prop.id}">Delete</button>
              </div>
            </div>
          </div>
        `;
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

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", function () {
      exitEditMode();
      showToast("Cancelled property edit");
    });
  }

  const userGoSubmitBtn = document.getElementById("user-go-submit-btn");
  if (userGoSubmitBtn) {
    userGoSubmitBtn.addEventListener("click", function () {
      if (!ctx.isStandardUser) return;
      exitEditMode();
      ctx.activateTab("panel-seller");
    });
  }

  // Step 6: Handle Form Submission (Admin Edit OR Standard User New Listing)
  if (sellerForm) {
    sellerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (lockFormSubmission(sellerForm)) return;

      const feedback = document.getElementById("seller-feedback");
      const editingId = editIdInput && editIdInput.value ? Number(editIdInput.value) : 0;

      // RBAC guard: Admin can ONLY edit existing properties, never publish new seller listings
      if (ctx.isAdmin && editingId <= 0) {
        feedback.className = "alert alert-error";
        feedback.textContent = "Admin Restriction: Click Edit on an existing property listing above to modify it.";
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

      // Path A: Admin updating an existing listing
      if (ctx.isAdmin && editingId > 0) {
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
          ctx.refreshAll();

          feedback.className = "alert alert-success";
          feedback.innerHTML = `
            <strong>Updated Property Listing #${editingId}!</strong>
            <a href="property.html?id=${editingId}" class="inline-action-link">View Updated Property &rarr;</a>
          `;
          feedback.classList.remove("hidden");
          showToast(`Updated property listing #${editingId}`);
          return;
        }
      }

      // Path B: Standard User publishing a new Panabo City land listing straight to Marketplace
      const nextId =
        list.reduce(function (max, item) {
          return Math.max(max, item.id);
        }, 0) + 1;

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
        seller: ctx.currentName,
        ownerEmail: ctx.currentEmail,
        latitude: "7.3100",
        longitude: "125.6820",
        image: pendingPhotoDataUrl || DEFAULT_PREVIEW_IMG,
        cardTags: [`${type} Lot`, "Direct Owner", "Panabo City"],
        highlights: [
          `${Number(area).toLocaleString()} SQM Lot Area`,
          roadAccess,
          "Direct buyer-seller communication & reservation available"
        ],
        description: description || "Listed directly by the landowner on YuTara Panabo City Marketplace."
      });

      saveProperties(list);
      exitEditMode();
      ctx.refreshAll();

      feedback.className = "alert alert-success";
      feedback.innerHTML = `
        <strong>Land Property #${nextId} Published to Marketplace!</strong> Your listing is now live in Panabo City.
        <a href="marketplace.html" class="inline-action-link">View on Marketplace &rarr;</a>
      `;
      feedback.classList.remove("hidden");
      showToast(`Land #${nextId} is now live on Marketplace`);
    });
  }

  exitEditMode();

  ctx.exitEditMode = exitEditMode;
  ctx.loadPropertyIntoEditForm = loadPropertyIntoEditForm;
  ctx.deletePropertyListingById = deletePropertyListingById;
  ctx.renderManagedProperties = renderManagedProperties;
}
