/* ==========================================================================
   YuTara Page — Workspace Router & Auth Gate (js/pages/tracker.js -> tracker.html)
   Enforces login gate for guests, applies 2-Role RBAC (Admin vs User),
   controls collapsible sidebar/drawer, and coordinates workspace sub-modules.
   ========================================================================== */

function renderTrackerAuthGate() {
  const workspaceShell = document.getElementById("workspace-shell");
  if (workspaceShell) {
    workspaceShell.classList.add("hidden");
  }

  const requestedTab = getQueryParam("tab");
  const isSellerIntent = requestedTab === "panel-seller";
  const reasonText = isSellerIntent
    ? "You must log in first before you can list land for sale on YuTara."
    : "You must log in first to view your account listings, manage reservations, or add land for sale.";
  const loginHref = buildLoginUrl(getCurrentRelativeUrl());

  const gate = document.createElement("main");
  gate.id = "tracker-auth-gate";
  gate.className = "auth-page-gate";
  gate.setAttribute("role", "main");
  gate.innerHTML =
    '<section class="auth-gate-card anim-fade-up" data-anim="ytFadeInUp" aria-labelledby="auth-gate-heading">' +
    '  <img src="assets/yutara-logo.png" alt="YuTara" class="auth-gate-logo" />' +
    '  <div class="auth-guard-icon" aria-hidden="true">' +
    '    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">' +
    '      <rect x="4" y="11" width="16" height="10" rx="2.5" ry="2.5"></rect>' +
    '      <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>' +
    '      <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"></circle>' +
    "    </svg>" +
    "  </div>" +
    '  <h1 class="auth-guard-title" id="auth-gate-heading">Please Log In First</h1>' +
    '  <p class="auth-guard-message">' + escapeHtml(reasonText) + "</p>" +
    '  <p class="auth-guard-subtext">Sign in to your YuTara account or register a free account to continue.</p>' +
    '  <div class="auth-guard-divider" aria-hidden="true"></div>' +
    '  <div class="auth-guard-actions">' +
    '    <a href="' + escapeHtml(loginHref) + '" class="btn btn-primary auth-guard-btn-login" id="gate-login-btn">' +
    '      <svg class="auth-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '        <circle cx="12" cy="8" r="4"></circle>' +
    '        <path d="M4 20c0-3.8 3.6-6.5 8-6.5s8 2.7 8 6.5"></path>' +
    "      </svg>" +
    "      <span>Log In Now &rarr;</span>" +
    "    </a>" +
    '    <a href="register.html" class="btn btn-outline auth-guard-btn-register" id="gate-register-btn">' +
    '      <svg class="auth-btn-icon" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '        <circle cx="9.5" cy="8" r="3.8"></circle>' +
    '        <path d="M2.5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"></path>' +
    '        <path d="M19 8v6M16 11h6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path>' +
    "      </svg>" +
    "      <span>Create Account</span>" +
    "    </a>" +
    "  </div>" +
    '  <a href="marketplace.html" class="auth-gate-back">&larr; Back to Panabo Marketplace</a>' +
    "</section>";
  document.body.appendChild(gate);
}

