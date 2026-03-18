"use client";
import { MenuPage } from "@/types/menu";

interface CategoryPageProps {
  page: MenuPage;
  pageNumber: number;
}

const CATEGORY_DECORATIONS: Record<
  string,
  { icon: string; pattern: string }
> = {
  "Rice & Noodle": { icon: "🌾", pattern: "leaves" },
  Snack: { icon: "🌿", pattern: "leaves" },
  "Crispy bite": { icon: "✦", pattern: "stars" },
  Drinks: { icon: "☕", pattern: "diamonds" },
  default: { icon: "🌿", pattern: "leaves" },
};

export default function CategoryPage({ page, pageNumber }: CategoryPageProps) {
  const deco =
    CATEGORY_DECORATIONS[page.title || ""] ||
    CATEGORY_DECORATIONS.default;

  return (
    <div
      className="relative w-full h-full overflow-hidden paper-texture"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Subtle paper grain */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 3px,
            var(--accent-forest) 3px,
            var(--accent-forest) 4px
          )`,
        }}
      />

      {/* watercolor-style bleed at corners */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10 bg-[radial-gradient(circle,var(--accent-olive),transparent)]" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-5 bg-[radial-gradient(circle,var(--accent-forest),transparent)]" />

      {/* Border lines */}
      <div className="absolute inset-5 border border-[var(--accent-forest)]/20 pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10">
        {/* Small ornament above */}
        <div className="mb-8 scale-110 opacity-60">
          <svg width="80" height="20" viewBox="0 0 80 20">
            <line x1="0" y1="10" x2="25" y2="10" stroke="var(--accent-forest)" strokeWidth="0.75" />
            <circle cx="32" cy="10" r="3" fill="none" stroke="var(--accent-forest)" strokeWidth="1" />
            <circle cx="40" cy="10" r="5" fill="none" stroke="var(--accent-forest)" strokeWidth="1.5" />
            <circle cx="40" cy="10" r="2" fill="var(--accent-forest)" />
            <circle cx="48" cy="10" r="3" fill="none" stroke="var(--accent-forest)" strokeWidth="1" />
            <line x1="55" y1="10" x2="80" y2="10" stroke="var(--accent-forest)" strokeWidth="0.75" />
          </svg>
        </div>

        {/* Italic subtitle */}
        <p className="font-menu-title italic text-sm mb-4 text-[var(--accent-forest)]/70 tracking-widest font-medium">
          {page.subtitle}
        </p>

        {/* Main category title */}
        <h2 className="font-menu-title text-6xl font-black mb-3 leading-tight text-[var(--accent-dark)] tracking-tight">
          {page.title}
        </h2>

        {/* Khmer title */}
        <p className="font-menu-khmer text-3xl font-bold mb-10 text-[var(--accent-forest)]">
          {page.titleKh}
        </p>

        {/* Decorative divider */}
        <div className="flex items-center gap-6 w-full px-12 mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[var(--accent-olive)]/50" />
          <div className="text-3xl text-[var(--accent-olive)] opacity-80">
            {deco.icon}
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-[var(--accent-olive)]/50 to-transparent" />
        </div>

        {/* Large decorative letter */}
        <div className="font-menu-title text-[240px] font-black absolute inset-0 flex items-center justify-center opacity-[0.03] text-[var(--accent-forest)] pointer-events-none -z-10 select-none">
          {(page.title || "")[0]}
        </div>
      </div>

      {/* Page number */}
      <div className="absolute bottom-6 w-full text-center font-body text-[10px] text-[var(--text-muted)] tracking-[0.2em] opacity-40">
        • {pageNumber} •
      </div>
    </div>
  );
}
