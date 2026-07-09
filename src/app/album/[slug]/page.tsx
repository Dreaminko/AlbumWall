import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAlbumBySlug } from "@/lib/albums";
import { getAllMdxSlugs } from "@/lib/mdx";
import AlbumDetail from "@/components/AlbumDetail";
import BackButton from "./back-button";

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

function createDescription(content: string): string {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_`~[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

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

  const title = `${album.name} - ${album.artist} | Album Wall`;
  const description =
    createDescription(album.reviewContent) ||
    `${album.artist} 的专辑《${album.name}》乐评`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: album.coverUrl ? [{ url: album.coverUrl, alt: album.name }] : [],
    },
    twitter: {
      card: album.coverUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: album.coverUrl ? [album.coverUrl] : undefined,
    },
  };
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
