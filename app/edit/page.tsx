"use client";
import { useState } from "react";
import BookViewer from "@/components/BookViewer";
import EditPanel from "@/components/EditPanel";
import { useMenuStore } from "@/hooks/useMenuStore";

export default function EditPage() {
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

  const [editOpen, setEditOpen] = useState(true);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="text-center">
          <div className="font-menu-title text-3xl mb-2 animate-pulse text-[var(--accent-dark)]">
            {menuBook.restaurantName || "Le Jardin d'Or"}
          </div>
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-[var(--accent-forest)] opacity-50">
            Opening editor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[var(--bg-secondary)]">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle at 50% -20%, var(--accent-olive) 0%, transparent 60%)",
          opacity: 0.05,
        }}
      />

      <header
        className="relative z-50 flex items-center justify-between px-8 py-5 bg-white/60 backdrop-blur-md"
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

        <div className="flex items-center gap-3">
          <a
            href="/upload"
            className="px-4 py-2 rounded-full bg-white border border-[var(--accent-forest)]/30 text-[var(--accent-forest)] font-body text-[10px] font-bold uppercase tracking-widest"
          >
            Upload PDF
          </a>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full bg-white border border-[var(--accent-forest)]/30 text-[var(--accent-forest)] font-body text-[10px] font-bold uppercase tracking-widest"
          >
            Open Public Menu
          </a>
          <button
            onClick={() => setEditOpen((v) => !v)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-body text-[10px] font-bold tracking-widest uppercase shadow-sm border ${
              editOpen
                ? "bg-[var(--accent-forest)] text-white border-[var(--accent-forest)] shadow-lg"
                : "bg-white text-[var(--accent-forest)] border-[var(--accent-forest)]/20 hover:border-[var(--accent-forest)]"
            }`}
          >
            {editOpen ? "Hide Editor" : "Show Editor"}
          </button>
        </div>
      </header>

      <div className={`relative z-10 flex-1 flex transition-all duration-500 ${editOpen ? "px-6 py-6" : "items-center justify-center"}`}>
        <div className={`transition-all duration-500 flex items-center justify-center ${editOpen ? "w-[60%] border-r border-black/5 pr-6" : "w-full"}`}>
          <BookViewer menuBook={menuBook} />
        </div>

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
    </main>
  );
}
