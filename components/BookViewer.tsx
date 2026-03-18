"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MenuBook, MenuPage } from "@/types/menu";
import { usePageFlip } from "@/hooks/usePageFlip";
import CoverPage from "./CoverPage";
import FlexiblePage from "./FlexiblePage";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
  useMotionTemplate,
} from "framer-motion";

interface BookViewerProps {
  menuBook: MenuBook;
  onEditRequest?: (pageId: string) => void;
  fullScreen?: boolean;
  initialPage?: number;
  showHint?: boolean;
  showIndicators?: boolean;
  preloadAllPages?: boolean;
}

const pageTurnVariants = {
  initial: (direction: "forward" | "backward") => ({
    opacity: 0.92,
    rotateY: direction === "forward" ? 110 : -110,
    scale: 0.985,
    x: direction === "forward" ? 18 : -18,
    transformOrigin: direction === "forward" ? "right center" : "left center",
  }),
  animate: {
    opacity: 1,
    rotateY: 0,
    scale: 1,
    x: 0,
    transformOrigin: "center center",
  },
  exit: (direction: "forward" | "backward") => ({
    opacity: 0.92,
    rotateY: direction === "forward" ? -110 : 110,
    scale: 0.985,
    x: direction === "forward" ? -18 : 18,
    transformOrigin: direction === "forward" ? "left center" : "right center",
  }),
};

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
  preloadAllPages = false,
}: BookViewerProps) {
  const pages = menuBook.pages;
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const {
    currentPage,
    isAnimating,
    flipDirection,
    goForward,
    goBackward,
    goToPage,
    isFirst,
    isLast,
  } = usePageFlip(pages.length, initialPage);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const dragX = useMotionValue(0);
  const smoothDragX = useSpring(dragX, {
    stiffness: 340,
    damping: 34,
    mass: 0.22,
  });
  const dragTilt = useTransform(smoothDragX, [-260, 0, 260], [70, 0, -70]);
  const dragRotateZ = useTransform(smoothDragX, [-260, 0, 260], [1.4, 0, -1.4]);
  const dragScale = useTransform(smoothDragX, [-260, 0, 260], [0.975, 1, 0.975]);
  const dragLiftY = useTransform(smoothDragX, [-260, 0, 260], [-4, 0, -4]);
  const dragShadowOpacity = useTransform(smoothDragX, [-260, -40, 0, 40, 260], [0.42, 0.18, 0.08, 0.18, 0.42]);
  const leftEdgeShade = useTransform(smoothDragX, [0, 260], [0, 0.34]);
  const rightEdgeShade = useTransform(smoothDragX, [-260, 0], [0.34, 0]);
  const centerGloss = useTransform(
    smoothDragX,
    [-260, -100, 0, 100, 260],
    [0.26, 0.1, 0, 0.1, 0.26]
  );
  const previewOpacity = useTransform(
    smoothDragX,
    [-260, -24, 0, 24, 260],
    [1, 0.18, 0, 0.18, 1]
  );
  const previewScale = useTransform(smoothDragX, [-260, 0, 260], [1, 0.965, 1]);
  const previewTranslateX = useTransform(smoothDragX, [-260, 0, 260], [10, 0, -10]);
  const previewBrightness = useTransform(smoothDragX, [-260, 0, 260], [0.95, 0.72, 0.95]);
  const stageGlow = useTransform(smoothDragX, [-260, 0, 260], [0.18, 0.1, 0.18]);
  const pageShadow = useMotionTemplate`0 24px 60px rgba(0,0,0,${dragShadowOpacity})`;

  const previewPageIndex = useMemo(() => {
    if (isMobileViewport) {
      return null;
    }

    if (isAnimating) {
      return null;
    }

    if (dragOffsetX < -8 && currentPage < pages.length - 1) {
      return currentPage + 1;
    }

    if (dragOffsetX > 8 && currentPage > 0) {
      return currentPage - 1;
    }

    return null;
  }, [isAnimating, dragOffsetX, currentPage, pages.length, isMobileViewport]);

  const previewPageData = previewPageIndex !== null ? pages[previewPageIndex] : null;
  const [isPreloadingAllPages, setIsPreloadingAllPages] = useState(preloadAllPages);

  useEffect(() => {
    if (!preloadAllPages) {
      setIsPreloadingAllPages(false);
      return;
    }

    let isCancelled = false;

    const isPdf = (url: string) => url.toLowerCase().endsWith(".pdf");
    const preloadImage = (url: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });

    const preloadPdf = async (url: string) => {
      try {
        await fetch(url, { cache: "force-cache" });
      } catch {
        // Keep preload resilient: a failed asset should not block startup forever.
      }
    };

    const startPreload = async () => {
      setIsPreloadingAllPages(true);

      const allAssetUrls = Array.from(
        new Set(
          pages.flatMap((page) =>
            (page.elements || [])
              .filter((el) => el.type === "image" && !!el.imageUrl)
              .map((el) => el.imageUrl as string)
          )
        )
      );

      const imageUrls = allAssetUrls.filter((url) => !isPdf(url));
      const pdfUrls = allAssetUrls.filter((url) => isPdf(url));

      await Promise.all([
        ...imageUrls.map((url) => preloadImage(url)),
        ...pdfUrls.map((url) => preloadPdf(url)),
      ]);

      if (!isCancelled) {
        setIsPreloadingAllPages(false);
      }
    };

    void startPreload();

    return () => {
      isCancelled = true;
    };
  }, [preloadAllPages, pages]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goForward();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goBackward();
    },
    [goForward, goBackward]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const currentPageData = pages[currentPage];

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Swipe gesture handler
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = fullScreen ? 40 : 30;
    const velocityThreshold = 280;
    
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      goForward();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      goBackward();
    }

    setDragOffsetX(0);
    dragX.set(0);
  };

  // Dimensions for the single page
  const pageMaxWidth = fullScreen ? "min(100vw, calc(100vh * 2 / 3))" : "400px";
  const containerClasses = fullScreen
    ? "flex flex-col items-center justify-center w-full min-h-screen select-none p-0"
    : "flex flex-col items-center justify-center w-full min-h-[80vh] select-none p-4";
  const isMobileFullScreen = fullScreen && isMobileViewport;
  const stageBackground = "#070b10";

  return (
    <div className={containerClasses}>
      {isPreloadingAllPages && (
        <div className="mb-4 px-4 py-2 rounded-full bg-black/30 text-white/90 text-[10px] tracking-[0.2em] uppercase font-body">
          Preloading menu pages...
        </div>
      )}

      {/* Page Container */}
      <div
        className={`relative bg-[var(--bg-primary)] touch-none overflow-hidden ${
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
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: stageGlow,
            background:
              "radial-gradient(circle at 50% 50%, rgba(97,126,110,0.28), rgba(7,11,16,0.92) 58%, #070b10 100%)",
          }}
        />

        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 pointer-events-none bg-gradient-to-r from-white/5 via-black/35 to-white/5 opacity-70" />

        {previewPageData && previewPageIndex !== null && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: previewOpacity,
              scale: previewScale,
              x: previewTranslateX,
              filter: useMotionTemplate`brightness(${previewBrightness})`,
            }}
          >
            <PageRenderer
              page={previewPageData}
              index={previewPageIndex}
              menuBook={menuBook}
            />
          </motion.div>
        )}

        <AnimatePresence mode="sync" custom={flipDirection}>
          <motion.div
            key={currentPage}
            custom={flipDirection}
            variants={pageTurnVariants}
            drag={isAnimating || isPreloadingAllPages ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            dragMomentum={false}
            dragTransition={{ bounceStiffness: 560, bounceDamping: 34 }}
            whileDrag={{ cursor: "grabbing" }}
            style={{ x: dragX }}
            onDragStart={() => setDragOffsetX(0)}
            onDrag={(event, info) => {
              setDragOffsetX(info.offset.x);
            }}
            onDragEnd={handleDragEnd}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ 
              duration: 0.38,
              ease: [0.22, 0.88, 0.24, 1],
            }}
            className="relative w-full h-full cursor-grab active:cursor-grabbing"
          >
            <motion.div
              className="w-full h-full"
              style={{
                rotateY: dragTilt,
                rotateZ: dragRotateZ,
                scale: dragScale,
                y: dragLiftY,
                boxShadow: pageShadow,
                transformStyle: "preserve-3d",
              }}
            >
              <PageRenderer
                page={currentPageData}
                index={currentPage}
                menuBook={menuBook}
              />
            </motion.div>

            {/* Dynamic page shading to enhance page-turn depth */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0.22 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0.22 }}
              transition={{ duration: 0.28 }}
              style={{
                background:
                  flipDirection === "forward"
                    ? "linear-gradient(90deg, rgba(0,0,0,0.3), transparent 38%)"
                    : "linear-gradient(270deg, rgba(0,0,0,0.3), transparent 38%)",
              }}
            />

            {/* Live drag edge shading to make swipe feel like physical page torque */}
            <motion.div
              className="absolute inset-y-0 left-0 w-24 pointer-events-none"
              style={{
                opacity: leftEdgeShade,
                background: "linear-gradient(90deg, rgba(0,0,0,0.42), transparent)",
              }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-24 pointer-events-none"
              style={{
                opacity: rightEdgeShade,
                background: "linear-gradient(270deg, rgba(0,0,0,0.42), transparent)",
              }}
            />
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: centerGloss,
                background:
                  "linear-gradient(90deg, transparent 45%, rgba(255,255,255,0.22) 50%, transparent 55%)",
              }}
            />
            <motion.div
              className="absolute inset-y-0 pointer-events-none"
              style={{
                left: flipDirection === "forward" ? 0 : "auto",
                right: flipDirection === "forward" ? "auto" : 0,
                width: 18,
                opacity: centerGloss,
                background:
                  flipDirection === "forward"
                    ? "linear-gradient(90deg, rgba(255,255,255,0.34), rgba(255,255,255,0.02))"
                    : "linear-gradient(270deg, rgba(255,255,255,0.34), rgba(255,255,255,0.02))",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Spine shadow for a stronger book feel */}
        {!isMobileFullScreen && (
          <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-r from-black/40 via-black/14 to-transparent" />
        )}

        {/* Swipe Feedback Hints (Subtle) */}
        {!isFirst && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-[var(--accent-forest)]/10 rounded-full blur-[1px]" />
        )}
        {!isLast && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-[var(--accent-forest)]/10 rounded-full blur-[1px]" />
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
          Swipe left or right to turn page
        </p>
      )}
    </div>
  );
}
