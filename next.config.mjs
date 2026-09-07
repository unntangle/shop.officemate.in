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
};
export default nextConfig;
