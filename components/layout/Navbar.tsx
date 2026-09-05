"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  Menu,
  Phone,
  ShoppingBag,
  Store,
  User,
  X,
} from "lucide-react";
import { SITE } from "@/constants/site";
import type { CategorySlug } from "@/types";
import {
  CATEGORIES,
  CATEGORY_GROUPS,
  categoriesIn,
} from "@/constants/categories";
import { CATEGORY_IMAGES } from "@/constants/home";
import { CATALOG } from "@/lib/catalog";
import { formatINR } from "@/lib/commerce";
import { useCart } from "@/components/commerce/CartProvider";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SearchBar } from "@/components/layout/SearchBar";
import { EASE } from "@/lib/motion";

/** Secondary links that used to be primary nav on the showcase site. */
const CORPORATE_LINKS = [
  { label: "Become a Dealer", href: "/contact?intent=dealer" },
  { label: "Bulk Orders", href: "/contact?intent=bulk" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/company" },
];

/**
 * Top-level shop menus: the full catalogue, then the four intent groups.
 *
 * "All categories" is modelled as a group of everything rather than as a
 * special case, so the trigger and the panel have exactly one render path.
 * It differs only in `showSeries` — listing all nineteen series under it
 * would produce a panel taller than most viewports, and a shopper who has
 * opened "all" is browsing categories, not hunting a specific series.
 */
const SHOP_MENUS = [
  {
    id: "all",
    label: "All Categories",
    categories: CATEGORIES,
    showSeries: false,
  },
  ...CATEGORY_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    categories: categoriesIn(group),
    showSeries: true,
  })),
];

