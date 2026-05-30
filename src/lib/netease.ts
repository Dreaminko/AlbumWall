import type { NeteaseAlbum } from "@/types/album";
import { getCachedAlbum, setCachedAlbum } from "./cache";

const API_BASE = process.env.NETEASE_API_BASE;

export async function fetchAlbumDetail(
  albumId: number,
): Promise<NeteaseAlbum | null> {
  // 先查缓存
  const cached = getCachedAlbum(albumId);
  if (cached) {
    return cached;
  }

  // 缓存未命中，调用 API
  if (!API_BASE) {
    console.warn(
      "NETEASE_API_BASE not set, skipping API call for album",
      albumId,
    );
    return null;
  }

  try {
    const url = new URL("/album", API_BASE);
    url.searchParams.set("id", String(albumId));

    const res = await fetch(url.toString());

    if (!res.ok) {
      console.error(`API error for album ${albumId}: ${res.status}`);
      return null;
    }

    const json = await res.json();

    // NeteaseCloudMusicApiEnhanced 返回 { code: 200, album: {...} }
    const data = json?.album ?? json;
    if (!data || !data.id) {
      console.error(`Invalid API response for album ${albumId}`);
      return null;
    }

    const album: NeteaseAlbum = {
      id: data.id,
      name: data.name,
      picUrl: data.picUrl,
      artist: { name: data.artist?.name ?? "Unknown Artist" },
      publishTime: data.publishTime,
      size: data.size ?? 0,
    };

    // 写入缓存
    setCachedAlbum(albumId, album);

    return album;
  } catch (error) {
    console.error(`Failed to fetch album ${albumId}:`, error);
    return null;
  }
}
