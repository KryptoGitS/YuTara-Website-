/* ==========================================================================
   YuTara Workspace — Admin Accounts Portal (js/pages/tracker-admin.js)
   --------------------------------------------------------------------------
   QUICK DEBUG INDEX:
   1. renderAdminAccountsPortal() — Renders KPI stats, User/Admin accounts table,
                                    and All Marketplace Listings overview table
   2. Role / Status / Remove      — Live handlers for role dropdown, Suspend/Activate,
                                    and custom account deletion
   3. Admin Account Provisioning  — #admin-provision-form (with duplicate email guard)
   ========================================================================== */

function initTrackerAdmin(ctx) {
  const DEFAULT_PREVIEW_IMG = "assets/Amiya-Lot-For-Sale-Davao-City-Lot-For-Sale-1.jpg";

  function renderAdminAccountsPortal() {
    const tbody = document.getElementById("admin-accounts-tbody");
    if (!tbody || !ctx.isAdmin) return;

    const props = getProperties();
    const allAccounts = getAllAccounts();

    // Step 1: Update Admin KPI Counters
    const totalEl = document.getElementById("admin-stat-total");
    const openEl = document.getElementById("admin-stat-open");
    const accEl = document.getElementById("admin-stat-accounts");
    const pendEl = document.getElementById("admin-stat-pending");

    if (totalEl) totalEl.textContent = props.length;
    if (openEl) openEl.textContent = props.length;
    if (accEl) accEl.textContent = allAccounts.length;
    if (pendEl) {
      pendEl.textContent = allAccounts.filter(function (a) {
        return a.status === "SUSPENDED";
      }).length;
    }

    // Step 2: Render Accounts Table Rows
    tbody.innerHTML = allAccounts
      .map(function (acc, idx) {
        const isCurrentAdminSelf = acc.email.toLowerCase() === ctx.currentEmail.toLowerCase();
        const isSuspended = acc.status === "SUSPENDED";
        const statusBadgeClass = isSuspended ? "badge-brown-soft" : "badge-green";

        const roleSelectHtml = `
          <select class="account-inline-select" data-mod-role-idx="${idx}" aria-label="Account role for ${escapeHtml(acc.name)}" ${isCurrentAdminSelf ? "disabled" : ""}>
            <option value="User" ${acc.role === "User" ? "selected" : ""}>User</option>
            <option value="Admin" ${acc.role === "Admin" ? "selected" : ""}>Admin</option>
          </select>
        `;

        const toggleStatusBtn = isCurrentAdminSelf
          ? `<span class="text-muted">Active Admin</span>`
          : `<button type="button" class="btn btn-outline btn-sm" data-toggle-status-idx="${idx}">${isSuspended ? "Activate" : "Suspend"}</button>`;

        const removeBtn = !acc.builtIn
          ? `<button type="button" class="btn btn-danger-outline btn-sm" data-remove-acc-idx="${idx}">Remove</button>`
          : "";

        return `
          <tr>
            <td><strong>${escapeHtml(acc.name)}</strong></td>
            <td>${escapeHtml(acc.email)}</td>
            <td>${roleSelectHtml}</td>
            <td><span class="badge ${statusBadgeClass}">${escapeHtml(acc.status || "APPROVED")}</span></td>
            <td><div class="flex-wrap-gap">${toggleStatusBtn}${removeBtn}</div></td>
          </tr>
        `;
      })
      .join("");

    // Step 3: Bind Account Action Controls (Role, Suspend/Activate, Remove)
    tbody.querySelectorAll("[data-mod-role-idx]").forEach(function (selectEl) {
      selectEl.addEventListener("change", function () {
        if (!ctx.isAdmin) return;
        const idx = Number(selectEl.getAttribute("data-mod-role-idx"));
        const list = getAllAccounts();
        if (!list[idx]) return;
        list[idx].role = selectEl.value;
        saveAllAccounts(list);
        renderAdminAccountsPortal();
        showToast(`Updated role for ${list[idx].name} to ${list[idx].role}`);
      });
    });

    tbody.querySelectorAll("[data-toggle-status-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!ctx.isAdmin) return;
        const idx = Number(btn.getAttribute("data-toggle-status-idx"));
        const list = getAllAccounts();
        if (!list[idx]) return;
        list[idx].status = list[idx].status === "SUSPENDED" ? "APPROVED" : "SUSPENDED";
        saveAllAccounts(list);
        renderAdminAccountsPortal();
        showToast(`Account ${list[idx].email} set to ${list[idx].status}`);
      });
    });

    tbody.querySelectorAll("[data-remove-acc-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!ctx.isAdmin) return;
        const idx = Number(btn.getAttribute("data-remove-acc-idx"));
        const list = getAllAccounts();
        if (!list[idx] || list[idx].builtIn) return;
        const removed = list.splice(idx, 1);
        saveAllAccounts(list);
        renderAdminAccountsPortal();
        showToast(`Removed account ${removed[0] ? removed[0].email : ""}`);
      });
    });

    // Step 4: Render Admin Marketplace Listings Overview Table
    const listingsTbody = document.getElementById("admin-overview-listings-tbody");
    if (listingsTbody) {
      listingsTbody.innerHTML = props
        .map(function (prop) {
          const statusLabel = prop.badgeText || "Active Listing";
          return `
            <tr>
              <td>
                <div class="table-prop-cell">
                  <img src="${escapeHtml(prop.image)}" alt="${escapeHtml(prop.title)}" class="table-prop-thumb" onerror="this.src='${DEFAULT_PREVIEW_IMG}'" />
                  <div>
                    <strong>#${prop.id} &mdash; ${escapeHtml(prop.title)}</strong>
                    <div class="text-muted">Owner: ${escapeHtml(prop.seller || "Verified Landowner")}</div>
                  </div>
                </div>
              </td>
              <td>
                <strong>Brgy. ${escapeHtml(prop.barangay)}, Panabo City</strong>
                <div class="mt-1"><span class="badge badge-brown-soft">${escapeHtml(prop.type)}</span></div>
              </td>
              <td>
                <strong>${escapeHtml(formatPropertyPrice(prop))}</strong>
                <div class="text-muted">${Number(prop.area).toLocaleString()} sqm &bull; ${escapeHtml(prop.roadAccess || "Direct Road Access")}</div>
              </td>
              <td><span class="badge badge-green">${escapeHtml(statusLabel)}</span></td>
              <td>
                <div class="flex-wrap-gap">
                  <a href="property.html?id=${prop.id}" class="btn btn-outline btn-sm">View</a>
                  <button type="button" class="btn btn-outline btn-sm" data-admin-edit-id="${prop.id}">Edit</button>
                  <button type="button" class="btn btn-danger-outline btn-sm" data-admin-delete-id="${prop.id}">Delete</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");

      listingsTbody.querySelectorAll("[data-admin-edit-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (ctx.loadPropertyIntoEditForm) {
            ctx.loadPropertyIntoEditForm(btn.getAttribute("data-admin-edit-id"));
          }
        });
      });

      listingsTbody.querySelectorAll("[data-admin-delete-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (ctx.deletePropertyListingById) {
            ctx.deletePropertyListingById(btn.getAttribute("data-admin-delete-id"));
          }
        });
      });
    }
  }

  // Step 5: Reset Demo Data Button
  const adminResetDataBtn = document.getElementById("admin-reset-data-btn");
  if (adminResetDataBtn) {
    adminResetDataBtn.addEventListener("click", function () {
      if (!ctx.isAdmin) return;
      resetDemoData();
    });
  }

  // Step 6: Create New User / Admin Account Form
  const provForm = document.getElementById("admin-provision-form");
  if (provForm) {
    provForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!ctx.isAdmin || lockFormSubmission(provForm)) return;

      const role = document.getElementById("prov-role").value;
      const name = document.getElementById("prov-name").value.trim();
      const email = document.getElementById("prov-email").value.trim();
      const password = document.getElementById("prov-pass").value.trim();

      if (!name || !email || !email.includes("@") || password.length < 4) {
        showToast("Enter name, valid email, and at least 4-char password");
        return;
      }

      if (accountEmailExists(email)) {
        showToast("An account with that email already exists");
        return;
      }

      const list = getAllAccounts();
      list.push({
        id: `ACC-${Date.now()}`,
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
      showToast(`Created ${role} account for ${name}`);
    });
  }

  ctx.renderAdminAccountsPortal = renderAdminAccountsPortal;
}
