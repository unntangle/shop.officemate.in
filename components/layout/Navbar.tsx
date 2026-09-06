"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
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
import { useAuth } from "@/components/common/AuthProvider";
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

/**
 * Shared cell styling for the mega-menu grids.
 *
 * Separator rules instead of gaps. Tiles floating in whitespace read as one
 * loose cluster — nothing marks where a target ends, so the panel scans as a
 * single block. Rules give each cell an edge and turn it into a grid you can
 * read across or down.
 *
 * TWO VARIANTS BECAUSE TAILWIND CANNOT TAKE A DYNAMIC COLUMN COUNT. The
 * nth-child selectors have to be literal strings for the JIT scanner to see
 * them, so a `menuCell(cols)` helper would silently emit no CSS at all. If a
 * grid's column count changes, its constant changes with it.
 *
 * What the selectors do, using the 4-column version as the example:
 *   4n     — last cell in a row: no right rule, no right padding, so the row
 *            ends flush with the container instead of on a floating stub.
 *   4n+1   — first in a row: no left padding, same reason on the other side.
 *   -n+4   — the first row: no top padding, so the grid starts level with the
 *            container's own vertical space.
 *   last   — only on the 5-column version, where the last row is often
 *            PARTIAL. Six series across five columns leaves one cell on row
 *            two, and without this its right rule juts into empty space.
 *
 * The bottom rule under the final row is not switched off here — it is
 * clipped by the wrapper. See `menuGridClip` below.
 */
const menuCell4 =
  "group flex items-center gap-4 border-b border-r border-line py-5 pl-7 pr-7 [&:nth-child(-n+4)]:pt-0 [&:nth-child(4n)]:border-r-0 [&:nth-child(4n)]:pr-0 [&:nth-child(4n+1)]:pl-0";

const menuCell5 =
  "group flex items-center gap-4 border-b border-r border-line py-5 pl-6 pr-6 [&:nth-child(-n+5)]:pt-0 [&:nth-child(5n)]:border-r-0 [&:nth-child(5n)]:pr-0 [&:nth-child(5n+1)]:pl-0 last:border-r-0";

/**
 * Wrapper that removes the rule under the last row.
 *
 * Every cell keeps its `border-b`; the grid pulls itself up 1px with `-mb-px`
 * inside this `overflow-hidden` box, which trims exactly the bottom-most rule
 * and nothing else.
 *
 * The obvious alternative — an `[&:nth-child(n+5)]` variant killing the last
 * row's borders — hardcodes the item count. Add a ninth category and it would
 * strip rules off the middle row while leaving one under the new bottom row.
 * The clip does not care how many cells there are, which matters most on the
 * group panels, where the count changes with every tab.
 */
const menuGridClip = "overflow-hidden";

