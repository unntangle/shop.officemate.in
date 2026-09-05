import { Category, CategoryGroup } from "@/types";

export const CATEGORIES: Category[] = [
  {
    slug: "office-chairs",
    name: "Office Chairs",
    tagline: "Executive, Leather, Task & more.",
    subcategories: [
      "Executive Series",
      "Leather Series",
      "Leatherette Series",
      "Task Series",
      "Training Series",
      "Cafe Chairs Series",
    ],
  },
  {
    slug: "office-tables",
    name: "Office Tables",
    tagline: "Conference, cabin & collaborative tables.",
    subcategories: [
      "Executive Table Series",
      "Conference Table Series",
      "Discussion Tables",
      "Cabin Tables",
      "Cafe / Training Tables",
    ],
  },
  {
    slug: "work-stations",
    name: "Work Stations",
    tagline: "Modular & linear workstations.",
    subcategories: ["Modular Workstations", "Linear Workstations", "Zenlift"],
  },
  {
    slug: "soft-sofas",
    name: "Soft Sofas",
    tagline: "Premium reception & lounge sofas.",
    subcategories: ["Sofas"],
  },
  {
    slug: "leisure-lounges",
    name: "Leisure Lounges",
    tagline: "Lounge seating for collaborative spaces.",
    subcategories: ["Lounge Series", "Barstool"],
  },
  {
    slug: "tele-pods",
    name: "Tele Pods",
    tagline: "Focused acoustic privacy pods.",
    subcategories: ["Phone Booth"],
  },
  {
    slug: "work-wellness",
    name: "Work Wellness",
    tagline: "Active furniture for healthier workdays.",
    subcategories: ["Wellness Cycles"],
  },
  {
    slug: "office-storage",
    name: "Office Storage",
    tagline: "Smart storage for every workspace.",
    subcategories: ["Pedestal & Storage"],
  },
];

export const categoryName = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

/**
 * Header groupings for the eight categories above.
 *
 * The labels are verbs because a shopper arrives with a posture in mind, not
 * a SKU family: someone who needs a chair thinks "I need to sit", not "I need
 * the Task Series". Four intent words are also scannable in a way eight
 * product nouns are not — a header row of "Office Chairs / Office Tables /
 * Work Stations / Soft Sofas / Leisure Lounges / Tele Pods / Work Wellness /
 * Office Storage" is a wall of the word "office", and nothing in it earns a
 * glance.
 *
 * The groups are deliberately uneven. `work` carries three categories and
 * nine series; `relax` and `focus` carry two apiece. Balancing them would
 * mean splitting chairs or filing storage somewhere it doesn't belong, and a
 * grouping that reads correctly matters more than four columns of equal
 * height. The panel renders each category as its own column, so the imbalance
 * shows up as a wider panel under `work` rather than as ragged whitespace.
 *
 * `work-wellness` sits under `focus` rather than `work`: wellness cycles are
 * bought for how the workday feels, alongside a phone booth, not alongside a
 * conference table. It is the weakest placement here — if the category grows
 * past one series, it likely deserves its own group.
 *
 * Every category appears in exactly one group. That is not enforced by the
 * type, so if you add a category to `CategorySlug`, add it here too, or it
 * will be reachable only through "All categories".
 */
export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: "sit", label: "Sit", slugs: ["office-chairs"] },
  {
    id: "work",
    label: "Work",
    slugs: ["office-tables", "work-stations", "office-storage"],
  },
  { id: "relax", label: "Relax", slugs: ["soft-sofas", "leisure-lounges"] },
  { id: "focus", label: "Focus", slugs: ["tele-pods", "work-wellness"] },
];

/**
 * Resolve a group's slugs to full category records, in the order the group
 * lists them. Unknown slugs are dropped rather than rendered as holes — a
 * stale slug should cost one missing column, not a crashed header.
 */
export const categoriesIn = (group: CategoryGroup): Category[] =>
  group.slugs
    .map((slug) => CATEGORIES.find((c) => c.slug === slug))
    .filter((c): c is Category => Boolean(c));
