# YuTara — Panabo City Digital Land Marketplace
## 5-Minute Presentation & 3-Minute Live Debugging Guide (Team Cri-Ters)

---

## 1. How to Launch the Website (Zero `ERR_CONNECTION_REFUSED`)

You have **three offline ways** to open and present the website:

1. **1-Click Local Server (`http://localhost:8080`)**:
   - Double-click **`START_SERVER.bat`** inside `F:\Yutara website for Debugging\`.
   - It automatically starts a local HTTP server on port `8080` and opens `http://localhost:8080/index.html`.
2. **VS Code Run & Debug (`F5`)**:
   - Open `F:\Yutara website for Debugging` in VS Code and press **`F5`** (configured in `.vscode/launch.json`).
3. **Direct Offline File Mode**:
   - Double-click **`index.html`** directly in Windows File Explorer (`file:///F:/Yutara%20website%20for%20Debugging/index.html`). All images, CSS, and JavaScript work 100% offline with zero external CDNs.

---

## 2. Project Folder & File Structure (Modular & Easy to Debug)

```text
F:\Yutara website for Debugging\
├── START_SERVER.bat          # 1-click launcher for http://localhost:8080
├── PRESENTATION_GUIDE.md     # Architecture & 3-minute live debugging cheat sheet
├── index.html                # Homepage (Hero, Search, Featured Lots, Location Cards, 5-Step Process, Services, FAQ Accordion)
├── marketplace.html          # Marketplace Directory (Desktop Sidebar Filters, Mobile Filter Toggle, Sort, Pagination)
├── property.html             # Property Details (Photo Lightbox Zoom, Copy GPS Coordinates, Site Visit Modal, Related Lots)
├── reservation.html          # Simulated MVP Property Reservation Checkout
├── tracker.html              # MVP Workflows Hub (Buyer 5-Stage Milestone Tracker, Seller Intake Form, Agency Queue)
├── services.html             # Platform Services & MVP Scope Transparency
├── about.html                # Problem, Solution & Team Cri-Ters (Sam Tapar, John Aj I. Castro, Jian T. Castillon)
├── contact.html              # Panabo City Contact Channels, Official Facebook Link & Inquiry Form
├── login.html                # Split-Screen Login with Password Show/Hide Toggle & 1-Click Demo Roles
├── register.html             # 4-Step Identity Verification Onboarding Flow with Password Show/Hide Toggle
├── css/
│   └── styles.css            # Single stylesheet organized into 15 numbered sections (Official Logo Palette ONLY, zero !important)
├── js/
│   ├── data.js               # All Panabo City barangays, property listings (Panabo Lot 1 & Lot 2 at top), and milestones
│   └── app.js                # Clean vanilla JS organized into 12 numbered sections (Search, Filter, Pagination, Modals, CRUD)
└── assets/
    ├── yutara-logo.png       # Official YuTara Brand Logo
    ├── panabo-lot-1.jpg      # Real photo: Brgy. Gredu (229 sqm Commercial/Residential Lot with Existing House)
    ├── panabo-lot-2.jpg      # Real photo: Brgy. New Pandan (₱1.6M Markdown 200 sqm Fenced 2-Room House & Lot Near Agriya)
    ├── prop-1.jpg .. prop-6.jpg
    └── team-*.png            # Team Cri-Ters founder portraits
```

---

## 3. Where to Modify & Debug Common Instructor Challenges (3-Minute Cheat Sheet)

