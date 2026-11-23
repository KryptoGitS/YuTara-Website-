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
    promoted: true,
    seller: "Verified Panabo Owner",
    latitude: "7.3008",
    longitude: "125.6876",
    image: "assets/panabo-lot-1.jpg",
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
    badgeText: "Markdown Price",
    badgeStyle: "badge-warning",
    promoted: true,
    seller: "Verified Panabo Owner",
    latitude: "7.3148",
    longitude: "125.6792",
    image: "assets/panabo-lot-2.jpg",
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
    promoted: true,
    seller: "Maya Santos",
    latitude: "7.3080",
    longitude: "125.6840",
    image: "assets/prop-1.jpg",
    cardTags: ["Clean Title", "Barangay Road", "Near City Center"],
    highlights: [
      "200 SQM Residential Lot",
      "Clean Title screened for MVP",
      "Accessible from Barangay Road",
      "Close to Panabo City essentials"
    ],
    description:
      "A gently sloping residential lot in a growing Panabo City neighborhood, close to everyday essentials and schools."
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
    badgeText: "Agricultural",
    badgeStyle: "badge-green",
    promoted: false,
    seller: "Lio Navarro",
    latitude: "7.3310",
    longitude: "125.6760",
    image: "assets/prop-2.jpg",
    cardTags: ["National Road", "Coconut Farm", "Tax Dec Ready"],
    highlights: [
      "1,800 SQM Agricultural Lot",
      "Accessible from National Road",
      "Productive coconut trees on site",
      "Tax declaration available for review"
    ],
    description:
      "Productive agricultural land with direct road access and a calm rural setting in Brgy. Cagangohan, Panabo City."
  },
  {
    id: 5,
    title: "Open Farm Land with Creek Access",
    type: "Agricultural",
    barangay: "Kasilak",
    city: "Panabo City",
    province: "Davao del Norte",
    price: 2850000,
    priceLabel: "₱2,850,000",
    priceNote: "Open for offers",
    area: 2500,
    roadAccess: "Accessible from Barangay Road",
    badgeText: "Farm Lot",
    badgeStyle: "badge-green",
    promoted: false,
    seller: "Rina Dela Cruz",
    latitude: "7.3220",
    longitude: "125.6650",
    image: "assets/prop-5.jpg",
    cardTags: ["Creek Access", "2,500 SQM", "Mixed Crops"],
    highlights: [
      "2,500 SQM Open Farm Land",
      "Natural creek water access",
      "Accessible from Barangay Road",
      "Ideal for mixed crops or agri-business"
    ],
    description:
      "Open, practical agricultural land with creek water access and ample room for mixed farm development in Brgy. Kasilak."
  },
  {
    id: 6,
    title: "Warehouse-Ready Lot Near the Highway",
    type: "Industrial",
    barangay: "A.O. Floirendo",
    city: "Panabo City",
    province: "Davao del Norte",
    price: 7600000,
    priceLabel: "₱7,600,000",
    priceNote: "Open for offers",
    area: 900,
    roadAccess: "Accessible from National Road",
    badgeText: "Industrial",
    badgeStyle: "badge-green",
    promoted: false,
    seller: "Eli Mercado",
    latitude: "7.2950",
    longitude: "125.6920",
    image: "assets/prop-6.jpg",
    cardTags: ["Highway Access", "Logistics Ready", "900 SQM"],
    highlights: [
      "900 SQM Industrial Parcel",
      "National Highway vehicle access",
      "Suitable for storage or logistics",
      "Title & tax papers ready for screening"
    ],
    description:
      "Strategically located Panabo City parcel with heavy-vehicle road access suited for logistics, storage, or light industrial operations."
  }
];

const MILESTONE_STEPS = [
  "Booking requested",
  "Documents requested",
  "Documents submitted",
  "Verified by YuTara",
  "Transaction complete"
];

const DEFAULT_TRANSACTIONS = [
  {
    id: "TX-1001",
    propertyId: 2,
    propertyTitle: "Fenced 2-Room House & Lot Near Agriya",
    location: "Brgy. New Pandan, Panabo City",
    buyerName: "Demo Buyer",
    sellerName: "Verified Panabo Owner",
    salePrice: 1600000,
    priceLabel: "₱1,600,000",
    reservationFee: 25000,
    stageIndex: 1,
    documents: [
      { name: "Clean Transfer Certificate of Title (TCT Copy)", status: "Under Review" },
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
