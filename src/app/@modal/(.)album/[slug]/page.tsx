import { notFound } from "next/navigation";
import { getAlbumBySlug, getAlbums } from "@/lib/albums";
import AlbumDetail from "@/components/AlbumDetail";
import AlbumModal from "@/components/AlbumModal";

interface ModalAlbumPageProps {
  params: Promise<{ slug: string }>;
}

// 预渲染所有拦截路由，消除 Vercel 冷启动
export async function generateStaticParams() {
  const albums = await getAlbums();
  return albums.map((album) => ({ slug: album.slug }));
}

export default async function ModalAlbumPage({ params }: ModalAlbumPageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  return (
    <AlbumModal>
      <AlbumDetail album={album} />
    </AlbumModal>
  );
}
