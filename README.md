# YuTara — Panabo City Digital Land Marketplace

Static HTML, modular CSS, and vanilla JavaScript platform for discovering, listing, messaging about, and reserving land properties in **Panabo City, Davao del Norte**. Built with zero frameworks and zero build steps so every page can be opened directly or served locally and debugged cleanly in Chrome DevTools.

## Project Structure

```text
YuTara-Website/
├── index.html                      # Homepage (hero, spotlight, search, featured lots, districts, FAQ)
├── marketplace.html                # Property directory (sidebar filters, barangay chips, sort, pagination)
├── property.html                   # Property detail (lightbox gallery, coordinates, actions, direct chat)
├── reservation.html                # Auth-guarded property reservation request
├── login.html                      # Split-screen account sign-in
├── register.html                   # Botanical 4-step User registration wizard
├── about.html                      # About YuTara & Team Cri-Ters founders
├── services.html                   # Core YuTara Digital Land Services (6 illustrated cards)
├── contact.html                    # Contact form & Panabo City operations info
├── tracker.html                    # 2-Role Workspace (User listings/reservations & Admin portal)
│
├── assets/                         # Real Panabo land photos, service illustrations, team photos & logos
│
├── css/
│   ├── base.css                    # Brand palette (:root), clean typography, reset, containers & grids
│   ├── components.css              # Navbar, footer, buttons, badges, forms, cards, modals & auth guard
│   ├── utilities.css               # Keyframes, animation debug modes, responsive breakpoints & .hidden
│   └── pages/
│       ├── home.css                # Homepage hero, spotlight, search bar, 5-step process & FAQ
│       ├── marketplace.css         # Marketplace sidebar, pagination, property detail & chat thread
│       ├── auth.css                # Login split stage & Register 4-step botanical layout
│       ├── info.css                # About Us, Team Cri-Ters & Services illustrated card layout
│       └── workspace.css           # Workspace sidebar, KPIs, tables, milestones & Add Land form
│
└── js/
    ├── data.js                     # Static seed data (Panabo barangays, properties, accounts, milestones)
    ├── core/
    │   ├── utils.js                # Storage keys, YuTaraAnimDebug, diagnostics, toast, formatters
    │   ├── store.js                # localStorage persistence (properties, saved, bookings, chat, accounts)
    │   ├── auth.js                 # sessionStorage auth (auto-logout on close), modals & RBAC routing
    │   └── ui.js                   # Shared navbar, guest link guards, FAQ, password toggles & property cards
    └── pages/
        ├── home.js                 # index.html
        ├── marketplace.js          # marketplace.html
        ├── property.js             # property.html
        ├── reservation.js          # reservation.html
        ├── login.js                # login.html
        ├── register.js             # register.html
        ├── contact.js              # contact.html
        ├── tracker-listings.js     # tracker.html — Add Land for Sale & Admin property inventory
        ├── tracker-reservations.js # tracker.html — User listings & Buyer-Seller reservations
        ├── tracker-admin.js        # tracker.html — Admin accounts CRUD & overview table
        └── tracker.js              # tracker.html — Auth gate, sidebar/drawer & RBAC tab router
```

## Live Presentation Debugging Cheat Sheet

Every JS and CSS file begins with a **`QUICK DEBUG INDEX`** comment block so you can jump straight to the exact function or style rule during a live code defense:

| Common Live Debugging Task | Exact File | Symbol / Section to Edit |
| :--- | :--- | :--- |
| **Change brand colors, fonts, or border radius** | `css/base.css` | `:root` variables (`--forest-green`, `--font-display`, `--font-sans`) |
| **Swap or customize the Promotional Video** | `index.html` & `js/pages/home.js` | `#promo-video` (`assets/yutara-promo.mp4` & Step 5 player handler) |
| **Add/edit default properties, barangays, or demo accounts** | `js/data.js` | `PANABO_BARANGAYS`, `DEFAULT_PROPERTIES`, `DEMO_ACCOUNTS` |
| **Edit the 5 reservation milestone stages** | `js/data.js` | `MILESTONE_STEPS` |
| **Change items per page or filter/sort logic** | `js/pages/marketplace.js` | `ITEMS_PER_PAGE` (default `4`), `filterProperties()` |
| **Modify property card layout or badges** | `js/core/ui.js` & `css/components.css` | `createPropertyCardHTML(prop)` & `.property-card` |
| **Adjust login validation or demo role buttons** | `js/pages/login.js` | `initLoginPage()` (Steps 1–4) |
| **Adjust 4-step registration validation rules** | `js/pages/register.js` | `validateStep(stepNum)` & `form.addEventListener("submit", ...)` |
| **Change session storage / auto-logout / guest modal** | `js/core/auth.js` | `getSession()`, `requireLoginForAction()`, `requestLogoutConfirmation()` |
| **Edit "Add Land for Sale" or Admin property editor** | `js/pages/tracker-listings.js` | `initTrackerListings(ctx)` |
| **Edit Seller reservation Accept / Reject / Advance Stage** | `js/pages/tracker-reservations.js` | `renderWorkflows()` |
| **Edit Admin Account Role / Suspend / Create logic** | `js/pages/tracker-admin.js` | `renderAdminAccountsPortal()` & `#admin-provision-form` |

## Running Locally

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/index.html` (or press **F5** in VS Code using `.vscode/launch.json`). Because scripts use ordered classic `<script>` tags, pages also work without a build step or bundler.

## Demo Accounts

- **User (Buyer & Landowner):** `user@yutara.ph` / `user123`
- **Admin:** `admin@yutara.ph` / `admin123`

Active login sessions are stored in `sessionStorage`, so closing the browser tab or window logs the user out automatically.

## Built-In Console Helpers

Open **Chrome DevTools Console (`F12`)** on any page:

- **Inspect caught errors:** `window.YuTaraDiagnostics`
- **Slow down animations 5x:** `YuTaraAnimDebug.slow()` (or append `?debugAnim=slow` to any URL)
- **Disable animations:** `YuTaraAnimDebug.off()` (or append `?debugAnim=off`)
- **Restore normal animations:** `YuTaraAnimDebug.normal()`
- **Reset all local demo data:** `resetDemoData()` (or click **Reset Demo Data** in the footer)