export function Navbar() {
  const pathname = usePathname();
  const { totals, ready, openDrawer, wishlist } = useCart();
  const { signedIn, ready: authReady, openLogin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  /* Desktop search collapses to an icon once someone is signed in, and this
     is whether the expanded row is showing. See the note where it renders. */
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [preview, setPreview] = useState<CategorySlug | null>(null);

  /* Hover intent. A 300ms delay before opening means a pointer travelling
     across the nav to reach something else doesn't flash three panels open on
     the way past. Once a panel IS open, switching between triggers is
     instant — the shopper has already committed to the menu, and delaying the
     swap would feel like lag rather than restraint. */
  const openTimer = useRef<number | null>(null);

  /* Both halves of the expanding search: the toggle in the icon row and the
     row it opens. A click outside BOTH closes it — see the effect below. */
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const searchRowRef = useRef<HTMLDivElement>(null);

  const cancelOpen = () => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const scheduleOpen = (id: string) => {
    cancelOpen();
    if (openMenu) {
      setOpenMenu(id);
      return;
    }
    openTimer.current = window.setTimeout(() => setOpenMenu(id), 300);
  };

  const closeNow = () => {
    cancelOpen();
    setOpenMenu(null);
  };

  /* A pending timer that fires after unmount would set state on a dead
     component. */
  useEffect(() => cancelOpen, []);

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
    setSearchOpen(false);
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

  /* Click anywhere outside the search and it closes, which is why the toggle
     no longer needs an X. A dedicated close button is a second control for
     something the page already communicates — clicking away is what people do
     with an expanded search bar without being told.

     Checking BOTH refs matters. The popular-searches panel is `fixed`, but it
     is still a DOM descendant of the SearchBar inside `searchRowRef`, so
     `contains` covers it and clicking a category tile does not close the row
     out from under the navigation it just triggered.

     `mousedown` rather than `click`: on `click` the row would close before the
     tile's own handler ran, and the navigation would be lost. */
  useEffect(() => {
    if (!searchOpen) return;

    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchBtnRef.current?.contains(target)) return;
      if (searchRowRef.current?.contains(target)) return;
      setSearchOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  /* `ready` gates the count so a server-rendered 0 doesn't flash before
     localStorage is read and the real number lands. */
  const cartCount = ready ? totals.itemCount : 0;
  const wishCount = ready ? wishlist.length : 0;

  /**
   * Where the category nav lives.
   *
   * Signed in it sits INLINE, between the logo and the icons, and the search
   * field collapses to an icon to make room. Signed out it keeps its own
   * centred row underneath, and the search field stays inline instead.
   *
   * Only one of the two ever renders, and both take their markup from
   * `renderNav` / `menuPanel` below — rendered twice from copied JSX, the two
   * would drift within a week.
   */
  const navInline = authReady && signedIn;

  /**
   * The nav triggers, plus the corporate links on the standalone row only.
   *
   * `inline` drops the four corporate links entirely rather than hiding them
   * at a breakpoint. Beside a 293px logo and five icons there is no width
   * where they sit on one line — they wrapped to two rows and broke the
   * header's height instead. They stay on the signed-out row, where the
   * full width is theirs, and they are reachable from the footer and the
   * mobile sheet in both states.
   */
  const renderNav = (inline: boolean) => (
    <>
      {SHOP_MENUS.map((menu) => {
        const isOpen = openMenu === menu.id;
        return (
          <button
            key={menu.id}
            onMouseEnter={() => scheduleOpen(menu.id)}
            onFocus={() => {
              /* Keyboard focus opens immediately. Hover intent is about a
                 pointer sweeping past; a tab press is deliberate. */
              cancelOpen();
              setOpenMenu(menu.id);
            }}
            onClick={() => {
              cancelOpen();
              setOpenMenu(isOpen ? null : menu.id);
            }}
            aria-expanded={isOpen}
            className={`flex h-full items-center gap-1.5 whitespace-nowrap px-3.5 text-[0.85rem] font-medium transition-colors ${
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

      {!inline && (
        <>
          <span className="mx-3 h-4 w-px bg-line" />
          {CORPORATE_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onMouseEnter={closeNow}
              className="whitespace-nowrap px-3 text-[0.85rem] text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </>
      )}
    </>
  );

  /**
   * The mega-menu panel.
   *
   * Hoisted for the same reason as the nav, but with a harder constraint: it
   * is `absolute inset-x-0 top-full`, so it MUST render inside whichever
   * wrapper is currently holding the triggers, or it opens in the wrong place.
   * That wrapper also carries `onMouseLeave` — the pointer has to travel from
   * a label down into the panel without crossing dead space, which only works
   * if the row and the panel share one positioned element.
   */
  const menuPanel = (
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

             "All categories" is a flat tile grid — nothing to drill into, so a
             left rail would be a rail with no second pane to drive. The four
             groups get the tab row plus product preview, because there a
             category has series under it worth revealing. */}
          {activeMenu?.id === "all" ? (
            <div className="container py-8">
              {/* Rules rather than gaps — see `menuCell4`. */}
              <div className={menuGridClip}>
                <div className="-mb-px grid grid-cols-4">
                  {activeMenu.categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/products?category=${category.slug}`}
                      className={menuCell4}
                    >
                      {/* The well is static; only the photo inside it moves.
                         Eight tiles that each lift on hover make the panel feel
                         unstable — see CategoryStrip. */}
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
              </div>

              <div className="mt-7 flex justify-end">
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
                 splits "Shop By Usecase" from "Shop By Concerns". A group can
                 hold three categories (Work does), and a tab row handles that
                 without the vertical rail the panel used before. Hover switches
                 tabs — the pointer is already moving across the row, so
                 requiring a click would add a step to a gesture the shopper is
                 performing anyway. */}
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

              {/* Rules rather than gaps — see `menuCell5`. `min-h` keeps the
                  panel from collapsing when a tab has one item, so switching
                  tabs does not jump the page. */}
              <div className={`mt-8 ${menuGridClip}`}>
                <div className="-mb-px grid min-h-[5rem] grid-cols-5">
                  {previewItems.length > 0
                    ? previewItems.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/products/${item.slug}`}
                          className={menuCell5}
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
                         series fill the row instead, so a tab never opens onto
                         an empty band. */
                      previewSlug &&
                      previewCategory?.subcategories &&
                      previewCategory.subcategories.map((series) => (
                        <Link
                          key={series}
                          href={`/products?category=${previewSlug}&sub=${encodeURIComponent(series)}`}
                          className={menuCell5}
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
              </div>

              <div className="mt-7 flex justify-end">
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
  );

  return (
    <header className="sticky top-0 z-50 w-full">
      <AnnouncementBar />

      {/* ---------------------------------------------------------------
          Utility row: logo, nav or search, account actions.

          `relative` and `onMouseLeave` are here rather than only on the nav
          row below, because when the nav is inline this row is the one that
          holds both the triggers and the panel.
      --------------------------------------------------------------- */}
      <div
        className="relative border-b border-line bg-white"
        onMouseLeave={navInline ? closeNow : undefined}
      >
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
              {/* The real vector, extracted from the old PHP site. Plain <img>
                  rather than next/image: next.config.mjs does not set
                  `dangerouslyAllowSVG`, so an SVG through the optimizer 400s.

                  SIZED BY HEIGHT, AND THE NUMBERS ARE NOT THE WEBP'S. The
                  vector is 12.19:1 where logo.webp was about 8.9:1, so the
                  same `h-7` that fitted the raster renders this ~37% wider.
                  h-6 at desktop lands near 293px, roughly what officemate.in
                  itself uses. h-4 on mobile keeps the burger, logo and two
                  icons inside a 375px viewport.

                  `fetchPriority="high"` replaces next/image's `priority` —
                  this is the first thing painted on every page. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.svg"
                alt={SITE.name}
                width={739}
                height={61}
                fetchPriority="high"
                decoding="async"
                className="h-4 w-auto object-contain sm:h-5 md:h-6"
              />
            </Link>

            {/* Signed out, the search field takes the middle and dominates the
                row — which is right, because finding a product is the only
                thing a new visitor is there to do.

                Signed in, the nav takes that space and search collapses to an
                icon. Someone with an account is more often arriving to check
                an order than to start a search, and the full field is still
                one click away.

                `authReady` gates it so neither renders and then swaps a frame
                later once localStorage is read. */}
            {navInline ? (
              <nav
                className="hidden flex-1 items-center justify-center lg:flex"
                aria-label="Categories"
              >
                {renderNav(true)}
              </nav>
            ) : (
              <SearchBar className="hidden flex-1 md:block" />
            )}

            <div className="ml-auto flex items-center gap-0.5 md:gap-1">
              {navInline && (
                <button
                  ref={searchBtnRef}
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Search"
                  aria-expanded={searchOpen}
                  className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface md:flex"
                >
                  <Search size={19} />
                </button>
              )}

              <Link
                href="/contact#stores"
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[0.8rem] font-medium text-ink transition-colors hover:bg-surface xl:flex"
              >
                <Store size={16} />
                Stores
              </Link>

              {/* Call button removed. The number is in the footer and on every
                  contact surface, and a `tel:` link is dead weight on desktop
                  where most of this traffic is. */}

              {/* Wishlist appears only once someone has signed in. This hides
                  the ICON, not the data — the wishlist lives in this browser's
                  storage either way. It is a UI affordance, not a permission.
                  See AuthProvider. */}
              {navInline && (
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
              )}

              {/* Signed in, this goes to the account dashboard; signed out it
                  opens the sign-in modal. One control, two jobs — which is what
                  people expect from an account icon, and it avoids a second
                  header slot appearing after login and shifting the row. */}
              {signedIn ? (
                <Link
                  href="/account"
                  aria-label="Account"
                  className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface sm:flex"
                >
                  <User size={19} />
                </Link>
              ) : (
                <button
                  onClick={openLogin}
                  aria-label="Sign in"
                  aria-haspopup="dialog"
                  className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface sm:flex"
                >
                  <User size={19} />
                </button>
              )}

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

          {/* Expanded search row.

              A row of its own rather than a dropdown, so the field is the full
              width of the page and the popular-searches panel underneath lines
              up with it. That panel is full-bleed and measures its own
              position, so it follows this row wherever it lands.

              `autoFocus` is right here and would be wrong on load: the row
              only exists because someone just pressed the search button, so
              the cursor belongs in the field. */}
          {navInline && searchOpen && (
            <div ref={searchRowRef} className="hidden pb-3 md:block">
              <SearchBar autoFocus />
            </div>
          )}

          {/* Search moves below the logo row on mobile — squeezing it between
              the burger and four icons leaves a field too narrow to read.
              Always visible there, signed in or not: a phone has no room for
              an icon that reveals another row. */}
          <div className="pb-3 md:hidden">
            <SearchBar />
          </div>
        </div>

        {/* Panel renders here only when the triggers are in this row. */}
        {navInline && menuPanel}
      </div>

      {/* ---------------------------------------------------------------
          Desktop category nav — signed out only.

          `onMouseLeave` sits on the outer wrapper rather than on each trigger,
          so the pointer can travel from a label down into the panel without
          crossing dead space and snapping the menu shut. That is also why the
          row and the panel must share one element.
      --------------------------------------------------------------- */}
      {!navInline && (
        <div
          className="relative hidden border-b border-line bg-white lg:block"
          onMouseLeave={closeNow}
        >
          <div className="container">
            <nav
              className="flex h-12 items-center justify-center"
              aria-label="Categories"
            >
              {renderNav(false)}
            </nav>
          </div>

          {menuPanel}
        </div>
      )}

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
                {/* Same vector as the header, at the same mobile height. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo.svg"
                  alt={SITE.name}
                  width={739}
                  height={61}
                  decoding="async"
                  className="h-4 w-auto object-contain"
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
                {/* The header's account icon is hidden below `sm`, so without
                    this there is no way into sign-in on a phone at all. */}
                {signedIn ? (
                  <Link
                    href="/account"
                    className="mb-2 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line text-sm font-semibold text-ink transition-colors hover:bg-surface"
                  >
                    <User size={17} />
                    My account
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      openLogin();
                    }}
                    aria-haspopup="dialog"
                    className="mb-2 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line text-sm font-semibold text-ink transition-colors hover:bg-surface"
                  >
                    <User size={17} />
                    Sign in
                  </button>
                )}
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
