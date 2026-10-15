import type { Metadata } from "next";
import type { Album } from "@/types/album";

interface ShareImage {
  path: string;
  width: number;
  height: number;
  alt: string;
}

export function resolveSiteUrl(value: string | undefined, production: boolean): URL {
  if (!value && !production) return new URL("http://localhost:3000");
  let url: URL;
  try {
    url = new URL(value ?? "");
  } catch {
    throw new Error("SITE_URL must be the public HTTPS site origin.");
  }
  if ((production ? url.protocol !== "https:" : !["https:", "http:"].includes(url.protocol)) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL must be the public HTTPS site origin, without a path or credentials.");
  }
  return url;
}

export function buildAlbumShareMetadata(album: Album, siteUrl: URL, image: ShareImage | undefined): Metadata {
  if (!image) throw new Error(`Missing share image for ${album.slug}; run npm run content:prepare.`);
  const title = `${album.name} — ${album.artist} | Album Wall`;
  const excerpt = album.reviewContent
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_`~[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  const description = [album.genre?.trim(), album.year > 0 && album.year, excerpt || `${album.artist} 的专辑《${album.name}》乐评`].filter(Boolean).join(" · ");
  const url = new URL(`/album/${encodeURIComponent(album.slug)}`, siteUrl).href;
  const imageUrl = new URL(image.path, siteUrl).href;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, type: "article", url, siteName: "Album Wall",
      images: [{ url: imageUrl, width: image.width, height: image.height, type: "image/png", alt: image.alt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}
