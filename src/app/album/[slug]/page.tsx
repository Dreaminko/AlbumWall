import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAlbumBySlug } from "@/lib/albums";
import { getAllMdxSlugs } from "@/lib/albums";
import AlbumDetail from "@/components/AlbumDetail";
import shareImages from "@/generated/share-images.json";
import { buildAlbumShareMetadata, resolveSiteUrl } from "@/lib/share-metadata";
import BackButton from "./back-button";

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) {
    return {
      title: "Album not found | Album Wall",
    };
  }

  return buildAlbumShareMetadata(
    album,
    resolveSiteUrl(process.env.SITE_URL, process.env.NODE_ENV === "production"),
    shareImages[slug as keyof typeof shareImages],
  );
}

export async function generateStaticParams() {
  return getAllMdxSlugs().map((slug) => ({ slug }));
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white md:h-screen md:overflow-hidden">
      {/* 返回按钮 - 仅独立页面显示 */}
      <BackButton />
      <AlbumDetail album={album} />
    </main>
  );
}
