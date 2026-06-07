"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MenuImage {
  filename: string;
  originalName: string;
  uploadedAt: string;
  url: string;
}

export default function UploadPage() {
  const [images, setImages] = useState<MenuImage[]>([]);
  const [channel, setChannel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadLog, setUploadLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    try {
      const [channelRes, imagesRes] = await Promise.all([
        fetch("/api/channel"),
        fetch("/api/menu-images"),
      ]);
      const { channel: ch } = (await channelRes.json()) as { channel: string };
      const data = (await imagesRes.json()) as { images: MenuImage[] };
      setChannel(ch ?? "");
      setImages(data.images || []);
    } catch {
      setError("Failed to load images from Supabase.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchImages();
  }, [fetchImages]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    const log: string[] = [];

    for (const file of Array.from(files)) {
      log.push(`Uploading ${file.name}…`);
      setUploadLog([...log]);

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/menu-images", { method: "POST", body: formData });

      if (res.ok) {
        log[log.length - 1] = `✓ ${file.name}`;
      } else {
        const data = (await res.json()) as { error?: string };
        log[log.length - 1] = `✗ ${file.name}: ${data.error ?? "failed"}`;
      }

      setUploadLog([...log]);
    }

    await fetchImages();
    setUploading(false);
    setTimeout(() => setUploadLog([]), 4000);
  };

  const handleDelete = async (filename: string) => {
    if (!confirm("Delete this image from the menu?")) return;

    const res = await fetch(`/api/menu-images?filename=${encodeURIComponent(filename)}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.filename !== filename));
    } else {
      setError("Failed to delete image.");
    }
  };

  const saveOrder = async (ordered: MenuImage[]) => {
    await fetch("/api/menu-images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: ordered.map((img) => img.filename) }),
    });
  };

  const onDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const onDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    setDragOverIndex(null);
    dragIndexRef.current = null;

    if (fromIndex === null || fromIndex === toIndex) return;

    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setImages(reordered);
    await saveOrder(reordered);
  };

  const onDragEnd = () => {
    setDragOverIndex(null);
    dragIndexRef.current = null;
  };

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--accent-forest)]">
              Admin Panel
              {channel && (
                <span className="ml-3 rounded-full border border-[var(--accent-forest)]/40 px-2 py-0.5 text-[9px] tracking-widest text-[var(--accent-dark)]">
                  {channel}
                </span>
              )}
            </p>
            <h1 className="mt-1 font-menu-title text-4xl text-[var(--accent-dark)]">
              Menu Image Manager
            </h1>
            <p className="mt-2 font-body text-sm text-[var(--text-muted)]">
              Upload images, drag to reorder, and delete. Changes are immediately live on the public menu.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--accent-forest)]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-dark)]"
            >
              View Menu
            </a>
            <a
              href="/edit"
              className="rounded-full border border-[var(--accent-forest)]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-dark)]"
            >
              Editor
            </a>
          </div>
        </div>

        {/* Upload drop zone */}
        <div
          className="rounded-[1.5rem] border-2 border-dashed border-[var(--accent-forest)]/40 bg-white/5 p-10 text-center transition cursor-pointer hover:border-[var(--accent-forest)]/70 hover:bg-white/[0.07]"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleUpload(e.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <p className="mb-1 font-menu-title text-2xl text-[var(--accent-dark)]">
            + Drop images here or click to upload
          </p>
          <p className="font-body text-xs text-[var(--text-muted)]">
            PNG, JPG, WEBP — select multiple files at once
          </p>

          {uploadLog.length > 0 && (
            <div className="mt-5 space-y-1">
              {uploadLog.map((msg, i) => (
                <p key={i} className="font-body text-xs text-[var(--accent-forest)]">
                  {msg}
                </p>
              ))}
            </div>
          )}

          {uploading && uploadLog.length === 0 && (
            <p className="mt-4 font-body text-xs text-[var(--text-muted)] animate-pulse">
              Uploading…
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Image grid */}
        {isLoading ? (
          <p className="py-16 text-center font-body text-sm text-[var(--text-muted)] animate-pulse">
            Loading images…
          </p>
        ) : images.length === 0 ? (
          <div className="rounded-[1.5rem] border border-[var(--border-light)] bg-white/5 py-16 text-center">
            <p className="font-menu-title text-xl text-[var(--accent-dark)]">No images yet</p>
            <p className="mt-2 font-body text-sm text-[var(--text-muted)]">
              Upload your first menu page image above.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-4 font-body text-[10px] uppercase tracking-[0.3em] text-[var(--accent-forest)]">
              {images.length} page{images.length !== 1 ? "s" : ""} — drag to reorder
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {images.map((img, index) => (
                <div
                  key={img.filename}
                  draggable
                  onDragStart={() => onDragStart(index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={(e) => void onDrop(e, index)}
                  onDragEnd={onDragEnd}
                  className={`group relative cursor-grab overflow-hidden rounded-xl border transition active:cursor-grabbing active:opacity-60 ${
                    dragOverIndex === index
                      ? "scale-105 border-[var(--accent-forest)] shadow-lg shadow-[var(--accent-forest)]/20"
                      : "border-[var(--border-light)]"
                  }`}
                >
                  {/* Page number */}
                  <div className="absolute left-2 top-2 z-10 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-dark)]">
                    {index + 1}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(img.filename);
                    }}
                    className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ×
                  </button>

                  <img
                    src={img.url}
                    alt={`Menu page ${index + 1}`}
                    draggable={false}
                    className="block h-auto w-full object-cover"
                    style={{ aspectRatio: "3/4" }}
                  />

                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20 pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