| Instructor Debugging Task | Exact File & Section | What to Edit |
| :--- | :--- | :--- |
| **1. Change Brand Colors or Typography** | `css/styles.css` — **Section 1 (`:root` lines 16–50)** | Edit `--forest-green: #315B19;`, `--olive-green: #71851B;`, `--earth-brown: #8B4A20;`, `--dark-brown: #593318;`, `--white: #FFFFFF;`, or `--soft-off-white: #FAFAF6;`. Every button, badge, header, and footer updates automatically. |
| **2. Edit Property Listings (Price, Area, Highlights, Barangay)** | `js/data.js` — **`DEFAULT_PROPERTIES` (lines 31–214)** | Edit **Lot 1 (`id: 1`, Brgy. Gredu)** or **Lot 2 (`id: 2`, Brgy. New Pandan)** at the very top of `js/data.js`, then click **Reset Demo Data** in the website footer to reload from `data.js`. |
| **3. Modify Property Card Layout or Category Badges** | `js/app.js` — **Section 3 (`createPropertyCardHTML`, lines 210–255)** | Edit the reusable property card template used across the Homepage, Marketplace, and Related Properties sections. |
| **4. Debug Marketplace Filtering, Sorting, or Pagination** | `js/app.js` — **Section 5 (`initMarketplacePage`, lines 335–545)** | Change `const ITEMS_PER_PAGE = 4;` (line 377) to adjust how many properties appear per page, or inspect `filterProperties()` (line 451) for keyword, barangay, category, price, and sort logic. |
| **5. Debug Hero Spotlight Switcher or Homepage Search** | `js/app.js` — **Section 4 (`initHomePage`, lines 273–330)** | `renderSpotlight(propId)` switches the hero featured card between Brgy. New Pandan (`id: 2`) and Brgy. Gredu (`id: 1`). |
| **6. Debug FAQ Accordion or Password Show/Hide Toggle** | `js/app.js` — **Section 2 (`initFaqAccordion` & `initPasswordToggles`, lines 180–205)** | Controls the `.faq-item.open` accordion state on `index.html` and the `Show`/`Hide` password toggle on `login.html` and `register.html`. |
| **7. Debug Login, 4-Step Registration, or Demo Sessions** | `js/app.js` — **Sections 8 & 9 (`initLoginPage` & `initRegisterPage`, lines 700–830)** | Controls validation rules, 1-click demo role buttons (`Buyer`, `Seller`, `Agency`), and the 4-step registration wizard. |
| **8. Debug 5-Stage Milestone Tracker or Seller Intake Form** | `js/app.js` — **Section 11 (`initTrackerPage`, lines 860–1035)** | `MILESTONE_STEPS` is defined in `js/data.js` (line 216). Seller form submissions save directly to `localStorage` and appear in `marketplace.html`. |

---

## 4. Recommended 5-Minute Presentation Flow

1. **Minute 0:00–1:00 — Problem & Brand Identity (`index.html`)**
   - Show the sticky navigation bar, two-column Hero section (*"Your Land. Your Opportunity. Your YuTara."*), and interactive **Featured Property Card switcher** toggling between **Brgy. New Pandan (₱1.6M Markdown, 200 sqm near Agriya)** and **Brgy. Gredu (229 sqm Commercial/Residential lot with existing house)**.
   - Scroll through **Explore Properties by Location**, **Why Choose YuTara?**, **How YuTara Works (5-Step Process)**, **Our Services**, and click an item in the **FAQ Accordion**.
2. **Minute 1:00–2:15 — Marketplace Discovery, Sidebar Filters & Pagination (`marketplace.html`)**
   - Use the **Left Filter Sidebar** (or **Quick Barangay Chips**) to filter by `Brgy. Gredu` or `Brgy. New Pandan`, sort by `Price: Low to High` or `Largest Lot Area`, and demonstrate the **Pagination controls (`Page 1`, `Page 2`, `Load All`)**.
3. **Minute 2:15–3:15 — Property Details & Verification Safeguards (`property.html`)**
   - Open **Brgy. Gredu** or **Brgy. New Pandan**, click the photo to open the **Lightbox Zoom**, click **Copy Coordinates**, and submit a **Request Site Visit** modal inquiry.
4. **Minute 3:15–4:15 — End-to-End MVP Workflows (`reservation.html` & `tracker.html`)**
   - Click **Reserve Property (MVP)** to create a simulated reservation (`TX-XXXX`), then open **MVP Workflows Hub** to show:
     - **Tab 1:** Buyer 5-stage progress bar & document vault.
     - **Tab 2:** Seller Property Intake Form (add a new Panabo listing live).
     - **Tab 3:** Partner Agency Queue (click **Advance to Next Milestone** and watch the progress percentage update live).
5. **Minute 4:15–5:00 — Authentication & Team Cri-Ters (`login.html`, `register.html`, `about.html`)**
   - Show the **Password Show/Hide toggle** and **1-Click Demo Login** on `login.html`, the **4-Step Verification Wizard** on `register.html`, and the **Team Cri-Ters** founder cards on `about.html`.
