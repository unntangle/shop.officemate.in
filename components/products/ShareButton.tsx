"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * Share the current product.
 *
 * Uses the WEB SHARE API where it exists — on a phone that opens the native
 * sheet with WhatsApp, which is how a chair actually gets shared in India.
 * Everywhere else it copies the URL and says so, because a share button that
 * silently does nothing on desktop is worse than one that admits its limits.
 *
 * The confirmation lives on the button rather than in a toast: it is a small,
 * local action and a page-level notification would be louder than the thing
 * it is reporting.
 */
export function ShareButton({
  name,
  tagline,
}: {
  name: string;
  tagline?: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: tagline, url });
        return;
      } catch {
        /* The person dismissed the sheet, or the browser refused. Falling
           through to copy would be wrong for a deliberate cancel, so this
           just ends quietly. */
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard access can be denied outright. Nothing useful to say. */
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Share ${name}`}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-surface"
    >
      {copied ? (
        <Check size={17} className="text-save" />
      ) : (
        <Share2 size={17} />
      )}
    </button>
  );
}
