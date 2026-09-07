import { Product } from "@/types";

/**
 * Product catalogue — the five real, fully-specified Officemate products.
 *
 * This is now the ONLY product source. constants/chairs.ts previously carried
 * 45 name-and-series placeholders with no price or photography, and
 * lib/catalog.ts invented a price band for each; both are gone. Everything
 * here has a real price, real photography and a real detail page.
 *
 * Six "Aeris"-branded mock records from the original showcase build were
 * removed earlier for the same reason — Aeris is an invented brand and had no
 * business on a live storefront.
 *
 * DO NOT ADD PLACEHOLDER PRODUCTS HERE. The rest of the range is being built
 * in Shopify; this file is what the Storefront API adapter will replace.
 *
 * `subcategory` must match one of `Category.subcategories` for the product's
 * category in constants/categories.ts, or the product is reachable only under
 * "All series".
 */
export const PRODUCTS: Product[] = [
  {
    name: "Zenpro",
    slug: "zenpro",
    category: "office-chairs",
    subcategory: "Executive Series",
    price: 19499,
    compareAtPrice: 25999,
    rating: 4.7,
    reviewCount: 302,
    tagline: "Posture-correcting mesh chair built for marathon focus.",
    description:
      "Zenpro is engineered for the deep-work hours when comfort can't be an afterthought. A tri-zone mesh backrest targets shoulders, mid-back and lumbar independently, while a waterfall seat edge reduces thigh pressure so circulation stays strong through long sittings.",
    swatch: "#2B2B2E",
    colors: [
      { name: "Black", hex: "#2B2B2E" },
      { name: "Grey", hex: "#C9CCD1" },
    ],
    badges: ["Tri-zone mesh", "Waterfall seat", "3D lumbar"],
    features: [
      {
        title: "Tri-zone mesh backrest",
        description:
          "Three separate mesh panels with different tensions support shoulders, mid-back and lumbar each at the right firmness.",
      },
      {
        title: "Waterfall seat edge",
        description:
          "A gently curved front edge reduces pressure on the underside of the thighs to keep legs comfortable for hours.",
      },
      {
        title: "3D adjustable lumbar",
        description:
          "The lumbar pad moves up, down, in and out to meet your lower back precisely where it needs it.",
      },
    ],
    benefits: [
      {
        title: "Better circulation",
        description:
          "Waterfall edge and ventilated mesh keep blood flowing even during full-day sittings.",
      },
      {
        title: "Targeted spinal support",
        description:
          "Independent zone tensions mean every section of your back is held, not just averaged.",
      },
    ],
    materials: [
      "Tri-zone tensioned polyester mesh",
      "High-density contoured foam seat",
      "Nylon reinforced frame",
      "PU twin-wheel castors",
    ],
    dimensions: [
      { label: "Seat height", value: "44 – 54 cm" },
      { label: "Seat width", value: "51 cm" },
      { label: "Seat depth", value: "46 cm" },
      { label: "Back height", value: "60 cm" },
      { label: "Overall height", value: "106 – 116 cm" },
      { label: "Base diameter", value: "67 cm" },
    ],
    specifications: [
      { label: "Weight capacity", value: "125 kg" },
      { label: "Recline range", value: "95° – 125°" },
      { label: "Tilt mechanism", value: "Tension-adjustable tilt" },
      { label: "Gas lift", value: "Class 4, certified" },
      { label: "Armrests", value: "3D adjustable" },
      { label: "Assembly time", value: "~12 minutes" },
    ],
    usage:
      "Adjust the 3D lumbar so the pad sits just above your waistband. Set seat height so feet rest flat, then fine-tune armrests until your shoulders are relaxed.",
    warranty: "1-year limited warranty on frame and mechanism.",
    care: [
      "Vacuum the mesh panels monthly using a soft brush attachment.",
      "Wipe the frame with a slightly damp cloth — avoid abrasive cleaners.",
    ],
    faqs: [
      {
        question: "How is the tri-zone mesh different from a single-panel back?",
        answer:
          "Each zone is tensioned separately, so shoulders get a softer hold while the lumbar zone provides firmer push-back — closer to what your spine actually needs.",
      },
      {
        question: "Can the seat depth be adjusted?",
        answer:
          "Yes, the seat slides forward up to 50mm so users of different leg lengths can all achieve the recommended two-finger gap behind the knee.",
      },
    ],
    downloads: [
      { label: "Product brochure", type: "brochure", size: "2.9 MB" },
      { label: "Assembly manual", type: "manual", size: "1.0 MB" },
      { label: "Warranty terms", type: "warranty", size: "210 KB" },
    ],
    relatedSlugs: ["ferro", "altura", "jupiter"],
    featured: true,
    isNew: true,
  },
  {
    name: "Jupiter",
    slug: "jupiter",
    category: "office-chairs",
    subcategory: "Task Series",
    price: 54999,
    compareAtPrice: 64999,
    rating: 4.8,
    reviewCount: 143,
    tagline: "Modular L-shaped workstation that grows with your team.",
    description:
      "Jupiter is the anchor of any serious workspace. Its L-shaped modular design links seamlessly into clusters for open-plan offices or stands alone as a private workstation. A cable-managed steel frame and reversible desk top mean it configures left or right in minutes, not hours.",
    swatch: "#4A4A4A",
    colors: [
      { name: "Graphite", hex: "#4A4A4A" },
      { name: "White Oak", hex: "#C8B89A" },
      { name: "Ivory", hex: "#EDEAE3" },
    ],
    badges: ["L-shaped", "Cable management", "Modular"],
    features: [
      {
        title: "Reversible L-configuration",
        description:
          "The return panel mounts left or right without extra parts — choose the layout that works for your room.",
      },
      {
        title: "Integrated cable management",
        description:
          "A rear cable spine and modesty panel keep wires routed and hidden from every angle.",
      },
      {
        title: "Cluster-ready frame",
        description:
          "Side-link brackets let multiple Jupiter units join into an open-plan cluster without visible gaps.",
      },
    ],
    benefits: [
      {
        title: "More desk, same footprint",
        description:
          "The L-shape gives you a primary and secondary surface without doubling the floor area.",
      },
      {
        title: "Ready for the long run",
        description:
          "Powder-coated steel and 25mm tops withstand years of daily heavy use.",
      },
    ],
    materials: [
      "25 mm engineered wood top",
      "Powder-coated steel frame",
      "ABS edge-banding",
      "Levelling feet",
    ],
    dimensions: [
      { label: "Primary top", value: "150 × 75 cm" },
      { label: "Return top", value: "100 × 60 cm" },
      { label: "Desk height", value: "75 cm (fixed)" },
      { label: "Frame gauge", value: "1.5 mm cold-rolled steel" },
    ],
    specifications: [
      { label: "Load capacity", value: "80 kg per surface" },
      { label: "Top thickness", value: "25 mm" },
      { label: "Finish", value: "Melamine with ABS edge" },
      { label: "Cable spine", value: "Integrated, rear" },
      { label: "Cluster link", value: "Side-bracket included" },
      { label: "Assembly time", value: "~30 minutes" },
    ],
    usage:
      "Position the primary surface as your main monitor station and the return for secondary tasks or a second screen. Run cables through the rear spine before attaching the modesty panel.",
    warranty: "1-year limited warranty on frame and top surface.",
    care: [
      "Wipe the melamine surface with a damp cloth — avoid abrasive pads.",
      "Check levelling feet every 6 months on uneven floors.",
    ],
    faqs: [
      {
        question: "Can I order just the primary desk and add the return later?",
        answer:
          "Yes. The return panel and side-link bracket are sold separately, so you can start with the primary desk and expand when needed.",
      },
      {
        question: "Does it support dual monitors?",
        answer:
          "The 80 kg per-surface load capacity handles multiple monitors, docks and accessories with ease.",
      },
    ],
    downloads: [
      { label: "Product brochure", type: "brochure", size: "3.5 MB" },
      { label: "Assembly manual", type: "manual", size: "2.1 MB" },
      { label: "Warranty terms", type: "warranty", size: "230 KB" },
    ],
    relatedSlugs: ["altura", "webstar", "zenpro"],
    featured: true,
  },
  {
    name: "Webstar",
    slug: "webstar",
    category: "office-chairs",
    subcategory: "Task Series",
    price: 67999,
    compareAtPrice: 79999,
    rating: 4.6,
    reviewCount: 88,
    tagline: "Twelve-seat conference table with integrated AV channel.",
    description:
      "Webstar turns the boardroom into a broadcast studio without the clutter. A solid-core top with an inlaid AV channel routes power, data and video cables beneath the surface to any seat, while a brushed-aluminium base adds the presence the room demands.",
    swatch: "#8A7560",
    colors: [
      { name: "Walnut", hex: "#5A4633" },
      { name: "Dark Oak", hex: "#3B2F2F" },
      { name: "White", hex: "#EDEAE3" },
    ],
    badges: ["12-seat", "AV channel", "Brushed aluminium"],
    features: [
      {
        title: "Inlaid AV channel",
        description:
          "A recessed spine running the full length of the table routes HDMI, power and USB to pop-up modules at every seat.",
      },
      {
        title: "Solid-core top",
        description:
          "A 38mm top with hardwood core resists impact, flex and day-to-day scuffs in heavy-use meeting rooms.",
      },
      {
        title: "Brushed-aluminium base",
        description:
          "Twin boat-shaped pedestals in brushed aluminium keep the floor clear and hold the top stable at full load.",
      },
    ],
    benefits: [
      {
        title: "Clean, cable-free surface",
        description:
          "Every cable stays beneath the top, so the table always looks boardroom-ready.",
      },
      {
        title: "Handles any meeting format",
        description:
          "Power and AV at each seat mean the room adapts to presentations, video calls and workshops equally.",
      },
    ],
    materials: [
      "38 mm solid-core engineered top",
      "Brushed aluminium pedestals",
      "Integrated AV conduit",
      "Pop-up module inserts",
    ],
    dimensions: [
      { label: "Top size", value: "360 × 120 cm" },
      { label: "Table height", value: "75 cm" },
      { label: "Top thickness", value: "38 mm" },
      { label: "Seating capacity", value: "Up to 12" },
    ],
    specifications: [
      { label: "Load capacity", value: "200 kg" },
      { label: "AV channel", value: "Full-length, recessed" },
      { label: "Pop-up modules", value: "6 × dual power + USB-A/C" },
      { label: "Base finish", value: "Brushed aluminium" },
      { label: "Top finish", value: "Premium melamine" },
      { label: "Assembly", value: "White-glove recommended" },
    ],
    usage:
      "Route your HDMI and power cables through the AV channel before the pop-up modules are clipped in. Modules are tool-free snap-in and can be repositioned to any seat as needed.",
    warranty: "1-year limited warranty on frame and AV modules.",
    care: [
      "Wipe the top with a dry or lightly damp microfibre cloth.",
      "Clean pop-up modules with a dry cloth — no liquid inside the inserts.",
    ],
    faqs: [
      {
        question: "Are the pop-up modules replaceable?",
        answer:
          "Yes. Modules snap in and out without tools and are available in power, USB-C, HDMI and RJ45 variants.",
      },
      {
        question: "Can the table be split for transport?",
        answer:
          "The top ships in two halves and joins with concealed bolts for a seamless seam on site.",
      },
    ],
    downloads: [
      { label: "Product brochure", type: "brochure", size: "4.4 MB" },
      { label: "Installation guide", type: "manual", size: "2.8 MB" },
      { label: "AV module specs", type: "brochure", size: "980 KB" },
    ],
    relatedSlugs: ["jupiter", "altura", "zenpro"],
  },
  {
    name: "Ferro",
    slug: "ferro",
    category: "office-chairs",
    subcategory: "Task Series",
    price: 12999,
    compareAtPrice: 16999,
    rating: 4.5,
    reviewCount: 476,
    tagline: "Steel-framed task chair with no-nonsense durability.",
    description:
      "Ferro is built for the floors that never stop moving — receptions, trading desks, training rooms. A powder-coated steel frame and heavy-duty mechanism outlast the average replacement cycle by years, while a slim profile keeps rows and clusters feeling open.",
    swatch: "#374151",
    colors: [
      { name: "Onyx", hex: "#1C1C1E" },
      { name: "Slate", hex: "#374151" },
      { name: "Sand", hex: "#B5A99A" },
    ],
    badges: ["Steel frame", "Heavy duty", "Slim profile"],
    features: [
      {
        title: "Powder-coated steel frame",
        description:
          "A welded and powder-coated frame resists dents, scratches and the day-to-day knocks of high-traffic spaces.",
      },
      {
        title: "Heavy-duty synchro mechanism",
        description:
          "Rated to 150 kg with a multi-lock tilt, the mechanism is built to handle shift-pattern use without wearing.",
      },
      {
        title: "Slim-profile backrest",
        description:
          "A narrow, upright backrest lets chairs tuck neatly into rows and clusters without wasting aisle space.",
      },
    ],
    benefits: [
      {
        title: "Lower total cost of ownership",
        description:
          "A frame rated for twice the average lifecycle means fewer replacements and less downtime.",
      },
      {
        title: "Fits any floor plan",
        description:
          "Slim, upright profile works equally well in dense training rooms and open-plan aisles.",
      },
    ],
    materials: [
      "Welded powder-coated steel frame",
      "High-density moulded foam seat",
      "Woven fabric upholstery",
      "Steel-reinforced nylon base",
    ],
    dimensions: [
      { label: "Seat height", value: "43 – 52 cm" },
      { label: "Seat width", value: "48 cm" },
      { label: "Seat depth", value: "45 cm" },
      { label: "Back height", value: "52 cm" },
      { label: "Overall height", value: "98 – 107 cm" },
      { label: "Base diameter", value: "65 cm" },
    ],
    specifications: [
      { label: "Weight capacity", value: "150 kg" },
      { label: "Recline range", value: "95° – 115°" },
      { label: "Tilt mechanism", value: "Multi-lock synchro" },
      { label: "Gas lift", value: "Class 4, certified" },
      { label: "Armrests", value: "Fixed or 2D optional" },
      { label: "Chair weight", value: "13.2 kg" },
    ],
    usage:
      "Set seat height so your knees sit at 90° and feet rest flat. For training-room use, the multi-lock tilt can be set upright to keep rows consistent.",
    warranty: "1-year limited warranty on frame and mechanism.",
    care: [
      "Wipe the frame with a dry cloth to prevent surface moisture.",
      "Spot-clean fabric with mild soap and cool water, then blot dry.",
    ],
    faqs: [
      {
        question: "Is Ferro suitable for 24-hour use environments?",
        answer:
          "Yes. The steel frame and Class-4 gas lift are rated for continuous multi-shift use, making Ferro a common choice for contact centres and control rooms.",
      },
      {
        question: "Can armrests be added after purchase?",
        answer:
          "Optional 2D armrests are available as an add-on and fit the existing arm-mount sockets on the frame.",
      },
    ],
    downloads: [
      { label: "Product brochure", type: "brochure", size: "2.2 MB" },
      { label: "Assembly manual", type: "manual", size: "880 KB" },
      { label: "Warranty terms", type: "warranty", size: "200 KB" },
    ],
    relatedSlugs: ["zenpro", "altura", "jupiter"],
  },
  {
    name: "Altura",
    slug: "altura",
    category: "office-chairs",
    subcategory: "Executive Series",
    price: 36999,
    compareAtPrice: 44999,
    rating: 4.9,
    reviewCount: 195,
    tagline: "Single-motor sit-stand desk with whisper-smooth lift.",
    description:
      "Altura brings height-adjustable working to individual desks without the complexity of a full dual-motor setup. A single precision motor lifts up to 80 kg smoothly and quietly, with a slim digital handset storing three personalised height presets. The bamboo-composite top is harder than solid oak and friendlier to the planet.",
    swatch: "#7A6B55",
    colors: [
      { name: "Bamboo", hex: "#C8A96E" },
      { name: "Slate Grey", hex: "#4A4A4A" },
      { name: "White", hex: "#EDEAE3" },
    ],
    badges: ["Single motor", "3 presets", "Bamboo top"],
    features: [
      {
        title: "Single precision motor",
        description:
          "A brushless motor runs below 42 dB — quieter than a library — while lifting at 35mm per second.",
      },
      {
        title: "Slim digital handset",
        description:
          "A compact handset with an LED height readout stores three presets and a sedentary reminder timer.",
      },
      {
        title: "Bamboo-composite top",
        description:
          "Strand-woven bamboo is harder than most hardwoods, resists surface scratches and is FSC-certified.",
      },
    ],
    benefits: [
      {
        title: "Moves with your day",
        description:
          "Three presets mean you switch between sitting, standing and collaboration height with one tap.",
      },
      {
        title: "A top that takes the punishment",
        description:
          "Bamboo composite is harder and more scratch-resistant than standard melamine tops.",
      },
    ],
    materials: [
      "Strand-woven bamboo composite top",
      "Powder-coated steel frame",
      "Single brushless motor",
      "Integrated cable tray",
    ],
    dimensions: [
      { label: "Top size", value: "140 × 70 cm" },
      { label: "Height range", value: "65 – 128 cm" },
      { label: "Lift speed", value: "35 mm / sec" },
      { label: "Top thickness", value: "22 mm" },
    ],
    specifications: [
      { label: "Load capacity", value: "80 kg" },
      { label: "Motor", value: "Single brushless" },
      { label: "Presets", value: "3 programmable" },
      { label: "Noise level", value: "< 42 dB" },
      { label: "Reminder timer", value: "Integrated, adjustable" },
      { label: "Cable tray", value: "Integrated, under-desk" },
    ],
    usage:
      "Programme your sitting preset first, then raise to your standing height and save that second. Set the reminder timer to prompt you every 45 – 60 minutes to switch.",
    warranty: "1-year limited warranty on frame and motor.",
    care: [
      "Wipe the bamboo top with a dry or lightly damp cloth — avoid standing water.",
      "Keep the motor housing clear of debris.",
    ],
    faqs: [
      {
        question: "How is Altura different from Orbit?",
        answer:
          "Altura uses a single motor and is optimised for individual use up to 80 kg, making it lighter and more affordable. Orbit's dual motors support 120 kg and suit heavier multi-monitor setups.",
      },
      {
        question: "Is bamboo as durable as wood?",
        answer:
          "Strand-woven bamboo is harder than most hardwoods by Janka rating, so it resists scratches and dents better than oak or walnut veneer.",
      },
    ],
    downloads: [
      { label: "Product brochure", type: "brochure", size: "3.3 MB" },
      { label: "Assembly manual", type: "manual", size: "1.4 MB" },
      { label: "Warranty terms", type: "warranty", size: "220 KB" },
    ],
    relatedSlugs: ["jupiter", "webstar", "zenpro"],
    featured: true,
    isNew: true,
  },
];

