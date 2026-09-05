import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { TrustStrip } from "@/components/home/TrustStrip";
import { StoreRail } from "@/components/home/StoreRail";
import { NewArrivals } from "@/components/home/NewArrivals";
import { BankOffers } from "@/components/home/BankOffers";
import { ShopByZone } from "@/components/home/ShopByZone";
import {
  AdvisorBanner,
  FlashSaleStrip,
  LiveShoppingBanner,
} from "@/components/home/PromoBanners";
import { TopSelling } from "@/components/home/TopSelling";
import { FurnitureTabs } from "@/components/home/FurnitureTabs";
import { BulkOrderBand } from "@/components/home/BulkOrderBand";
import { Awards } from "@/components/home/Awards";
import { SeoContent } from "@/components/home/SeoContent";

/**
 * Storefront homepage.
 *
 * Section order follows the Wakefit reference; the visual language (rounded
 * cards, alternating white / sand / near-black bands, centred section heads)
 * follows Frido, with Officemate red standing in for Frido's yellow.
 *
 * The ordering logic worth preserving if this gets rearranged: everything
 * above Bank Offers exists to get a first click, so it goes
 * banner → trust → category grid → stores → product. Everything below Top
 * Selling exists to catch a shopper who hasn't clicked yet, which is why the
 * second, more granular category browser (FurnitureTabs) sits deep rather than
 * next to the first one.
 */
export default function HomePage() {
  return (
    <>
      <CategoryStrip />
      <HeroCarousel />
      <TrustStrip />

      <StoreRail />
      <NewArrivals />
      <BankOffers />

      <ShopByZone />
      <AdvisorBanner />
      <FlashSaleStrip />

      <TopSelling />
      <LiveShoppingBanner />

      <FurnitureTabs />
      <BulkOrderBand />

      <Awards />
      <SeoContent />
    </>
  );
}
