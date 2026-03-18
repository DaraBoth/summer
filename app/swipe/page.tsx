"use client";
import React from "react";
import BookViewer from "@/components/BookViewer";
import { useMenuStore } from "@/hooks/useMenuStore";

export default function SwipePage() {
  const { menuBook } = useMenuStore();

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col pt-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="font-menu-title text-4xl text-[var(--accent-dark)] mb-2 uppercase tracking-[0.3em]">
            Professional Menu
          </h1>
          <p className="font-body text-xs text-[var(--text-muted)] tracking-widest uppercase opacity-60">
            Swipe to explore our seasonal selections
          </p>
        </header>

        <BookViewer menuBook={menuBook} />
      </div>
    </div>
  );
}
