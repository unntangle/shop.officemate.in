import type { CategorySlug } from "@/types";

/* -------------------------------------------------------------------------
   Homepage merchandising data.

   Structure mirrors the Wakefit reference section-for-section; the content is
   Officemate's own office-furniture range rather than mattresses and sofas.

   PLACEHOLDER: offer codes, store addresses, award citations and testimonial
   quotes below are written for the build and must be replaced with approved
   copy before launch. Imagery falls back through PLACEHOLDER_IMAGES until real
   category photography lands.
------------------------------------------------------------------------- */

/** Rotating strip above the header. */
export const ANNOUNCEMENTS = [
  "Use code OMFIRST10 — flat 10% off your first order",
  "Free delivery on orders above ₹15,000",
  "1-year warranty + free installation across 38 cities",
  "Bulk orders above 10 seats? Talk to our workspace team",
];

/** Top-level category nav under the search bar. */
export const SHOP_NAV: { label: string; href: string; highlight?: boolean }[] = [
  { label: "Chairs", href: "/products?category=office-chairs" },
  { label: "Desks", href: "/products?category=office-tables" },
  { label: "Workstations", href: "/products?category=work-stations" },
  { label: "Sofas", href: "/products?category=soft-sofas" },
  { label: "Lounges", href: "/products?category=leisure-lounges" },
  { label: "Pods", href: "/products?category=tele-pods" },
  { label: "Storage", href: "/products?category=office-storage" },
  { label: "Wellness", href: "/products?category=work-wellness" },
  { label: "Bulk Orders", href: "/contact?intent=bulk" },
  { label: "Stores", href: "/contact#stores" },
  { label: "Offers", href: "/products?sort=discount", highlight: true },
];

/** Hero banner carousel. */
export const HERO_SLIDES = [
  {
    image: "/images/hero.webp",
    eyebrow: "Workspace Upgrade Sale",
    heading: "Ergonomic chairs from ₹8,900",
    sub: "Up to 30% off across the seating range. Free installation included.",
    cta: { label: "Shop chairs", href: "/products?category=office-chairs" },
    align: "left" as const,
  },
  {
    image: "/images/hero2.webp",
    eyebrow: "New — Altura sit-stand",
    heading: "Sit. Stand. Repeat.",
    sub: "Single-motor height adjustment with three presets and a bamboo top.",
    cta: { label: "Shop desks", href: "/products?category=office-tables" },
    align: "left" as const,
  },
  {
    image: "/images/omban1.webp",
    eyebrow: "Fit out a whole floor",
    heading: "Volume pricing for 10+ seats",
    sub: "Workspace assessment, staggered delivery and a dedicated account team.",
    cta: { label: "Request a quote", href: "/contact?intent=bulk" },
    align: "left" as const,
  },
];

/** Trust strip beneath the hero — the Wakefit "Why Wakefit?" row. */
export const TRUST_POINTS = [
  { value: "1.2 Lakh+", label: "Seats delivered" },
  { value: "Free", label: "Shipping above ₹15k" },
  { value: "Free", label: "Installation" },
  { value: "1 Year", label: "Warranty" },
];

