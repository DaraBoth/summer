"use client";

import { useMemo, useState } from "react";
import { convertPdfFileToImages } from "@/lib/pdfToImages";
import { useMenuStore } from "@/hooks/useMenuStore";

export default function UploadPage() {
  const { menuBook, importPdfPagesAsMenu } = useMenuStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const progressText = useMemo(() => {
    if (!progress) return "";
    return `Converting page ${progress.current} of ${progress.total}...`;
  }, [progress]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a PDF file first.");
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      setIsConverting(true);
      setProgress({ current: 0, total: 0 });

      const imagePages = await convertPdfFileToImages(selectedFile, {
        scale: 1.6,
        onProgress: (current, total) => setProgress({ current, total }),
      });

      importPdfPagesAsMenu(imagePages, selectedFile.name);

      setSuccessMessage(
        `Imported ${imagePages.length} pages from ${selectedFile.name}. Your public menu is now updated.`
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "PDF conversion failed. Try a smaller PDF or fewer pages."
      );
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] p-6 md:p-10">
      <div className="mx-auto max-w-3xl bg-white rounded-3xl shadow-xl border border-black/5 p-6 md:p-8">
        <h1 className="font-menu-title text-3xl text-[var(--accent-dark)] mb-2">Upload Menu PDF</h1>
        <p className="font-body text-sm text-[var(--text-muted)] mb-8">
          Upload a PDF menu. The system will split pages, convert each page to an image, and use them as your menu pages.
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          <label className="block text-[10px] tracking-[0.2em] uppercase font-bold text-[var(--accent-forest)] mb-2">
            Select PDF File
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full rounded-xl border border-black/10 bg-[var(--bg-secondary)] px-4 py-3 text-sm"
          />

          <button
            type="submit"
            disabled={isConverting}
            className="rounded-full bg-[var(--accent-forest)] text-white px-6 py-3 text-xs font-bold tracking-widest uppercase disabled:opacity-60"
          >
            {isConverting ? "Converting..." : "Convert PDF And Apply"}
          </button>
        </form>

        {progress && isConverting && (
          <p className="mt-4 text-sm text-[var(--accent-forest)]">{progressText}</p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        {successMessage && (
          <p className="mt-4 text-sm text-[var(--accent-forest)]">{successMessage}</p>
        )}

        {menuBook.sourcePdf && (
          <div className="mt-8 rounded-2xl border border-black/10 bg-[var(--bg-secondary)] p-4">
            <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[var(--accent-forest)] mb-2">
              Last Imported PDF
            </p>
            <p className="font-body text-sm text-[var(--text-main)]">{menuBook.sourcePdf.name}</p>
            <p className="font-body text-xs text-[var(--text-muted)] mt-1">
              {menuBook.sourcePdf.pageCount} pages · Imported {new Date(menuBook.sourcePdf.importedAt).toLocaleString()}
            </p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--accent-forest)]/30 text-[var(--accent-forest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
          >
            Open Public Menu
          </a>
          <a
            href="/edit"
            className="rounded-full border border-[var(--accent-forest)]/30 text-[var(--accent-forest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
          >
            Go To Editor
          </a>
        </div>
      </div>
    </main>
  );
}
