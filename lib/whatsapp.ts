import { SITE } from "@/constants/site";

/**
 * WhatsApp link helpers.
 *
 * The number-stripping was duplicated in three components (the floating
 * button, the dock and the business band), which meant three places to get
 * wrong if SITE.phone ever gains an extension or changes format.
 *
 * wa.me wants a bare international number — no +, spaces or dashes.
 */
export const waNumber = SITE.phone.replace(/\D/g, "");

/** Opens a WhatsApp chat with an empty composer. */
export const waChatHref = `https://wa.me/${waNumber}`;

/**
 * Opens WhatsApp with a message already typed.
 *
 * `?text=` is a wa.me feature, not a query param of ours: it prefills the
 * composer and the person still has to press send themselves. That is the
 * difference between a link and sending a message on someone's behalf, and it
 * is why these stay plain anchors.
 *
 * Encode the message — apostrophes and dashes are common in this copy.
 */
export const waHrefWithText = (message: string) =>
  `${waChatHref}?text=${encodeURIComponent(message)}`;

/**
 * "Shop Live" — a video-call shopping session.
 *
 * Shared between the floating dock and the business band so the two never ask
 * for different things. If this copy changes, it changes in both at once.
 */
export const waShopLiveHref = waHrefWithText(
  "Hi Officemate, I'd like to shop over a video call."
);
