"use client";

import BookViewer from "@/components/BookViewer";
import { useMenuStore } from "@/hooks/useMenuStore";

interface PublicMenuProps {
  initialPage: number;
}

export default function PublicMenu({ initialPage }: PublicMenuProps) {
  const { menuBook, isLoaded } = useMenuStore();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b10]">
        <div className="text-center">
          <div className="font-menu-title text-3xl mb-2 animate-pulse text-white/90">
            {menuBook.restaurantName || "Le Jardin d'Or"}
          </div> 
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-white/50">
            Opening your menu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#070b10] overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 25%, rgba(91,123,105,0.22), rgba(7,11,16,0.9) 55%, #070b10 100%)",
        }}
      />
      <BookViewer
        menuBook={menuBook}
        fullScreen
        showIndicators={false}
        showHint={false}
        initialPage={initialPage}
        preloadAllPages
      />
    </main>
  );
}
