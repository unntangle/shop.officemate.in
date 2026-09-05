import Link from "next/link";
import Image from "next/image";
import { CATEGORY_TILES } from "@/constants/home";
import { PLACEHOLDER_IMAGES, SUBCATEGORY_IMAGES } from "@/constants/products";
import { SectionHead } from "@/components/common/SectionHead";

/**
 * "Shop By Categories" — the twelve-tile grid from the Wakefit reference.
 *
 * This is the highest-value block on a furniture homepage: most visitors
 * arrive without a specific model in mind, and this grid is what turns a
 * browse into a category page visit. It sits directly under the hero for that
 * reason, ahead of any product rail.
 */
export function ShopByCategory() {
  return (
    <section className="section-retail bg-white">
      <div className="container">
        <SectionHead
          title="Shop by category"
          href="/products"
          description="Twelve ranges, every one built on the same frame and finish system."
        />

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {CATEGORY_TILES.map((tile, i) => {
            const key = tile.sub ? `${tile.category}:${tile.sub}` : "";
            const image =
              SUBCATEGORY_IMAGES[key] ??
              PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length];

            const href = tile.sub
              ? `/products?category=${tile.category}&sub=${encodeURIComponent(tile.sub)}`
              : `/products?category=${tile.category}`;

            return (
              <Link key={tile.label} href={href} className="group block text-center">
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-lift">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 30vw, 180px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-[0.75rem] font-semibold leading-snug text-ink transition-colors group-hover:text-accent md:text-[0.8rem]">
                  {tile.label}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
