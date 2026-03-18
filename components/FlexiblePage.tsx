"use client";
import { useEffect, useState } from "react";
import { MenuPage, PageElement, MenuItem } from "@/types/menu";

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
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  const isPdfUrl = (url?: string) =>
    typeof url === "string" && url.toLowerCase().endsWith(".pdf");

  const getPdfImageFallbackUrl = (url?: string) => {
    if (!url) return null;
    const match = url.match(/^\/splited\/Summer202026-(\d+)\.pdf$/i);
    if (!match) return null;
    return `/menu/menu-${match[1]}.png`;
  };
  
  const renderElement = (el: PageElement) => {
    const { x, y, width, height, rotation = 0, scale = 1, zIndex = 1 } = el.position;
    const isFullBleedBackground =
      el.type === "image" &&
      /^bg-\d+$/i.test(el.id) &&
      x === 0 &&
      y === 0 &&
      width === 100 &&
      height === 100;
    
    const style: React.CSSProperties = {
      position: "absolute",
      left: isFullBleedBackground ? 0 : `${x}%`,
      top: isFullBleedBackground ? 0 : `${y}%`,
      width: isFullBleedBackground ? "100%" : width ? `${width}%` : "auto",
      height: isFullBleedBackground ? "100%" : height ? `${height}%` : "auto",
      transform: isFullBleedBackground
        ? `rotate(${rotation}deg) scale(${scale})`
        : `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
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
        if (isPdfUrl(el.imageUrl)) {
          const imageClassName = isFullBleedBackground
            ? "overflow-hidden bg-white pointer-events-none flex items-center justify-center"
            : "rounded-2xl overflow-hidden shadow-lg border-2 border-white/30 bg-white";

          const mobileFallbackUrl = getPdfImageFallbackUrl(el.imageUrl);
          if (isMobileViewport && mobileFallbackUrl) {
            return (
              <div key={el.id} style={style} className={imageClassName}>
                <img
                  src={mobileFallbackUrl}
                  alt="menu page"
                  className={`pointer-events-none ${
                    isFullBleedBackground ? "w-full h-full object-contain" : "w-full h-full object-cover"
                  }`}
                />
              </div>
            );
          }

          return (
            <div key={el.id} style={style} className={imageClassName}>
              <iframe
                src={`${el.imageUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title="PDF page"
                className="w-full h-full pointer-events-none"
              />
            </div>
          );
        }

        const imageClassName = isFullBleedBackground
          ? "overflow-hidden bg-white pointer-events-none flex items-center justify-center"
          : "rounded-2xl overflow-hidden shadow-lg border-2 border-white/30";

        return (
          <div key={el.id} style={style} className={imageClassName}>
            <img
              src={el.imageUrl}
              alt="element"
              className={isFullBleedBackground ? "w-full h-full object-contain" : "w-full h-full object-cover"}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const isBackgroundElement = (el: PageElement) =>
    el.type === "image" &&
    /^bg-\d+$/i.test(el.id) &&
    el.position.x === 0 &&
    el.position.y === 0 &&
    el.position.width === 100 &&
    el.position.height === 100;

  const backgroundElements = page.elements.filter(isBackgroundElement);
  const contentElements = page.elements.filter((el) => !isBackgroundElement(el));
  const hasFullBleedBackgroundImage = backgroundElements.length > 0;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${
        hasFullBleedBackgroundImage ? "" : "paper-texture shadow-INNER"
      }`}
      style={{ 
        background: page.backgroundColor || "var(--bg-primary)",
        aspectRatio: "3/4" 
      }}
    >
      {!hasFullBleedBackgroundImage && (
        <>
          {/* Subtle paper grain */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, var(--accent-olive) 2px, var(--accent-olive) 3px)` }} 
          />

          {/* watercolor-style bleed at corners */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10 bg-[radial-gradient(circle,var(--accent-olive),transparent)] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-5 bg-[radial-gradient(circle,var(--accent-forest),transparent)] pointer-events-none" />
        </>
      )}

      {/* Render background layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {backgroundElements.map(renderElement)}
      </div>

      {/* Render foreground/content layer */}
      <div className="absolute inset-0 z-10 p-8">
        {contentElements.map(renderElement)}
      </div>

      {/* Page number */}
      <div className="absolute bottom-3 w-full text-center font-body text-[10px] text-[var(--text-muted)] tracking-[0.2em] opacity-22">
        • {pageNumber} •
      </div>
    </div>
  );
}