export const getProduct = (slug: string) =>
  PRODUCTS.find((p) => p.slug === slug);

export const getRelated = (slugs: string[]) =>
  slugs
    .map((s) => PRODUCTS.find((p) => p.slug === s))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 3);

const FEATURED_SLUGS = ["zenpro", "webstar", "ferro", "altura", "jupiter"];
export const FEATURED = FEATURED_SLUGS.map((s) => PRODUCTS.find((p) => p.slug === s)!).filter(Boolean);

/**
 * Map of slug → public image path.
 * Add an entry here whenever a real product photo is available.
 */
export const PRODUCT_IMAGES: Record<string, string> = {
  zenpro:   "/images/products/chairs/zenpro.webp",
  jupiter:  "/images/products/chairs/Jupiter.webp",
  webstar:  "/images/products/chairs/webstar.webp",
  ferro:    "/images/products/chairs/ferro.webp",
  altura:   "/images/products/chairs/altura.webp",
};

/**
 * Feature panels — the annotated diagram shots. These illustrate mechanisms
 * rather than finishes, so they're shared across every colourway and appended
 * to whichever product shots are showing.
 */
const ZENPRO_PANELS = [
  "/images/products/chairs/Zenpro/1.webp",
  "/images/products/chairs/Zenpro/2.webp",
  "/images/products/chairs/Zenpro/3.webp",
  "/images/products/chairs/Zenpro/4.webp",
  "/images/products/chairs/Zenpro/5.webp",
];

