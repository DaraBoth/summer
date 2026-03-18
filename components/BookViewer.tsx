"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MenuBook, MenuPage } from "@/types/menu";
import CoverPage from "./CoverPage";
import FlexiblePage from "./FlexiblePage";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCreative, Keyboard, A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

interface BookViewerProps {
  menuBook: MenuBook;
  onEditRequest?: (pageId: string) => void;
  fullScreen?: boolean;
  initialPage?: number;
  showHint?: boolean;
  showIndicators?: boolean;
}

function PageRenderer({
  page,
  index,
  menuBook,
}: {
  page: MenuPage;
  index: number;
  menuBook: MenuBook;
}) {
  if (page.type === "cover") {
    return (
      <CoverPage
        page={page}
        restaurantName={menuBook.restaurantName}
        restaurantNameKh={menuBook.restaurantNameKh}
        tagline={menuBook.tagline}
      />
    );
  }
  if (page.type === "back-cover") {
    return (
      <CoverPage
        page={page}
        restaurantName={menuBook.restaurantName}
        restaurantNameKh={menuBook.restaurantNameKh}
        tagline={menuBook.tagline}
        isBack
      />
    );
  }
  
  return (
    <FlexiblePage 
      page={page} 
      inventory={menuBook.inventory || []} 
      pageNumber={index + 1} 
    />
  );
}

export default function BookViewer({
  menuBook,
  fullScreen = false,
  initialPage = 0,
  showHint = true,
  showIndicators = true,
}: BookViewerProps) {
  const pages = menuBook.pages;
  const maxIndex = Math.max(0, pages.length - 1);
  const clampedInitialPage = useMemo(
    () => Math.max(0, Math.min(initialPage, maxIndex)),
    [initialPage, maxIndex]
  );
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [currentPage, setCurrentPage] = useState(clampedInitialPage);
  const swiperRef = useRef<SwiperType | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        swiperRef.current?.slideNext();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        swiperRef.current?.slidePrev();
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setCurrentPage(clampedInitialPage);
    if (swiperRef.current) {
      swiperRef.current.slideTo(clampedInitialPage, 0, false);
    }
  }, [clampedInitialPage]);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const goForward = useCallback(() => {
    swiperRef.current?.slideNext();
  }, []);

  const goBackward = useCallback(() => {
    swiperRef.current?.slidePrev();
  }, []);

  const goToPage = useCallback((page: number) => {
    swiperRef.current?.slideTo(page);
  }, []);

  const isFirst = currentPage <= 0;
  const isLast = currentPage >= maxIndex;
  const isMobileFullScreen = fullScreen && isMobileViewport;
  const canInteract = pages.length > 1;

  // Dimensions for the single page
  const pageMaxWidth = fullScreen ? "min(100vw, calc(100vh * 2 / 3))" : "400px";
  const containerClasses = fullScreen
    ? "flex flex-col items-center justify-center w-full min-h-screen select-none p-0"
    : "flex flex-col items-center justify-center w-full min-h-[80vh] select-none p-4";
  const stageBackground = "#070b10";

  return (
    <div className={containerClasses}>
      {/* Page Container */}
      <div
        className={`relative bg-[var(--bg-primary)] touch-pan-y overflow-hidden ${
          isMobileFullScreen ? "shadow-none rounded-none" : "shadow-2xl rounded-lg"
        }`}
        style={{ 
          perspective: 2200,
          background: stageBackground,
          width: isMobileFullScreen ? "100vw" : "100%",
          maxWidth: isMobileFullScreen ? "100vw" : pageMaxWidth,
          height: isMobileFullScreen ? "100dvh" : "auto",
          aspectRatio: isMobileFullScreen ? "auto" : "2/3",
          border: isMobileFullScreen
            ? "none"
            : fullScreen
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(212,175,106,0.1)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none bg-[#070b10]" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 pointer-events-none bg-gradient-to-r from-transparent via-black/35 to-transparent opacity-80" />

        <Swiper
          modules={[EffectCreative, Keyboard, A11y]}
          effect="creative"
          speed={380}
          threshold={8}
          resistanceRatio={0.75}
          keyboard={{ enabled: true, onlyInViewport: true }}
          allowTouchMove={canInteract}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            swiper.slideTo(clampedInitialPage, 0, false);
            setCurrentPage(swiper.activeIndex);
          }}
          onSlideChange={(swiper) => setCurrentPage(swiper.activeIndex)}
          a11y={{ enabled: true }}
          creativeEffect={{
            perspective: true,
            prev: {
              translate: ["-15%", 0, -140],
              rotate: [0, -10, 0],
              shadow: true,
            },
            next: {
              translate: ["15%", 0, -140],
              rotate: [0, 10, 0],
              shadow: true,
            },
            limitProgress: 2,
          }}
          className="w-full h-full"
        >
          {pages.map((page, idx) => (
            <SwiperSlide key={page.id}>
              <div className="w-full h-full relative">
                <PageRenderer page={page} index={idx} menuBook={menuBook} />
                <div className="absolute inset-y-0 left-0 w-16 pointer-events-none bg-gradient-to-r from-black/10 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-16 pointer-events-none bg-gradient-to-l from-black/10 to-transparent" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Spine shadow for a stronger book feel */}
        {!isMobileFullScreen && (
          <div className="absolute left-0 top-0 bottom-0 w-6 pointer-events-none bg-gradient-to-r from-black/18 to-transparent" />
        )}

        {/* Swipe Feedback Hints (Subtle) */}
        {!isFirst && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-[var(--accent-forest)]/10 rounded-full blur-[1px]" />
        )}
        {!isLast && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-[var(--accent-forest)]/10 rounded-full blur-[1px]" />
        )}

        {/* Mobile-safe fallback controls: tapping edges always turns pages. */}
        {isMobileViewport && canInteract && (
          <>
            <button
              type="button"
              aria-label="Previous page"
              disabled={isFirst}
              onClick={goBackward}
              className="absolute left-0 top-0 bottom-0 w-1/4 z-20"
              style={{ touchAction: "manipulation" }}
            />
            <button
              type="button"
              aria-label="Next page"
              disabled={isLast}
              onClick={goForward}
              className="absolute right-0 top-0 bottom-0 w-1/4 z-20"
              style={{ touchAction: "manipulation" }}
            />
          </>
        )}
      </div>

      {showIndicators && (
        <div className="flex gap-2 mt-8">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              className="transition-all duration-300"
              style={{
                width: idx === currentPage ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  idx === currentPage
                    ? "var(--accent-forest)"
                    : "var(--accent-olive)",
                opacity: idx === currentPage ? 1 : 0.3,
                border: "none",
                cursor: "pointer",
              }}
              aria-label={`Go to page ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {showHint && (
        <p className="font-body text-[10px] mt-6 text-[var(--text-muted)] tracking-[0.2em] uppercase opacity-60">
          {isMobileViewport ? "Swipe or tap edges to turn page" : "Swipe left or right to turn page"}
        </p>
      )}
    </div>
  );
}
