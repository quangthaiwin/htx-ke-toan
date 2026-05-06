import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HTX Farm-Kế Toán",
  description: "Phần mềm kế toán VAS/TT200 cho HTX nông nghiệp",
  manifest: "/manifest.json",
  themeColor: "#1a1a2e",
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