/**
 * Annotated feature panels for a product, in feature order — the close-up
 * mechanism shots used by the Product Highlights carousel.
 */
export const PRODUCT_PANELS: Record<string, string[]> = {
  zenpro: ZENPRO_PANELS,
};

export const panelsFor = (slug: string): string[] => PRODUCT_PANELS[slug] ?? [];

/**
 * Map of slug → multiple public image paths, in display order.
 * When a slug appears here the product gallery shows these as switchable
 * views with thumbnails; otherwise it falls back to PRODUCT_IMAGES.
 *
 * This is the default set — used when a product has no per-colour photography,
 * or when the selected colour isn't in PRODUCT_COLOR_GALLERIES below.
 */
export const PRODUCT_GALLERIES: Record<string, string[]> = {
  /* Product shots first, then the feature panels.
     Note: spaces in the filenames are URL-encoded (%20) — "Front  Perspective"
     genuinely has two spaces. Renaming these to kebab-case would be safer. */
  zenpro: [
    "/images/products/chairs/Zenpro/Front.webp",
    "/images/products/chairs/Zenpro/Front%20%20Perspective.webp",
    "/images/products/chairs/Zenpro/Side.webp",
    "/images/products/chairs/Zenpro/Rear%20Perspective.webp",
    "/images/products/chairs/Zenpro/Rear.webp",
    ...ZENPRO_PANELS,
  ],
};

