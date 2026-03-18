"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type SharePlatform = "facebook" | "x" | "telegram" | "whatsapp";

export default function PdfQrPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const pdfUrl = useMemo(() => {
    if (!origin) return "";
    return `${origin}/api/pdf`;
  }, [origin]);

  const downloadQrCode = () => {
    const canvas = document.getElementById("menu-pdf-qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "menu-pdf-qr.png";
    link.click();
  };

  const shareQrTarget = async () => {
    if (!pdfUrl) return;

    if (navigator.share) {
      await navigator.share({
        title: "Menu PDF",
        text: "Open our menu PDF",
        url: pdfUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(pdfUrl);
    window.alert("PDF link copied to clipboard.");
  };

  const shareToPlatform = (platform: SharePlatform) => {
    if (!pdfUrl) return;
    const encodedUrl = encodeURIComponent(pdfUrl);
    const encodedText = encodeURIComponent("Open our menu PDF");

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
        <h1 className="font-menu-title text-3xl text-[var(--accent-dark)] mb-2">Menu PDF QR</h1>
        <p className="font-body text-sm text-[var(--text-muted)] mb-8">
          This route always generates a QR code for your menu PDF file.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl border border-black/10 bg-white p-6 flex justify-center">
            {pdfUrl ? (
              <QRCodeCanvas
                id="menu-pdf-qr-canvas"
                value={pdfUrl}
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
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-forest)] font-bold mb-2">PDF URL</p>
            <p className="text-sm break-all bg-[var(--bg-secondary)] border border-black/5 rounded-xl p-3 mb-6">
              {pdfUrl || "Loading..."}
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
