"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useMenuStore } from "@/hooks/useMenuStore";

type SharePlatform = "facebook" | "x" | "telegram" | "whatsapp";

export default function QRPage() {
  const { menuBook } = useMenuStore();
  const [origin, setOrigin] = useState("");
  const [selectedPath, setSelectedPath] = useState("/");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const detectedPaths = useMemo(() => {
    const basePaths = [
      { label: "Home Menu", path: "/" },
      { label: "Swipe Menu", path: "/swipe" },
      { label: "Edit (Protected)", path: "/edit" },
    ];

    const pageLinks = (menuBook.pages || []).map((_, index) => ({
      label: `Menu Page ${index + 1}`,
      path: `/?page=${index + 1}`,
    }));

    return [...basePaths, ...pageLinks];
  }, [menuBook.pages]);

  const selectedUrl = useMemo(() => {
    if (!origin) return "";
    return `${origin}${selectedPath}`;
  }, [origin, selectedPath]);

  const downloadQrCode = () => {
    const canvas = document.getElementById("menu-qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "menu-qr.png";
    link.click();
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl border border-black/10 bg-white p-6 flex justify-center">
            {selectedUrl ? (
              <QRCodeCanvas
                id="menu-qr-canvas"
                value={selectedUrl}
                size={280}
                includeMargin
                bgColor="#ffffff"
                fgColor="#1f4f2e"
                level="H"
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
