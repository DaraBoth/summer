"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { MenuBook, MenuPage } from "@/types/menu";
import { usePageFlip } from "@/hooks/usePageFlip";
import CoverPage from "./CoverPage";
import FlexiblePage from "./FlexiblePage";
import { motion, AnimatePresence } from "framer-motion";

interface BookViewerProps {
  menuBook: MenuBook;
  onEditRequest?: (pageId: string) => void;
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

export default function BookViewer({ menuBook, onEditRequest }: BookViewerProps) {
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
  } = usePageFlip(pages.length);

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
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      goForward();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      goBackward();
    }
  };

  // Dimensions for the single page
  const PAGE_W = 400;
  const PAGE_H = 600;

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[80vh] select-none p-4">
      {/* Page Container */}
      <div
        className="relative shadow-2xl rounded-lg bg-[var(--bg-primary)] touch-none overflow-hidden"
        style={{ 
          width: "100%", 
          maxWidth: PAGE_W, 
          height: "auto", 
          aspectRatio: "2/3",
          border: "1px solid rgba(212,175,106,0.1)"
        }}
      >
        <AnimatePresence mode="wait" custom={flipDirection}>
          <motion.div
            key={currentPage}
            custom={flipDirection}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ 
              opacity: 0, 
              rotateY: flipDirection === "forward" ? 90 : -90,
              x: flipDirection === "forward" ? 100 : -100,
              scale: 0.95
            }}
            animate={{ 
              opacity: 1, 
              rotateY: 0,
              x: 0,
              scale: 1
            }}
            exit={{ 
              opacity: 0, 
              rotateY: flipDirection === "forward" ? -90 : 90,
              x: flipDirection === "forward" ? -100 : 100,
              scale: 0.95
            }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              mass: 1
            }}
            style={{ 
              perspective: 1200,
              transformStyle: "preserve-3d",
              originX: flipDirection === "forward" ? 0 : 1
            }}
            className="w-full h-full cursor-grab active:cursor-grabbing origin-center"
          >
            <PageRenderer
              page={currentPageData}
              index={currentPage}
              menuBook={menuBook}
            />
          </motion.div>
        </AnimatePresence>

        {/* Swipe Feedback Hints (Subtle) */}
        {!isFirst && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-[var(--accent-forest)]/10 rounded-full blur-[1px]" />
        )}
        {!isLast && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-[var(--accent-forest)]/10 rounded-full blur-[1px]" />
        )}
      </div>

      {/* Page indicator dots */}
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

      {/* Navigation hint */}
      <p className="font-body text-[10px] mt-6 text-[var(--text-muted)] tracking-[0.2em] uppercase opacity-60">
        Swipe left or right to turn page
      </p>
    </div>
  );
}
