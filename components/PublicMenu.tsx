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
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
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
            "radial-gradient(ellipse at 50% 28%, rgba(255,183,82,0.28), rgba(184,113,42,0.18) 36%, rgba(55,34,17,0.4) 58%, rgba(5,5,5,1) 82%)",
        }}
      />
      <VerticalMenuScroll menuBook={menuBook} initialPage={initialPage} />
    </main>
  );
}