/**
 * Per-colourway photography, keyed `slug:Colour name`. The colour name must
 * match `Product.colors[].name` exactly — that's what the picker passes in.
 * Falls back to PRODUCT_GALLERIES when a colour has no dedicated shots yet.
 */
export const PRODUCT_COLOR_GALLERIES: Record<string, string[]> = {
  "zenpro:Black": [
    "/images/products/chairs/Zenpro/black/front.jpg",
    "/images/products/chairs/Zenpro/black/front-perspective.jpg",
    "/images/products/chairs/Zenpro/black/side.jpg",
    "/images/products/chairs/Zenpro/black/rear-perspective.jpg",
    "/images/products/chairs/Zenpro/black/rear.jpg",
    ...ZENPRO_PANELS,
  ],
};

/** Every photo for a product, richest source first. */
export const galleryFor = (slug: string, color?: string): string[] => {
  const byColor = color ? PRODUCT_COLOR_GALLERIES[`${slug}:${color}`] : undefined;
  return (
    byColor ??
    PRODUCT_GALLERIES[slug] ??
    (PRODUCT_IMAGES[slug] ? [PRODUCT_IMAGES[slug]] : [])
  );
};

/**
 * 3D / AR assets, keyed `slug:Colour name` to match PRODUCT_COLOR_GALLERIES.
 *
 * `glb` drives both the in-page 3D viewer and Android's Scene Viewer.
 * `usdz` is iOS-only — Quick Look won't read a .glb, so without it the
 * "View in room" button stays hidden on iPhone and iPad. Everything degrades
 * on its own: no entry here means no buttons, rather than dead controls.
 */
