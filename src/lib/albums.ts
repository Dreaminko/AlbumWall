import { cache } from "react";
import {
  getAllMdxFiles,
  getMdxFileBySlug,
  type MdxFile,
} from "./mdx";
import { fetchAlbumDetail } from "./netease";
import type { Album } from "@/types/album";

async function buildAlbum(file: MdxFile): Promise<Album> {
  const { slug, frontmatter, content } = file;

  const apiData = await fetchAlbumDetail(frontmatter.id);

  const name = apiData?.name ?? frontmatter.album ?? "Unknown Album";
  const artist =
    apiData?.artist?.name ?? frontmatter.artist ?? "Unknown Artist";
  const coverUrl = apiData?.picUrl ?? "";
  const year = apiData
    ? new Date(apiData.publishTime).getFullYear()
    : new Date(frontmatter.date).getFullYear();
  const trackCount = apiData?.size ?? 0;

  return {
    slug,
    neteaseId: frontmatter.id,
    name,
    artist,
    coverUrl,
    year,
    trackCount,
    date: frontmatter.date,
    genre: frontmatter.genre,
    reviewContent: content,
  } satisfies Album;
}

export const getAlbums = cache(async (): Promise<Album[]> => {
  const mdxFiles = getAllMdxFiles();

  const albums = await Promise.all(mdxFiles.map(buildAlbum));

  // 按日期降序排列（最新的在前）
  albums.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return albums;
});

export const getAlbumBySlug = cache(
  async (slug: string): Promise<Album | undefined> => {
    const file = getMdxFileBySlug(slug);

    if (!file) return undefined;

    return buildAlbum(file);
  },
);
