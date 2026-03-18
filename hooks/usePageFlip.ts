"use client";
import { useState, useCallback } from "react";

export function usePageFlip(totalPages: number) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward">(
    "forward"
  );

  const goForward = useCallback(() => {
    if (isAnimating || currentPage >= totalPages - 1) return;
    setFlipDirection("forward");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage((p) => p + 1);
      setIsAnimating(false);
    }, 400); // Faster transition for modern feel
  }, [isAnimating, currentPage, totalPages]);

  const goBackward = useCallback(() => {
    if (isAnimating || currentPage <= 0) return;
    setFlipDirection("backward");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage((p) => p - 1);
      setIsAnimating(false);
    }, 400);
  }, [isAnimating, currentPage]);

  const goToPage = useCallback(
    (page: number) => {
      if (isAnimating || page === currentPage) return;
      setFlipDirection(page > currentPage ? "forward" : "backward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(page);
        setIsAnimating(false);
      }, 400);
    },
    [isAnimating, currentPage]
  );

  return {
    currentPage,
    isAnimating,
    flipDirection,
    goForward,
    goBackward,
    goToPage,
    isFirst: currentPage === 0,
    isLast: currentPage >= totalPages - 1,
  };
}
