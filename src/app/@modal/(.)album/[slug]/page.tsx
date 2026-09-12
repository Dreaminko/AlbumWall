import { notFound } from "next/navigation";
import { getAlbumBySlug } from "@/lib/albums";
import { getAllMdxSlugs } from "@/lib/albums";
import AlbumDetail from "@/components/AlbumDetail";
import AlbumModal from "@/components/AlbumModal";

interface ModalAlbumPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

// 预渲染已发布文章的弹窗路由。
export async function generateStaticParams() {
  return getAllMdxSlugs().map((slug) => ({ slug }));
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
