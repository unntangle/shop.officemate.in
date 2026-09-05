/**
 * Omate AI's mark.
 *
 * An open ring — the "O" of Omate, drawn as an incomplete circle — with a
 * four-point spark sitting in the gap it leaves. The ring reads as the brand
 * initial and as the arc of a chair back; the spark carries the "this thing
 * thinks" idea without being the generic four-point sparkle every AI product
 * ships with.
 *
 * Deliberately NOT lucide's `Sparkles`. That icon is on a large share of AI
 * features on the web, which is exactly why an assistant using it reads as
 * generated rather than designed.
 *
 * Stroke geometry is drawn on a 24-unit grid with `currentColor`, so it
 * inherits text colour and scales cleanly from the 16px CTA to the 30px
 * avatar. The spark is filled rather than stroked so it stays solid and
 * readable at small sizes, where a 1.6-wide outline would close up.
 */
export function OmateMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Open ring. The gap sits at the top-right so the spark reads as
          escaping from it rather than as a separate floating object. */}
      <path
        d="M17.2 5.6A8.2 8.2 0 1 0 20.2 12"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      {/* Four-point spark in the gap. */}
      <path
        d="M19.4 2.6l.78 2.12 2.12.78-2.12.78-.78 2.12-.78-2.12-2.12-.78 2.12-.78z"
        fill="currentColor"
      />
      {/* Inner dot — the seated figure at the centre of the arc, and what
          stops the ring reading as an empty loading spinner. */}
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}
