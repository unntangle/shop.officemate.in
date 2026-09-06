import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/constants/categories";
import { CATEGORY_IMAGES } from "@/constants/home";
import { PLACEHOLDER_IMAGES } from "@/constants/products";
import { Rail } from "@/components/common/Rail";

/**
 * Top-level category rail, sitting directly beneath the header.
 *
 * Renders the eight real categories from `constants/categories.ts` and nothing
 * else. It deliberately does NOT mix in subcategories — an earlier version
 * listed twelve tiles combining categories ("Reception Sofas") with series
 * ("Leather Series", "Task Chairs"), which put two different levels of the
 * hierarchy in one row and made the shorter categories look under-represented.
 * Series belong in the nav dropdown and on the listing page, not here.
 *
 * Structure follows the Sleep Company reference — one row of thumbnails with
 * labels beneath, above the hero. Finish follows Frido: flat light-grey wells
 * with softly rounded corners, plain ink labels, no gradient fills and no
 * coloured type.
 *
 * The well is a static grey square that never moves or changes colour. All the
 * hover motion lives on the image inside it, which is clipped by the well's
 * `overflow-hidden` — so the photo grows within a fixed frame rather than the
 * whole tile lifting. A row of eight tiles that each jump on hover makes the
 * strip feel unstable; keeping the frames pinned and animating only the
 * contents reads as considered.
 *
 * `object-cover` because these are stock JPEGs with their own backgrounds (see
 * CATEGORY_IMAGES). If real transparent PNG cut-outs replace them, switch this
 * to `object-contain` and the product will float on the grey well the way it
 * does on the Frido and Sleep Company references.
 */
export function CategoryStrip() {
  return (
    <section className="border-b border-line bg-white py-5 md:py-6">
      <div className="container">
        {/* `safe center` rather than plain `center`.

            Centring a flex container that can overflow is a classic trap: with
            plain `justify-content: center`, once the eight tiles are wider than
            the viewport the overflow spills equally in both directions and the
            first tile ends up in negative scroll space — unreachable, because
            you cannot scroll left of zero. `safe` tells the browser to fall
            back to flex-start the moment content would overflow, so the row
            centres on desktop and scrolls correctly on mobile. */}
        <Rail
          ariaLabel="Shop by category"
          itemClassName="gap-5 md:gap-8 [justify-content:safe_center]"
        >
          {CATEGORIES.map((category, i) => {
            const image =
              CATEGORY_IMAGES[category.slug] ??
              PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length];

            return (
              <Link
                key={category.slug}
                href={`/categories?category=${category.slug}`}
                className="group flex shrink-0 flex-col items-center text-center"
              >
                {/* rounded-xl (16px), not the 24px the product cards use.
                    Corner radius has to scale with the tile: 24px on a 72px
                    square eats most of the corner and drifts toward a circle. */}
                <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-surface md:h-[4.5rem] md:w-[4.5rem]">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 64px, 72px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                  {/* Tint on hover. Sits above the photo rather than on the
                      well, so the frame itself stays completely static. */}
                  <span className="pointer-events-none absolute inset-0 bg-accent/0 transition-colors duration-300 group-hover:bg-accent/10" />
                </div>
                <p className="mt-2.5 whitespace-nowrap text-[0.78rem] font-medium leading-snug text-ink transition-colors group-hover:text-accent md:text-[0.82rem]">
                  {category.name}
                </p>
              </Link>
            );
          })}
        </Rail>
      </div>
    </section>
  );
}
