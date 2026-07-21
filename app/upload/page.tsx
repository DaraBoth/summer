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

// ─── Upload with progress ─────────────────────────────────────────────────────

interface SendResult {
  ok: boolean;
  status: number;
  body: string;
}

// fetch() cannot report upload progress, so send the body over XHR instead.
function sendWithProgress(
  method: string,
  url: string,
  body: FormData,
  onProgress: (percent: number) => void
): Promise<SendResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body: xhr.responseText });
    xhr.onerror = () => reject(new Error("network error"));
    xhr.onabort = () => reject(new Error("upload cancelled"));

    xhr.send(body);
  });
}

function errorFrom(body: string, fallback: string): string {
  try {
    return (JSON.parse(body) as { error?: string }).error ?? fallback;
  } catch {
    return body.slice(0, 200) || fallback;
  }
}

type ReplacePhase = "compressing" | "uploading" | "saving";

const PHASE_LABEL: Record<ReplacePhase, string> = {
  compressing: "Compressing",
  uploading: "Uploading",
  saving: "Saving",
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  images: MenuImage[];
  index: number;
  onClose: () => void;
  onNav: (index: number) => void;
}

function Lightbox({ images, index, onClose, onNav }: LightboxProps) {
  const img = images[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNav(index - 1);
      if (e.key === "ArrowRight" && index < images.length - 1) onNav(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onNav]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
      >
        ×
      </button>

      {/* Page counter */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-dark)]">
        {index + 1} / {images.length}
      </div>

      {/* Prev */}
      {index > 0 && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onNav(index - 1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 md:left-6"
        >
          ‹
        </button>
      )}

      {/* Next */}
      {index < images.length - 1 && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onNav(index + 1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 md:right-6"
        >
          ›
        </button>
      )}

      {/* Image */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] max-w-[88vw] flex-col items-center"
      >
        <img
          src={img.url}
          alt={`Menu page ${index + 1}`}
          className="max-h-[80vh] max-w-[84vw] rounded-xl object-contain shadow-2xl"
        />
        <p className="mt-3 font-body text-[11px] text-[var(--text-muted)]">
          {img.originalName}
        </p>
      </div>
    </div>
  );
}

// ─── Sortable card ────────────────────────────────────────────────────────────

interface SortableCardProps {
  img: MenuImage;
  index: number;
  onDelete: (filename: string) => void;
  onPreview: (index: number) => void;
  onReplace: (filename: string) => void;
  progress: { percent: number; phase: ReplacePhase } | null;
}

