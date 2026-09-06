import { Skeleton } from "@/components/common/Skeleton";

/**
 * Loading state for the category listing.
 *
 * SHARED BY TWO DIFFERENT LOADING PATHS, which is why it lives in its own
 * file rather than inline in the page:
 *
 *   app/categories/page.tsx     — the <Suspense> fallback. Shows on a HARD
 *                                 RELOAD, while the server streams and
 *                                 ProductsView (which calls `useSearchParams`)
 *                                 is still suspended.
 *
 *   app/categories/loading.tsx  — the route segment's loading UI. Shows on a
 *                                 CLIENT-SIDE NAVIGATION, e.g. clicking
 *                                 "All Categories" in the header.
 *
 * Cover only one and the other still jumps. Before this existed, a hard
 * reload got card skeletons with an empty strip where the page head belongs,
 * and a client navigation got the ROOT app/loading.tsx instead — a centred
 * spinner in a `min-h-[70vh]` box, a completely different shape.
 *
 * IT MIRRORS THE DIRECTORY VIEW, NOT A PRODUCT LISTING, and deliberately so.
 * This file is a server component: it cannot read `?category=`, so it has to
 * guess which of the two layouts ProductsView will render. Bare /categories —
 * the eight category tiles, no Filters button, no item count — is both the
 * default and by far the most common way in, so that is the shape reserved
 * here. Landing straight on a filtered listing shifts by the height of one
 * toolbar row, which is the cheaper of the two mistakes.
 *
 * The heights and margins are copied from ProductsView and have to stay in
 * step with it: the head row's `lg:flex-row` split with search on the right,
 * `mt-2` on the title, `mt-5` on the grid, `h-10` controls, and the same
 * four-column tile grid.
 */
export function CategoriesSkeleton() {
  return (
    <div className="py-8 md:py-10">
      <div className="container">
        {/* Head row: breadcrumb and title on the left, search on the right.
            The directory has no toolbar row — nothing to filter, nothing to
            count — so the search shares the title's line. */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="min-w-0">
            {/* Breadcrumb — one short line at `text-sm`'s line height. */}
            <Skeleton className="h-5 w-44 rounded-md" />

            {/* Title */}
            <Skeleton className="mt-2 h-8 w-56 rounded-md sm:h-9" />
          </div>

          <Skeleton className="h-10 w-full shrink-0 rounded-lg lg:w-[18rem]" />
        </div>

        {/* Category tiles: square well plus a label line, in a card. Four
            across, matching the directory grid in ProductsView. */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-surface p-3">
              <Skeleton className="aspect-square w-full rounded-xl bg-line/60" />
              <Skeleton className="mx-auto mt-3 h-4 w-1/2 rounded-md bg-line/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
