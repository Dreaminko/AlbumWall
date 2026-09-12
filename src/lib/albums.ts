import data from "@/generated/albums.json";
import type { Album } from "@/types/album";

const albums: Album[] = data;

export function getAlbums(): Album[] {
  return albums;
}

export function getAlbumBySlug(slug: string): Album | undefined {
  return albums.find((album) => album.slug === slug);
}

export function getAllMdxSlugs(): string[] {
  return albums.map((album) => album.slug);
}
