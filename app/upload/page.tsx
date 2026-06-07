"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MenuImage {
  filename: string;
  originalName: string;
  uploadedAt: string;
  url: string;
}

// ─── Image compression ────────────────────────────────────────────────────────

const MAX_PX = 1920;
const JPEG_QUALITY = 0.85;

function formatKB(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)}KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= MAX_PX && height <= MAX_PX) { resolve(file); return; }

      if (width >= height) {
        height = Math.round((height / width) * MAX_PX);
        width = MAX_PX;
      } else {
        width = Math.round((width / height) * MAX_PX);
        height = MAX_PX;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

// ─── Sortable card ────────────────────────────────────────────────────────────

interface SortableCardProps {
  img: MenuImage;
  index: number;
  onDelete: (filename: string) => void;
}

function SortableCard({ img, index, onDelete }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: img.filename });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative overflow-hidden rounded-xl border transition-shadow ${
        isDragging
          ? "z-50 border-[var(--accent-forest)] opacity-50 shadow-xl"
          : "border-[var(--border-light)]"
      }`}
    >
      {/* Drag handle — touch-friendly target */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Page number */}
      <div className="absolute left-2 top-2 z-20 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-dark)] pointer-events-none">
        {index + 1}
      </div>

      {/* Delete button — sits above drag handle */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(img.filename)}
        className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100 md:h-6 md:w-6 md:text-xs"
        style={{ opacity: undefined }}
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
    </div>
  );
}

// ─── Upload page ──────────────────────────────────────────────────────────────

export default function UploadPage() {
  const [images, setImages] = useState<MenuImage[]>([]);
  const [channel, setChannel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadLog, setUploadLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

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

  useEffect(() => { void fetchImages(); }, [fetchImages]);

  const saveOrder = async (ordered: MenuImage[]) => {
    await fetch("/api/menu-images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: ordered.map((img) => img.filename) }),
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.filename === active.id);
    const newIndex = images.findIndex((img) => img.filename === over.id);
    const reordered = arrayMove(images, oldIndex, newIndex);
    setImages(reordered);
    await saveOrder(reordered);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const log: string[] = [];

    for (const file of Array.from(files)) {
      log.push(`Compressing ${file.name}…`);
      setUploadLog([...log]);

      let compressed: File;
      try {
        compressed = await compressImage(file);
      } catch {
        log[log.length - 1] = `✗ ${file.name}: compression failed`;
        setUploadLog([...log]);
        continue;
      }

      const sizeNote =
        compressed.size < file.size
          ? ` ${formatKB(file.size)} → ${formatKB(compressed.size)}`
          : ` ${formatKB(file.size)}`;

      log[log.length - 1] = `Uploading ${compressed.name}${sizeNote}…`;
      setUploadLog([...log]);

      const formData = new FormData();
      formData.append("image", compressed);
      const res = await fetch("/api/menu-images", { method: "POST", body: formData });

      if (res.ok) {
        log[log.length - 1] = `✓ ${compressed.name}${sizeNote}`;
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

  const handleDeleteAll = async () => {
    if (!confirm(`Remove all ${images.length} images? This cannot be undone.`)) return;
    const res = await fetch("/api/menu-images?all=true", { method: "DELETE" });
    if (res.ok) {
      setImages([]);
    } else {
      setError("Failed to remove all images.");
    }
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
            <h1 className="mt-1 font-menu-title text-4xl text-[var(--accent-dark)]">Menu Image Manager</h1>
            <p className="mt-2 font-body text-sm text-[var(--text-muted)]">
              Upload images, hold and drag to reorder, tap × to delete.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="/" target="_blank" rel="noreferrer"
              className="rounded-full border border-[var(--accent-forest)]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-dark)]">
              View Menu
            </a>
            <a href="/edit"
              className="rounded-full border border-[var(--accent-forest)]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-dark)]">
              Editor
            </a>
          </div>
        </div>

        {/* Upload drop zone */}
        <div
          className="rounded-[1.5rem] border-2 border-dashed border-[var(--accent-forest)]/40 bg-white/5 p-10 text-center transition cursor-pointer hover:border-[var(--accent-forest)]/70 hover:bg-white/[0.07]"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void handleUpload(e.dataTransfer.files); }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => void handleUpload(e.target.files)} />
          <p className="mb-1 font-menu-title text-2xl text-[var(--accent-dark)]">
            + Drop images here or click to upload
          </p>
          <p className="font-body text-xs text-[var(--text-muted)]">PNG, JPG, WEBP — multiple files supported</p>

          {uploadLog.length > 0 && (
            <div className="mt-5 space-y-1">
              {uploadLog.map((msg, i) => (
                <p key={i} className="font-body text-xs text-[var(--accent-forest)]">{msg}</p>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        {/* Image grid */}
        {isLoading ? (
          <p className="py-16 text-center font-body text-sm text-[var(--text-muted)] animate-pulse">Loading images…</p>
        ) : images.length === 0 ? (
          <div className="rounded-[1.5rem] border border-[var(--border-light)] bg-white/5 py-16 text-center">
            <p className="font-menu-title text-xl text-[var(--accent-dark)]">No images yet</p>
            <p className="mt-2 font-body text-sm text-[var(--text-muted)]">Upload your first menu page image above.</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-body text-[10px] uppercase tracking-[0.3em] text-[var(--accent-forest)]">
                {images.length} page{images.length !== 1 ? "s" : ""} — hold to drag and reorder
              </p>
              <button
                onClick={() => void handleDeleteAll()}
                className="rounded-full border border-red-500/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400 transition hover:bg-red-500/10"
              >
                Remove All
              </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
              <SortableContext items={images.map((img) => img.filename)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {images.map((img, index) => (
                    <SortableCard key={img.filename} img={img} index={index} onDelete={handleDelete} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </main>
  );
}
