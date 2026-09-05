import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/constants/categories";
import { CATEGORY_IMAGES } from "@/constants/home";
import { SectionHead } from "@/components/common/SectionHead";

/**
 * "Shop by category" — the bento grid between the hero and the store rail.
 *
 * Driven by CATEGORIES, the same eight the header nav and CategoryStrip use.
 * It previously ran on CATEGORY_TILES (twelve series-level tiles), which gave
 * "Executive Chairs" and "Task Chairs" equal billing as large lifestyle cards
 * while being fairly similar things. Categories are the level a shopper who
 * arrives without a model in mind is actually choosing at.
 *
 * Layout follows the Frido reference: full-bleed photography with the label
 * and arrow sitting ON the image rather than beneath it, and cards at two
 * sizes so the block has a rhythm instead of reading as a uniform sheet.
 *
 * THE SPAN PATTERN IS TIED TO THERE BEING EXACTLY EIGHT TILES.
 *
 * A 4-column grid, one 2x2 feature and one 2x1 wide card comes to
 * 4 + 2 + (6 x 1) = 12 cells — three full rows, no gaps:
 *
 *     [ A A ][ B ][ C ]
 *     [ A A ][ D ][ E ]
 *     [ F F ][ G ][ H ]
 *
 * It also divides cleanly at 2 columns for mobile. Add or remove a category
 * and the last row will leave a hole; either restore the count to eight or
 * drop the spans for a uniform grid. `CategorySlug` is a fixed union, so this
 * only changes if someone deliberately edits the taxonomy.
 */

/** Index 0 is the tall feature; index 5 is the wide one. See the note above. */
const spanFor = (i: number) =>
  i === 0 ? "col-span-2 row-span-2" : i === 5 ? "col-span-2" : "";

export function ShopByCategory() {
  return (
    <section className="section-retail bg-white">
      <div className="container">
        <SectionHead
          title="Shop by category"
          href="/products"
          align="left"
          rule
          description="Eight ranges, every one built on the same frame and finish system."
        />

        {/* Fixed row height rather than aspect-ratio cards: the feature card is
            two rows tall, and that only lines up with its neighbours if the
            rows are a known size. */}
        <div className="grid auto-rows-[8.5rem] grid-cols-2 gap-3 sm:auto-rows-[10rem] md:gap-4 lg:auto-rows-[12rem] lg:grid-cols-4">
          {CATEGORIES.map((category, i) => {
            const feature = i === 0;

            return (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className={`group relative overflow-hidden rounded-2xl bg-surface ${spanFor(i)}`}
              >
                <Image
                  src={CATEGORY_IMAGES[category.slug] ?? ""}
                  alt=""
                  fill
                  sizes={
                    feature
                      ? "(max-width: 1024px) 100vw, 50vw"
                      : "(max-width: 1024px) 50vw, 25vw"
                  }
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Carrying text contrast, not decoration — the label is white
                    over arbitrary photography and several of these shots are
                    bright at the bottom edge. */}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/80 via-scrim/15 to-transparent" />

                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 md:p-4">
                  <span
                    className={`font-bold leading-tight text-white ${
                      feature
                        ? "text-[1.05rem] md:text-[1.35rem]"
                        : "text-[0.85rem] md:text-[0.95rem]"
                    }`}
                  >
                    {category.name}
                  </span>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-colors group-hover:bg-accent group-hover:text-white md:h-9 md:w-9">
                    <ArrowRight size={16} />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
