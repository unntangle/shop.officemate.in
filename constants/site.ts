export const SITE = {
  name: "Officemate",
  tagline: "Sit well. Work better.",
  description:
    "Officemate designs ergonomic chairs, standing desks and workspace accessories engineered around how the body actually moves — so you can focus longer and finish the day feeling better.",
  url: "https://officemate.in",
  email: "hello@officemate.in",
  phone: "+91 97898 27270",
  /**
   * Corporate Identity Number, issued by the Ministry of Corporate Affairs.
   *
   * Indian companies must display this on their website, letterheads,
   * invoices and other official publications — Section 12(3)(c) of the
   * Companies Act 2013. That is why it sits in the footer legal bar on every
   * page rather than only on an About page.
   *
   * Reading it back: U = unlisted, 36100 = manufacture of furniture, TN =
   * Tamil Nadu, 2007 = year of incorporation, PTC = private limited company.
   * All of which matches Zebro Officemate Pvt Ltd as registered.
   */
  cin: "U36100TN2007PTC065143",
  /** Registered / corporate address — see LOCATIONS for the full list. */
  address: {
    line1: "Zebro Officemate Pvt Ltd, No 67/3, E Spur Tank Road",
    line2: "M.S. Nagar, Mukta Gardens, Chetpet",
    city: "Chennai, Tamil Nadu 600031, India",
  },
  hours: [
    { day: "Monday – Friday", time: "9:30 – 18:30" },
    { day: "Saturday", time: "10:00 – 16:00" },
    { day: "Sunday", time: "Closed" },
  ],
  social: [
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "YouTube", href: "#" },
    { label: "X", href: "#" },
  ],
};

/** Physical locations, shown in the footer and on the contact page. */
export const LOCATIONS = [
  {
    label: "Corporate Office",
    name: "Zebro Officemate Pvt Ltd",
    lines: [
      "No 67/3, E Spur Tank Road",
      "M.S. Nagar, Mukta Gardens, Chetpet",
      "Chennai, Tamil Nadu 600031",
    ],
    phone: "+91 97898 27270",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Zebro+Officemate+Pvt+Ltd+No+67+3+E+Spur+Tank+Rd+Chetpet+Chennai+600031",
  },
  {
    label: "Experience Centre",
    name: "Officemate Experience Centre",
    lines: [
      "New No. 72, Ace Plantina, Gopathy Narayana Road",
      "Thirumurthy Nagar, Satyamurthy Nagar, T. Nagar",
      "Chennai, Tamil Nadu 600017",
    ],
    phone: "+91 97898 27270",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Officemate+72+Ace+Plantina+Gopathy+Narayana+Rd+T+Nagar+Chennai+600017",
  },
];

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Company", href: "/company" },
  { label: "Products", href: "/products", hasDropdown: true },
  { label: "Ergonomic Advisor", href: "/advisor" },
  { label: "Projects", href: "/projects" },
  { label: "Infrastructure", href: "/infrastructure" },
  { label: "Resources", href: "/resources" },
  { label: "Social Responsibility", href: "/social-responsibility" },
  { label: "Career", href: "/career" },
  { label: "Contact", href: "/contact" },
];

export const STATS = [
  { value: 120000, suffix: "+", label: "Chairs shipped" },
  { value: 4.8, suffix: "/5", label: "Average rating", decimals: 1 },
  { value: 1, suffix: "yr", label: "Warranty" },
  { value: 38, suffix: "", label: "Cities served" },
];

export const WHY_CHOOSE = [
  {
    title: "Engineered, not decorated",
    description:
      "Every curve starts as a posture study. If an adjustment doesn't earn its place, it doesn't make the chair.",
  },
  {
    title: "Materials that last",
    description:
      "Full-grain leather, recycled knit and die-cast aluminium — chosen to age well, not to hit a price.",
  },
  {
    title: "Warranty that means it",
    description:
      "One year on frames and mechanisms, because we stand behind every chair we ship.",
  },
  {
    title: "Try before you commit",
    description:
      "Book a live demo or visit a studio. Ergonomics is personal — you should feel it first.",
  },
];

export const PROCESS = [
  {
    step: "01",
    title: "Study",
    description:
      "We start with pressure maps and posture data, not mood boards — the body sets the brief.",
  },
  {
    step: "02",
    title: "Prototype",
    description:
      "Frames are printed, foamed and re-cut dozens of times until the support feels invisible.",
  },
  {
    step: "03",
    title: "Refine",
    description:
      "Real people live with each chair for weeks. Their feedback moves millimetres that matter.",
  },
  {
    step: "04",
    title: "Deliver",
    description:
      "Flat-packed to protect the finish, then set up in minutes with tools included in the box.",
  },
];

/**
 * Homepage testimonials, attributed to clients from the logo carousel.
 *
 * PLACEHOLDER COPY — the companies are real Officemate clients, but these
 * quotes, names and seat counts are written for demo purposes. Every one must
 * be replaced with an approved, on-record quote before this site goes live.
 */
