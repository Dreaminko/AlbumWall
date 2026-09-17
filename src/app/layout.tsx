import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getAlbums } from "@/lib/albums";
import RandomAlbumButton from "@/components/RandomAlbumButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Album Wall",
  description: "Personal album recommend blog",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const slugs = getAlbums().map((album) => album.slug);

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white">
        {children}
        {modal}
        <RandomAlbumButton slugs={slugs} />
      </body>
    </html>
  );
}
