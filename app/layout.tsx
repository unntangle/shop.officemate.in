import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import "./globals.css";
import { SITE } from "@/constants/site";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { EnquiryProvider } from "@/components/common/EnquiryProvider";
import { BackToTop } from "@/components/common/BackToTop";
import { FloatingDock } from "@/components/common/FloatingDock";
import { AuthProvider } from "@/components/common/AuthProvider";
import { CartProvider } from "@/components/commerce/CartProvider";
import { CatalogProvider } from "@/components/commerce/CatalogProvider";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { getCatalog } from "@/lib/catalog.server";



/**
 * Storefront typeface.
 *
 * Matched to the Frido reference: a geometric sans with a large x-height,
 * open counters and low stroke contrast. Frido runs a Gilroy-family face,
 * which is commercially licensed, so this is a free stand-in rather than an
 * exact match.
 *
 * Currently Poppins. Note it differs from the reference in one obvious way:
 * Poppins has a SINGLE-storey `a` (a plain circle and stem) where Gilroy's is
 * double-storey. That shows up in almost every heading, so if the headings
 * start looking too round or too geometric, that letter is why.
 *
 * Previously Plus Jakarta Sans (narrower, more grotesque) and Figtree. If this
 * is swapped again, the shortlist worth trying is Outfit and Hanken Grotesk on
 * Google Fonts, or Satoshi / General Sans on Fontshare (free for commercial
 * use, but self-hosted via next/font/local rather than next/font/google).
 *
 * Loaded through next/font rather than an @import, which matters for three
 * reasons: the files are self-hosted at build time so there is no render-
 * blocking round trip to a third-party CDN, no visitor IP is handed to an
 * external font host, and Next generates a size-adjusted fallback that removes
 * the layout shift when the webfont swaps in.
 *
 * The variable MUST stay named `--font-sans`: that is the exact name
 * tailwind.config.ts reads in `fontFamily.sans`. It was once exposed as
 * `--font-jakarta`, which matched nothing, so `var(--font-sans)` resolved to
 * empty and the whole site silently rendered in the system-ui fallback while
 * still paying to download the webfont. Renaming this without renaming the
 * config brings that back.
 *
 * This replaces an @import of "Google Sans" from fonts.cdnfonts.com. Google
 * Sans is Google's proprietary corporate typeface and is NOT licensed for
 * third-party use — do not reinstate it.
 */
const sans = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | Work Ergonomics`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "ergonomic chair",
    "office chair",
    "standing desk",
    "lumbar support",
    "workspace",
    "Officemate",
  ],
  authors: [{ name: SITE.name }],
  alternates: { canonical: "/" },
  /* Served straight from /public rather than the app/icon.png convention, so
     the asset stays where the rest of the imagery lives. `apple` is the
     home-screen icon on iOS, which ignores the standard rel="icon". */
  icons: {
    icon: "/images/fav-icon.png",
    shortcut: "/images/fav-icon.png",
    apple: "/images/fav-icon.png",
  },
  openGraph: {
    type: "website",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Loaded once per request, on the server, and shared by every client
     component that needs it through CatalogProvider below. The header, the
     search panel and the listing grid all read the same array rather than
     each fetching their own copy — which will matter when this is a
     Storefront API round trip rather than a local map.

     This is also what makes RootLayout async. That is fine for a server
     component and changes nothing about how pages render. */
  const catalog = await getCatalog();

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    email: SITE.email,
    telephone: SITE.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${SITE.address.line1}, ${SITE.address.line2}`,
      addressLocality: "Bengaluru",
      addressCountry: "IN",
    },
  };

  return (
    <html lang="en" className={sans.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {/* CatalogProvider is OUTERMOST because CartProvider now reads the
            catalogue: it resolves a saved localStorage line (slug + colour)
            to a Shopify variant ID when migrating a pre-Shopify basket, and
            it looks up the colour swatch and category for each cart line,
            neither of which Shopify's cart returns.

            The order used to be Cart → Catalog, which would throw
            "useCatalog must be used inside <CatalogProvider>" the moment the
            cart called it. The catalogue is inert server data with no
            dependencies of its own, so it can safely sit at the top.

            CartProvider then wraps EnquiryProvider rather than the reverse:
            the enquiry modal can be opened from inside a cart surface (bulk
            order prompts on the cart page), but nothing in the cart is
            reachable from the enquiry modal.

            AuthProvider sits inside CartProvider because the wishlist heart
            needs both — it reads cart state and opens the sign-in modal. */}
        <CatalogProvider items={catalog}>
          <CartProvider>
            <AuthProvider>
              <EnquiryProvider>
                <Navbar />
                <main id="main">{children}</main>
                <Footer />
                <BackToTop />
                <FloatingDock />
                <CartDrawer />
              </EnquiryProvider>
            </AuthProvider>
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
