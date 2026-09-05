import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import { SITE } from "@/constants/site";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { EnquiryProvider } from "@/components/common/EnquiryProvider";
import { BackToTop } from "@/components/common/BackToTop";
import { CartProvider } from "@/components/commerce/CartProvider";
import { CartDrawer } from "@/components/commerce/CartDrawer";



/**
 * Storefront typeface.
 *
 * Matched to the Frido reference: a geometric sans with a large x-height, a
 * double-storey `a` and angled terminals on e / c / s. Frido itself appears to
 * run a Gilroy-family face, which is commercially licensed — Plus Jakarta Sans
 * is the closest freely-licensed equivalent and carries the full 200-800 range
 * the storefront needs (400 body, 600 card titles, 700-800 section heads).
 *
 * Loaded through next/font rather than an @import, which matters for three
 * reasons: the files are self-hosted at build time so there is no render-
 * blocking round trip to a third-party CDN, no visitor IP is handed to an
 * external font host, and Next generates a size-adjusted fallback that removes
 * the layout shift when the webfont swaps in.
 *
 * This replaces an @import of "Google Sans" from fonts.cdnfonts.com. Google
 * Sans is Google's proprietary corporate typeface and is NOT licensed for
 * third-party use — do not reinstate it.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <html lang="en" className={jakarta.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {/* CartProvider wraps EnquiryProvider rather than the reverse: the
            enquiry modal can be opened from inside a cart surface (bulk order
            prompts on the cart page), but nothing in the cart is reachable from
            the enquiry modal, so the cart is the outer of the two. */}
        <CartProvider>
          <EnquiryProvider>
            <Navbar />
            <main id="main">{children}</main>
            <Footer />
            <BackToTop />
            <CartDrawer />
          </EnquiryProvider>
        </CartProvider>
      </body>
    </html>
  );
}
