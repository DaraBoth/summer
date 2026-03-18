"use client";

import { useEffect, useMemo, useRef } from "react";
import { MenuBook } from "@/types/menu";

interface VerticalMenuScrollProps {
  menuBook: MenuBook;
  initialPage: number;
}

function getPageImageUrl(page: MenuBook["pages"][number]): string | null {
  const fullBackground = (page.elements || []).find(
    (el) =>
      el.type === "image" &&
      el.position.x === 0 &&
      el.position.y === 0 &&
      el.position.width === 100 &&
      el.position.height === 100 &&
      !!el.imageUrl
  );

  if (fullBackground?.imageUrl) {
    return fullBackground.imageUrl;
  }

  const firstImage = (page.elements || []).find((el) => el.type === "image" && !!el.imageUrl);
  return firstImage?.imageUrl || null;
}

export default function VerticalMenuScroll({ menuBook, initialPage }: VerticalMenuScrollProps) {
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  const pages = useMemo(() => {
    return (menuBook.pages || []).map((page, index) => ({
      id: page.id,
      pageNumber: index + 1,
      imageUrl: getPageImageUrl(page),
    }));
  }, [menuBook.pages]);

  useEffect(() => {
    const targetIndex = Math.max(0, Math.min(initialPage, pages.length - 1));
    const target = pageRefs.current[targetIndex];
    if (!target) {
      return;
    }

    // Jump to requested page (e.g. /?page=8) with a smooth PDF-like scroll.
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [initialPage, pages.length]);

  return (
    <div className="relative z-10 mx-auto w-full max-w-3xl px-3 pb-12 pt-6 md:px-6 md:pt-8">
      <div className="space-y-4 md:space-y-6">
        {pages.map((page, index) => (
          <div
            key={page.id}
            ref={(el) => {
              pageRefs.current[index] = el;
            }}
            className="rounded-xl border border-[var(--border-light)] bg-black/80 shadow-[0_12px_32px_rgba(0,0,0,0.55)] overflow-hidden"
          >
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={`Menu page ${page.pageNumber}`}
                loading={index <= 1 ? "eager" : "lazy"}
                decoding="async"
                className="w-full h-auto block"
              />
            ) : (
              <div className="aspect-[3/4] flex items-center justify-center text-sm text-[var(--text-muted)]">
                Page {page.pageNumber}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
