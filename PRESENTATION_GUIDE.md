# YuTara — Panabo City Digital Land Marketplace
## Full Presentation Checklist & 3-Minute Live Debugging Guide (Team Cri-Ters)

---

## 1. How to Launch the Application

1. **1-Click Local Server (`http://localhost:8080`)**:
   - Double-click **`START_SERVER.bat`** inside `F:\Yutara website for Debugging\`.
   - It launches a local HTTP server on port `8080` and opens `http://localhost:8080/index.html`.
2. **VS Code Run & Debug (`F5`)**:
   - Open `F:\Yutara website for Debugging` in VS Code and press **`F5`** (configured via `.vscode/launch.json`).
3. **Offline Direct Mode**:
   - Open **`index.html`** directly in any browser (`file:///F:/Yutara%20website%20for%20Debugging/index.html`). All assets, SVG icons, CSS, and JavaScript run 100% offline with zero external dependencies.

---

## 2. Project Architecture & Folder Structure

```text
F:\Yutara website for Debugging\
├── START_SERVER.bat          # 1-click local HTTP server launcher (http://localhost:8080)
├── PRESENTATION_GUIDE.md     # 10-point live demo script & 3-minute debugging cheat sheet
├── index.html                # Visual-first Homepage (Hero, Icon Search, Featured Lots, Location Cards, 4 Feature Cards, 5 Connected Steps, FAQ)
├── marketplace.html          # Marketplace Directory (Desktop Sidebar Filters, Mobile Filter Drawer, Sort, Pagination)
├── property.html             # Property Details (Photo Lightbox Zoom, Copy GPS Coordinates, Persisted Site Visit Modal, Related Lots)
├── reservation.html          # Simulated MVP Property Reservation Checkout
├── tracker.html              # MVP Workflows & Dashboard Hub (1. Buyer Tracker, 2. Property CRUD, 3. Agency Queue, 4. Inquiries Log)
├── services.html             # Platform Services & MVP Scope Transparency
├── about.html                # Problem, Solution & Team Cri-Ters (Sam Tapar, John Aj I. Castro, Jian T. Castillon)
├── contact.html              # Panabo City Contact Channels, Official Facebook Link & Persisted Inquiry Form
├── login.html                # Split-Screen Login with Password Show/Hide Toggle & 1-Click Demo Roles
├── register.html             # 4-Step Identity Verification Onboarding Wizard with Password Show/Hide Toggle
├── css/
│   └── styles.css            # Centralized stylesheet (15 numbered sections, Official Logo Palette ONLY, zero !important)
├── js/
│   ├── data.js               # Seed Data Store: PANABO_BARANGAYS, DEFAULT_PROPERTIES (Lot 1 & Lot 2 at top), MILESTONE_STEPS, DEFAULT_TRANSACTIONS, DEFAULT_INQUIRIES
│   └── app.js                # Modular Vanilla JS (12 numbered sections: Diagnostics, Search/Filter/Pagination, Auth, Full CRUD, Milestone & Inquiry Management)
└── assets/
    ├── yutara-logo.png       # Official YuTara Brand Logo
    ├── panabo-lot-1.jpg      # Real photo: Brgy. Gredu (229 sqm Commercial/Residential Lot with Existing House)
    ├── panabo-lot-2.jpg      # Real photo: Brgy. New Pandan (₱1.6M Markdown 200 sqm Fenced 2-Room House & Lot Near Agriya)
    ├── prop-1.jpg .. prop-6.jpg
    └── team-*.png            # Team Cri-Ters founder portraits
```

---

## 3. 10-Point Live Demonstration Checklist (5-Minute Presentation)

1. **Opening the Homepage (`index.html`)**
   - Highlight the two-column Hero (*"Your Land. Your Opportunity. YuTara!"*), light sage green primary CTA (`#DCECCB`), light earth brown secondary CTA (`#E8C7A5`), compact icon trust indicators, and the interactive **Featured Property Card switcher** (`Brgy. New Pandan ₱1.6M` ↔ `Brgy. Gredu 229 sqm`).
2. **Navigating the Website**
   - Use the sticky white navigation bar to move between `Home`, `Marketplace`, `MVP Workflows`, `Services`, `About Us`, and `Contact Us`.
