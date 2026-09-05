"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, Star, X } from "lucide-react";
import type { CategorySlug } from "@/types";
import { CATEGORIES } from "@/constants/categories";
import { CATALOG, priceBounds, seriesIn } from "@/lib/catalog";
import { formatINR } from "@/lib/commerce";
import { cn } from "@/lib/utils";
import { CatalogCard } from "@/components/products/CatalogCard";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "discount", label: "Biggest discount" },
  { id: "popular", label: "Most reviewed" },
  { id: "newest", label: "Newest" },
] as const;

const [MIN_PRICE, MAX_PRICE] = priceBounds();

export function ProductsView() {
  const router = useRouter();
  const params = useSearchParams();

  const activeCategory = (params.get("category") as CategorySlug | null) ?? "all";
  const activeSub = params.get("sub");
  const urlQuery = params.get("q") ?? "";
  const urlSort = params.get("sort") ?? "featured";

  const [query, setQuery] = useState(urlQuery);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Keep local search in step with the URL. The header search pushes `?q=`,
     and without this the field would keep showing whatever was typed here
     before, contradicting the results on screen. */
  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const patch = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(Array.from(params.entries()));
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  const items = useMemo(() => {
    let list = CATALOG.slice();

    if (activeCategory !== "all") {
      list = list.filter((i) => i.category === activeCategory);
    }
    if (activeSub) list = list.filter((i) => i.subcategory === activeSub);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((i) =>
        `${i.name} ${i.subcategory}`.toLowerCase().includes(q)
      );
    }

    list = list.filter((i) => i.price <= maxPrice);

    if (minRating > 0) {
      list = list.filter((i) => (i.rating ?? 0) >= minRating);
    }

    /* "In stock" here means genuinely buyable — a real price and a real
       product record behind it. An estimated price is not a purchasable item,
       so it must not survive this filter. */
    if (inStockOnly) {
      list = list.filter((i) => Boolean(i.product) && !i.pricingIsEstimated);
    }

    switch (urlSort) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "discount":
        return list.sort(
          (a, b) =>
            (b.compareAtPrice ?? b.price) / b.price -
            (a.compareAtPrice ?? a.price) / a.price
        );
      case "popular":
        return list.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
      case "newest":
        return list.sort(
          (a, b) => Number(Boolean(b.product?.isNew)) - Number(Boolean(a.product?.isNew))
        );
      default:
        /* Featured: photographed and priced models first. A grid that opens on
           a wall of generated placeholders reads as an empty shop. */
        return list.sort(
          (a, b) =>
            Number(Boolean(b.image)) - Number(Boolean(a.image)) ||
            Number(!b.pricingIsEstimated) - Number(!a.pricingIsEstimated)
        );
    }
  }, [activeCategory, activeSub, query, maxPrice, minRating, inStockOnly, urlSort]);

  const series = seriesIn(activeCategory);
  const showSeries = series.length > 1;

  const activeFilterCount =
    (maxPrice < MAX_PRICE ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (activeSub ? 1 : 0);

  const resetAll = () => {
    setMaxPrice(MAX_PRICE);
    setMinRating(0);
    setInStockOnly(false);
    setQuery("");
    patch({ category: null, sub: null, q: null });
  };

  /* ------------------------------------------------------- filter panel */
  const Filters = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-[0.85rem] font-bold text-ink">Category</h3>
        <div className="flex flex-col gap-0.5">
          {[{ slug: "all" as const, name: "All products" }, ...CATEGORIES].map(
            (c) => (
              <button
                key={c.slug}
                onClick={() => patch({ category: c.slug === "all" ? null : c.slug, sub: null })}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-[0.82rem] transition-colors",
                  activeCategory === c.slug
                    ? "bg-accent-soft font-semibold text-accent"
                    : "text-muted hover:bg-surface hover:text-ink"
                )}
              >
                {c.name}
              </button>
            )
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-[0.85rem] font-bold text-ink">Max price</h3>
        <p className="mb-3 text-[0.78rem] text-muted">
          Up to <span className="font-semibold text-ink">{formatINR(maxPrice)}</span>
        </p>
        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={500}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          aria-label="Maximum price"
          className="w-full accent-accent"
        />
        <div className="mt-1 flex justify-between text-[0.7rem] text-muted">
          <span>{formatINR(MIN_PRICE)}</span>
          <span>{formatINR(MAX_PRICE)}</span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-[0.85rem] font-bold text-ink">Rating</h3>
        <div className="flex flex-col gap-0.5">
          {[0, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[0.82rem] transition-colors",
                minRating === r
                  ? "bg-accent-soft font-semibold text-accent"
                  : "text-muted hover:bg-surface hover:text-ink"
              )}
            >
              {r === 0 ? (
                "Any rating"
              ) : (
                <>
                  <Star size={13} className="fill-rated text-rated" />
                  {r} & above
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          <span className="text-[0.82rem] text-ink">
            Buy online only
            <span className="block text-[0.7rem] text-muted">
              Hides quote-only models
            </span>
          </span>
        </label>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={resetAll}
          className="w-full rounded-full border border-line py-2.5 text-[0.8rem] font-semibold text-ink transition-colors hover:border-ink hover:bg-surface"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
        <div className="rounded-2xl border border-line bg-white p-4">
          <Filters />
        </div>
      </aside>

      <div className="min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-[0.82rem] font-semibold text-ink lg:hidden"
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <span className="flex h-11 items-center rounded-full border border-line bg-white px-4 text-[0.82rem] text-muted">
            <span className="mr-1 font-semibold tabular-nums text-ink">
              {items.length}
            </span>
            {items.length === 1 ? "product" : "products"}
          </span>

          <label className="ml-auto flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4">
            <span className="text-[0.78rem] text-muted">Sort</span>
            <select
              value={urlSort}
              onChange={(e) => patch({ sort: e.target.value })}
              aria-label="Sort products"
              className="bg-transparent text-[0.82rem] font-semibold text-ink outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Series chips */}
        {showSeries && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <button
              onClick={() => patch({ sub: null })}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium transition-colors",
                !activeSub
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-ink"
              )}
            >
              All series
            </button>
            {series.map((sub) => (
              <button
                key={sub}
                onClick={() => patch({ sub })}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium transition-colors",
                  activeSub === sub
                    ? "bg-accent text-white"
                    : "bg-surface text-muted hover:text-ink"
                )}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {items.length > 0 ? (
          <motion.div
            layout
            className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <CatalogCard key={item.slug} item={item} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-line py-20 text-center">
            <p className="text-lg font-semibold text-ink">
              Nothing matches those filters
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Try widening the price range or clearing the series filter.
            </p>
            <button
              onClick={resetAll}
              className="mt-6 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 z-[65] bg-scrim/50 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[66] max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-5 lg:hidden"
              role="dialog"
              aria-label="Filters"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-ink">Filters</h2>
                <button
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface"
                >
                  <X size={19} />
                </button>
              </div>
              <Filters />
              <button
                onClick={() => setFiltersOpen(false)}
                className="mt-6 h-12 w-full rounded-full bg-accent text-sm font-semibold text-white"
              >
                Show {items.length} products
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
