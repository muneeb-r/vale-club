"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Thumbs, FreeMode, Keyboard } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

// Swiper styles
import "swiper/swiper.css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import "swiper/css/free-mode";

interface GalleryProps {
  images: string[];
  businessName: string;
}

export default function Gallery({ images, businessName }: GalleryProps) {
  const t = useTranslations("business");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const previewSwiperRef = useRef<SwiperType | null>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const openAt = useCallback((index: number) => {
    setActiveIndex(index);
    setOpen(true);
  }, []);

  if (images.length === 0) return null;

  return (
    <>
      {/* ── Thumbnail slider (single row, snapping) ── */}
      <div className="relative group">
        <Swiper
          modules={[]}
          onSwiper={(s) => { previewSwiperRef.current = s; }}
          spaceBetween={8}
          slidesPerView="auto"
          className="gallery-preview-swiper overflow-hidden"
        >
          {images.map((src, index) => (
            <SwiperSlide key={src} style={{ width: "auto" }}>
              <button
                onClick={() => openAt(index)}
                className="relative h-40 w-40 sm:h-48 sm:w-48 shrink-0 overflow-hidden rounded-xl bg-muted hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${businessName} ${t("photos")} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
        {images.length > 1 && (
          <>
            <button
              onClick={() => previewSwiperRef.current?.slidePrev()}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-vale-teal text-white flex items-center justify-center shadow-md hover:opacity-80 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => previewSwiperRef.current?.slideNext()}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-vale-teal text-white flex items-center justify-center shadow-md hover:opacity-80 transition-opacity cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* ── Lightbox modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95 pb-16 md:pb-0"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-white/60 text-sm">
              {businessName}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main swiper */}
          <div className="flex-1 min-h-0">
            <Swiper
              modules={[Navigation, Pagination, Thumbs, Keyboard]}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              navigation
              keyboard={{ enabled: true }}
              pagination={{ type: "fraction" }}
              initialSlide={activeIndex}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              className="h-full gallery-main-swiper"
            >
              {images.map((src, i) => (
                <SwiperSlide key={src} className="flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${businessName} ${i + 1}`}
                    className="max-w-full max-h-full object-contain select-none"
                    draggable={false}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="shrink-0 px-4 pb-4 pt-2">
              <Swiper
                modules={[FreeMode, Thumbs]}
                onSwiper={setThumbsSwiper}
                spaceBetween={8}
                slidesPerView="auto"
                freeMode
                watchSlidesProgress
                className="gallery-thumbs-swiper"
              >
                {images.map((src, i) => (
                  <SwiperSlide key={src} style={{ width: 64 }}>
                    <button
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === activeIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-90"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>
      )}

      <style>{`
        .gallery-preview-swiper {
          width: 100%;
        }
        .gallery-main-swiper {
          width: 100%;
          height: 100%;
        }
        .gallery-main-swiper .swiper-slide {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 48px;
        }
        .gallery-main-swiper .swiper-button-prev,
        .gallery-main-swiper .swiper-button-next {
          color: white;
          background: rgba(0,0,0,0.4);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          --swiper-navigation-size: 18px;
        }
        .gallery-main-swiper .swiper-button-prev:hover,
        .gallery-main-swiper .swiper-button-next:hover {
          background: rgba(0,0,0,0.7);
        }
        .gallery-main-swiper .swiper-pagination {
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          bottom: 8px;
        }
        .gallery-thumbs-swiper .swiper-slide {
          width: auto !important;
        }
      `}</style>
    </>
  );
}
