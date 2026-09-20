import type { Album } from "@/types/album";

export interface AlbumTag {
  id: string;
  type: "artist" | "genre";
  value: string;
}

export function getAlbumTags(albums: Album[]): AlbumTag[] {
  const tags = new Map<string, AlbumTag & { count: number }>();
  for (const album of albums) {
    for (const type of ["artist", "genre"] as const) {
      const value = album[type]?.trim();
      if (!value) continue;
      const id = `${type}:${value}`;
      const existing = tags.get(id);
      if (existing) existing.count++;
      else tags.set(id, { id, type, value, count: 1 });
    }
  }
  return [...tags.values()].sort((a, b) => b.count - a.count);
}

export function filterAlbums(albums: Album[], tag: AlbumTag | null): Album[] {
  return tag ? albums.filter((album) => album[tag.type]?.trim() === tag.value) : albums;
}
