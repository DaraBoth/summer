"use client";

import { useEffect, useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { convertPdfFileToImages } from "@/lib/pdfToImages";
import { useMenuStore } from "@/hooks/useMenuStore";

interface SplitPdfPage {
  pageNumber: number;
  fileName: string;
  url: string;
}

export default function SplitPdfPageTool() {
  const { importPdfPagesAsMenu } = useMenuStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [convertToPng, setConvertToPng] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splitPdfPages, setSplitPdfPages] = useState<SplitPdfPage[]>([]);
  const [pngPages, setPngPages] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    return () => {
      splitPdfPages.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [splitPdfPages]);

  const progressText = useMemo(() => {
    if (!progress) return "";
    return `Converting page ${progress.current} of ${progress.total}...`;
  }, [progress]);

  const splitIntoSinglePagePdfs = async (file: File): Promise<SplitPdfPage[]> => {
    const bytes = await file.arrayBuffer();
    const sourceDoc = await PDFDocument.load(bytes);
    const totalPages = sourceDoc.getPageCount();
    const safeBaseName = file.name.replace(/\.pdf$/i, "");

    const pages: SplitPdfPage[] = [];

    for (let i = 0; i < totalPages; i += 1) {
      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(sourceDoc, [i]);
      singleDoc.addPage(copiedPage);
      const singleBytes = await singleDoc.save();

      const singleBuffer = singleBytes.buffer.slice(
        singleBytes.byteOffset,
        singleBytes.byteOffset + singleBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([singleBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      pages.push({
        pageNumber: i + 1,
        fileName: `${safeBaseName}-page-${i + 1}.pdf`,
        url,
      });
    }

    return pages;
  };

  const handleProcess = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please choose a PDF file first.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(null);

    splitPdfPages.forEach((item) => URL.revokeObjectURL(item.url));

    try {
      const splitPages = await splitIntoSinglePagePdfs(selectedFile);
      setSplitPdfPages(splitPages);

      if (convertToPng) {
        const images = await convertPdfFileToImages(selectedFile, {
          scale: 1.6,
          onProgress: (current, total) => setProgress({ current, total }),
        });
        setPngPages(images);
      } else {
        setPngPages([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to split this PDF.");
      setSplitPdfPages([]);
      setPngPages([]);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const downloadAllSplitPdfs = () => {
    splitPdfPages.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = item.url;
        link.download = item.fileName;
        link.click();
      }, index * 120);
    });
  };

  const downloadAllPngPages = () => {
    pngPages.forEach((url, index) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = url;
        link.download = `menu-page-${index + 1}.png`;
        link.click();
      }, index * 120);
    });
  };

  const applyPngToMenu = () => {
    if (!selectedFile || pngPages.length === 0) return;
    importPdfPagesAsMenu(pngPages, selectedFile.name);
    window.alert("PNG pages have been applied to your menu.");
  };

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] p-6 md:p-10">
      <div className="mx-auto max-w-5xl bg-white rounded-3xl shadow-xl border border-black/5 p-6 md:p-8">
        <h1 className="font-menu-title text-3xl text-[var(--accent-dark)] mb-2">Split PDF Pages</h1>
        <p className="font-body text-sm text-[var(--text-muted)] mb-8">
          Upload one multi-page PDF, split it page-by-page, and optionally convert pages to PNG for faster loading in your menu.
        </p>

        <form onSubmit={handleProcess} className="space-y-5">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-bold text-[var(--accent-forest)] mb-2">
              Select PDF File
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full rounded-xl border border-black/10 bg-[var(--bg-secondary)] px-4 py-3 text-sm"
            />
          </div>

          <label className="inline-flex items-center gap-3">
            <input
              type="checkbox"
              checked={convertToPng}
              onChange={(e) => setConvertToPng(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-[var(--text-main)]">
              Also convert each page to PNG (recommended for faster mobile swipe)
            </span>
          </label>

          <button
            type="submit"
            disabled={isProcessing}
            className="rounded-full bg-[var(--accent-forest)] text-white px-6 py-3 text-xs font-bold tracking-widest uppercase disabled:opacity-60"
          >
            {isProcessing ? "Processing..." : "Split PDF"}
          </button>
        </form>

        {progress && isProcessing && (
          <p className="mt-4 text-sm text-[var(--accent-forest)]">{progressText}</p>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {splitPdfPages.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-menu-title text-xl text-[var(--accent-dark)]">Split PDF Pages</h2>
              <button
                onClick={downloadAllSplitPdfs}
                className="rounded-full border border-[var(--accent-forest)] text-[var(--accent-forest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
              >
                Download All PDFs
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {splitPdfPages.map((item) => (
                <div key={item.fileName} className="rounded-xl border border-black/10 p-3 bg-[var(--bg-secondary)]">
                  <p className="text-sm font-bold text-[var(--text-main)]">Page {item.pageNumber}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate mb-3">{item.fileName}</p>
                  <a
                    href={item.url}
                    download={item.fileName}
                    className="inline-flex rounded-full border border-[var(--accent-forest)]/30 text-[var(--accent-forest)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                  >
                    Download PDF
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {pngPages.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-menu-title text-xl text-[var(--accent-dark)]">Converted PNG Pages</h2>
              <div className="flex gap-2">
                <button
                  onClick={downloadAllPngPages}
                  className="rounded-full border border-[var(--accent-forest)] text-[var(--accent-forest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                >
                  Download All PNGs
                </button>
                <button
                  onClick={applyPngToMenu}
                  className="rounded-full bg-[var(--accent-forest)] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                >
                  Use PNG In Menu
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pngPages.map((url, index) => (
                <div key={`${index}-${url.slice(0, 32)}`} className="rounded-xl border border-black/10 p-3 bg-[var(--bg-secondary)]">
                  <p className="text-sm font-bold text-[var(--text-main)] mb-2">Page {index + 1}</p>
                  <div className="aspect-[3/4] rounded-lg overflow-hidden border border-black/10 mb-3 bg-white">
                    <img src={url} alt={`page ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <a
                    href={url}
                    download={`menu-page-${index + 1}.png`}
                    className="inline-flex rounded-full border border-[var(--accent-forest)]/30 text-[var(--accent-forest)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                  >
                    Download PNG
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
