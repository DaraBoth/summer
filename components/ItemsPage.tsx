"use client";
import { MenuPage, MenuItem } from "@/types/menu";
import Image from "next/image";

interface ItemsPageProps {
  page: MenuPage;
  pageNumber: number;
}

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex gap-4 items-start">
        {/* Item image if available */}
        {item.image && (
          <div
            className="flex-shrink-0 rounded-full overflow-hidden shadow-sm"
            style={{
              width: "80px",
              height: "80px",
              border: "2px solid var(--paper-white)",
              outline: "1px solid var(--border-light)",
            }}
          >
            <img
              src={item.image}
              alt={item.titleEn}
              className="w-full h-full object-cover px-1"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title row with price */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-menu-title text-base font-bold leading-tight text-[var(--accent-dark)]">
                  {item.titleEn}
                </h3>
                {item.isSignature && (
                  <span className="badge-signature">Signature</span>
                )}
                {item.isNew && <span className="badge-new">New</span>}
              </div>
              <p className="font-menu-khmer text-sm mt-0.5 leading-relaxed text-[var(--accent-forest)] font-medium">
                {item.titleKh}
              </p>
            </div>

            {/* Price */}
            <div className="flex-shrink-0 text-right">
              <span className="price-tag text-lg">
                ${item.price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Minimal divider */}
          <div className="w-full h-px bg-gradient-to-r from-[var(--border-light)] via-[var(--accent-olive)] to-transparent opacity-20 mt-1" />

          {/* Description */}
          {item.descriptionEn && (
            <p className="font-body text-xs mt-2 leading-relaxed text-[var(--text-muted)] italic">
              {item.descriptionEn}
            </p>
          )}
          {item.descriptionKh && (
            <p className="font-menu-khmer mt-0.5 leading-relaxed text-[var(--text-muted)] opacity-70 text-[10px]">
              {item.descriptionKh}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ItemsPage({ page, pageNumber }: ItemsPageProps) {
  const items = page.items || [];

  return (
    <div
      className="relative w-full h-full overflow-hidden paper-texture"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Side binding shadow */}
      <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-r from-black/5 to-transparent" />

      <div className="relative h-full flex flex-col p-8 overflow-hidden">
        {/* Page header */}
        <div className="text-center mb-6">
          <h2 className="font-menu-title text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent-olive)]">
            {page.title}
          </h2>
          <div className="w-16 h-px bg-[var(--accent-olive)] mx-auto mt-2 opacity-30" />
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-hidden">
          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="font-body text-sm italic text-[var(--text-muted)] opacity-50">
                No items yet. Click Edit to add some.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id}>
                  <MenuItemCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Page footer ornament */}
        <div className="text-center pt-4 mt-auto">
          <svg
            width="60"
            height="12"
            viewBox="0 0 60 12"
            className="mx-auto mb-2 opacity-40"
          >
            <line x1="0" y1="6" x2="22" y2="6" stroke="var(--accent-forest)" strokeWidth="0.5" />
            <circle cx="30" cy="6" r="3" fill="none" stroke="var(--accent-forest)" strokeWidth="0.5" />
            <circle cx="30" cy="6" r="1" fill="var(--accent-forest)" />
            <line x1="38" y1="6" x2="60" y2="6" stroke="var(--accent-forest)" strokeWidth="0.5" />
          </svg>
          <p className="font-body text-[10px] text-[var(--text-muted)] tracking-widest uppercase opacity-60">
            • {pageNumber} •
          </p>
        </div>

        {/* Page curl hint */}
        <div className="page-curl-hint" />
      </div>
    </div>
  );
}
