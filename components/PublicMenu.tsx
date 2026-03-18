"use client";

import VerticalMenuScroll from "@/components/VerticalMenuScroll";
import { useMenuStore } from "@/hooks/useMenuStore";

interface PublicMenuProps {
  initialPage: number;
}

export default function PublicMenu({ initialPage }: PublicMenuProps) {
  const { menuBook, isLoaded } = useMenuStore();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6e8d5]">
        <div className="text-center">
          <div className="font-menu-title text-3xl mb-2 animate-pulse text-[var(--accent-dark)]">
            {menuBook.restaurantName || "Le Jardin d'Or"}
          </div> 
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)]">
            Opening your menu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-[var(--bg-secondary)] overflow-x-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, rgba(255,220,176,0.85), rgba(245,202,147,0.55) 45%, rgba(230,183,128,0.45) 65%, rgba(246,232,213,1) 100%)",
        }}
      />
      <VerticalMenuScroll menuBook={menuBook} initialPage={initialPage} />
    </main>
  );
}
