import type { Album } from "@/types/album";
import AlbumCard from "./AlbumCard";

interface AlbumGridProps {
  albums: Album[];
}

export default function AlbumGrid({ albums }: AlbumGridProps) {
  if (albums.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
        <p className="text-lg">No albums yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 px-4 pt-4 sm:grid-cols-3 lg:grid-cols-5">
      {albums.map((album) => (
        <AlbumCard key={album.slug} album={album} />
      ))}
    </div>
  );
}
