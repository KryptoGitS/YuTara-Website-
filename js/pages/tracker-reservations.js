/* ==========================================================================
   YuTara Workspace — User Listings & Reservations (js/pages/tracker-reservations.js)
   Renders the signed-in User's account inventory and Buyer-Seller reservation
   approval & 5-stage milestone tracking workflow.
   ========================================================================== */

function initTrackerReservations(ctx) {
  function renderUserWorkspace() {
    const savedEl = document.getElementById("user-stat-saved");
    const onSaleEl = document.getElementById("user-stat-onsale");
    const roleEl = document.getElementById("user-stat-role");
    const landGrid = document.getElementById("user-land-grid");

    const props = getProperties();
    // Strictly show ONLY listings owned by the signed-in user's account
    const myProps = props.filter(function (p) {
      const matchEmail =
        p.ownerEmail && p.ownerEmail.toLowerCase() === ctx.currentEmail.toLowerCase();
      const matchName =
        p.seller && p.seller.toLowerCase() === ctx.currentName.toLowerCase();
      return matchEmail || matchName;
    });

    if (savedEl) savedEl.textContent = getSavedIds().length;
    if (onSaleEl) onSaleEl.textContent = myProps.length;
    if (roleEl) roleEl.textContent = ctx.currentRole.toUpperCase();

    if (landGrid) {
      if (myProps.length === 0) {
        landGrid.innerHTML =
          '<div class="card text-center">' +
          "  <h3>No account listings yet</h3>" +
          '  <p class="mb-2">You have not published any land listings under ' +
          escapeHtml(ctx.currentEmail) +
          " yet. Add a Panabo City land parcel to list it on the Marketplace.</p>" +
          '  <button type="button" class="btn btn-primary btn-sm" id="user-empty-add-land-btn">+ Add Land for Sale</button>' +
          "</div>";
        const emptyAddBtn = document.getElementById("user-empty-add-land-btn");
        if (emptyAddBtn) {
          emptyAddBtn.addEventListener("click", function () {
            if (ctx.exitEditMode) ctx.exitEditMode();
            ctx.activateTab("panel-seller");
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

  function renderWorkflows() {
    const transactions = getTransactions();
    const buyerList = document.getElementById("buyer-tracker-list");
    if (!buyerList) return;

    // Filter transactions by user role for privacy
    let visibleTransactions = transactions;
    if (ctx.isStandardUser) {
      visibleTransactions = transactions.filter(function (tx) {
        return (
          (tx.buyerEmail && tx.buyerEmail.toLowerCase() === ctx.currentEmail.toLowerCase()) ||
          (tx.sellerEmail && tx.sellerEmail.toLowerCase() === ctx.currentEmail.toLowerCase()) ||
          tx.buyerName === ctx.currentName ||
          tx.sellerName === ctx.currentName
        );
      });
    }

    if (visibleTransactions.length === 0) {
      buyerList.innerHTML =
        '<div class="card text-center">' +
        "  <h3>No reservations</h3>" +
        '  <p class="mb-2">You have no buyer or seller reservations yet.</p>' +
        (ctx.isStandardUser
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
        const percent =
          isPending || isRejected
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
        const isSeller =
          (tx.sellerEmail && tx.sellerEmail.toLowerCase() === ctx.currentEmail.toLowerCase()) ||
          tx.sellerName === ctx.currentName;

        const isBuyer =
          (tx.buyerEmail && tx.buyerEmail.toLowerCase() === ctx.currentEmail.toLowerCase()) ||
          tx.buyerName === ctx.currentName;

        const otherParty = ctx.isStandardUser
          ? isBuyer
            ? "Seller: " + escapeHtml(tx.sellerName)
            : "Buyer: " + escapeHtml(tx.buyerName)
          : "Buyer: " + escapeHtml(tx.buyerName) + " &bull; Seller: " + escapeHtml(tx.sellerName);

        let statusBadgeHtml = "";
        if (isPending) {
          statusBadgeHtml = '<span class="badge badge-warning">Awaiting Seller Approval</span>';
        } else if (isRejected) {
          statusBadgeHtml = '<span class="badge badge-brown-soft">Rejected by Seller</span>';
        } else {
          statusBadgeHtml =
            '<span class="badge badge-green">' +
            escapeHtml(tx.id) +
            " &bull; " +
            escapeHtml(txPriceDisplay) +
            "</span>";
        }

        const msgBtnHtml =
          '<a href="property.html?id=' +
          Number(tx.propertyId || 1) +
          '#msg-section" class="btn btn-outline btn-sm">Message</a>';

        let actionButtonsHtml = "";
        if (isPending && ctx.isStandardUser && isSeller) {
          actionButtonsHtml =
            '  <div class="mt-2 flex-wrap-gap">' +
            '    <button type="button" class="btn btn-primary btn-sm" data-approve-tx-id="' + tx.id + '">Accept Reservation</button>' +
            '    <button type="button" class="btn btn-outline btn-sm" data-reject-tx-id="' + tx.id + '">Reject Reservation</button>' +
            "    " + msgBtnHtml +
            "  </div>";
        } else if (isApproved && ctx.isStandardUser && isSeller && !isDone) {
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

  ctx.renderUserWorkspace = renderUserWorkspace;
  ctx.renderWorkflows = renderWorkflows;
}