/**
 * Artwork for the top-level category strip, keyed by category slug.
 *
 * PLACEHOLDER — STOCK PHOTOGRAPHY, NOT OFFICEMATE PRODUCT.
 *
 * These are Unsplash stock shots standing in until real category photography
 * exists. The IDs are the same ones already used by the listing-page sidebar
 * in `components/products/ProductsView.tsx`, so the two surfaces agree on what
 * each category looks like rather than drifting apart.
 *
 * Note these are JPEGs with real backgrounds, not cut-outs. Frido and the
 * Sleep Company use transparent PNGs masked off a white shoot, which is what
 * lets their product float on a coloured well. Unsplash has no alpha channel,
 * so the strip fills the well with the photo instead. Dropping transparent
 * PNGs into this map later needs no component change — switch `object-cover`
 * to `object-contain` in CategoryStrip and the float-on-colour look works.
 *
 * `w=240` because the tile renders at 88px; next/image still generates the
 * responsive set from this, and requesting a 2000px original for an 88px
 * square wastes the whole point of the CDN.
 */
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=240&h=240&q=75`;

export const CATEGORY_IMAGES: Partial<Record<CategorySlug, string>> = {
  "office-chairs": unsplash("1688578735352-9a6f2ac3b70a"),
  "office-tables": unsplash("1517502884422-41eaead166d4"),
  "work-stations": unsplash("1623177623442-979c1e42c255"),
  "soft-sofas": unsplash("1524758631624-e2822e304c36"),
  "leisure-lounges": unsplash("1633975846872-2bed7fd995f9"),
  "tele-pods": unsplash("1589779256250-a8743f78f4af"),
  "work-wellness": unsplash("1622126807280-9b5b32b28e77"),
  "office-storage": unsplash("1577412647305-991150c7d163"),
};

/**
 * Shop-by-category tiles. `category` links straight into the PLP filter;
 * `sub` narrows further where the range warrants its own tile.
 */
export const CATEGORY_TILES: {
  label: string;
  category: CategorySlug;
  sub?: string;
}[] = [
  { label: "Executive Chairs", category: "office-chairs", sub: "Executive Series" },
  { label: "Task Chairs", category: "office-chairs", sub: "Task Series" },
  { label: "Leather Series", category: "office-chairs", sub: "Leather Series" },
  { label: "Training Chairs", category: "office-chairs", sub: "Training Series" },
  { label: "Executive Tables", category: "office-tables", sub: "Executive Table Series" },
  { label: "Conference Tables", category: "office-tables", sub: "Conference Table Series" },
  { label: "Modular Workstations", category: "work-stations", sub: "Modular Workstations" },
  { label: "Sit-Stand Desks", category: "work-stations", sub: "Zenlift" },
  { label: "Reception Sofas", category: "soft-sofas" },
  { label: "Lounge Seating", category: "leisure-lounges", sub: "Lounge Series" },
  { label: "Acoustic Pods", category: "tele-pods" },
  { label: "Pedestals & Storage", category: "office-storage" },
];

/** Store locator rail. PLACEHOLDER addresses — confirm before launch. */
export const STORES = [
  { city: "Chennai", area: "T. Nagar", label: "Experience Centre", since: "2016" },
  { city: "Chennai", area: "Chetpet", label: "Corporate Office", since: "2016" },
  { city: "Bengaluru", area: "Indiranagar", label: "Studio", since: "2019" },
  { city: "Hyderabad", area: "Gachibowli", label: "Studio", since: "2020" },
  { city: "Pune", area: "Baner", label: "Studio", since: "2021" },
  { city: "Mumbai", area: "Andheri East", label: "Studio", since: "2022" },
  { city: "Coimbatore", area: "Race Course", label: "Studio", since: "2023" },
  { city: "Kochi", area: "Kakkanad", label: "Studio", since: "2024" },
];

/** Bank offer chips. PLACEHOLDER — replace with live issuer agreements. */
export const BANK_OFFERS = [
  { bank: "HDFC Bank", type: "Cards", value: "Flat 7% off", cap: "up to ₹3,000" },
  { bank: "ICICI Bank", type: "Cards", value: "Flat 5% off", cap: "up to ₹2,500" },
  { bank: "Axis Bank", type: "EMI", value: "No-cost EMI", cap: "up to 9 months" },
  { bank: "SBI Card", type: "EMI", value: "No-cost EMI", cap: "up to 6 months" },
  { bank: "Amazon Pay", type: "UPI", value: "Flat ₹750 off", cap: "min ₹15,000" },
  { bank: "Paytm UPI", type: "Cashback", value: "₹500 cashback", cap: "min ₹10,000" },
  { bank: "Mobikwik", type: "Cashback", value: "5% cashback", cap: "up to ₹1,000" },
  { bank: "CRED", type: "UPI", value: "Flat ₹1,000 off", cap: "min ₹25,000" },
];

export const OFFER_FILTERS = ["All", "Cards", "EMI", "UPI", "Cashback"] as const;

/** Shop-by-zone tiles — the Wakefit "Shop By Rooms" block, office-side. */
export const ZONE_TILES: { label: string; blurb: string; href: string }[] = [
  {
    label: "Private Cabin",
    blurb: "Executive desk, chair and storage",
    href: "/products?category=office-tables",
  },
  {
    label: "Open Floor",
    blurb: "Workstations and task seating",
    href: "/products?category=work-stations",
  },
  {
    label: "Meeting Room",
    blurb: "Conference tables and boardroom chairs",
    href: "/products?category=office-tables&sub=Conference%20Table%20Series",
  },
  {
    label: "Reception",
    blurb: "Sofas and visitor seating",
    href: "/products?category=soft-sofas",
  },
  {
    label: "Breakout",
    blurb: "Lounges, barstools and cafe chairs",
    href: "/products?category=leisure-lounges",
  },
  {
    label: "Home Office",
    blurb: "Compact desks and ergonomic chairs",
    href: "/products?category=office-chairs&sub=Task%20Series",
  },
];

/** Furniture tab groups — the Wakefit "Furnitures" block. */
export const FURNITURE_TABS: {
  label: string;
  category: CategorySlug;
  tiles: string[];
}[] = [
  {
    label: "Chairs",
    category: "office-chairs",
    tiles: [
      "Executive Series",
      "Leather Series",
      "Leatherette Series",
      "Task Series",
      "Training Series",
      "Cafe Chairs Series",
    ],
  },
  {
    label: "Tables",
    category: "office-tables",
    tiles: [
      "Executive Table Series",
      "Conference Table Series",
      "Discussion Tables",
      "Cabin Tables",
      "Cafe / Training Tables",
    ],
  },
  {
    label: "Workstations",
    category: "work-stations",
    tiles: ["Modular Workstations", "Linear Workstations", "Zenlift"],
  },
  {
    label: "Soft Seating",
    category: "soft-sofas",
    tiles: ["Sofas"],
  },
  {
    label: "Storage",
    category: "office-storage",
    tiles: ["Pedestal & Storage"],
  },
];

/** Awards rail. PLACEHOLDER citations. */
export const AWARDS = [
  { title: "Red Dot Design Award", detail: "Glide Ergo — Product Design, 2024" },
  { title: "Good Design Award", detail: "Orbit Standing Desk, 2023" },
  { title: "BIFMA Certified", detail: "Full seating range tested to X5.1" },
  { title: "GREENGUARD Gold", detail: "Low-emission materials across the range" },
  { title: "ISO 9001:2015", detail: "Quality management, Chennai plant" },
  { title: "Great Place To Work", detail: "Certified employer, 2025" },
];

/**
 * Long-form SEO block at the foot of the page.
 * Kept as data so the copy team can edit it without touching the component.
 */
export const SEO_SECTIONS = [
  {
    heading: "Officemate — office furniture built around how people work",
    body: "Officemate designs and manufactures ergonomic chairs, desks, workstations and storage for Indian workplaces. Every product starts with posture data rather than a mood board, which is why an Officemate chair supports you the same way in month forty as it did in week one. Shop the full range online with free delivery above ₹15,000 and installation included.",
  },
  {
    heading: "Ergonomic office chairs for long working days",
    body: "A chair is the single piece of furniture you touch for eight hours a day, so small failures compound. Our seating range covers executive, task, training and cafe use, with adjustable lumbar support, seat-depth glide and multi-directional armrests across the premium tiers. Filter by budget, series or adjustability to find the model that fits the way you sit.",
  },
  {
    heading: "Desks and workstations that scale with the floor",
    body: "From a single sit-stand desk for a home office to a hundred-seat modular workstation rollout, the tables range is built on a shared frame system. That means finishes, cable management and screen heights stay consistent as you grow, and replacement parts remain available years after the original order.",
  },
  {
    heading: "Delivery, installation and warranty",
    body: "In-stock models ship in three to five working days. Every order includes free installation by a trained team, and frames and mechanisms carry a one-year warranty. Bulk orders are scheduled around your shift patterns, with staggered delivery so no floor loses a working day.",
  },
];

/** Video testimonial cards. PLACEHOLDER — swap in approved footage. */
export const VIDEO_STORIES = [
  {
    name: "Vikram Shah",
    role: "Head of Workplace",
    company: "Freshworks",
    quote: "420 seats across three floors, replaced without a day of downtime.",
  },
  {
    name: "Meera Nair",
    role: "Director, Procurement",
    company: "Bosch",
    quote: "A transparent ergonomic rating per model let us defend the spend with data.",
  },
  {
    name: "Rajesh Menon",
    role: "GM, Admin",
    company: "Royal Enfield",
    quote: "They assessed the floor before quoting and installed overnight.",
  },
  {
    name: "Ananya Rao",
    role: "VP, People & Culture",
    company: "Access Healthcare",
    quote: "Reported back pain on the operations floor dropped after the rollout.",
  },
];
