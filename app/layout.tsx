import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "swiper/css";
import "swiper/css/effect-creative";

export const metadata: Metadata = {
  title: "Food Menu Book",
  description: "Interactive digital restaurant menu with page flip",
};

// One built image is shared by multiple CHANNEL-differentiated containers
// (see /opt/hermess/CLAUDE.md), so this must read process.env.CHANNEL at
// request time, not get baked into a statically prerendered page at build
// time — force-dynamic makes every route under this layout render per
// request instead of being prerendered once during `next build`.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const channel = process.env.CHANNEL;

  if (!channel) {
    return (
      <html lang="en">
        <body className="antialiased" style={{ background: "#050505", color: "#f2e3c6", margin: 0 }}>
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", textAlign: "center", padding: "2rem" }}>
            <div>
              <p style={{ fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#b7762f", marginBottom: "12px" }}>
                Configuration Error
              </p>
              <h1 style={{ fontSize: "2rem", marginBottom: "12px" }}>CHANNEL not set</h1>
              <p style={{ color: "#b79a6c", fontSize: "14px" }}>
                Set the <code style={{ background: "#111", padding: "2px 6px", borderRadius: "4px" }}>CHANNEL</code> environment variable for this deployment.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // Read at request time for the same reason CHANNEL is: summer and balcony
  // are one image in two containers, so a build-time NEXT_PUBLIC_ variable
  // would bake a single site's ID into both and merge their stats.
  const umamiWebsiteId = process.env.UMAMI_WEBSITE_ID;
  const umamiSrc =
    process.env.UMAMI_SRC ?? "https://analytics.filessecond.com/script.js";

  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {/* Absent env var = no tracking, which is the right default: local
            dev and any future deployment stay out of production stats
            without needing to remember to disable anything. */}
        {umamiWebsiteId ? (
          <Script
            src={umamiSrc}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
