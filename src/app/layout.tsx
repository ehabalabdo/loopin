import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loopin - نظام إدارة شركة لوب",
  description: "نظام محاسبي وإدارة موارد بشرية لشركة لوب للدعاية والإعلان",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
