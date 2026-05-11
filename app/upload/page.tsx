"use client";

import { useMemo, useState } from "react";
import { convertPdfFileToImages } from "@/lib/pdfToImages";
import { useMenuStore } from "@/hooks/useMenuStore";

export default function UploadPage() {
  const { menuBook, importPdfPagesAsMenu } = useMenuStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isReplacingMenu, setIsReplacingMenu] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [replacementSummary, setReplacementSummary] = useState<string[]>([]);

  const progressText = useMemo(() => {
    if (!progress) return "";
    return `Converting page ${progress.current} of ${progress.total}...`;
  }, [progress]);

  const uploadGuideUrl = "https://www.ilovepdf.com/split_pdf";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a PDF file first.");
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      setReplacementSummary([]);
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
  const onReplaceMenu = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedZipFile) {
      setError("Please select a zip firadial-gradient(circle_at_top,rgba(183,118,47,0.18),transparent_30%),linear-gradient(180deg,var(--bg-secondary),#0b0b0b)] p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6 rounded-[2rem] border border-[var(--border-light)] bg-white/95 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-black/10 bg-[linear-gradient(180deg,#fff9f0,#fff3e3)] p-6 text-[var(--text-main)] shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--accent-forest)]">Menu Replacer Workflow</p>
            <h1 className="mt-3 font-menu-title text-4xl text-[var(--accent-dark)] md:text-5xl">
              Upload a split menu zip and replace <span className="text-[var(--accent-forest)]">public/menu</span>
            </h1>
            <p className="mt-4 max-w-2xl font-body text-sm leading-7 text-[var(--text-muted)]">
              First split your PDF at{' '}
              <a className="font-bold text-[var(--accent-forest)] underline decoration-[var(--accent-forest)]/40 underline-offset-4" href={uploadGuideUrl} target="_blank" rel="noreferrer">
                ilovepdf.com/split_pdf
              </a>{" "}
              after naming the source file menu. Download the split result as menu.zip, then upload it here to overwrite the files currently served from /public/menu.
            </p>

            <div className="mt-6 grid gap-3 text-sm text-[var(--text-main)] sm:grid-cols-3">
              <div className="rounded-2xl border border-black/10 bg-white/75 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-forest)]">Step 1</p>
                <p className="mt-1 text-[var(--text-main)]">Rename the PDF to <span className="font-bold">menu</span>.</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/75 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-forest)]">Step 2</p>
                <p className="mt-1 text-[var(--text-main)]">Use the split PDF site to generate the zip.</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/75 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-forest)]">Step 3</p>
                <p className="mt-1 text-[var(--text-main)]">Upload menu.zip here to replace the menu assets.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border-light)] bg-[var(--bg-secondary)] p-6 text-[var(--text-main)] shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--accent-forest)]">About GitHub deploys</p>
            <p className="mt-3 font-body text-sm leading-7 text-[var(--text-muted)]">
              This page replaces the live files under <span className="font-semibold text-[var(--text-main)]">public/menu</span> on the server.
              Pushing those files into GitHub automatically needs a separate GitHub Action, token, or self-hosted script with repo write access.
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--text-muted)]">
              If you want, this can be extended later with a commit step, but the safest default is direct replacement only.
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/split" className="rounded-full border border-[var(--accent-forest)]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-dark)]">
                Open Split Tool
              </a>
              <a href="/edit" className="rounded-full border border-[var(--accent-forest)]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-dark)]">
                Go To Editor
              </a>
              <a href="/" target="_blank" rel="noreferrer" className="rounded-full border border-[var(--accent-forest)]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-dark)]">
                Open Public Menu
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={onSubmit} className="rounded-[1.5rem] border border-black/10 bg-[var(--bg-secondary)] p-6 shadow-lg">
            <h2 className="font-menu-title text-2xl text-[var(--accent-dark)]">Convert PDF to Menu Images</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
              Keep this for the browser-based flow that imports a PDF and converts each page into menu images.
            </p>
            <div className="mt-6 space-y-5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-forest)]">
                Select PDF File
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--text-main)]"
              />

              <button
                type="submit"
                disabled={isConverting}
                className="rounded-full bg-[var(--accent-forest)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
              >
                {isConverting ? "Converting..." : "Convert PDF And Apply"}
              </button>
            </div>
          </form>

          <form onSubmit={onReplaceMenu} className="rounded-[1.5rem] border border-black/10 bg-[var(--bg-secondary)] p-6 shadow-lg">
            <h2 className="font-menu-title text-2xl text-[var(--accent-dark)]">Replace public/menu from Zip</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
              Upload menu.zip here. The server will unzip it, clear the current menu folder, and write the new files into public/menu.
            </p>

            <div className="mt-6 space-y-5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-forest)]">
                Select Zip File
              </label>
              <input
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(e) => setSelectedZipFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--text-main)]"
              />

              <button
                type="submit"
                disabled={isReplacingMenu}
                className="rounded-full bg-[var(--accent-dark)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--bg-secondary)] disabled:opacity-60"
              >
                {isReplacingMenu ? "Replacing..." : "Replace Public Menu"}
              </button>
            </div>
          </form>
        </section>

        {progress && isConverting && <p className="text-sm text-[var(--accent-forest)]">{progressText}</p>}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {successMessage && <p className="text-sm text-[var(--accent-forest)]">{successMessage}</p>}

        {replacementSummary.length > 0 && (
          <section className="rounded-[1.5rem] border border-black/10 bg-[var(--bg-secondary)] p-6 shadow-lg">
            <h2 className="font-menu-title text-xl text-[var(--accent-dark)]">Replaced Files</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {replacementSummary.slice(0, 12).map((item) => (
                <div key={item} className="truncate rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--text-muted)]">
                  {item}
                </div>
              ))}
            </div>
          </section>
        )}

        {menuBook.sourcePdf && (
          <div className="rounded-[1.5rem] border border-black/10 bg-[var(--bg-secondary)] p-6 shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-forest)]">Last Imported PDF</p>
            <p className="mt-2 font-body text-sm text-[var(--text-main)]">{menuBook.sourcePdf.name}</p>
            <p className="mt-1 font-body text-xs text-[var(--text-muted)]">
              {menuBook.sourcePdf.pageCount} pages · Imported {new Date(menuBook.sourcePdf.importedAt).toLocaleString()}
            </p>
          </div>
        )}lassName="mt-4 text-sm text-[var(--accent-forest)]">{progressText}</p>
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
            href="/split"
            className="rounded-full border border-[var(--accent-forest)]/30 text-[var(--accent-forest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
          >
            Open Split Tool
          </a>
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
