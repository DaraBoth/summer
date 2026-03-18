"use client";
import { useState } from "react";
import BookViewer from "@/components/BookViewer";
import EditPanel from "@/components/EditPanel";
import { useMenuStore } from "@/hooks/useMenuStore";

export default function Home() {
  const {
    menuBook,
    isLoaded,
    updateRestaurantInfo,
    addItemToInventory,
    updateInventoryItem,
    deleteFromInventory,
    addElementToPage,
    updateElement,
    deleteElement,
    addPage,
    deletePage,
    reorderPages,
    resetToDefault,
  } = useMenuStore();

  const [editOpen, setEditOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]"
      >
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
    <main
      className="min-h-screen flex flex-col bg-[var(--bg-secondary)]"
    >
      {/* Ambient lighting - Green focused */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle at 50% -20%, var(--accent-olive) 0%, transparent 60%)",
          opacity: 0.05
        }}
      />

      {/* Top bar */}
      <header
        className="relative z-50 flex items-center justify-between px-8 py-5 bg-white/50 backdrop-blur-md"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-forest)]/10 flex items-center justify-center text-[var(--accent-forest)]">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M2 3h6a4 4 0 0 1 4 4v14a4 4 0 0 0-4-4H2z" />
               <path d="M22 3h-6a4 4 0 0 0-4 4v14a4 4 0 0 1 4-4h6z" />
             </svg>
          </div>
          <div>
            <h1 className="font-menu-title text-base font-bold text-[var(--accent-dark)] leading-none">
              {menuBook.restaurantName}
            </h1>
            <p className="font-menu-khmer text-xs text-[var(--accent-forest)] mt-1">
              {menuBook.restaurantNameKh}
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditOpen(!editOpen)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-body text-[10px] font-bold tracking-widest uppercase shadow-sm border ${
            editOpen 
              ? "bg-[var(--accent-forest)] text-white border-[var(--accent-forest)] shadow-lg" 
              : "bg-white text-[var(--accent-forest)] border-[var(--accent-forest)]/20 hover:border-[var(--accent-forest)]"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          {editOpen ? "Save & Close" : "Customize Menu"}
        </button>
      </header>

      {/* Main content - 2 Column Layout when editor is open */}
      <div className={`relative z-10 flex-1 flex transition-all duration-500 ${editOpen ? "px-6 py-6" : "items-center justify-center"}`}>
        
        {/* Book viewer container */}
        <div className={`transition-all duration-500 flex items-center justify-center ${editOpen ? "w-[60%] border-r border-black/5 pr-6" : "w-full"}`}>
          <BookViewer
            menuBook={menuBook}
            onEditRequest={() => setEditOpen(true)}
          />
        </div>

        {/* Designer Panel - slides in from right */}
        {editOpen && (
          <div className="w-[40%] pl-6 flex flex-col h-[calc(100vh-140px)] sticky top-[100px]">
            <EditPanel
              menuBook={menuBook}
              onUpdateRestaurant={updateRestaurantInfo}
              onAddItemToInventory={addItemToInventory}
              onUpdateInventoryItem={updateInventoryItem}
              onDeleteFromInventory={deleteFromInventory}
              onAddElementToPage={addElementToPage}
              onUpdateElement={updateElement}
              onDeleteElement={deleteElement}
              onAddPage={addPage}
              onDeletePage={deletePage}
              onReorderPages={reorderPages}
              onResetToDefault={resetToDefault}
              onClose={() => setEditOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      {!editOpen && (
        <footer className="relative z-10 py-6 text-center">
          <p className="font-body text-[10px] text-[var(--text-muted)] tracking-[0.2em] uppercase opacity-40">
            Powered by Culinary Canvas · Professional Page Designer
          </p>
        </footer>
      )}
    </main>
  );
}
