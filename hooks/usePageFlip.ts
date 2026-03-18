"use client";
import { useState, useCallback, useRef, useEffect } from "react";

const FLIP_DURATION_MS = 550;

export function usePageFlip(totalPages: number, initialPage = 0) {
  const getClampedPage = useCallback(
    (page: number) => Math.max(0, Math.min(page, Math.max(totalPages - 1, 0))),
    [totalPages]
  );
  const [currentPage, setCurrentPage] = useState(() => getClampedPage(initialPage));
  const [isAnimating, setIsAnimating] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward">(
    "forward"
  );
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAnimationLock = useCallback(() => {
    setIsAnimating(true);
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }
    animationTimerRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, FLIP_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentPage((prev) => getClampedPage(prev));
  }, [getClampedPage]);

  useEffect(() => {
    setCurrentPage(getClampedPage(initialPage));
  }, [initialPage, getClampedPage]);

  const goForward = useCallback(() => {
    if (isAnimating || currentPage >= totalPages - 1) return;
    setFlipDirection("forward");
    setCurrentPage((p) => p + 1);
    startAnimationLock();
  }, [isAnimating, currentPage, totalPages, startAnimationLock]);

  const goBackward = useCallback(() => {
    if (isAnimating || currentPage <= 0) return;
    setFlipDirection("backward");
    setCurrentPage((p) => p - 1);
    startAnimationLock();
  }, [isAnimating, currentPage, startAnimationLock]);

  const goToPage = useCallback(
    (page: number) => {
      if (isAnimating || page === currentPage || page < 0 || page >= totalPages) return;
      setFlipDirection(page > currentPage ? "forward" : "backward");
      setCurrentPage(page);
      startAnimationLock();
    },
    [isAnimating, currentPage, totalPages, startAnimationLock]
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
