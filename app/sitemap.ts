import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/constants/products";
import { SITE } from "@/constants/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  /* The catalogue listing lives at /categories now. The per-product routes
     below are unaffected — /products/<slug> is still where a product page
     lives, and only the browse-by-category page moved. */
  const staticRoutes = ["", "/categories", "/about", "/contact"].map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const productRoutes = PRODUCTS.map((p) => ({
    url: `${SITE.url}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
