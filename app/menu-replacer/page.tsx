"use client";

import { useState } from "react";

export default function MenuReplacerPage() {
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [replacedFiles, setReplacedFiles] = useState<string[]>([]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedZipFile) {
      setError("Please select a zip file first.");
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      setReplacedFiles([]);
      setIsUploading(true);

      const formData = new FormData();
      formData.append("zipFile", selectedZipFile);

      const response = await fetch("/api/menu-zip", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        replacedFiles?: string[];
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to replace menu files.");
      }

      setSuccessMessage(payload.message || `✓ Successfully replaced your menu!`);
      setReplacedFiles(payload.replacedFiles || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--bg-secondary)] via-[#0d0d0d] to-[var(--bg-primary)] p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-menu-title text-5xl md:text-6xl text-[var(--accent-dark)] mb-4">
            Menu Replacer
          </h1>
          <p className="text-lg text-[var(--text-muted)]">
            Update your restaurant menu in 3 simple steps
          </p>
        </div>

        {/* Step-by-Step Guide */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {/* Step 1 */}
          <div className="rounded-[1.5rem] border border-[var(--border-light)] bg-white/5 p-6 backdrop-blur">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-forest)] text-white flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h2 className="font-menu-title text-2xl text-[var(--accent-dark)] mb-3">
              Prepare Your PDF
            </h2>
            <p className="text-[var(--text-muted)] mb-4">
              Make sure your menu PDF is ready, then rename it to <span className="font-bold text-[var(--accent-olive)]">menu.pdf</span>
            </p>
            <ul className="text-sm text-[var(--text-muted)] space-y-2">
              <li>✓ One PDF file</li>
              <li>✓ Filename: menu.pdf</li>
              <li>✓ All pages included</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="rounded-[1.5rem] border border-[var(--border-light)] bg-white/5 p-6 backdrop-blur">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-forest)] text-white flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h2 className="font-menu-title text-2xl text-[var(--accent-dark)] mb-3">
              Split & Download
            </h2>
            <p className="text-[var(--text-muted)] mb-4">
              Visit this free tool to split your PDF into individual pages:
            </p>
            <a
              href="https://www.ilovepdf.com/split_pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-block px-6 py-3 bg-[var(--accent-forest)] text-white rounded-full font-bold text-sm uppercase tracking-wider hover:bg-[var(--accent-olive)] transition"
            >
              Go to ilovepdf.com
            </a>
            <p className="text-xs text-[var(--text-muted)] mt-4">
              Download the result as <span className="font-bold">menu.zip</span>
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-[1.5rem] border border-[var(--border-light)] bg-white/5 p-6 backdrop-blur">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-forest)] text-white flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h2 className="font-menu-title text-2xl text-[var(--accent-dark)] mb-3">
              Upload & Replace
            </h2>
            <p className="text-[var(--text-muted)] mb-4">
              Upload your <span className="font-bold">menu.zip</span> file below. Your menu will update instantly.
            </p>
            <ul className="text-sm text-[var(--text-muted)] space-y-2">
              <li>✓ Automatic replacement</li>
              <li>✓ Instant activation</li>
              <li>✓ No downtime</li>
            </ul>
          </div>
        </div>

        {/* Upload Form */}
        <div className="rounded-[2rem] border border-[var(--border-light)] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-8 md:p-12">
          <h2 className="font-menu-title text-3xl text-[var(--accent-dark)] mb-2">
            Upload Your Menu ZIP
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            Select the menu.zip file you downloaded from ilovepdf.com
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* File Input */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-[var(--accent-forest)] mb-4">
                Select ZIP File
              </label>
              <div
                className={`relative rounded-xl border-2 border-dashed transition ${
                  selectedZipFile
                    ? "border-[var(--accent-forest)] bg-[var(--accent-forest)]/10"
                    : "border-[var(--text-muted)]/30 hover:border-[var(--accent-forest)]/50"
                }`}
              >
                <input
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={(e) => setSelectedZipFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="p-8 md:p-12 text-center">
                  <div className="text-4xl mb-3">📦</div>
                  {selectedZipFile ? (
                    <div>
                      <p className="text-lg font-bold text-[var(--accent-dark)]">
                        {selectedZipFile.name}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-2">
                        {(selectedZipFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-bold text-[var(--text-main)]">
                        Click here to select menu.zip
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-2">
                        or drag and drop
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-4">
                <p className="text-red-200 font-semibold">⚠️ {error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-xl bg-green-500/20 border border-green-500/50 p-4">
                <p className="text-green-200 font-semibold mb-2">{successMessage}</p>
                {replacedFiles.length > 0 && (
                  <p className="text-xs text-green-200/70">
                    {replacedFiles.length} file(s) replaced
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || !selectedZipFile}
              className="w-full py-4 bg-gradient-to-r from-[var(--accent-forest)] to-[var(--accent-olive)] text-white rounded-full font-bold text-lg uppercase tracking-widest hover:shadow-lg hover:shadow-[var(--accent-forest)]/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Replace Menu Now"}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-8 rounded-xl bg-[var(--accent-forest)]/10 border border-[var(--accent-forest)]/30 p-6">
            <p className="text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-forest)] font-bold">ℹ️ What happens:</span> When you upload, the system will unzip the file and replace all menu images instantly. Your restaurant menu will be live immediately.
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-full border border-[var(--accent-forest)]/50 text-[var(--accent-forest)] font-bold text-sm uppercase tracking-widest hover:bg-[var(--accent-forest)]/10 transition"
          >
            View Public Menu
          </a>
          <a
            href="/upload"
            className="px-6 py-3 rounded-full border border-[var(--accent-forest)]/50 text-[var(--accent-forest)] font-bold text-sm uppercase tracking-widest hover:bg-[var(--accent-forest)]/10 transition"
          >
            Upload PDF
          </a>
          <a
            href="/edit"
            className="px-6 py-3 rounded-full border border-[var(--accent-forest)]/50 text-[var(--accent-forest)] font-bold text-sm uppercase tracking-widest hover:bg-[var(--accent-forest)]/10 transition"
          >
            Edit Menu
          </a>
        </div>
      </div>
    </main>
  );
}
