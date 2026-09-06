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
  { label: "Chairs", href: "/categories?category=office-chairs" },
  { label: "Desks", href: "/categories?category=office-tables" },
  { label: "Workstations", href: "/categories?category=work-stations" },
  { label: "Sofas", href: "/categories?category=soft-sofas" },
  { label: "Lounges", href: "/categories?category=leisure-lounges" },
  { label: "Pods", href: "/categories?category=tele-pods" },
  { label: "Storage", href: "/categories?category=office-storage" },
  { label: "Wellness", href: "/categories?category=work-wellness" },
  { label: "Bulk Orders", href: "/contact?intent=bulk" },
  { label: "Stores", href: "/stores" },
  { label: "Offers", href: "/categories?sort=discount", highlight: true },
];

/**
 * Hero banner carousel.
 *
 * PLACEHOLDER COPY — needs marketing sign-off before launch.
 *
 * Headings are held to three words to match the Frido reference, where the
 * headline is the hook and the eyebrow above it carries the specifics.
 * Anything longer wraps to a second line at `lg:text-[3rem]` and pushes the
 * CTA out of a 25rem banner. `sub` is no longer rendered by HeroCarousel for
 * the same reason; it is kept here in case the banner grows back.
 */
export const HERO_SLIDES = [
  {
    image: "/images/hero.webp",
    eyebrow: "Workspace Upgrade Sale",
    heading: "Chairs from ₹8,900",
    sub: "Up to 30% off across the seating range. Free installation included.",
    cta: { label: "Shop chairs", href: "/categories?category=office-chairs" },
    align: "left" as const,
  },
  {
    image: "/images/hero2.webp",
    eyebrow: "New — Altura sit-stand",
    heading: "Sit. Stand. Repeat.",
    sub: "Single-motor height adjustment with three presets and a bamboo top.",
    cta: { label: "Shop desks", href: "/categories?category=office-tables" },
    align: "left" as const,
  },
  {
    image: "/images/omban1.webp",
    eyebrow: "Fit out a whole floor",
    heading: "Bulk orders, simplified",
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

/**
 * Officemate experience centres.
 *
 * Real addresses and Google Maps links, replacing the eight placeholder
 * cities that were here before (Pune, Mumbai, Kochi and the Chetpet corporate
 * office were invented for the build, as were the "since" years).
 *
 * ⚠ Hyderabad and Bengaluru currently share the SAME maps link
 * (P3nHp2s2mbbWq5Nd9). That is almost certainly a copy-paste slip in the
 * source, and it means "Get directions" on the Hyderabad card sends people to
 * Bengaluru. Replace the Hyderabad URL before launch.
 *
 * `image` is a per-centre photograph. Note the Bengaluru file is spelled
 * "bangalore" on disk while the city renders as "Bengaluru" — the path has to
 * match the filename, not the label.
 *
 * `hours` is deliberately absent. Opening times are a factual claim about a
 * real business and inventing them sends people to a closed door, so the card
 * simply omits the pill until someone supplies them. Add e.g.
 * `hours: "10:00 AM - 7:00 PM"` and it renders.
 */
export const STORES: {
  city: string;
  area: string;
  building: string;
  address: string[];
  map: string;
  image: string;
  hours?: string;
}[] = [
  {
    city: "Chennai",
    area: "T. Nagar",
    building: "ACE PLATINA",
    address: ["72, G.N. Chetty Road", "T. Nagar, Chennai", "Tamil Nadu - 600 017"],
    map: "https://maps.app.goo.gl/LaMAU9mbhKvwvUWC7",
    image: "/images/experience-centre-chennai.webp",
  },
  {
    city: "Coimbatore",
    area: "Avinashi Road",
    building: "B Kay Towers",
    address: ["185, Avinashi Road", "Coimbatore", "Tamil Nadu - 641 014"],
    map: "https://maps.app.goo.gl/W7LAyU8oegKT4gq17",
    image: "/images/experience-centre-coimbatore.webp",
  },
  {
    city: "Bengaluru",
    area: "Indira Nagar",
    building: "782",
    address: ["9th A Main Road", "Indira Nagar", "Bengaluru - 560 038"],
    map: "https://maps.app.goo.gl/P3nHp2s2mbbWq5Nd9",
    image: "/images/experience-centre-bangalore.webp",
  },
  {
    city: "Hyderabad",
    area: "Gachibowli",
    building: "Enza Furnitures",
    address: ["8-25/14/83/1/3", "Gachibowli, Hyderabad", "Telangana - 500 032"],
    /* ⚠ Duplicate of the Bengaluru link — see the note above. */
    map: "https://maps.app.goo.gl/P3nHp2s2mbbWq5Nd9",
    image: "/images/experience-centre-hyderabad.webp",
  },
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
    href: "/categories?category=office-tables",
  },
  {
    label: "Open Floor",
    blurb: "Workstations and task seating",
    href: "/categories?category=work-stations",
  },
  {
    label: "Meeting Room",
    blurb: "Conference tables and boardroom chairs",
    href: "/categories?category=office-tables&sub=Conference%20Table%20Series",
  },
  {
    label: "Reception",
    blurb: "Sofas and visitor seating",
    href: "/categories?category=soft-sofas",
  },
  {
    label: "Breakout",
    blurb: "Lounges, barstools and cafe chairs",
    href: "/categories?category=leisure-lounges",
  },
  {
    label: "Home Office",
    blurb: "Compact desks and ergonomic chairs",
    href: "/categories?category=office-chairs&sub=Task%20Series",
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
 * Long-form SEO block at the foot of the page, rendered by SeoContent.tsx.
 * Kept as data so the copy team can edit it without touching the component.
 *
 * TWO HALVES, deliberately.
 *
 * The first four blocks are statement headings — the category-level copy that
 * ranks for "ergonomic office chair", "modular workstation" and so on.
 *
 * The rest are QUESTION headings. Those exist because the queries people
 * actually type are questions ("which office chair is best for long hours",
 * "mesh or leather office chair"), and a heading that matches the query word
 * for word is what gets pulled into a featured snippet. They are NOT in
 * HOME_FAQS: an accordion of a dozen rows stops being scannable and nobody
 * opens any of them. Here length is the point — this block is set small and
 * low-contrast precisely because it is for finding, not for reading.
 *
 * Answers stay in the 40-70 word range. Shorter has nothing to extract;
 * longer and search engines truncate mid-thought.
 *
 * ⚠ NO PRICES. It is tempting to answer "how much should you spend" with a
 * number, but the only figure in this codebase (₹8,900, in HERO_SLIDES) is
 * marked placeholder, and a stale price in a search snippet is worse than
 * none. The answer explains what each tier buys instead. Add a real figure
 * once pricing is signed off.
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
  {
    heading: "Which office chair is best for long working hours?",
    body: "For eight hours or more at a desk, look for three adjustments before anything else: lumbar support that meets the curve of your lower back, seat-depth glide so the front edge does not press behind your knees, and a recline you can lock. The Executive and Leather series carry all three. The Chair Health Score on every product page rates them, so you can compare models directly rather than by feature count.",
  },
  {
    heading: "Mesh or leather \u2014 which office chair back is better?",
    body: "Mesh flexes to your spine and breathes, which matters in Indian summers and in rooms without strong air conditioning. Leather and leatherette hold their shape, feel more formal and wipe clean, so they suit cabins and boardrooms. Neither is more ergonomic on its own \u2014 the adjustments underneath decide that.",
  },
  {
    heading: "How much should you spend on an office chair?",
    body: "Cost tracks adjustability more than materials. An entry task chair sets your height and little else; mid-range models add lumbar support and armrest travel; premium seating adds seat depth, tilt tension and a headrest. Decide how many hours a day the chair will be used, then buy the adjustments those hours need. Filter the seating range by budget to see what each tier includes.",
  },
  {
    heading: "What is the correct desk and chair height?",
    body: "Set the chair first: feet flat, knees at roughly ninety degrees, hips level with or slightly above them. Then set the desk so your forearms are parallel to the floor with your shoulders relaxed. If the desk is fixed and too high, raise the chair and add a footrest rather than reaching upward all day. A sit-stand desk removes the compromise entirely.",
  },
  {
    heading: "Are sit-stand desks worth it?",
    body: "The benefit is not standing, it is changing position. Alternating every thirty to sixty minutes eases the lower-back load that comes from sitting still, and most people find that easier to sustain than a resolution to get up more often. Height-adjustable models store presets, so switching takes one press rather than a decision.",
  },
  {
    heading: "How do you plan seating for a new office floor?",
    body: "Start from how the floor is used rather than from a headcount. Focused desk work needs task seating and workstations; meeting rooms need chairs that stack or roll; reception and breakout areas need soft seating that survives constant use. Our workspace team assesses the floor before quoting, so the mix is set against your layout instead of a spreadsheet.",
  },
  {
    heading: "How do you get a bulk quote for an office fit-out?",
    body: "For ten seats and up, tell us the headcount, the city and roughly when the floor needs to be live. You get volume pricing, a floor assessment before you commit, GST invoicing, and delivery staggered around your shift patterns. Annual maintenance contracts are available so servicing is scheduled rather than reactive.",
  },
  {
    heading: "Where can you see Officemate furniture in person?",
    body: "There are experience centres in Chennai (T. Nagar), Coimbatore, Bengaluru (Indira Nagar) and Hyderabad (Gachibowli), where you can sit in the full seating range rather than judging it from a photograph. If you cannot get to one, a specialist will walk you through the chairs over a video call.",
  },
  {
    heading: "How do you look after an office chair?",
    body: "Most chairs fail at the castors and the gas lift, not the frame. Vacuum mesh and fabric monthly, wipe leatherette with a damp cloth rather than solvent, and swap castors once they start dragging on the floor instead of rolling. Replacement parts stay available for years after the original order.",
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
