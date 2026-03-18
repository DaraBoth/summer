"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useMenuStore } from "@/hooks/useMenuStore";

type SharePlatform = "facebook" | "x" | "telegram" | "whatsapp";

interface PublicFileEntry {
  name: string;
  path: string;
}

export default function QRPage() {
  const { menuBook } = useMenuStore();
  const [origin, setOrigin] = useState("");
  const [selectedPath, setSelectedPath] = useState("/");
  const [publicFiles, setPublicFiles] = useState<PublicFileEntry[]>([]);
  const [fgColor, setFgColor] = useState("#5f3a1c");
  const [bgColor, setBgColor] = useState("#fffdf7");
  const [captionText, setCaptionText] = useState("Scan to open menu");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(56);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const loadPublicFiles = async () => {
      try {
        const response = await fetch("/api/public-files");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { files?: PublicFileEntry[] };
        setPublicFiles(payload.files || []);
      } catch {
        setPublicFiles([]);
      }
    };

    void loadPublicFiles();
  }, []);

  const detectedPaths = useMemo(() => {
    const basePaths = [
      { label: "Home Menu", path: "/" },
      { label: "Menu PDF File", path: "/api/pdf" },
      { label: "Swipe Menu", path: "/swipe" },
      { label: "Edit (Protected)", path: "/edit" },
    ];

    const pageLinks = (menuBook.pages || []).map((_, index) => ({
      label: `Menu Page ${index + 1}`,
      path: `/?page=${index + 1}`,
    }));

    const publicFileLinks = publicFiles.map((file) => ({
      label: `Public File: ${file.name}`,
      path: file.path,
    }));

    return [...basePaths, ...pageLinks, ...publicFileLinks];
  }, [menuBook.pages, publicFiles]);

  const selectedUrl = useMemo(() => {
    if (!origin) return "";
    return `${origin}${selectedPath}`;
  }, [origin, selectedPath]);

  const qrSize = 280;

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setLogoDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadQrCode = () => {
    const canvas = document.getElementById("menu-qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "menu-qr.png";
    link.click();
  };

  const printStyledQr = () => {
    const canvas = document.getElementById("menu-qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const qrDataUrl = canvas.toDataURL("image/png");
    const safeCaption = captionText
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const safeUrl = selectedUrl
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=720,height=920");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR</title>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; background: #ffffff; color: #2f2419; }
            .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .card { width: 420px; border: 1px solid #e7d2ba; border-radius: 20px; padding: 28px; text-align: center; }
            .caption { font-size: 18px; font-weight: 700; margin: 0 0 14px; }
            img { width: 300px; height: 300px; object-fit: contain; }
            .url { margin-top: 12px; font-size: 11px; word-break: break-all; color: #6f553f; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="card">
              <p class="caption">${safeCaption || "Scan to open menu"}</p>
              <img src="${qrDataUrl}" alt="QR code" />
              <p class="url">${safeUrl}</p>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareQrTarget = async () => {
    if (!selectedUrl) return;

    if (navigator.share) {
      await navigator.share({
        title: "Menu Link",
        text: "Check our menu",
        url: selectedUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(selectedUrl);
    window.alert("Link copied to clipboard.");
  };

  const shareToPlatform = (platform: SharePlatform) => {
    if (!selectedUrl) return;
    const encodedUrl = encodeURIComponent(selectedUrl);
    const encodedText = encodeURIComponent("Check our menu");

    const platformUrlMap: Record<SharePlatform, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    };

    window.open(platformUrlMap[platform], "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] px-4 py-10">
      <div className="mx-auto max-w-3xl bg-white rounded-3xl shadow-xl border border-black/5 p-8">
        <h1 className="font-menu-title text-3xl text-[var(--accent-dark)] mb-2">QR Generator</h1>
        <p className="font-body text-sm text-[var(--text-muted)] mb-8">
          Select a detected page and generate a shareable QR code.
        </p>

        <div className="mb-6">
          <a
            href="/QR/pdf"
            className="inline-flex rounded-full border border-[var(--accent-forest)]/30 text-[var(--accent-forest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
          >
            Open Dedicated Menu PDF QR Route
          </a>
        </div>

        <label className="block text-[10px] tracking-[0.2em] uppercase font-bold text-[var(--accent-forest)] mb-2">
          Select Page
        </label>
        <select
          value={selectedPath}
          onChange={(e) => setSelectedPath(e.target.value)}
          className="w-full mb-6 rounded-xl border border-black/10 bg-[var(--bg-secondary)] px-4 py-3 text-sm"
        >
          {detectedPaths.map((item) => (
            <option key={item.path} value={item.path}>
              {item.label} - {item.path}
            </option>
          ))}
        </select>

        <div className="mb-6 rounded-2xl border border-black/10 bg-[var(--bg-secondary)] p-4 md:p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-forest)] font-bold mb-3">Style QR</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-xs font-bold text-[var(--accent-dark)]">
              QR Color
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="mt-2 block h-10 w-full rounded-lg border border-black/10 bg-white"
              />
            </label>
            <label className="text-xs font-bold text-[var(--accent-dark)]">
              Background Color
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="mt-2 block h-10 w-full rounded-lg border border-black/10 bg-white"
              />
            </label>
            <label className="text-xs font-bold text-[var(--accent-dark)] md:col-span-2">
              Caption Text
              <input
                type="text"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Scan to open menu"
                className="mt-2 block w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-bold text-[var(--accent-dark)] md:col-span-2">
              Logo (optional)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="mt-2 block w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              />
            </label>
            {logoDataUrl && (
              <label className="text-xs font-bold text-[var(--accent-dark)] md:col-span-2">
                Logo Size ({logoSize}px)
                <input
                  type="range"
                  min={28}
                  max={84}
                  value={logoSize}
                  onChange={(e) => setLogoSize(Number(e.target.value))}
                  className="mt-2 block w-full"
                />
              </label>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl border border-black/10 bg-white p-6 flex flex-col items-center gap-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-forest)] font-bold">{captionText || "Scan to open menu"}</p>
            {selectedUrl ? (
              <QRCodeCanvas
                id="menu-qr-canvas"
                value={selectedUrl}
                size={qrSize}
                includeMargin
                bgColor={bgColor}
                fgColor={fgColor}
                level="H"
                imageSettings={
                  logoDataUrl
                    ? {
                        src: logoDataUrl,
                        width: logoSize,
                        height: logoSize,
                        excavate: true,
                      }
                    : undefined
                }
              />
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Preparing URL...</p>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-forest)] font-bold mb-2">Target URL</p>
            <p className="text-sm break-all bg-[var(--bg-secondary)] border border-black/5 rounded-xl p-3 mb-6">
              {selectedUrl || "Loading..."}
            </p>

            <div className="space-y-3">
              <button
                onClick={downloadQrCode}
                className="w-full rounded-full bg-[var(--accent-forest)] text-white px-4 py-3 text-xs font-bold tracking-widest uppercase"
              >
                Download QR
              </button>
              <button
                onClick={printStyledQr}
                className="w-full rounded-full bg-[var(--accent-olive)] text-white px-4 py-3 text-xs font-bold tracking-widest uppercase"
              >
                Print QR
              </button>
              <button
                onClick={shareQrTarget}
                className="w-full rounded-full border border-[var(--accent-forest)] text-[var(--accent-forest)] px-4 py-3 text-xs font-bold tracking-widest uppercase"
              >
                Share Link
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => shareToPlatform("facebook")} className="rounded-xl bg-[#1877F2] text-white py-2 text-xs font-bold">Facebook</button>
              <button onClick={() => shareToPlatform("x")} className="rounded-xl bg-black text-white py-2 text-xs font-bold">X</button>
              <button onClick={() => shareToPlatform("telegram")} className="rounded-xl bg-[#229ED9] text-white py-2 text-xs font-bold">Telegram</button>
              <button onClick={() => shareToPlatform("whatsapp")} className="rounded-xl bg-[#25D366] text-white py-2 text-xs font-bold">WhatsApp</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