3. **Searching for Properties (`index.html` → `marketplace.html`)**
   - Type `Agriya` or `Gredu` in the homepage search bar (or click a **Popular Areas** chip) to jump straight to filtered results on `marketplace.html`.
4. **Applying Property Filters, Sorting & Pagination (`marketplace.html`)**
   - Filter by **Panabo City Barangay** (`Brgy. Gredu`, `Brgy. New Pandan`), **Property Type** (`Commercial`, `Residential`), and **Min/Max Price**, change **Sort By** (`Price: Low to High` or `Largest Lot Area`), and click **Page 1 → Page 2 → Load All (6)**.
5. **Viewing Property Information & Submitting a Site Visit (`property.html`)**
   - Click a property card, click the photo to open the **Lightbox Zoom**, click **Copy Coordinates**, and submit the **Request Site Visit** modal (which saves a live `INQ-XXXX` record to the dashboard).
6. **Demonstrating Authentication (`login.html` & `register.html`)**
   - Show the **Password Show/Hide toggle**, click a **1-Click Demo Login** (`Demo Buyer`, `Demo Seller`, `Demo Agency`), or step through the **4-Step Identity Verification Registration Wizard**.
7. **Demonstrating User, Seller & Admin/Agency Dashboard Functions (`tracker.html`)**
   - **Tab 1 (Buyer Dashboard & Tracker):** Inspect the 5-stage milestone progress bar and Document Vault.
   - **Tab 2 (Property Management CRUD):** Create a new property listing, click **Edit** on an existing listing to update its price/title, or click **Delete** to remove a listing.
   - **Tab 3 (Admin & Agency Verification Desk):** Click **Advance to Next Milestone** (or **Reset Stage**) and watch the progress bar and summary stats update immediately.
   - **Tab 4 (Inquiries & Site Visits Log):** View persisted site visit requests and contact inquiries, click **Advance Inquiry Status** (`Open` → `Scheduled` → `Resolved`), or delete an inquiry.
8. **Showing the Project Structure**
   - Open `css/styles.css`, `js/data.js`, and `js/app.js` in VS Code to show the numbered section headers.
9. **Explaining the Technical Architecture**
   - Pure HTML5 + CSS3 Custom Variables + Modular Vanilla ES6 JavaScript backed by a browser `localStorage` data layer (`yutara_v3_properties`, `yutara_v3_saved`, `yutara_v3_transactions`, `yutara_v3_inquiries`, `yutara_v3_session`) with automatic seed fallback from `js/data.js` and structured diagnostic reporting (`reportDiagnostic()`).
10. **Demonstrating a Safe 3-Minute Live Debugging Scenario**
    - Use the table below to modify colors, property data, pagination size, or validation rules in under 30 seconds.

---

## 4. 3-Minute Live Debugging Cheat Sheet

| Evaluator Debugging Challenge | File & Section | Exact Lines / Variable to Edit |
| :--- | :--- | :--- |
| **Change Brand Colors or Button Theme** | `css/styles.css` — **Section 1 (`:root`) & Section 6 (`.hero-actions`)** | Edit `--forest-green: #315B19;`, `--earth-brown: #8B4A20;` (lines 26–31) or hero buttons `#DCECCB` / `#E8C7A5` (lines 585–625). |
| **Modify Default Panabo Lot 1 or Lot 2 Data** | `js/data.js` — **`DEFAULT_PROPERTIES`** | Edit Lot 1 (`id: 1`, Brgy. Gredu, line 32) or Lot 2 (`id: 2`, Brgy. New Pandan, line 66), then click **Reset Demo Data** in the footer. |
| **Change Cards Per Page in Marketplace Pagination** | `js/app.js` — **Section 5 (`initMarketplacePage`)** | Change `const ITEMS_PER_PAGE = 4;` to `2` or `3` or `6`. |
| **Modify Property Card Icon Pills or Layout** | `js/app.js` — **Section 3 (`createPropertyCardHTML`)** | Edit `SVG_ICONS` or `createPropertyCardHTML(prop)` (lines 290–355). |
| **Inspect Structured Error & Diagnostic Logs** | `js/app.js` — **Section 1 (`reportDiagnostic`)** | Open Chrome DevTools Console (`F12`) to view `[YuTara Diagnostic] Layer=... | Component=... | Operation=...` logs whenever storage or validation errors occur. |
