import type { Metadata } from "next";
import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import { STORES } from "@/constants/home";
import { SITE } from "@/constants/site";
import { waHrefWithText } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { WhatsAppGlyph } from "@/components/common/WhatsAppGlyph";

/**
 * Experience centres.
 *
 * A REAL ROUTE, replacing `/contact#stores`. That anchor pointed into the
 * contact page, which renders <UnderDevelopment /> — so the header's "Stores"
 * link, the floating dock's "Visit store", the bulk band's pill and the
 * homepage rail's "4 locations" all landed on a placeholder. Four surfaces
 * advertising a showroom and none of them arriving at one.
 *
 * ZIGZAG RATHER THAN A GRID, and the reason is the content rather than the
 * fashion. There are four centres and they are not interchangeable — each is
 * a place someone will travel to, so each deserves a full-width photograph
 * you can actually read the room from. A four-up card grid (which the
 * homepage rail already is) shrinks every photo to a thumbnail and turns the
 * page into a directory. Alternating full-bleed rows give the photography
 * room and give the eye a rhythm to follow down the page.
 *
 * The alternation is done with `order` on grid children, not with two
 * different JSX branches. One markup path means a change to the card shape
 * cannot land on only half the rows.
 *
 * Data comes from STORES in constants/home.ts — the same source the homepage
 * rail and the footer addresses use, so a new centre appears in all three at
 * once. It also carries the count in the header below.
 */
export const metadata: Metadata = {
  title: "Experience Centres",
  description:
    "Visit an Officemate experience centre in Chennai, Coimbatore, Bengaluru or Hyderabad. Sit in the full range of ergonomic chairs, desks and workstations before you buy.",
  alternates: { canonical: "/stores" },
  openGraph: {
    title: `Experience Centres — ${SITE.name}`,
    description:
      "Sit in the full range before you buy — four experience centres across South India.",
    url: `${SITE.url}/stores`,
  },
};

export default function StoresPage() {
  return (
    <div className="py-8 md:py-10">
      {/* ------------------------------------------------------- page head */}
      <div className="container">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Experience Centres" }]}
        />

        <h1 className="mt-2 text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[1.75rem]">
          Visit our experience centres
        </h1>

        <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-muted">
          A chair is the one thing you should not buy from a photograph. Sit in
          the full range, compare the mechanisms side by side, and talk to
          someone who knows the difference. Walk in, or message ahead and
          we&apos;ll keep the models you want free.
        </p>
      </div>

      {/* ----------------------------------------------------------- centres */}
      <div className="container mt-10 space-y-14 md:mt-14 md:space-y-20">
        {STORES.map((store, i) => {
          /* Odd rows flip. `order` applies to grid children, so both halves
             stay in one source order and only their placement changes. */
          const flipped = i % 2 === 1;

          const talkHref = waHrefWithText(
            `Hi Officemate, I'd like to know more about the ${store.city} experience centre.`
          );

          return (
            <article
              key={store.city}
              className="grid items-center gap-7 lg:grid-cols-2 lg:gap-14"
            >
              {/* Photograph.

                  `aspect-[4/3]` rather than a fixed height: these are real
                  photographs of rooms at different proportions, and a fixed
                  height would crop some of them through the furniture. */}
              <div
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface",
                  flipped && "lg:order-2"
                )}
              >
                <Image
                  src={store.image}
                  alt={`Inside the Officemate experience centre in ${store.city}`}
                  fill
                  /* Half the page from `lg` up, full width below it. Getting
                     this wrong on a full-bleed photo is expensive — the
                     browser downloads a 2x asset for a slot half the size. */
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                  /* The first centre is above the fold on a laptop. */
                  priority={i === 0}
                />
              </div>

              <div className={cn("min-w-0", flipped && "lg:order-1")}>
                {/* The index is decoration with a job: on a page of four
                    near-identical blocks it tells you how far down you are. */}
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h2 className="mt-2 text-[1.35rem] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[1.6rem]">
                  {store.building}
                </h2>

                <p className="mt-1.5 flex items-center gap-2 text-[0.85rem] font-semibold text-azure">
                  <MapPin size={15} className="shrink-0" />
                  {store.area}, {store.city}
                </p>

                {/* Only rendered when real trading hours exist. STORES omits
                    `hours` deliberately: opening times are a factual claim
                    about a real business, and inventing them sends people to
                    a closed door. Fill them in and this pill appears. */}
                {store.hours && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-azure-soft px-2.5 py-1 text-[0.75rem] font-medium text-azure-ink">
                    <Clock size={13} />
                    {store.hours}
                  </span>
                )}

                {/* Address lines stay separate strings rather than one joined
                    block, so they break the way they would on an envelope
                    instead of wherever the column width happens to land. */}
                <address className="mt-4 text-[0.9rem] not-italic leading-relaxed text-muted">
                  {store.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={store.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-night px-7 text-[0.88rem] font-semibold text-white transition-colors hover:bg-night-deep"
                  >
                    Get directions
                  </a>

                  <a
                    href={talkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-line px-6 text-[0.88rem] font-semibold text-ink transition-colors hover:border-ink"
                  >
                    <WhatsAppGlyph className="h-[17px] w-[17px] text-save" />
                    Talk to us
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- close */}
      <div className="container mt-16 md:mt-20">
        <div className="rounded-3xl bg-surface px-6 py-10 text-center md:px-12 md:py-14">
          <h2 className="text-[1.25rem] font-bold tracking-[-0.02em] text-ink sm:text-[1.5rem]">
            Can&apos;t get to a centre?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[0.9rem] leading-relaxed text-muted">
            A specialist will walk you through the range over a video call —
            the same chairs, the same questions answered, from your desk.
          </p>
          <a
            href={waHrefWithText(
              "Hi Officemate, I'd like to shop over a video call."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-night px-7 text-[0.88rem] font-semibold text-white transition-colors hover:bg-night-deep"
          >
            <WhatsAppGlyph className="h-[17px] w-[17px] text-white" />
            Book a live walkthrough
          </a>
        </div>
      </div>
    </div>
  );
}
