/* ==========================================================================
   YuTara Land Marketplace — Data Store (Easy to Edit for Live Debugging)
   Panabo Lot 1 (Brgy. Gredu) and Panabo Lot 2 (Brgy. New Pandan) are at top.
   ========================================================================== */

const PANABO_BARANGAYS = [
  "A.O. Floirendo",
  "Buenavista",
  "Cacao",
  "Cagangohan",
  "Consolacion",
  "Datu Abdul Dadia",
  "Gredu",
  "J.P. Laurel",
  "Kasilak",
  "Katipunan",
  "Kauswagan",
  "Little Panay",
  "Mabuhay",
  "New Pandan",
  "Poblacion",
  "Salvacion",
  "San Francisco",
  "San Nicolas",
  "San Pedro",
  "San Vicente",
  "Southern Davao",
  "Waterfall"
];

const DEFAULT_PROPERTIES = [
  {
    id: 1,
    title: "Commercial & Residential Lot with Existing House",
    type: "Commercial",
    barangay: "Gredu",
    city: "Panabo City",
    province: "Davao del Norte",
    price: 0,
    priceLabel: "Negotiable (For Sale)",
    priceNote: "Negotiable for serious buyers",
    area: 229,
    roadAccess: "Accessible Paved Road with Wide Frontage",
    badgeText: "Clean Title",
    badgeStyle: "badge-green",
    verificationStatus: "Active Listing",
    promoted: true,
    seller: "Juan Dela Cruz",
    ownerEmail: "user@yutara.ph",
    latitude: "7.3008",
    longitude: "125.6876",
    image: "assets/panabo-lot-1.jpg",
    documents: {
      tct: { label: "Clean Transfer Certificate of Title (TCT / OCT)", refNo: "TCT No. 142-2023004819", submitted: true, legitimate: true },
      taxDec: { label: "Updated Real Property Tax Declaration & Clearance", refNo: "TD-2026-GREDU-0192", submitted: true, legitimate: true },
      ownerId: { label: "Verified Owner Government ID & Deed / Authority", refNo: "Owner ID & Registry Matched", submitted: true, legitimate: true }
    },
    cardTags: ["Existing House", "Near School", "Business Frontage"],
    highlights: [
      "229 SQM Lot Area",
      "Clean Title",
      "With existing house & commercial roll-up frontage",
      "Near school (Duol sa eskwelahan)",
      "Ideal for store, rental, boarding house, or business",
      "Accessible road with wide frontage",
      "Great for residence, investment, or business",
      "For sale — negotiable for serious buyers"
    ],
    description:
      "229 sqm clean-titled lot in Brgy. Gredu, Panabo City with an existing house and dual roll-up commercial frontage along a paved, accessible road near a school. Ideal for living, tindahan, paupahan, boarding house, or business investment. Price negotiable for serious buyers."
  },
  {
    id: 2,
    title: "Fenced 2-Room House & Lot Near Agriya",
    type: "Residential",
    barangay: "New Pandan",
    city: "Panabo City",
    province: "Davao del Norte",
    price: 1600000,
    priceLabel: "₱1,600,000",
    priceNote: "Markdown Selling Price",
    area: 200,
    roadAccess: "Accessible Residential Street with Parking Space",
    badgeText: "For Sale",
    badgeStyle: "badge-green",
    verificationStatus: "Active Listing",
    promoted: true,
    seller: "Juan Dela Cruz",
    ownerEmail: "user@yutara.ph",
    latitude: "7.3148",
    longitude: "125.6792",
    image: "assets/panabo-lot-2.jpg",
    documents: {
      tct: { label: "Clean Transfer Certificate of Title (TCT / OCT)", refNo: "TCT No. 142-2024001154", submitted: true, legitimate: true },
      taxDec: { label: "Updated Real Property Tax Declaration & Clearance", refNo: "TD-2026-NPANDAN-0842", submitted: true, legitimate: true },
      ownerId: { label: "Verified Owner Government ID & Deed / Authority", refNo: "Owner Gov ID & Authority to Sell", submitted: true, legitimate: true }
    },
    cardTags: ["Updated Tax", "2 Rooms & Fence", "Near Agriya"],
    highlights: [
      "₱1.6M Selling Price (Markdown)",
      "200 SQM Lot Area",
      "Clean Title ready for transfer",
      "Updated Real Property Tax",
      "With Davao Light & Water District connection",
      "With 2 rooms",
      "Complete fence and parking space",
      "Near Agriya & Doña Nenita Elementary School"
    ],
    description:
      "Markdown selling price of ₱1,600,000 for a 200 sqm fenced house and lot in Brgy. New Pandan, Panabo City. Includes clean title ready for transfer, updated tax records, Davao Light and Water District connection, 2 rooms, complete perimeter fence, and parking space near Agriya and Doña Nenita Elementary School."
  },
  {
    id: 3,
    title: "Quiet Family Lot Near the City Center",
    type: "Residential",
    barangay: "San Vicente",
    city: "Panabo City",
    province: "Davao del Norte",
    price: 2500000,
    priceLabel: "₱2,500,000",
    priceNote: "Open for offers",
    area: 200,
    roadAccess: "Accessible from Barangay Road",
    badgeText: "Clean Title",
    badgeStyle: "badge-green",
    verificationStatus: "Active Listing",
    promoted: true,
    seller: "Maya Santos",
    ownerEmail: "maya.santos@yutara.ph",
    latitude: "7.3080",
    longitude: "125.6840",
    image: "assets/Amiya-Lot-For-Sale-Davao-City-Lot-For-Sale-1.jpg",
    documents: {
      tct: { label: "Clean Transfer Certificate of Title (TCT / OCT)", refNo: "TCT No. 142-2022007721", submitted: true, legitimate: true },
      taxDec: { label: "Updated Real Property Tax Declaration & Clearance", refNo: "TD-2026-SVIC-0311", submitted: true, legitimate: true },
      ownerId: { label: "Verified Owner Government ID & Deed / Authority", refNo: "Owner Gov ID Verified", submitted: true, legitimate: true }
    },
    cardTags: ["Clean Title", "Concrete Road", "Near City Center"],
    highlights: [
      "200 SQM Residential Lot",
      "Clean Title ready for transfer",
      "Accessible along concrete barangay road",
      "Close to Panabo City essentials"
    ],
    description:
      "Flat residential lot along a paved concrete road in Brgy. San Vicente, Panabo City, surrounded by greenery and close to everyday essentials and schools."
  },
  {
    id: 4,
    title: "Productive Coconut Land with Road Access",
    type: "Agricultural",
    barangay: "Cagangohan",
    city: "Panabo City",
    province: "Davao del Norte",
    price: 3900000,
    priceLabel: "₱3,900,000",
    priceNote: "Open for offers",
    area: 1800,
    roadAccess: "Accessible from National Road",
    badgeText: "For Sale",
    badgeStyle: "badge-green",
    verificationStatus: "Active Listing",
    promoted: false,
    seller: "Lio Navarro",
    ownerEmail: "lio.navarro@yutara.ph",
    latitude: "7.3310",
    longitude: "125.6760",
    image: "assets/Land-for-sale-in-Panabo.jpg",
    documents: {
      tct: { label: "Clean Transfer Certificate of Title (TCT / OCT)", refNo: "TCT No. 142-2024006218", submitted: true, legitimate: true },
      taxDec: { label: "Updated Real Property Tax Declaration & Clearance", refNo: "TD-2026-CAG-0518", submitted: true, legitimate: true },
      ownerId: { label: "Verified Owner Government ID & Deed / Authority", refNo: "Owner Gov ID Verified", submitted: true, legitimate: true }
    },
    cardTags: ["Road Frontage", "Coconut Farm", "1,800 SQM"],
    highlights: [
      "1,800 SQM Agricultural Lot",
      "Direct gravel & barangay road access",
      "Productive mature coconut trees on site",
      "Clean title & updated tax declaration available"
    ],
    description:
      "Productive agricultural land planted with mature coconut and fruit trees with direct road frontage in Brgy. Cagangohan, Panabo City."
  }
];

