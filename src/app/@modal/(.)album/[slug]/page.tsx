import { notFound } from "next/navigation";
import { getAlbumBySlug } from "@/lib/albums";
import AlbumDetail from "@/components/AlbumDetail";
import AlbumModal from "@/components/AlbumModal";

interface ModalAlbumPageProps {
  params: Promise<{ slug: string }>;
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
