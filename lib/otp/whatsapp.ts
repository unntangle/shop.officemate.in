/**
 * WhatsApp Cloud API — sending the login code.
 *
 * Lives under lib/otp/ rather than beside lib/whatsapp.ts because it belongs
 * to authentication, not to the chat links. That file builds `wa.me` URLs for
 * a human conversation; this one sends a templated message from a business
 * number. Different number, different credentials, different purpose.
 *
 * Meta's Cloud API directly, no BSP. At this volume a BSP's flat monthly fee
 * would be thirty to fifty times the message cost, and the send is one fetch.
 *
 * ⚠ AUTHENTICATION TEMPLATES ARE NOT FREE TEXT. Meta requires an approved
 * template of category AUTHENTICATION whose body is fixed — you supply only
 * the code as a parameter. An arbitrary "Your code is 123456" message is
 * rejected as an unapproved template.
 */

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const TEMPLATE = process.env.WHATSAPP_OTP_TEMPLATE ?? "otp_login";
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v21.0";

export const whatsappConfigured = Boolean(PHONE_NUMBER_ID && ACCESS_TOKEN);

export type SendResult =
  | { ok: true; logged: boolean }
  | { ok: false; error: string };

/**
 * Send a login code.
 *
 * WHEN NOT CONFIGURED, THE CODE IS LOGGED TO THE SERVER CONSOLE and the send
 * reports success — but only if `allowSimulated` is true. That makes the flow
 * testable while Meta business verification is pending, which takes days and
 * would otherwise block every part of login from being exercised.
 *
 * `allowSimulated` IS DECIDED BY THE CALLER, NOT HERE. On localhost it is
 * always true; deployed, it is true only for the numbers in OTP_DEV_PHONES.
 * This module has no business knowing about allowlists, and the route already
 * has the phone number in hand.
 *
 * When simulation is NOT allowed, a missing configuration is an ERROR rather
 * than a silent success. Logging to a server log nobody reads would leave a
 * real customer staring at a code screen for a message that was never sent.
 */
export async function sendOtpWhatsApp(
  phone: string,
  code: string,
  allowSimulated = false
): Promise<SendResult> {
  if (!whatsappConfigured) {
    if (!allowSimulated) {
      return {
        ok: false,
        error:
          "WhatsApp is not configured. Set WHATSAPP_PHONE_NUMBER_ID and " +
          "WHATSAPP_ACCESS_TOKEN.",
      };
    }

    console.log(
      `\n  ┌──────────────────────────────────────────────\n` +
        `  │  LOGIN CODE for +91 ${phone}:  ${code}\n` +
        `  │  WhatsApp not configured — development only\n` +
        `  └──────────────────────────────────────────────\n`
    );
    return { ok: true, logged: true };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          /* E.164 without the plus. Mobiles are stored as ten digits
             throughout this codebase, so the country code is added here
             rather than carried around in every phone field. */
          to: `91${phone}`,
          type: "template",
          template: {
            name: TEMPLATE,
            language: { code: "en" },
            components: [
              { type: "body", parameters: [{ type: "text", text: code }] },
              {
                /* The copy-code button repeats the code. Meta rejects the
                   message if a template declaring a button is sent without
                   this parameter — a confusing 132000 error otherwise. */
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: code }],
              },
            ],
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`[whatsapp] send failed ${res.status}: ${body}`);
      return { ok: false, error: `WhatsApp returned ${res.status}` };
    }

    return { ok: true, logged: false };
  } catch (err) {
    console.error("[whatsapp] send threw", err);
    return { ok: false, error: "Could not reach WhatsApp." };
  }
}
