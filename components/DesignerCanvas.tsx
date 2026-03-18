"use client";
import { MenuPage, PageElement, MenuItem } from "@/types/menu";
import { motion } from "framer-motion";
import { useState } from "react";

interface DesignerCanvasProps {
  page: MenuPage;
  inventory: MenuItem[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
}

export default function DesignerCanvas({
  page,
  inventory,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
}: DesignerCanvasProps) {
  
  const handleDragEnd = (id: string, e: any, info: any, currentPos: any) => {
    // Convert pixels to percentages relative to the container
    const container = e.target.closest(".designer-container");
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newX = ((info.point.x - rect.left) / rect.width) * 100;
    const newY = ((info.point.y - rect.top) / rect.height) * 100;
    
    onUpdateElement(id, {
      position: { ...currentPos, x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) }
    });
  };

  const renderElement = (el: PageElement) => {
    const isSelected = selectedElementId === el.id;
    const { x, y, width, height, rotation = 0, scale = 1, zIndex = 1 } = el.position;

    return (
      <motion.div
        key={el.id}
        drag
        dragMomentum={false}
        onDragStart={() => onSelectElement(el.id)}
        onDragEnd={(e, info) => handleDragEnd(el.id, e, info, el.position)}
        onClick={(e) => {
           e.stopPropagation();
           onSelectElement(el.id);
        }}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? "ring-2 ring-[var(--accent-forest)] shadow-2xl z-50" : ""
        }`}
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: width ? `${width}%` : "auto",
          height: height ? `${height}%` : "auto",
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
          zIndex: isSelected ? 100 : zIndex,
        }}
      >
        {el.type === "text" && (
          <p
            className="whitespace-pre-wrap"
            style={{
              fontSize: `${el.fontSize || 16}px`,
              color: el.color || "inherit",
              fontFamily: el.fontFamily || "inherit",
              fontWeight: el.fontWeight || "normal",
              textAlign: el.textAlign || "left",
              lineHeight: 1.2,
            }}
          >
            {el.content || "Click to edit text"}
          </p>
        )}

        {el.type === "item" && (
          <div className="flex flex-col items-center pointer-events-none">
            {inventory.find(it => it.id === el.itemId)?.image && (
              <img 
                src={inventory.find(it => it.id === el.itemId)?.image} 
                className="w-full aspect-square rounded-full object-cover shadow-lg border-2 border-white"
                alt="food"
              />
            )}
            <div className="text-center mt-2">
              <span className="font-menu-title font-bold text-sm block leading-tight">
                {inventory.find(it => it.id === el.itemId)?.titleEn}
              </span>
              <span className="font-body font-bold text-xs text-[var(--accent-olive)]">
                ${inventory.find(it => it.id === el.itemId)?.price.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {el.type === "image" && (
          <img 
            src={el.imageUrl} 
            className="w-full h-full object-cover rounded-lg shadow-md"
            alt="custom"
          />
        )}
        
        {isSelected && (
           <div className="absolute -top-6 -right-6 bg-[var(--accent-forest)] text-white text-[10px] px-2 py-1 rounded-full pointer-events-none">
             Selected
           </div>
        )}
      </motion.div>
    );
  };

  return (
    <div
      className="designer-container relative border border-[var(--accent-olive)]/20 rounded-lg overflow-hidden shadow-2xl bg-white"
      style={{ 
        width: "100%", 
        maxWidth: "400px", 
        height: "560px",
        margin: "0 auto",
        boxShadow: "0 20px 50px rgba(0,0,0,0.1), inset 0 0 100px rgba(0,0,0,0.02)"
      }}
      onClick={() => onSelectElement(null)}
    >
      <div className="absolute inset-0 paper-texture opacity-30 pointer-events-none" />
      
      {/* Element Layer */}
      <div className="absolute inset-0 p-8 z-10">
        {page.elements.map(renderElement)}
      </div>

      {!page.elements.length && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] opacity-50 p-12 text-center italic font-body text-sm">
          Blank Page. Add elements from the menu editor to start designing.
        </div>
      )}
    </div>
  );
}
