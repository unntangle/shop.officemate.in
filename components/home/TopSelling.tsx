import { PRODUCTS } from "@/constants/products";
import { Rail } from "@/components/common/Rail";
import { SectionHead } from "@/components/common/SectionHead";
import { ProductCard } from "@/components/products/ProductCard";

/**
 * "Top Selling Products".
 *
 * Ranked by review count rather than rating. A 5.0 from eleven people is not
 * evidence of a bestseller, and sorting by rating alone reliably floats the
 * newest, least-proven items to the front of the row.
 */
export function TopSelling() {
  const top = [...PRODUCTS]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 8);

  return (
    <section className="section-retail bg-white">
      <div className="container">
        <SectionHead
          kicker="Most ordered this quarter"
          title="Top selling"
          href="/categories?sort=popular"
        />

        <Rail ariaLabel="Top selling products">
          {top.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              compact
              className="w-[10.5rem] sm:w-[13rem] md:w-[15rem]"
            />
          ))}
        </Rail>
      </div>
    </section>
  );
}