export type ProductModel = {
  /** glTF binary — in-page 3D and Android AR. */
  glb: string;
  /** USDZ — required for iOS AR (Quick Look). */
  usdz?: string;
};

export const PRODUCT_MODELS: Record<string, ProductModel> = {
  "zenpro:Black": {
    glb: "/images/products/chairs/Zenpro/black/zen-pro-black.glb",
  },
  "zenpro:Grey": {
    glb: "/images/products/chairs/Zenpro/zen-pro-grey.glb",
  },
};

/** The 3D asset for a colourway, if one has been exported. */
export const modelFor = (slug: string, color?: string): ProductModel | undefined =>
  color ? PRODUCT_MODELS[`${slug}:${color}`] : undefined;

/** Products belonging to a category, photographed ones first. */
export const productsByCategory = (slug: string) =>
  PRODUCTS.filter((p) => p.category === slug).sort(
    (a, b) => Number(Boolean(PRODUCT_IMAGES[b.slug])) - Number(Boolean(PRODUCT_IMAGES[a.slug]))
  );

/**
 * Explicit artwork for a subcategory, keyed `categorySlug:Subcategory name`.
 * Used by the products mega menu so each tile shows a deliberate shot rather
 * than whichever product happens to sort first.
 */
export const SUBCATEGORY_IMAGES: Record<string, string> = {
  "office-chairs:Executive Series": "/images/products/chairs/zenpro.webp",
  "office-chairs:Leather Series": "/images/products/chairs/webstar.webp",
  "office-chairs:Leatherette Series": "/images/products/chairs/ferro.webp",
};

/**
 * TEMPORARY: stand-in shots for categories without photography yet.
 * Cycled by tile position so the menu never falls back to a generated render.
 * Remove once real artwork lands in SUBCATEGORY_IMAGES.
 */
export const PLACEHOLDER_IMAGES: string[] = [
  "/images/products/chairs/zenpro.webp",
  "/images/products/chairs/webstar.webp",
  "/images/products/chairs/ferro.webp",
];
