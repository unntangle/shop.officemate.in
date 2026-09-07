/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    /**
     * Next serves WebP (and resizes per breakpoint) automatically for anything
     * rendered through next/image. `unoptimized` was only needed back when the
     * gallery was generated SVG placeholders — with real photography it costs
     * us the format conversion and the responsive srcset, so it stays off.
     */
    formats: ["image/avif", "image/webp"],
    /**
     * Unsplash is allowed so the category strip can render stand-in imagery
     * through next/image rather than a raw <img>, which keeps the responsive
     * srcset and the format conversion.
     *
     * TEMPORARY. These are stock photographs standing in for real Officemate
     * category shots. Remove this entry once `CATEGORY_IMAGES` points at local
     * assets — leaving a third-party host allowlisted after it stops being
     * used is a needless surface, and it makes the homepage depend on someone
     * else's CDN staying up.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      /**
       * Shopify's image CDN. REQUIRED, not optional — every product image
       * from the Storefront API is served from here, and next/image refuses
       * any host that is not listed rather than falling back to a plain
       * <img>. Without this entry every product photo throws once the
       * catalogue comes from Shopify.
       *
       * This one is permanent, unlike the Unsplash entry above.
       */
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
    ],
  },
  eslint: { ignoreDuringBuilds: true },

  /**
   * Legacy route redirects.
   *
   * /products WAS the catalogue listing before it moved to /categories. It
   * has been 404ing since, which is fine for a URL nobody ever linked to and
   * wrong for one people type by habit — "products" is the obvious guess on
   * any storefront, and a 404 there sends someone to the exit.
   *
   * ⚠ THE SOURCE IS `/products` EXACTLY, NOT A WILDCARD. `/products/:slug`
   * is still the live product detail route and must not be caught by this.
   * Next matches the literal path here, so `/products/zenpro` is untouched —
   * but anyone tempted to write `/products/:path*` to "be thorough" would
   * take every product page down with it.
   *
   * `permanent: true` issues a 308: search engines transfer any ranking the
   * old URL held, and browsers cache it. That is the right call for a move
   * that is not being reversed — but it also means a stale cache will keep
   * redirecting if /products ever becomes a real page again, so changing this
   * back is not as simple as deleting these lines.
   */
  async redirects() {
    return [
      {
        source: "/products",
        destination: "/categories",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
