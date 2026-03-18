"use client";
import { MenuPage } from "@/types/menu";

interface CoverPageProps {
  page: MenuPage;
  restaurantName: string;
  restaurantNameKh: string;
  tagline?: string;
  isBack?: boolean;
}

export default function CoverPage({
  restaurantName,
  restaurantNameKh,
  tagline,
  isBack = false,
}: CoverPageProps) {
  return (
    <div
      className="relative w-full h-full overflow-hidden paper-texture"
      style={{
        background: isBack
          ? "var(--bg-secondary)"
          : "var(--bg-primary)",
      }}
    >
      {/* Deep texture overlay */}
      {/* Subtle green pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            var(--accent-olive) 2px,
            var(--accent-olive) 4px
          )`,
        }}
      />

      {/* Radial glow center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(212,175,106,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Ornamental frame */}
      <div
        className="absolute"
        style={{
          inset: "20px",
          border: "1px solid rgba(212,175,106,0.35)",
          pointerEvents: "none",
        }}
      />
      <div
        className="absolute"
        style={{
          inset: "28px",
          border: "1px solid rgba(212,175,106,0.15)",
          pointerEvents: "none",
        }}
      />

      {/* Corner ornaments */}
      {["tl", "tr", "bl", "br"].map((pos) => (
        <div key={pos} className={`corner-ornament ${pos}`} />
      ))}

      {isBack ? (
        // Back cover
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="font-decorative text-4xl mb-6 text-[var(--accent-olive)]">
            ✦
          </div>
          <div className="font-menu-title text-3xl font-bold mb-3 text-[var(--accent-dark)]">
            {restaurantName}
          </div>
          <div className="font-menu-khmer text-xl mb-8 text-[var(--accent-forest)] font-medium">
            {restaurantNameKh}
          </div>
          <div className="w-16 h-px mx-auto mb-8 bg-[var(--accent-olive)]/30" />
          <p className="font-body text-xs tracking-widest uppercase text-[var(--text-muted)] opacity-60">
            Thank you for dining with us
          </p>
          <p className="font-menu-khmer text-xs mt-2 text-[var(--text-muted)] opacity-50">
            សូមអរគុណដែលបានចូលទទួលទានជាមួយយើង
          </p>
        </div>
      ) : (
        // Front cover
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
          {/* Top ornament */}
          <div className="mb-8">
            <div className="font-decorative text-xs tracking-[0.4em] uppercase mb-5 text-[var(--accent-forest)]/60 font-medium">
              Since 2026
            </div>
            <svg width="100" height="20" viewBox="0 0 100 20" className="mx-auto opacity-70">
              <line x1="0" y1="10" x2="35" y2="10" stroke="var(--accent-forest)" strokeWidth="0.75" />
              <circle cx="42" cy="10" r="3" fill="none" stroke="var(--accent-forest)" strokeWidth="1" />
              <circle cx="50" cy="10" r="5" fill="none" stroke="var(--accent-forest)" strokeWidth="1.5" />
              <circle cx="50" cy="10" r="2" fill="var(--accent-forest)" />
              <circle cx="58" cy="10" r="3" fill="none" stroke="var(--accent-forest)" strokeWidth="1" />
              <line x1="65" y1="10" x2="100" y2="10" stroke="var(--accent-forest)" strokeWidth="0.75" />
            </svg>
          </div>

          {/* Main title */}
          <h1 className="font-menu-title text-6xl font-black leading-tight mb-2 text-[var(--accent-dark)] tracking-tight">
            {restaurantName}
          </h1>

          {/* Khmer title */}
          <p className="font-menu-khmer text-2xl font-bold mb-8 text-[var(--accent-forest)]">
            {restaurantNameKh}
          </p>

          {/* Ornamental divider */}
          <div className="flex items-center gap-6 mb-8 w-full px-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[var(--accent-olive)]/50" />
            <div className="text-3xl text-[var(--accent-olive)] opacity-80">
              🌿
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--accent-olive)]/50 to-transparent" />
          </div>

          {/* Tagline */}
          <p className="font-body text-xs font-bold tracking-[0.3em] uppercase text-[var(--accent-olive)]">
            {tagline}
          </p>

          {/* Bottom scroll hint */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center">
            <p className="font-body text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] opacity-60 animate-pulse">
              ← swipe to open →
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