function initTrackerPage() {
  const tabContainer = document.getElementById("workflow-tabs");
  if (!tabContainer) return;

  const session = getSession();
  if (!session) {
    renderTrackerAuthGate();
    return;
  }

  const currentRole = session.role || "User";
  const currentName = session.name || "YuTara User";
  const currentEmail = session.email || "";
  const isAdmin = currentRole === "Admin";
  const isStandardUser = !isAdmin;

  const tabBtns = tabContainer.querySelectorAll("[data-tab]");
  const rbacAlert = document.getElementById("rbac-alert");

  function isTabAllowedForRole(targetId) {
    if (isAdmin) {
      return targetId === "panel-accounts" || targetId === "panel-seller";
    }
    return targetId === "panel-buyer" || targetId === "panel-seller";
  }

  function applyRolePermissionsToUI() {
    const sidebarBrandLink = document.getElementById("sidebar-brand-link");
    const sidebarLogoImg = document.getElementById("sidebar-logo-img");
    const mobileTopbarLogo = document.getElementById("mobile-topbar-logo");
    const mobileTopbarTitle = document.getElementById("mobile-topbar-title");
    const brandSub = document.getElementById("sidebar-brand-sub");
    const groupTitle = document.getElementById("sidebar-group-title");
    const avatarEl = document.getElementById("sidebar-avatar");
    const displayEl = document.getElementById("active-account-display");
    const emailEl = document.getElementById("sidebar-profile-email");

    const navHome = document.getElementById("nav-item-home");
    const navMarketplace = document.getElementById("nav-item-marketplace");
    const navUserProps = document.getElementById("nav-item-user-props");
    const navUserSell = document.getElementById("nav-item-user-sell");
    const navAdminAccounts = document.getElementById("nav-item-admin-accounts");

    const heading = document.getElementById("dashboard-heading");
    const adminCrudCard = document.getElementById("admin-crud-card");
    const adminEditOnlyNotice = document.getElementById("admin-edit-only-notice");
    const tabBtnSeller = document.getElementById("tab-btn-seller");
    const tabBtnSellerLabel = document.getElementById("tab-btn-seller-label");
    const lifecycleBar = document.getElementById("seller-lifecycle-bar");
    const photoGroup = document.getElementById("seller-photo-group");

    if (avatarEl) avatarEl.textContent = getInitials(currentName);
    if (displayEl) displayEl.textContent = currentName;
    if (emailEl) emailEl.textContent = currentEmail;

    if (sidebarLogoImg) {
      sidebarLogoImg.src = "assets/yutara-logo.png";
      sidebarLogoImg.alt = "YuTara Logo";
      sidebarLogoImg.className = "sidebar-logo-img";
    }
    if (mobileTopbarLogo) mobileTopbarLogo.src = "assets/yutara-logo.png";

    if (isAdmin) {
      if (sidebarBrandLink) sidebarBrandLink.setAttribute("href", "tracker.html?tab=panel-accounts");
      if (mobileTopbarTitle) mobileTopbarTitle.textContent = "Admin Portal";
      if (brandSub) brandSub.textContent = "Admin Dashboard";
      if (groupTitle) groupTitle.textContent = "Admin Controls";
      if (navHome) navHome.classList.add("hidden");
      if (navMarketplace) navMarketplace.classList.add("hidden");
      if (navUserProps) navUserProps.classList.add("hidden");
      if (navAdminAccounts) navAdminAccounts.classList.remove("hidden");
      if (navUserSell) navUserSell.classList.remove("hidden");
      if (tabBtnSellerLabel) tabBtnSellerLabel.textContent = "Edit / Delete Properties";
      if (tabBtnSeller) tabBtnSeller.setAttribute("title", "Edit / Delete Properties");
      if (adminCrudCard) adminCrudCard.classList.remove("hidden");
      if (adminEditOnlyNotice) adminEditOnlyNotice.classList.remove("hidden");
      if (lifecycleBar) lifecycleBar.classList.add("hidden");
      if (photoGroup) photoGroup.classList.add("hidden");
    } else {
      if (sidebarBrandLink) sidebarBrandLink.setAttribute("href", "marketplace.html");
      if (mobileTopbarTitle) mobileTopbarTitle.textContent = "My Account Listings";
      if (brandSub) brandSub.textContent = "Yuta ba? YuTara!";
      if (groupTitle) groupTitle.textContent = "User Navigation";
      if (heading) heading.textContent = "Welcome back, " + currentName + "!";
      if (navHome) navHome.classList.add("hidden");
      if (navMarketplace) navMarketplace.classList.remove("hidden");
      if (navUserProps) navUserProps.classList.remove("hidden");
      if (navUserSell) navUserSell.classList.remove("hidden");
      if (navAdminAccounts) navAdminAccounts.classList.add("hidden");
      if (adminCrudCard) adminCrudCard.classList.add("hidden");
      if (adminEditOnlyNotice) adminEditOnlyNotice.classList.add("hidden");
      if (tabBtnSellerLabel) tabBtnSellerLabel.textContent = "Add Land for Sale";
      if (tabBtnSeller) tabBtnSeller.setAttribute("title", "Add Land for Sale");
      if (lifecycleBar) lifecycleBar.classList.remove("hidden");
      if (photoGroup) photoGroup.classList.remove("hidden");
    }
  }

  // Desktop collapsible sidebar & mobile drawer controls
  const workspaceShellEl = document.getElementById("workspace-shell");
  const collapseBtn = document.getElementById("sidebar-collapse-btn");
  const mobileDrawerBtn = document.getElementById("mobile-sidebar-btn");
  const mobileBackdrop = document.getElementById("sidebar-mobile-backdrop");
  const mobileLogoutBtn = document.getElementById("mobile-logout-btn");

  if (collapseBtn && workspaceShellEl) {
    collapseBtn.addEventListener("click", function () {
      const collapsed = workspaceShellEl.classList.toggle("sidebar-collapsed");
      collapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });
  }

  function closeMobileDrawer() {
    if (workspaceShellEl) workspaceShellEl.classList.remove("drawer-open");
  }

  if (mobileDrawerBtn && workspaceShellEl) {
    mobileDrawerBtn.addEventListener("click", function () {
      workspaceShellEl.classList.toggle("drawer-open");
    });
  }
  if (mobileBackdrop) mobileBackdrop.addEventListener("click", closeMobileDrawer);
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", requestLogoutConfirmation);

  function activateTab(targetId) {
    if (!isTabAllowedForRole(targetId)) {
      if (rbacAlert) {
        rbacAlert.textContent =
          "Access Restricted: Your current role (" +
          currentRole +
          ") is not authorized for that section.";
        rbacAlert.classList.remove("hidden");
      }
      targetId = getDefaultTabForRole(currentRole);
    }

    tabBtns.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === targetId);
    });
    document.querySelectorAll(".tab-panel").forEach(function (panel) {
      const isActive = panel.id === targetId;
      panel.classList.toggle("hidden", !isActive);
      if (isActive) {
        replayTabAnimation(panel);
      }
    });
  }

  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (rbacAlert) rbacAlert.classList.add("hidden");
      closeMobileDrawer();
      activateTab(btn.getAttribute("data-tab"));
    });
  });

  // Shared context object passed across workspace sub-modules
  const ctx = {
    currentRole: currentRole,
    currentName: currentName,
    currentEmail: currentEmail,
    isAdmin: isAdmin,
    isStandardUser: isStandardUser,
    activateTab: activateTab,
    refreshAll: function () {
      if (ctx.renderUserWorkspace) ctx.renderUserWorkspace();
      if (ctx.renderAdminAccountsPortal) ctx.renderAdminAccountsPortal();
      if (ctx.renderWorkflows) ctx.renderWorkflows();
      if (ctx.renderManagedProperties) ctx.renderManagedProperties();
    }
  };

  applyRolePermissionsToUI();

  const initialTab = getQueryParam("tab");
  if (initialTab && document.getElementById(initialTab)) {
    activateTab(initialTab);
  } else {
    const roleTab = getDefaultTabForRole(currentRole);
    if (document.getElementById(roleTab)) {
      activateTab(roleTab);
    }
  }

  initTrackerListings(ctx);
  initTrackerReservations(ctx);
  initTrackerAdmin(ctx);
  ctx.refreshAll();
}

document.addEventListener("DOMContentLoaded", initTrackerPage);
