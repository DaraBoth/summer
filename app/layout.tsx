import type { Metadata } from "next";
import "./globals.css";
import "swiper/css";
import "swiper/css/effect-creative";

export const metadata: Metadata = {
  title: "Food Menu Book",
  description: "Interactive digital restaurant menu with page flip",
};

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

  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
