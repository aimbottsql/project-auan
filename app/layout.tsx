import type { Metadata } from "next";
import { Anton, IBM_Plex_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import Navbar from "@/app/components/Navbar";
import "./globals.css";

// หัวข้อโปสเตอร์ (ตัวหนาแน่น) — ใช้กับชื่อวง/หัวเรื่องภาษาอังกฤษเท่านั้น
const displayFont = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

// ป้าย/label สั้นๆ ที่เป็นอังกฤษ-ตัวเลขล้วน (ไม่รองรับภาษาไทย ห้ามใช้กับข้อความไทย)
const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

// ตัวอักษรหลักของเนื้อหา — รองรับทั้งไทยและอังกฤษในตระกูลเดียวกับ mono ด้านบน
const bodyFont = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Student Course Hub",
  description: "เว็บไซต์รวบรวมข้อมูลรายวิชา",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${displayFont.variable} ${monoFont.variable} ${bodyFont.variable}`}
    >
      <body>
        <header className="siteHeader">
          <Navbar />
        </header>
        {children}
      </body>
    </html>
  );
}