"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MenuBook, MenuPage } from "@/types/menu";
import { DEFAULT_MENU } from "@/types/defaultMenu";
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
  const pages = useMemo(() => {
    if (menuBook.pages.length >= DEFAULT_MENU.pages.length) {
      return menuBook.pages;
    }

    const missingPages = DEFAULT_MENU.pages
      .slice(menuBook.pages.length)
      .map((page) => ({
        ...page,
        elements: page.elements.map((el) => ({ ...el })),
      }));

    return [...menuBook.pages, ...missingPages];
  }, [menuBook.pages]);
  const maxIndex = Math.max(0, pages.length - 1);
  const clampedInitialPage = useMemo(
    () => Math.max(0, Math.min(initialPage, maxIndex)),
    [initialPage, maxIndex]
  );
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [currentPage, setCurrentPage] = useState(clampedInitialPage);
  const [showSwipeGuide, setShowSwipeGuide] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);
  const swipeGuideStorageKey = "menu_swipe_guide_seen_v1";

  const dismissSwipeGuide = useCallback(() => {
    setShowSwipeGuide(false);
    try {
      window.localStorage.setItem(swipeGuideStorageKey, "1");
    } catch {
      // Ignore storage failures (e.g. private mode restrictions).
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        dismissSwipeGuide();
        swiperRef.current?.slideNext();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        dismissSwipeGuide();
        swiperRef.current?.slidePrev();
      }
    },
    [dismissSwipeGuide]
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

  useEffect(() => {
    if (!isMobileViewport || !canInteract) {
      setShowSwipeGuide(false);
      return;
    }

    let hasSeenGuide = false;
    try {
      hasSeenGuide = window.localStorage.getItem(swipeGuideStorageKey) === "1";
    } catch {
      hasSeenGuide = false;
    }

    if (hasSeenGuide) {
      setShowSwipeGuide(false);
      return;
    }

    setShowSwipeGuide(true);
    const timer = window.setTimeout(() => {
      dismissSwipeGuide();
    }, 5200);

    return () => window.clearTimeout(timer);
  }, [isMobileViewport, canInteract, dismissSwipeGuide]);

  // Dimensions for the single page
  const pageMaxWidth = fullScreen ? "min(100vw, calc(100vh * 2 / 3))" : "400px";
  const containerClasses = fullScreen
    ? "flex flex-col items-center justify-center w-full min-h-screen select-none p-0"
    : "flex flex-col items-center justify-center w-full min-h-[80vh] select-none p-4";
  const stageBackground = "#f3dfc4";

  return (
    <div className={containerClasses}>
      {/* Page Container */}
      <div
        className={`relative bg-[var(--bg-primary)] touch-pan-y overflow-hidden ${
          isMobileFullScreen ? "shadow-none rounded-none" : "shadow-2xl rounded-lg"
        }`}
        onPointerDownCapture={() => {
          if (showSwipeGuide) {
            dismissSwipeGuide();
          }
        }}
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
              ? "1px solid rgba(153,100,58,0.18)"
              : "1px solid rgba(153,100,58,0.14)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none bg-[#f3dfc4]" />

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
          onSlideChange={(swiper) => {
            setCurrentPage(swiper.activeIndex);
            dismissSwipeGuide();
          }}
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
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {showSwipeGuide && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <div className="swipe-guide-panel">
              <div className="swipe-guide-track">
                <div className="swipe-guide-hand" />
              </div>
              <p className="font-body text-[11px] tracking-[0.18em] uppercase text-[var(--accent-dark)] mt-3 text-center">
                Swipe in the middle area
              </p>
              <p className="font-body text-[10px] tracking-[0.14em] uppercase text-[var(--text-muted)] mt-1 text-center">
                Left or right to turn pages
              </p>
            </div>
          </div>
        )}

        {/* Spine shadow for a stronger book feel */}
        {!isMobileFullScreen && !fullScreen && (
          <div className="absolute left-0 top-0 bottom-0 w-6 pointer-events-none bg-gradient-to-r from-[#8c5c35]/20 to-transparent" />
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
              onClick={() => {
                dismissSwipeGuide();
                goBackward();
              }}
              className="absolute left-0 top-0 bottom-0 w-1/4 z-20"
              style={{ touchAction: "manipulation" }}
            />
            <button
              type="button"
              aria-label="Next page"
              disabled={isLast}
              onClick={() => {
                dismissSwipeGuide();
                goForward();
              }}
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
              onClick={() => {
                dismissSwipeGuide();
                goToPage(idx);
              }}
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