export function Navbar() {
  const pathname = usePathname();
  const { totals, ready, openDrawer, wishlist } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [preview, setPreview] = useState<CategorySlug | null>(null);

  const activeMenu = SHOP_MENUS.find((m) => m.id === openMenu) ?? null;

  /* The previewed category is validated against the open menu rather than
     reset by an effect. Switching from Work to Relax leaves `preview` holding
     a slug that Relax doesn't contain; checking membership here falls back to
     the group's first category in the same render, so the right pane never
     shows a category the left pane isn't listing. */
  const previewSlug =
    (preview && activeMenu?.categories.some((c) => c.slug === preview)
      ? preview
      : null) ??
    activeMenu?.categories[0]?.slug ??
    null;

  const previewCategory = CATEGORIES.find((c) => c.slug === previewSlug);

  /* Real models first. An estimated price renders as "Price on request", and
     a preview pane made entirely of those tells a shopper nothing. */
  const previewItems = useMemo(
    () =>
      previewSlug
        ? CATALOG.filter((i) => i.category === previewSlug && i.image)
            .sort(
              (a, b) =>
                Number(a.pricingIsEstimated) - Number(b.pricingIsEstimated)
            )
            .slice(0, 5)
        : [],
    [previewSlug]
  );

  /* Close the mobile sheet on navigation. Leaving it open across a route
     change is the single most common bug in a header like this — the new page
     renders behind a panel the shopper thought they had dismissed. The
     dropdown has the same failure mode: clicking a series link navigates but
     the pointer never leaves the panel, so no mouseleave fires and the menu
     hangs over the page it just opened. */
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  /* Escape closes the dropdown. Keyboard users open it with focus, and
     without this the only way back out is to tab through every link in the
     panel. */
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMenu]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* `ready` gates the count so a server-rendered 0 doesn't flash before
     localStorage is read and the real number lands. */
  const cartCount = ready ? totals.itemCount : 0;
  const wishCount = ready ? wishlist.length : 0;

  return (
    <header className="sticky top-0 z-50 w-full">
      <AnnouncementBar />

      {/* ---------------------------------------------------------------
          Utility row: logo, search, account actions.
      --------------------------------------------------------------- */}
      <div className="border-b border-line bg-white">
        <div className="container">
          <div className="flex h-16 items-center gap-3 md:h-[4.25rem] md:gap-6">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface lg:hidden"
            >
              <Menu size={22} />
            </button>

            <Link href="/" className="shrink-0" aria-label={`${SITE.name} home`}>
              <Image
                src="/images/logo.webp"
                alt={SITE.name}
                width={132}
                height={32}
                priority
                className="h-7 w-auto object-contain md:h-8"
              />
            </Link>

            <SearchBar className="hidden flex-1 md:block" />

            <div className="ml-auto flex items-center gap-0.5 md:gap-1">
              <Link
                href="/contact#stores"
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[0.8rem] font-medium text-ink transition-colors hover:bg-surface xl:flex"
              >
                <Store size={16} />
                Stores
              </Link>

              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                aria-label="Call us"
                className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface md:flex"
              >
                <Phone size={18} />
              </a>

              <Link
                href="/wishlist"
                aria-label={`Wishlist${wishCount ? `, ${wishCount} saved` : ""}`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
              >
                <Heart size={19} />
                {wishCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 animate-badge-pop items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold text-white">
                    {wishCount}
                  </span>
                )}
              </Link>

              <Link
                href="/contact?intent=account"
                aria-label="Account"
                className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface sm:flex"
              >
                <User size={19} />
              </Link>

              <button
                onClick={openDrawer}
                aria-label={`Cart${cartCount ? `, ${cartCount} items` : ", empty"}`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="absolute right-1 top-1 flex h-4 min-w-4 animate-badge-pop items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold text-white"
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search moves below the logo row on mobile — squeezing it between
              the burger and four icons leaves a field too narrow to read. */}
          <div className="pb-3 md:hidden">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------
          Desktop category nav.

          `onMouseLeave` sits on the outer wrapper rather than on each
          trigger, so the pointer can travel from a label down into the panel
          without crossing dead space and snapping the menu shut. That also
          means the row and the panel must share one element — splitting them
          would reintroduce the gap.
      --------------------------------------------------------------- */}
      <div
        className="relative hidden border-b border-line bg-white lg:block"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="container">
          <nav
            className="flex h-12 items-center justify-center"
            aria-label="Categories"
          >
            {SHOP_MENUS.map((menu) => {
              const isOpen = openMenu === menu.id;
              return (
                <button
                  key={menu.id}
                  onMouseEnter={() => setOpenMenu(menu.id)}
                  onFocus={() => setOpenMenu(menu.id)}
                  onClick={() => setOpenMenu(isOpen ? null : menu.id)}
                  aria-expanded={isOpen}
                  className={`flex h-full items-center gap-1.5 px-3.5 text-[0.85rem] font-medium transition-colors ${
                    isOpen ? "text-accent" : "text-ink hover:text-accent"
                  }`}
                >
                  {menu.label}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              );
            })}

            <span className="mx-3 h-4 w-px bg-line" />

            {CORPORATE_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onMouseEnter={() => setOpenMenu(null)}
                className="px-3 text-[0.85rem] text-muted transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <AnimatePresence>
          {openMenu && (
            <motion.div
              key={openMenu}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: EASE }}
              className="absolute inset-x-0 top-full z-40 border-b border-line bg-white shadow-soft"
            >
              {/* Two panel shapes.

                 "All categories" is a flat tile grid — nothing to drill into,
                 so a left rail would be a rail with no second pane to drive.
                 The four groups get the rail plus product preview, because
                 there a category has series under it worth revealing. */}
              {activeMenu?.id === "all" ? (
                <div className="container py-10">
                  <div className="grid grid-cols-4 gap-x-10 gap-y-7">
                    {activeMenu.categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/products?category=${category.slug}`}
                        className="group flex items-center gap-4"
                      >
                        {/* The well is static; only the photo inside it moves.
                           Eight tiles that each lift on hover make the panel
                           feel unstable — see CategoryStrip. */}
                        <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                          <Image
                            src={CATEGORY_IMAGES[category.slug] ?? ""}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                          />
                        </span>
                        <span className="text-[0.95rem] font-medium leading-snug text-ink transition-colors group-hover:text-accent">
                          {category.name}
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-9 flex justify-end">
                    <Link
                      href="/products"
                      className="text-[0.85rem] font-medium text-accent transition-colors hover:text-accent-deep"
                    >
                      View all
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="container py-9">
                  {/* Category names run across the top as tabs, the way Frido
                     splits "Shop By Usecase" from "Shop By Concerns". A group
                     can hold three categories (Work does), and a tab row
                     handles that without the vertical rail the panel used
                     before. Hover switches tabs — the pointer is already
                     moving across the row, so requiring a click would add a
                     step to a gesture the shopper is performing anyway. */}
                  <div
                    className="flex items-center gap-8 border-b border-line"
                    role="tablist"
                  >
                    {activeMenu?.categories.map((category) => {
                      const isActive = previewSlug === category.slug;
                      return (
                        <button
                          key={category.slug}
                          role="tab"
                          aria-selected={isActive}
                          onMouseEnter={() => setPreview(category.slug)}
                          onFocus={() => setPreview(category.slug)}
                          onClick={() => setPreview(category.slug)}
                          className={`-mb-px border-b-2 pb-3 text-[1rem] transition-colors ${
                            isActive
                              ? "border-accent text-ink"
                              : "border-transparent text-muted hover:text-ink"
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 grid min-h-[5rem] grid-cols-5 gap-x-8 gap-y-7">
                    {previewItems.length > 0
                      ? previewItems.map((item) => (
                          <Link
                            key={item.slug}
                            href={`/products/${item.slug}`}
                            className="group flex items-center gap-4"
                          >
                            {/* The well is static; only the photo inside it
                               moves — see CategoryStrip. */}
                            <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                              <Image
                                src={item.image!}
                                alt=""
                                fill
                                sizes="80px"
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                              />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[0.9rem] font-medium text-ink transition-colors group-hover:text-accent">
                                {item.name}
                              </span>
                              <span className="mt-0.5 block text-[0.8rem] text-muted">
                                {/* Never print an invented number. See the
                                   SERIES_PRICING warning in lib/catalog.ts. */}
                                {item.pricingIsEstimated
                                  ? "Price on request"
                                  : formatINR(item.price)}
                              </span>
                            </span>
                          </Link>
                        ))
                      : /* Most categories carry no catalogue entries yet — the
                           shoppable range is chairs plus a few desks. Their
                           series fill the row instead, so a tab never opens
                           onto an empty band. */
                        previewSlug &&
                        previewCategory?.subcategories &&
                        previewCategory.subcategories.map((series) => (
                          <Link
                            key={series}
                            href={`/products?category=${previewSlug}&sub=${encodeURIComponent(series)}`}
                            className="group flex items-center gap-4"
                          >
                            <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                              <Image
                                src={CATEGORY_IMAGES[previewSlug] ?? ""}
                                alt=""
                                fill
                                sizes="80px"
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                              />
                            </span>
                            <span className="text-[0.9rem] font-medium leading-snug text-ink transition-colors group-hover:text-accent">
                              {series}
                            </span>
                          </Link>
                        ))}
                  </div>

                  <div className="mt-9 flex justify-end">
                    <Link
                      href={`/products?category=${previewSlug}`}
                      className="text-[0.85rem] font-medium text-accent transition-colors hover:text-accent-deep"
                    >
                      View all
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------------------------------------------------------
          Mobile sheet.
      --------------------------------------------------------------- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-scrim/50 lg:hidden"
              aria-hidden
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed left-0 top-0 z-[61] flex h-dvh w-[85%] max-w-sm flex-col bg-white lg:hidden"
              role="dialog"
              aria-label="Menu"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <Image
                  src="/images/logo.webp"
                  alt={SITE.name}
                  width={110}
                  height={28}
                  className="h-7 w-auto object-contain"
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* Grouped headings rather than an accordion. The sheet is
                    already a scrolling surface, and collapsing four sections
                    inside it would hide the whole catalogue behind taps on a
                    screen that has room to just show it. `Accordion` is also
                    FAQ-shaped — it takes question/answer strings, not links —
                    so reusing it here would mean rewriting it. */}
                {CATEGORY_GROUPS.map((group) => (
                  <div key={group.id} className="mb-5">
                    <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">
                      {group.label}
                    </p>
                    <ul className="space-y-0.5">
                      {categoriesIn(group).map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/products?category=${c.slug}`}
                            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[0.88rem] font-medium text-ink transition-colors hover:bg-surface"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <Link
                  href="/products"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[0.88rem] font-medium text-accent transition-colors hover:bg-surface"
                >
                  All categories
                </Link>

                <p className="mb-2 mt-6 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">
                  More
                </p>
                <ul className="space-y-0.5">
                  {CORPORATE_LINKS.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="block rounded-lg px-3 py-2.5 text-[0.88rem] text-muted transition-colors hover:bg-surface hover:text-ink"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-line p-4">
                <Link
                  href="/advisor"
                  className="flex h-12 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
                >
                  Find your chair
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