function SortableCard({ img, index, onDelete, onPreview, onReplace, progress }: SortableCardProps) {
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
      {/* Replace progress */}
      {progress && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 px-4">
          <div className="font-menu-title text-3xl text-[var(--accent-dark)] tabular-nums">
            {progress.percent}%
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-[var(--accent-forest)] transition-[width] duration-200 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-2 font-body text-[9px] uppercase tracking-[0.25em] text-white/70">
            {PHASE_LABEL[progress.phase]}
          </p>
        </div>
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute inset-0 z-10 cursor-grab active:cursor-grabbing touch-none ${
          progress ? "pointer-events-none" : ""
        }`}
      />

      {/* Page number */}
      <div className="absolute left-2 top-2 z-20 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-dark)] pointer-events-none">
        {index + 1}
      </div>

      {/* Delete button */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(img.filename)}
        className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100 md:h-6 md:w-6 md:text-xs"
      >
        ×
      </button>

      {/* Replace button — swaps the file, keeps the page number */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onReplace(img.filename)}
        className="absolute bottom-2 left-2 z-20 flex h-7 items-center gap-1 rounded-full bg-black/60 px-2.5 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 transition group-hover:opacity-100 md:h-6"
        title={`Replace page ${index + 1}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h1.401a.75.75 0 0 0 0-1.5H3.443a.75.75 0 0 0-.75.75v3.757a.75.75 0 0 0 1.5 0v-1.94l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.389Zm1.23-3.723a.75.75 0 0 0 .219-.53V3.415a.75.75 0 0 0-1.5 0v1.94l-.31-.31A7 7 0 0 0 3.239 8.184a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.107l.311.31h-1.4a.75.75 0 0 0 0 1.5h3.757a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
        </svg>
        Replace
      </button>

      {/* Preview button */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onPreview(index)}
        className="absolute bottom-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 md:h-6 md:w-6"
        title="Preview"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
        </svg>
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
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
  const [replaceProgress, setReplaceProgress] = useState<{
    filename: string;
    percent: number;
    phase: ReplacePhase;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

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
      const data = (await imagesRes.json()) as { images: MenuImage[]; error?: string };
      setChannel(ch ?? "");

      // A failed read must not look like an empty menu.
      if (!imagesRes.ok) {
        setError(data.error ?? `Failed to load images (HTTP ${imagesRes.status}).`);
        return;
      }

      setError(null);
      setImages(data.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images from Supabase.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchImages(); }, [fetchImages]);

  const saveOrder = async (ordered: MenuImage[]) => {
    try {
      const res = await fetch("/api/menu-images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: ordered.map((img) => img.filename) }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Failed to save order (HTTP ${res.status}).`);
        return;
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save order.");
    }
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

    const queue = Array.from(files);

    for (let n = 0; n < queue.length; n++) {
      const file = queue[n];
      const counter = queue.length > 1 ? `(${n + 1}/${queue.length}) ` : "";
      const line = log.length;

      log.push(`${counter}Compressing ${file.name}…`);
      setUploadLog([...log]);

      let compressed: File;
      try {
        compressed = await compressImage(file);
      } catch {
        log[line] = `✗ ${counter}${file.name}: compression failed`;
        setUploadLog([...log]);
        continue;
      }

      const sizeNote =
        compressed.size < file.size
          ? ` ${formatKB(file.size)} → ${formatKB(compressed.size)}`
          : ` ${formatKB(file.size)}`;

      const formData = new FormData();
      formData.append("image", compressed);
      try {
        const res = await sendWithProgress("POST", "/api/menu-images", formData, (percent) => {
          // At 100% the bytes are sent but the server is still writing the manifest.
          const verb = percent < 100 ? "Uploading" : "Saving";
          log[line] = `${counter}${verb} ${compressed.name}${sizeNote} — ${percent}%`;
          setUploadLog([...log]);
        });

        if (res.ok) {
          log[line] = `✓ ${counter}${compressed.name}${sizeNote}`;
        } else {
          // Show what the server actually said, not a generic failure.
          const detail = errorFrom(res.body, `HTTP ${res.status}`);
          log[line] = `✗ ${counter}${file.name}: HTTP ${res.status} — ${detail}`;
          setError(detail);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "network error";
        log[line] = `✗ ${counter}${file.name}: ${msg}`;
        setError(msg);
      }
      setUploadLog([...log]);
    }

    await fetchImages();
    setUploading(false);
    setTimeout(() => setUploadLog([]), 4000);
  };

  const openReplace = (filename: string) => {
    setReplaceTarget(filename);
    replaceInputRef.current?.click();
  };

  const handleReplace = async (files: FileList | null) => {
    const target = replaceTarget;
    setReplaceTarget(null);
    if (!target || !files || files.length === 0) return;

    const file = files[0];
    setUploading(true);
    setError(null);
    setReplaceProgress({ filename: target, percent: 0, phase: "compressing" });

    let compressed: File;
    try {
      compressed = await compressImage(file);
    } catch {
      setError(`${file.name}: compression failed`);
      setReplaceProgress(null);
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("image", compressed);
    formData.append("filename", target);

    try {
      setReplaceProgress({ filename: target, percent: 0, phase: "uploading" });

      const res = await sendWithProgress("PUT", "/api/menu-images", formData, (percent) =>
        // At 100% the bytes are sent but the server is still writing the manifest.
        setReplaceProgress({
          filename: target,
          percent,
          phase: percent < 100 ? "uploading" : "saving",
        })
      );

      if (res.ok) {
        const { position } = JSON.parse(res.body) as { position: number };
        setUploadLog([`✓ page ${position} replaced with ${compressed.name}`]);
        setTimeout(() => setUploadLog([]), 4000);
      } else {
        const detail = errorFrom(res.body, `HTTP ${res.status}`);
        setError(detail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    }

    setReplaceProgress(null);
    await fetchImages();
    setUploading(false);
  };

  const handleDelete = async (filename: string) => {
    if (!confirm("Delete this image from the menu?")) return;
    const res = await fetch(`/api/menu-images?filename=${encodeURIComponent(filename)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.filename !== filename));
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? `Failed to delete image (HTTP ${res.status}).`);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Remove all ${images.length} images? This cannot be undone.`)) return;
    const res = await fetch("/api/menu-images?all=true", { method: "DELETE" });
    if (res.ok) {
      setImages([]);
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? `Failed to remove all images (HTTP ${res.status}).`);
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
                    <SortableCard
                      key={img.filename}
                      img={img}
                      index={index}
                      onDelete={handleDelete}
                      onPreview={setPreviewIndex}
                      onReplace={openReplace}
                      progress={
                        replaceProgress?.filename === img.filename
                          ? { percent: replaceProgress.percent, phase: replaceProgress.phase }
                          : null
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* Replace picker — kept outside the drop zone so its click doesn't reopen that */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onClick={(e) => {
          // Allow picking the same file again after a failed attempt.
          (e.target as HTMLInputElement).value = "";
        }}
        onChange={(e) => void handleReplace(e.target.files)}
      />

      {/* Lightbox */}
      {previewIndex !== null && (
        <Lightbox
          images={images}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNav={setPreviewIndex}
        />
      )}
    </main>
  );
}