export const TESTIMONIALS = [
  {
    quote:
      "We replaced 400 seats across three floors without a single day of downtime. Six months on, the ergonomic complaints that used to fill our facilities inbox have effectively stopped.",
    name: "Vikram Shah",
    role: "Head of Workplace",
    company: "Freshworks",
    logo: "freshworks.webp",
    detail: "420 seats · Chennai",
    rating: 5,
  },
  {
    quote:
      "Procurement usually means choosing between price and quality. Officemate gave us a transparent ergonomic rating per model, so we could defend the spend to finance with data rather than opinion.",
    name: "Meera Nair",
    role: "Director — Procurement",
    company: "Bosch",
    logo: "bosch.webp",
    detail: "1,100 seats · 4 cities",
    rating: 5,
  },
  {
    quote:
      "They assessed the floor before quoting, staggered delivery around our shift patterns and handled installation overnight. The AMC has been just as dependable two years in.",
    name: "Rajesh Menon",
    role: "General Manager — Admin",
    company: "Royal Enfield",
    logo: "royal-enfield.webp",
    detail: "680 seats · Chennai",
    rating: 5,
  },
  {
    quote:
      "Our teams sit for nine hours a day, so seating is a retention issue, not a furniture line item. Reported back pain across the operations floor dropped noticeably after the rollout.",
    name: "Ananya Rao",
    role: "VP — People & Culture",
    company: "Access Healthcare",
    logo: "access-healthcare.webp",
    detail: "250 seats · Pune",
    rating: 5,
  },
];

/**
 * Homepage FAQ, rendered by components/home/HomeFaqs.tsx.
 *
 * Kept SHORT on purpose — five questions, the ones almost every shopper asks
 * before deciding. An accordion of a dozen rows stops being scannable and
 * starts being a document, and at that point nobody opens any of them. The
 * longer question-and-answer material lives in SEO_SECTIONS at the foot of
 * the page instead, where length is the point.
 *
 * Every number here is also stated in the footer assurance strip and the SEO
 * block. That is why they live in constants rather than in components: a FAQ
 * that contradicts the footer is worse than no FAQ, because it is the surface
 * people trust most.
 *
 * ⚠ TWO ANSWERS WERE FACTUALLY WRONG and are fixed below. The old "try a
 * chair" answer named studios in Bengaluru, Pune, Hyderabad and Mumbai;
 * STORES in constants/home.ts lists Chennai, Coimbatore, Bengaluru and
 * Hyderabad. Pune and Mumbai do not exist and Chennai — the flagship — was
 * missing. The old enquiry answer described an enquiry-only flow that the
 * storefront replaced.
 */
export const HOME_FAQS = [
  {
    question: "How long does delivery take?",
    answer:
      "In-stock models ship in three to five working days. Made-to-order finishes and bulk workspace orders are scheduled with you directly, so you get a confirmed date rather than an estimate.",
  },
  {
    question: "Do I have to assemble the chair myself?",
    answer:
      "No. Every order includes free installation by a trained team, so the chair is unboxed, assembled and adjusted for you. Bulk orders are installed floor by floor around your shift patterns.",
  },
  {
    question: "What does the warranty cover?",
    answer:
      "Frames and mechanisms are covered for one year. Wearing parts such as castors and upholstery carry their own terms, listed on each product page.",
  },
  {
    question: "Can I try a chair before I buy?",
    answer:
      "Yes. Visit an experience centre in Chennai (T. Nagar), Coimbatore, Bengaluru or Hyderabad to sit in the full range. If you cannot get to one, tap Shop Live and a specialist will walk you through the chairs over a video call.",
  },
  {
    question: "Do you supply offices in bulk?",
    answer:
      "We do. For ten seats and up we quote volume pricing, assess the floor before you commit, and stagger delivery so no team loses a working day. GST invoicing and AMC contracts are standard.",
  },
];

export const VALUES = [
  {
    title: "Support first",
    description: "Comfort is never a trade-off. Ergonomics leads every decision we make.",
  },
  {
    title: "Built to last",
    description: "We design for a decade of daily use, not a season of showroom appeal.",
  },
  {
    title: "Honest materials",
    description: "We name what a product is made of, and choose materials that age with grace.",
  },
  {
    title: "Move with people",
    description: "Bodies aren't static, so our chairs and desks are built to move with you.",
  },
];

export const TIMELINE = [
  { year: "2016", title: "The first study", text: "Two engineers and a borrowed pressure mat set out to fix the office chair." },
  { year: "2018", title: "Glide is born", text: "Our self-weighing recline mechanism ships in the first Officemate task chair." },
  { year: "2021", title: "Studios open", text: "Physical studios launch so people can feel the difference before they commit." },
  { year: "2023", title: "Desks join the range", text: "The Orbit standing desk extends ergonomics from the seat to the whole workspace." },
  { year: "2026", title: "120,000 seated", text: "Officemate chairs now support focus in offices and homes across 38 cities." },
];

export const ACHIEVEMENTS = [
  "Red Dot Design Award — Glide Ergo",
  "Good Design Award — Orbit Standing Desk",
  "BIFMA-tested across the full seating range",
  "Carbon-neutral shipping on every order",
];
