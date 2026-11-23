/* ==========================================================================
   YuTara Page — Property Details & Chat (js/pages/property.js -> property.html)
   --------------------------------------------------------------------------
   QUICK DEBUG INDEX:
   1. Load Selected Property & Render Details
   2. Copy GPS Coordinates & Photo Lightbox Zoom
   3. Related Properties & Save / Bookmark Action
   4. Owner Self-Listing Check & Site Visit / Contact Seller Modal
   5. Buyer-Seller Direct Message Thread (#msg-section)
   ========================================================================== */

function initPropertyDetailPage() {
  const container = document.getElementById("property-detail-root");
  if (!container) return;

  /* 1. LOAD SELECTED PROPERTY & RENDER DETAILS */
  const idParam = Number(getQueryParam("id")) || 1;
  const allProperties = getProperties();
  const prop =
    allProperties.find(function (item) {
      return item.id === idParam;
    }) || allProperties[0];

  const session = getSession();
  const currentUserEmail = session && session.email ? session.email.toLowerCase() : "";
  const currentUserName = session && session.name ? session.name : "";
  const sellerName = prop.seller || "Property Owner";
  const sellerEmail = (prop.ownerEmail || "").toLowerCase();
  const isOwnerViewing = Boolean(
    session &&
      ((sellerEmail && currentUserEmail === sellerEmail) ||
        currentUserName.toLowerCase() === sellerName.toLowerCase())
  );

  const isSaved = session ? getSavedIds().includes(prop.id) : false;

  document.getElementById("detail-img").src = prop.image;
  document.getElementById("detail-img").alt = prop.title;
  document.getElementById("detail-title").textContent = prop.title;
  document.getElementById("detail-location").textContent =
    `Brgy. ${prop.barangay}, ${prop.city}, ${prop.province}`;
  document.getElementById("detail-price").textContent = formatPropertyPrice(prop);
  document.getElementById("detail-price-sqm").textContent = formatPricePerSqm(prop);
  document.getElementById("detail-area").textContent = `${Number(prop.area).toLocaleString()} sqm`;
  document.getElementById("detail-type").textContent = prop.type;
  document.getElementById("detail-road").textContent = prop.roadAccess;
  document.getElementById("detail-seller").textContent = sellerName;
  document.getElementById("detail-desc").textContent = prop.description;
  document.getElementById("detail-coords").textContent = `Coordinates: ${prop.latitude}, ${prop.longitude}`;

  const highlightsList = document.getElementById("detail-highlights");
  if (highlightsList) {
    const items =
      prop.highlights && prop.highlights.length > 0
        ? prop.highlights
        : ["Clean title ready for inspection", prop.roadAccess];
    highlightsList.innerHTML = items
      .map(function (item) {
        return `<li><span>&#10003;</span> ${escapeHtml(item)}</li>`;
      })
      .join("");
  }

  /* 2. COPY GPS COORDINATES & PHOTO LIGHTBOX ZOOM */
  const copyBtn = document.getElementById("copy-coords-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      const coordStr = `${prop.latitude}, ${prop.longitude}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(coordStr);
      }
      showToast("Copied coordinates: " + coordStr);
    });
  }

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

  /* 3. RELATED PROPERTIES & SAVE / BOOKMARK ACTION */
  const relatedGrid = document.getElementById("related-grid");
  if (relatedGrid) {
    const related = allProperties
      .filter(function (p) {
        return p.id !== prop.id;
      })
      .slice(0, 3);
    relatedGrid.innerHTML = related.map(createPropertyCardHTML).join("");
    bindSaveButtons(relatedGrid);
  }

  const reserveLink = document.getElementById("reserve-property-link");
  if (reserveLink) {
    if (isOwnerViewing) {
      reserveLink.href = "tracker.html";
      reserveLink.textContent = "Manage My Listing →";
    } else {
      reserveLink.href = `reservation.html?id=${prop.id}`;
    }
  }

  const saveBtn = document.getElementById("detail-save-btn");
  function updateSaveButton(saved) {
    saveBtn.textContent = saved ? "Saved Listing ✓" : "Save Listing";
  }
  updateSaveButton(isSaved);
  saveBtn.addEventListener("click", function () {
    if (!requireLoginForAction("save this listing")) return;
    const nowSaved = toggleSavedProperty(prop.id);
    updateSaveButton(nowSaved);
    showToast(nowSaved ? "Saved property to your list" : "Removed from saved properties");
  });

  /* 4. OWNER SELF-LISTING CHECK & SITE VISIT / CONTACT SELLER MODAL */
  const modal = document.getElementById("action-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalForm = document.getElementById("modal-form");
  const modalStatus = document.getElementById("modal-status");
  const closeModalBtn = document.getElementById("close-modal-btn");

  function openModal(titleText) {
    modalTitle.textContent = `${titleText} — Brgy. ${prop.barangay}`;
    modalStatus.classList.add("hidden");
    modalForm.reset();
    const activeSession = getSession();
    const modalNameEl = document.getElementById("modal-name");
    if (activeSession && activeSession.name && modalNameEl) {
      modalNameEl.value = activeSession.name;
    }
    modal.classList.remove("hidden");
  }

  document.getElementById("site-visit-btn").addEventListener("click", function () {
    if (!requireLoginForAction("request a site visit")) return;
    if (isOwnerViewing) {
      showToast("You are the owner of this property listing");
      return;
    }
    openModal("Request Site Visit");
  });

  document.getElementById("contact-seller-btn").addEventListener("click", function () {
    if (!requireLoginForAction("contact the seller")) return;
    if (isOwnerViewing) {
      const msgSec = document.getElementById("msg-section");
      if (msgSec) msgSec.scrollIntoView({ behavior: "smooth" });
      showToast("Viewing buyer messages on your listing");
      return;
    }
    openModal(`Contact Seller (${sellerName})`);
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

  /* 5. BUYER-SELLER DIRECT MESSAGE THREAD */
  const msgThread = document.getElementById("msg-thread");
  const msgForm = document.getElementById("msg-form");
  const msgText = document.getElementById("msg-text");
  const msgSendBtn = document.getElementById("msg-send-btn");
  const msgLoginPrompt = document.getElementById("msg-login-prompt");
  const msgWithParty = document.getElementById("msg-with-party");

  if (msgWithParty) {
    msgWithParty.textContent = isOwnerViewing ? "Buyers on Your Listing" : sellerName;
  }

  function renderMessages() {
    if (!msgThread) return;
    const propMsgs = getMessages().filter(function (m) {
      return m.propertyId === prop.id;
    });

    propMsgs.sort(function (a, b) {
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });

    if (propMsgs.length === 0) {
      msgThread.innerHTML =
        '<div class="msg-empty">No messages yet. Start the conversation below.</div>';
    } else {
      msgThread.innerHTML = propMsgs
        .map(function (m) {
          const isMine = m.senderEmail && m.senderEmail.toLowerCase() === currentUserEmail;
          const bubbleClass = isMine ? "msg-mine" : "msg-theirs";
          const senderLabel = isMine ? "You" : m.senderName || "Buyer";
          const formattedTime = String(m.createdAt || "").replace("T", " ");
          return `
            <div class="msg-bubble ${bubbleClass}">
              <div class="msg-header">
                <strong>${escapeHtml(senderLabel)}</strong>
                <span class="msg-time">${escapeHtml(formattedTime)}</span>
              </div>
              <div class="msg-body">${escapeHtml(m.message)}</div>
            </div>
          `;
        })
        .join("");
    }
    msgThread.scrollTop = msgThread.scrollHeight;
  }

  // Submitting Site Visit / Contact Seller also posts straight into Direct Messages
  modalForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!requireLoginForAction("submit an inquiry")) return;
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

    const reqType =
      modalTitle.textContent.indexOf("Site Visit") >= 0 ? "Site Visit Request" : "Buyer Inquiry";
    const summaryMsg = notes || "Requested site inspection and title document review.";

    const inquiries = getInquiries();
    const newInq = {
      id: "INQ-" + Math.floor(1000 + Math.random() * 9000),
      type: reqType,
      propertyTitle: `${prop.title} (Brgy. ${prop.barangay})`,
      senderName: sender,
      contactInfo: phone,
      message: summaryMsg,
      status: "Open",
      createdAt: new Date().toISOString().slice(0, 10)
    };
    inquiries.unshift(newInq);
    saveInquiries(inquiries);

    if (currentUserEmail) {
      addMessage(prop.id, null, sender, currentUserEmail, `[${reqType} • ${phone}] ${summaryMsg}`);
      renderMessages();
    }

    modalStatus.className = "alert alert-success";
    modalStatus.innerHTML = `
      <strong>${escapeHtml(reqType)} Sent (${escapeHtml(newInq.id)})!</strong>
      Delivered to ${escapeHtml(sellerName)}.
      <a href="#msg-section" class="inline-action-link" id="jump-to-thread-link">View in Direct Messages &darr;</a>
    `;
    modalStatus.classList.remove("hidden");

    const jumpLink = document.getElementById("jump-to-thread-link");
    if (jumpLink) {
      jumpLink.addEventListener("click", function () {
        modal.classList.add("hidden");
      });
    }
    showToast(`${reqType} ${newInq.id} sent to ${sellerName}`);
  });

  if (msgForm && msgText && msgSendBtn) {
    if (session) {
      if (msgLoginPrompt) msgLoginPrompt.classList.add("hidden");
      msgForm.classList.remove("hidden");

      msgForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!requireLoginForAction("send a direct message")) return;
        if (lockFormSubmission(msgForm)) return;

        const text = msgText.value.trim();
        if (!text) return;

        const relatedTx = getTransactions().find(function (t) {
          return (
            t.propertyId === prop.id &&
            ((t.buyerEmail && t.buyerEmail.toLowerCase() === currentUserEmail) ||
              (t.sellerEmail && t.sellerEmail.toLowerCase() === currentUserEmail))
          );
        });

        addMessage(prop.id, relatedTx ? relatedTx.id : null, currentUserName, currentUserEmail, text);
        msgText.value = "";
        renderMessages();
        showToast("Message sent");

        setTimeout(function () {
          msgThread.scrollTop = msgThread.scrollHeight;
        }, 100);
      });
    } else {
      if (msgLoginPrompt) msgLoginPrompt.classList.remove("hidden");
      const msgLoginLink = document.getElementById("msg-login-link");
      if (msgLoginLink) {
        msgLoginLink.setAttribute("href", buildLoginUrl(`property.html?id=${prop.id}#msg-section`));
      }
      msgForm.classList.add("hidden");
    }
  }

  renderMessages();
}

document.addEventListener("DOMContentLoaded", initPropertyDetailPage);
