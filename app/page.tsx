import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { BestSellers } from "@/components/home/BestSellers";
import { StoreRail } from "@/components/home/StoreRail";
import { NewArrivals } from "@/components/home/NewArrivals";
import { ErgonomicAdvisor } from "@/components/home/ErgonomicAdvisor";
import { BulkOrderBand } from "@/components/home/BulkOrderBand";
import { Awards } from "@/components/home/Awards";
import { HomeFaqs } from "@/components/home/HomeFaqs";
import { SeoContent } from "@/components/home/SeoContent";

/**
 * Storefront homepage.
 *
 * Section order follows the Wakefit reference; the visual language (rounded
 * cards, alternating white / sand / near-black bands, centred section heads)
 * follows Frido, with Officemate red standing in for Frido's yellow.
 *
 * The ordering logic worth preserving if this gets rearranged: the top of the
 * page exists to get a first click, so it goes category strip → banner →
 * product → category bento → stores. Everything below that exists to catch a
 * shopper who hasn't clicked yet.
 *
 * REMOVED FROM THIS PAGE (components still exist, nothing else imports them):
 *  - TrustStrip — sale countdown + delivery/warranty row. Note its
 *    `endOfToday` deadline is a placeholder needing a real campaign date.
 *  - BankOffers — issuer offer chips. The data was placeholder and would have
 *    advertised card discounts no bank had agreed to.
 *  - ShopByZone — shop-by-room browser. Overlapped ShopByCategory.
 *  - TopSelling — duplicated BestSellers off the same five products.
 *  - FurnitureTabs — the third pass at the same taxonomy.
 *  - AdvisorBanner, FlashSaleStrip, LiveShoppingBanner — the three full-width
 *    promo bands from PromoBanners.tsx. AdvisorBanner duplicated the oAI
 *    section's job and contradicted its copy ("six questions" vs "four");
 *    FlashSaleStrip advertised an unagreed "extra 7% off with select bank
 *    cards"; LiveShoppingBanner offered a video-call service that does not
 *    exist yet. Nothing imports PromoBanners.tsx now.
 *
 * That cut the page from roughly ten browse surfaces to four, which matters
 * more than it sounds: the shoppable catalogue is five chairs, and every extra
 * browser was showing the same handful of products again.
 */
export default function HomePage() {
  return (
    <>
      <CategoryStrip />
      <HeroCarousel />

      <NewArrivals />
      <BestSellers />
      <ShopByCategory />
      <ErgonomicAdvisor />
      <StoreRail />

      <BulkOrderBand />

      <Awards />
      <HomeFaqs />
      <SeoContent />
    </>
  );
}
