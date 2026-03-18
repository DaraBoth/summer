"use client";
import { useCallback, useEffect } from "react";
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
} from "framer-motion";

interface BookViewerProps {
  menuBook: MenuBook;
  onEditRequest?: (pageId: string) => void;
  fullScreen?: boolean;
  initialPage?: number;
  showHint?: boolean;
  showIndicators?: boolean;
}

const pageTurnVariants = {
  initial: (direction: "forward" | "backward") => ({
    opacity: 0.96,
    rotateY: direction === "forward" ? 78 : -78,
    scale: 0.994,
    transformOrigin: direction === "forward" ? "right center" : "left center",
    filter: "brightness(0.9)",
  }),
  animate: {
    opacity: 1,
    rotateY: 0,
    scale: 1,
    transformOrigin: "center center",
    filter: "brightness(1)",
  },
  exit: (direction: "forward" | "backward") => ({
    opacity: 0.96,
    rotateY: direction === "forward" ? -78 : 78,
    scale: 0.994,
    transformOrigin: direction === "forward" ? "left center" : "right center",
    filter: "brightness(0.9)",
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
}: BookViewerProps) {
  const pages = menuBook.pages;
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
  const dragX = useMotionValue(0);
  const smoothDragX = useSpring(dragX, {
    stiffness: 280,
    damping: 36,
    mass: 0.28,
  });
  const dragTilt = useTransform(smoothDragX, [-220, 0, 220], [11, 0, -11]);
  const dragRotateZ = useTransform(smoothDragX, [-220, 0, 220], [1, 0, -1]);
  const dragScale = useTransform(smoothDragX, [-220, 0, 220], [0.989, 1, 0.989]);
  const leftEdgeShade = useTransform(smoothDragX, [0, 220], [0, 0.25]);
  const rightEdgeShade = useTransform(smoothDragX, [-220, 0], [0.25, 0]);
  const centerGloss = useTransform(
    smoothDragX,
    [-220, -60, 0, 60, 220],
    [0.2, 0.08, 0, 0.08, 0.2]
  );

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

  // Swipe gesture handler
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = fullScreen ? 80 : 55;
    const velocityThreshold = 500;
    
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      goForward();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      goBackward();
    }

    dragX.set(0);
  };

  // Dimensions for the single page
  const pageMaxWidth = fullScreen ? "min(100vw, calc(100vh * 2 / 3))" : "400px";
  const containerClasses = fullScreen
    ? "flex flex-col items-center justify-center w-full min-h-screen select-none p-0"
    : "flex flex-col items-center justify-center w-full min-h-[80vh] select-none p-4";

  return (
    <div className={containerClasses}>
      {/* Page Container */}
      <div
        className="relative shadow-2xl rounded-lg bg-[var(--bg-primary)] touch-none overflow-hidden"
        style={{ 
          perspective: 2200,
          background: fullScreen ? "#111820" : "var(--bg-primary)",
          width: "100%", 
          maxWidth: pageMaxWidth,
          height: "auto", 
          aspectRatio: "2/3",
          border: fullScreen
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(212,175,106,0.1)",
        }}
      >
        <AnimatePresence mode="wait" custom={flipDirection}>
          <motion.div
            key={currentPage}
            custom={flipDirection}
            variants={pageTurnVariants}
            drag={isAnimating ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            dragMomentum={false}
            dragTransition={{ bounceStiffness: 320, bounceDamping: 24 }}
            whileDrag={{ cursor: "grabbing", scale: 1.002 }}
            style={{ x: dragX }}
            onDragEnd={handleDragEnd}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ 
              duration: 0.68,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative w-full h-full cursor-grab active:cursor-grabbing"
          >
            <motion.div
              className="w-full h-full"
              style={{
                rotateY: dragTilt,
                rotateZ: dragRotateZ,
                scale: dragScale,
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
              transition={{ duration: 0.4 }}
              style={{
                background:
                  flipDirection === "forward"
                    ? "linear-gradient(90deg, rgba(0,0,0,0.18), transparent 45%)"
                    : "linear-gradient(270deg, rgba(0,0,0,0.18), transparent 45%)",
              }}
            />

            {/* Live drag edge shading to make swipe feel like physical page torque */}
            <motion.div
              className="absolute inset-y-0 left-0 w-24 pointer-events-none"
              style={{
                opacity: leftEdgeShade,
                background: "linear-gradient(90deg, rgba(0,0,0,0.25), transparent)",
              }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-24 pointer-events-none"
              style={{
                opacity: rightEdgeShade,
                background: "linear-gradient(270deg, rgba(0,0,0,0.25), transparent)",
              }}
            />
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: centerGloss,
                background:
                  "linear-gradient(90deg, transparent 44%, rgba(255,255,255,0.22) 50%, transparent 56%)",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Spine shadow for a stronger book feel */}
        <div className="absolute left-0 top-0 bottom-0 w-6 pointer-events-none bg-gradient-to-r from-black/10 to-transparent" />

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