const DEMO_ACCOUNTS = [
  {
    key: "admin",
    name: "YuTara System Admin",
    email: "admin@yutara.ph",
    password: "admin123",
    role: "Admin",
    title: "Account Modification & Property Edit/Delete Admin",
    defaultTab: "panel-accounts"
  },
  {
    key: "user",
    name: "Juan Dela Cruz",
    email: "user@yutara.ph",
    password: "user123",
    role: "User",
    title: "Marketplace Viewer & Account Landowner",
    defaultTab: "panel-buyer"
  }
];

const MILESTONE_STEPS = [
  "Reservation requested",
  "Seller accepted",
  "Documents exchanged",
  "Site visit completed",
  "Transaction complete"
];

const DEFAULT_TRANSACTIONS = [
  {
    id: "TX-1001",
    propertyId: 2,
    propertyTitle: "Fenced 2-Room House & Lot Near Agriya",
    location: "Brgy. New Pandan, Panabo City",
    buyerName: "Juan Dela Cruz",
    buyerEmail: "user@yutara.ph",
    sellerName: "Verified Panabo Owner",
    sellerEmail: "owner@yutara.ph",
    salePrice: 1600000,
    priceLabel: "₱1,600,000",
    reservationFee: 25000,
    stageIndex: 1,
    approvalStatus: "approved",
    status: "active",
    documents: [
      { name: "Clean Transfer Certificate of Title (TCT Copy)", status: "Shared with Buyer" },
      { name: "Updated Real Property Tax Clearance", status: "Submitted" },
      { name: "Davao Light & Water Utility Verification", status: "Checked" }
    ]
  }
];

const DEFAULT_INQUIRIES = [
  {
    id: "INQ-2001",
    type: "Request Site Visit",
    propertyTitle: "Commercial & Residential Lot with Existing House (Brgy. Gredu)",
    senderName: "Juan Dela Cruz",
    contactInfo: "0917-555-0192",
    message: "Requesting an accompanied weekend inspection of the 229 sqm commercial frontage near the school.",
    status: "Scheduled",
    createdAt: "2026-11-22"
  },
  {
    id: "INQ-2002",
    type: "Buyer Property Inquiry",
    propertyTitle: "Fenced 2-Room House & Lot Near Agriya (Brgy. New Pandan)",
    senderName: "Maria Clara",
    contactInfo: "maria.clara@example.com",
    message: "Please confirm if the clean TCT and updated Real Property Tax clearance are ready for agency review.",
    status: "Open",
    createdAt: "2026-11-23"
  }
];
