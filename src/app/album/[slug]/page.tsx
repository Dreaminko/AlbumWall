import { notFound } from "next/navigation";
import { getAlbumBySlug, getAlbums } from "@/lib/albums";
import AlbumDetail from "@/components/AlbumDetail";
import BackButton from "./back-button";

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const albums = await getAlbums();
  return albums.map((album) => ({
    slug: album.slug,
  }));
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      {/* 返回按钮 - 仅独立页面显示 */}
      <BackButton />
      <AlbumDetail album={album} />
    </main>
  );
}
