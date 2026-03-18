"use client";
import { MenuPage, PageElement, MenuItem } from "@/types/menu";
import { useMemo } from "react";

interface FlexiblePageProps {
  page: MenuPage;
  inventory: MenuItem[];
  pageNumber: number;
  isDragging?: boolean;
}

export default function FlexiblePage({
  page,
  inventory,
  pageNumber,
}: FlexiblePageProps) {
  
  const renderElement = (el: PageElement) => {
    const { x, y, width, height, rotation = 0, scale = 1, zIndex = 1 } = el.position;
    
    const style: React.CSSProperties = {
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      width: width ? `${width}%` : "auto",
      height: height ? `${height}%` : "auto",
      transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
      zIndex,
      transition: "all 0.3s ease",
    };

    switch (el.type) {
      case "text":
        return (
          <div key={el.id} style={style} className="pointer-events-none select-none">
            <p
              style={{
                fontSize: `${el.fontSize || 16}px`,
                color: el.color || "inherit",
                fontFamily: el.fontFamily || "inherit",
                fontWeight: el.fontWeight || "normal",
                fontStyle: el.fontStyle || "normal",
                textAlign: el.textAlign || "left",
                lineHeight: 1.2,
              }}
            >
              {el.content}
            </p>
          </div>
        );

      case "item":
        const item = inventory.find((it) => it.id === el.itemId);
        if (!item) return null;
        return (
          <div key={el.id} style={style} className="flex flex-col items-center">
            {item.image && (
              <div className="relative mb-3 w-full aspect-square rounded-full overflow-hidden shadow-xl border-4 border-white/50">
                <img src={item.image} alt={item.titleEn} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-center">
              <h3 className="font-menu-title text-lg font-bold text-[var(--accent-dark)] leading-tight">
                {item.titleEn}
              </h3>
              <p className="font-menu-khmer text-sm text-[var(--accent-forest)] font-medium">
                {item.titleKh}
              </p>
              <p className="font-body text-sm mt-1 font-bold text-[var(--accent-olive)]">
                ${item.price.toFixed(2)}
              </p>
            </div>
          </div>
        );

      case "image":
        return (
          <div key={el.id} style={style} className="rounded-2xl overflow-hidden shadow-lg border-2 border-white/30">
            <img src={el.imageUrl} alt="element" className="w-full h-full object-cover" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden paper-texture shadow-INNER"
      style={{ 
        background: page.backgroundColor || "var(--bg-primary)",
        aspectRatio: "3/4" 
      }}
    >
      {/* Subtle paper grain */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, var(--accent-olive) 2px, var(--accent-olive) 3px)` }} 
      />

      {/* watercolor-style bleed at corners */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10 bg-[radial-gradient(circle,var(--accent-olive),transparent)] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-5 bg-[radial-gradient(circle,var(--accent-forest),transparent)] pointer-events-none" />

      {/* Render elements */}
      <div className="absolute inset-0 z-10 p-8">
        {page.elements.map(renderElement)}
      </div>

      {/* Page number */}
      <div className="absolute bottom-6 w-full text-center font-body text-[10px] text-[var(--text-muted)] tracking-[0.2em] opacity-30">
        • {pageNumber} •
      </div>
    </div>
  );
}
