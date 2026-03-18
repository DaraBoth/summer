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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="text-center">
          <div className="font-menu-title text-3xl mb-2 animate-pulse text-[var(--accent-dark)]">
            {menuBook.restaurantName || "Le Jardin d'Or"}
          </div> 
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-[var(--accent-forest)] opacity-50">
            Opening your menu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)]">
      <BookViewer
        menuBook={menuBook}
        fullScreen
        showIndicators={false}
        showHint={false}
        initialPage={initialPage}
      />
    </main>
  );
}
