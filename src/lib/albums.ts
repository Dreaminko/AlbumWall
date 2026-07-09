import { cache } from "react";
import { getAllMdxFiles } from "./mdx";
import { fetchAlbumDetail } from "./netease";
import type { Album } from "@/types/album";

export const getAlbums = cache(async (): Promise<Album[]> => {
  const mdxFiles = getAllMdxFiles();

  const albums = await Promise.all(
    mdxFiles.map(async (file) => {
      const { slug, frontmatter, content } = file;

      // 尝试从 API/缓存获取专辑数据
      const apiData = await fetchAlbumDetail(frontmatter.id);

      // 使用 API 数据，失败时用 frontmatter 作为 fallback
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
    }),
  );

  // 按日期降序排列（最新的在前）
  albums.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return albums;
});

export const getAlbumBySlug = cache(
  async (slug: string): Promise<Album | undefined> => {
    // 只读取目标 MDX，不加载所有专辑，避免 Vercel 冷启动超时
    const mdxFiles = getAllMdxFiles();
    const file = mdxFiles.find((f) => f.slug === slug);

    if (!file) return undefined;

    const { frontmatter, content } = file;
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
    };
  },
);
