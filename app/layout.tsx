import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Food Menu Book",
  description: "Interactive digital restaurant menu with page flip",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
