/* ==========================================================================
   YuTara Page — Property Details & Chat (js/pages/property.js -> property.html)
   Gallery lightbox, coordinate copy, auth-guarded actions, and buyer-seller chat.
   ========================================================================== */

function initPropertyDetailPage() {
  const container = document.getElementById("property-detail-root");
  if (!container) return;

  const idParam = Number(getQueryParam("id")) || 1;
  const allProperties = getProperties();
  const prop = allProperties.find(function (item) {
    return item.id === idParam;
  }) || allProperties[0];

  const isSaved = getSession() ? getSavedIds().includes(prop.id) : false;

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
    if (!requireLoginForAction("save this listing")) return;
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
    const activeSession = getSession();
    const modalNameEl = document.getElementById("modal-name");
    if (activeSession && activeSession.name && modalNameEl) {
      modalNameEl.value = activeSession.name;
    }
    modal.classList.remove("hidden");
  }

  document.getElementById("site-visit-btn").addEventListener("click", function () {
    if (!requireLoginForAction("request a site visit")) return;
    openModal("Request Site Visit");
  });

  document.getElementById("contact-seller-btn").addEventListener("click", function () {
    if (!requireLoginForAction("contact the seller")) return;
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
      const msgLoginLink = document.getElementById("msg-login-link");
      if (msgLoginLink) {
        msgLoginLink.setAttribute("href", buildLoginUrl("property.html?id=" + prop.id + "#msg-section"));
      }
      if (msgForm) msgForm.classList.add("hidden");
    }
  }

  renderMessages();
}

document.addEventListener("DOMContentLoaded", initPropertyDetailPage);
