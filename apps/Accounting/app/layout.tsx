import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HTX Farm-Kế Toán",
  description: "Phần mềm kế toán VAS/TT200 cho HTX nông nghiệp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
