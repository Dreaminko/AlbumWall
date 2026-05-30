import fs from "fs";
import path from "path";
import type { CacheEntry, NeteaseAlbum } from "@/types/album";

const CACHE_DIR = path.join(process.cwd(), "cache");
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCachePath(albumId: number): string {
  return path.join(CACHE_DIR, `${albumId}.json`);
}

export function getCachedAlbum(albumId: number): NeteaseAlbum | null {
  ensureCacheDir();
  const cachePath = getCachePath(albumId);

  if (!fs.existsSync(cachePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(cachePath, "utf-8");
    const entry: CacheEntry = JSON.parse(raw);

    // 检查是否过期
    if (Date.now() - entry.cachedAt > CACHE_TTL) {
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function setCachedAlbum(albumId: number, data: NeteaseAlbum): void {
  ensureCacheDir();
  const cachePath = getCachePath(albumId);
  const entry: CacheEntry = {
    data,
    cachedAt: Date.now(),
  };
  fs.writeFileSync(cachePath, JSON.stringify(entry, null, 2), "utf-8");
}
