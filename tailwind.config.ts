import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./constants/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        canvas: "#FFFFFF",
        surface: "#F5F5F5",
        ink: "#2D2D2D",
        muted: "#666666",
        /* Brand red.

           #EC1C24 — THE ACTUAL OFFICEMATE RED, taken from the live site at
           officemate.in, where the logo is an inline SVG carrying
           `.cls-1 { fill: #ec1c24; }`.

           Everything before this was a guess. The palette went #C62828 ->
           #D32F2F -> #E53935 chasing "lighter", all of them Material Design
           shades picked by eye. This one is not a preference, it is the
           company's colour, so it should not be changed without a reason from
           the brand side.

           ⚠ IT SITS JUST BELOW WCAG AA, at about 4.4:1 on white against the
           4.5:1 threshold. That is a property of the brand red itself, not of
           a choice made here.

           One value has to work in both directions — red text and icons on
           white, and a red fill under white button text — and both land at
           that same ratio. It still clears AA for LARGE text (3:1) and for
           non-text UI like fills, borders and icons. What it misses is normal
           body-size text: the "View all" links, section eyebrows, and white
           labels on primary buttons.

           THE FIX IS NOT TO DARKEN THIS. Doing so puts the site off-brand. If
           the contrast gap needs closing, split the token: keep #EC1C24 for
           fills, logos and large type, and add a darkened variant for small
           text and links. Two tokens to remember, brand intact, text passing.

           `soft` is a BACKGROUND tint only — at 97% luminance it cannot carry
           foreground weight. Red text in `soft` on white is 1.1:1, invisible
           rather than subtle.

           `deep` is the hover step. */
        accent: {
          DEFAULT: "#EC1C24",
          soft: "#FDECEA",
          deep: "#C1141B",
        },

        /* ------------------------------------------------------------------
           Retail commerce tokens.

           The Frido reference builds its rhythm out of near-black full-bleed
           bands alternating with white and one warm tint. We keep that rhythm
           but swap Frido's yellow for Officemate red, so the CTA colour still
           reads as the brand rather than as a borrowed palette.
        ------------------------------------------------------------------ */

        /* Full-bleed dark bands ("Officemate for Business", live-shopping,
           testimonials, footer).

           Charcoal rather than near-black. Against a warm red accent a true
           black band reads as harsh and cheapens the red; a neutral charcoal
           lets the accent stay the loudest thing on the page while the band
           itself recedes. White on #282A2E still clears 12:1, so nothing is
           given up on legibility.

           `soft` is for cards sitting *inside* a band — it has to be visibly
           raised without becoming a third colour, hence the small step. */
        night: {
          DEFAULT: "#282A2E",
          soft: "#33363B",
          line: "#41454B",
          /* Deeper step for the footer legal bar, where a subtle floor under
             the main band is wanted rather than another hairline. */
          deep: "#1E2023",
        },

        /* Modal and drawer scrims.

           Kept separate from `night` on purpose: a scrim's job is to kill
           contrast in the layer behind it, so it needs to stay genuinely dark
           even after the section bands were lightened. Tying the two together
           means every future tweak to the band colour silently weakens every
           overlay on the site. */
        scrim: "#14161A",

        /* Warm tint used behind category rails and offer strips — the Frido
           layout needs a third ground so white sections don't run together. */
        sand: "#FBF7F2",

        /* Commerce semantics. Green is deliberately reserved for savings and
           stock, never for a CTA — a discount is information, not an action. */
        save: {
          DEFAULT: "#1F8A4C",
          soft: "#E8F5EE",
        },
        /* Rating pills. Retail convention is green-on-white, not star yellow. */
        rated: "#1F8A4C",

        /* Ergonomics palette — used by the Chair Health Score and Advisor so
           scoring reads as measurement, not as a brand-red sales message. */
        sage: {
          DEFAULT: "#7FB69A",
          soft: "#E8F3EC",
          ink: "#356B52",
        },
        honey: {
          DEFAULT: "#E5B972",
          soft: "#FBF1DF",
          ink: "#8A5D1E",
        },
        lilac: {
          DEFAULT: "#A493C9",
          soft: "#F0ECF8",
          ink: "#4B3F72",
        },
        /* Utility blue for the 3D / AR viewer controls and the floating
           contact dock's trigger. Deliberately outside the brand red: these
           are tools — for inspecting a product, or for reaching a human — not
           calls to action, and reading them as "buy" would be wrong. It is
           also the only blue in the system, so anything that needs to look
           like a utility should come here rather than pick a fresh hex. */
        azure: {
          DEFAULT: "#2F6FEB",
          soft: "#E8F0FE",
          ink: "#1A46A8",
        },
        /* Warm neutral used for full-width section grounds. */
        cream: "#FBF6EC",
        walnut: "#6D4C41",
        /* Hairline. Lighter than the previous #E5E5E5 so the borders that do
           remain — table rules, dividers, input edges — recede rather than
           drawing boxes. Frido's page is held together by white space and soft
           grey fills; a border that reads clearly is already too strong. */
        line: "#ECECEC",
        card: "#FFFFFF",
      },
      fontFamily: {
        /* Both names are set by next/font in app/layout.tsx. Keep them in
           sync with the `variable` option there — a mismatch does not error,
           it just silently resolves to the system-ui fallback.

           No separate display face is loaded today, so `--font-display` falls
           back to `--font-sans` rather than to system-ui. Without the nested
           fallback, every `font-display` heading on the site renders in Segoe
           UI while the body renders in Jakarta. */
        display: [
          "var(--font-display, var(--font-sans))",
          "system-ui",
          "sans-serif",
        ],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.045em",
        eyebrow: "0.22em",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
      },
      boxShadow: {
        /* Flatter and more diffuse than before.

           Frido is a near-flat design: surfaces are separated by fill and
           space, and shadows only appear as a soft lift on hover. Tight, dark
           shadows read as material-design elevation and fight that. Each of
           these is wide-radius and low-opacity — the shape should be felt, not
           seen as an edge. */
        soft: "0 2px 6px -2px rgba(45,45,45,0.04), 0 12px 34px -18px rgba(45,45,45,0.10)",
        lift: "0 6px 16px -8px rgba(45,45,45,0.10), 0 20px 50px -24px rgba(45,45,45,0.18)",
        /* Barely-there edge for the full-width header — a hint of separation
           without the bar looking like it floats above the page. */
        hairline: "0 1px 2px -1px rgba(45,45,45,0.03), 0 6px 20px -16px rgba(45,45,45,0.08)",
        /* Resting product tile. Almost nothing — the grey image well does the
           separating now that cards are borderless. */
        tile: "0 1px 2px rgba(16,24,40,0.03), 0 8px 24px -16px rgba(16,24,40,0.10)",
        /* Deliberately neutralised.

           This used to cast a coloured halo under every primary button
           (`0 12px 34px -12px rgba(198,40,40,0.40)`). A tinted glow makes a
           button read as a graphic rather than a control, and at this density
           — an Add to cart on every tile in the grid — the page picked up a
           red wash it never asked for.

           Kept as a `none` token rather than deleted so any `shadow-accent`
           still sitting in older components resolves to nothing instead of
           silently becoming an unstyled class. */
        accent: "none",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "marquee-slow": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "zoom-in-out": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        /* Cart badge acknowledgement — one bounce, not a loop. A persistent
           animation on a count badge becomes noise within a minute. */
        "badge-pop": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.18)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        /* Attention halo on the floating contact dock — a ring growing out of
           the trigger and fading.

           Opacity is spent EARLY (gone by 70%) while the scale keeps running
           to 2. That asymmetry is the whole effect: the ring is brightest
           where it is tightest around the button, and has already faded by
           the time it is large enough to be intrusive. Fading linearly with
           the growth instead gives a big pale disc hanging over the page for
           half of every cycle. */
        "dock-pulse": {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "70%": { opacity: "0" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        marquee: "marquee 80s linear infinite",
        "marquee-slow": "marquee-slow 34s linear infinite",
        "zoom-in-out": "zoom-in-out 10s ease-in-out infinite",
        "badge-pop": "badge-pop 0.32s cubic-bezier(0.22,1,0.36,1)",
        /* 2.6s, deliberately slow. At around a second this reads as an alarm
           on a control that is on screen at all times; at 2.6 it registers as
           a slow breath you notice once and then stop seeing. The long ease
           puts most of the travel in the first third, so the ring leaves the
           button quickly and drifts out rather than expanding at a constant
           machine rate. */
        "dock-pulse": "dock-pulse 2.6s cubic-bezier(0.22,1,0.36,1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
