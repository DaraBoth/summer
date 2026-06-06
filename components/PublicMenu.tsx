"use client";

import { useEffect, useState } from "react";
import VerticalMenuScroll from "@/components/VerticalMenuScroll";
import { MenuBook } from "@/types/menu";

interface PublicMenuProps {
  initialPage: number;
}

interface MenuImage {
  filename: string;
  url: string;
}

function buildMenuBook(images: MenuImage[]): MenuBook {
  return {
    restaurantName: "Summer Menu",
    restaurantNameKh: "ម៉ឺនុយSummer",
    tagline: "Quality Experience & Professional Service",
    pages: images.map((img, index) => ({
      id: `supabase-${index}`,
      type: "content" as const,
      title: `Page ${index + 1}`,
      elements: [
        {
          id: `bg-${index}`,
          type: "image" as const,
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
          imageUrl: img.url,
        },
      ],
    })),
    inventory: [],
  };
}

export default function PublicMenu({ initialPage }: PublicMenuProps) {
  const [menuBook, setMenuBook] = useState<MenuBook | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/menu-images", { cache: "no-store" });
        const data = (await res.json()) as { images: MenuImage[] };
        setMenuBook(buildMenuBook(data.images || []));
      } catch {
        setMenuBook(buildMenuBook([]));
      }
    };
    void load();
  }, []);

  if (!menuBook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <div className="font-menu-title text-3xl mb-2 animate-pulse text-[var(--accent-dark)]">
            Summer Menu
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
