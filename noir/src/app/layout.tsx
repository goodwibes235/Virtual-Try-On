import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/providers/SmoothScroll";

export const metadata: Metadata = {
  title: "NOIR — Wear The Future",
  description:
    "NOIR redefines the boundaries between technology and couture. Premium fashion with live virtual try-on.",
  keywords: ["fashion", "virtual try-on", "premium clothing", "NOIR"],
};

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
        <html lang="en">
          <head>
            {/* Inter font from Google Fonts */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
              rel="stylesheet"
            />
          </head>
          <body className="antialiased">
            <SmoothScroll>{children}</SmoothScroll>
          </body>
        </html>
        );
}
