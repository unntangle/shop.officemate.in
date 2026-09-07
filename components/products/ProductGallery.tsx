"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Box, Scan } from "lucide-react";
import type { CategorySlug } from "@/types";
import { galleryFor, modelFor } from "@/constants/products";
import { cn } from "@/lib/utils";
import { ProductRender } from "@/components/common/ProductRender";
import { useProductColor } from "@/components/products/ColorProvider";
import { ModelViewerOverlay } from "@/components/products/ModelViewerOverlay";

const RENDER_VARIANTS = [0, 1, 2, 3];

export function ProductGallery({
  slug,
  category,
  name,
  images,
}: {
  slug: string;
  category: CategorySlug;
  name: string;
  /**
   * Photography from Shopify, when the product came from there.
   *
   * TAKES PRECEDENCE OVER THE LOCAL GALLERY. Without it this component looked
   * the product up by slug in constants/products.ts, so a product whose
   * images had moved to Shopify still showed its old local shots — the lookup
   * succeeded, nothing appeared broken, and the page simply displayed the
   * wrong chair. Same bug the product cards had.
   *
   * ⚠ COLOUR-SPECIFIC SHOTS ARE LOST while this is set. The local gallery can
   * return a different set per colourway; Shopify media is one list for the
   * whole product. Switching colour will change the swatch and the 3D model
   * but not the photographs. Fixing that properly means per-variant media in
   * Shopify, which is a data job rather than a code one.
   */
  images?: string[];
}) {
  const { active: activeColor } = useProductColor();
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState(false);

  /* The preview portals into <body>, which doesn't exist during SSR — so gate
     it until after mount rather than reaching for document on the server. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* Shopify media first, then real local photography, then the generated
     render. See the note on `images` — a slug lookup that quietly wins over
     the data passed in is how the wrong chair ends up on the page. */
  const photos = images && images.length > 0
    ? images
    : galleryFor(slug, activeColor.name);
  const hasPhotos = photos.length > 0;
  const views = hasPhotos ? photos.map((_, i) => i) : RENDER_VARIANTS;
  const current = Math.min(active, views.length - 1);

  /* Back to the front view when the colourway changes — otherwise you'd stay
     on, say, view 4 of a set that may be ordered differently. */
  useEffect(() => {
    setActive(0);
  }, [activeColor.name]);

  const color = activeColor.hex;

  /* 3D asset for the selected colourway — undefined when none is exported,
     which is what keeps the buttons from rendering as dead controls. */
  const model = modelFor(slug, activeColor.name);
  const [viewer, setViewer] = useState<null | { ar: boolean }>(null);

  /* The 3D / AR rail. Rendered beside the shot on desktop and beneath it on
     mobile, so it's declared once and placed twice. */
  const ViewActions = ({ className }: { className?: string }) =>
    model ? (
      <div className={className}>
        <button
          onClick={() => setViewer({ ar: false })}
          className="neon-ring flex w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-card px-3 py-4 text-ink ring-1 ring-ink/15 transition-all duration-200 hover:ring-ink/40 lg:w-[4.75rem]"
        >
          <Box size={20} strokeWidth={1.5} className="text-azure" />
          <span className="text-[0.625rem] font-semibold uppercase tracking-wide">
            3D view
          </span>
        </button>

        <button
          onClick={() => setViewer({ ar: true })}
          className="neon-ring flex w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-card px-3 py-4 text-ink ring-1 ring-ink/15 transition-all duration-200 hover:ring-ink/40 lg:w-[4.75rem]"
        >
          <Scan size={20} strokeWidth={1.5} className="text-azure" />
          <span className="text-center text-[0.625rem] font-semibold uppercase leading-tight tracking-wide">
            View in
            <br />
            room
          </span>
        </button>
      </div>
    ) : null;

  const step = useCallback(
    (dir: number) => setActive((i) => (i + dir + views.length) % views.length),
    [views.length]
  );

  /* Keyboard control while the preview is open, plus a scroll lock */
  useEffect(() => {
    if (!preview) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(false);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };

    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [preview, step]);

  const Thumb = ({ v }: { v: number }) => (
    <button
      onClick={() => setActive(v)}
      aria-label={`View ${v + 1} of ${name}`}
      aria-pressed={current === v}
      className={cn(
        "relative aspect-square shrink-0 overflow-hidden rounded-lg bg-surface transition-all duration-200",
        current === v ? "ring-1 ring-ink" : "ring-1 ring-line hover:ring-ink/40"
      )}
    >
      {hasPhotos ? (
        <Image src={photos[v]} alt="" fill sizes="80px" className="object-contain" />
      ) : (
        <ProductRender
          category={category}
          color={color}
          variant={v}
          blueprint={v === RENDER_VARIANTS.length - 1}
          label={`${name} thumbnail ${v + 1}`}
        />
      )}
    </button>
  );

  return (
    /* self-start is what makes the sticky work: as a grid item this column
       would otherwise stretch to the full row height, leaving it nothing to
       travel within, and sticky would silently do nothing. */
    <div className="lg:sticky lg:top-20 lg:self-start">
      <div className="flex gap-3">
        {/* Thumbnail rail — vertical alongside the shot on desktop */}
        {views.length > 1 && (
          <div className="thin-scrollbar hidden max-h-[calc(100vh-9rem)] w-[5rem] shrink-0 flex-col gap-3 overflow-y-auto p-1 lg:flex">
            {views.map((v) => (
              <Thumb key={v} v={v} />
            ))}
          </div>
        )}

        {/* Main shot — click to preview. Square, sized from the viewport
           height, so the frame is exactly as wide as the shot inside it. */}
        <div className="group relative aspect-square w-full flex-1 overflow-hidden rounded-xl border border-line bg-surface lg:h-[min(calc(100vh-9rem),52rem)] lg:w-auto lg:flex-none">
          <button
            onClick={() => setPreview(true)}
            aria-label={`Preview ${name}`}
            className="absolute inset-0 z-10 cursor-zoom-in"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full w-full"
              >
                {hasPhotos ? (
                  <Image
                    src={photos[current]}
                    alt={`${name} — view ${current + 1}`}
                    fill
                    priority={current === 0}
                    sizes="(max-width: 1024px) 90vw, 560px"
                    className="object-contain"
                  />
                ) : (
                  <ProductRender
                    category={category}
                    color={color}
                    variant={current}
                    blueprint={current === RENDER_VARIANTS.length - 1}
                    label={`${name} — view ${current + 1}`}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </button>

          {/* Step through views */}
          {views.length > 1 && (
            <>
              <button
                onClick={() => step(-1)}
                aria-label="Previous view"
                className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-soft backdrop-blur transition-colors duration-300 hover:bg-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => step(1)}
                aria-label="Next view"
                className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-soft backdrop-blur transition-colors duration-300 hover:bg-white"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* 3D / AR — vertical rail to the right of the shot on desktop */}
        <ViewActions className="hidden shrink-0 flex-col justify-center gap-3 lg:flex" />
      </div>

      {/* 3D / AR — side-by-side beneath the shot on mobile */}
      <ViewActions className="mt-3 grid grid-cols-2 gap-2 lg:hidden" />

      {/* Thumbnail row — horizontal below the shot on mobile */}
      {views.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 lg:hidden">
          {views.map((v) => (
            <Thumb key={v} v={v} />
          ))}
        </div>
      )}

      {/* Preview — portalled to <body>. The wrapper above is `lg:sticky`,
         which always creates a stacking context, so left in place the overlay
         would be trapped inside it and render beneath the fixed navbar no
         matter how high its z-index went. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setPreview(false)}
                className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm md:p-10"
                role="dialog"
                aria-modal="true"
                aria-label={`${name} preview`}
              >
                <button
                  onClick={() => setPreview(false)}
                  aria-label="Close preview"
                  className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <X size={20} />
                </button>

                {/* The shot itself — contained here, so nothing is cropped */}
                <motion.div
                  key={current}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative h-full w-full max-w-4xl"
                >
                  {hasPhotos ? (
                    <Image
                      src={photos[current]}
                      alt={`${name} — view ${current + 1}`}
                      fill
                      sizes="100vw"
                      className="object-contain"
                    />
                  ) : (
                    <ProductRender
                      category={category}
                      color={color}
                      variant={current}
                      blueprint={current === RENDER_VARIANTS.length - 1}
                      label={`${name} — view ${current + 1}`}
                    />
                  )}
                </motion.div>

                {views.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        step(-1);
                      }}
                      aria-label="Previous view"
                      className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        step(1);
                      }}
                      aria-label="Next view"
                      className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                      {current + 1} / {views.length}
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* 3D / AR viewer. Mounted only on demand — it pulls in both the
         model-viewer library and a ~25MB .glb, so it stays off the page until
         someone actually asks for it. */}
      {viewer && model && (
        <ModelViewerOverlay
          model={model}
          name={name}
          autoAR={viewer.ar}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
