import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HTX Farm - Quản lý Trại Tôm",
  description: "Module quản lý trại nuôi tôm - MRP",
  manifest: "/manifest.json",
  themeColor: "#1B2B4B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
