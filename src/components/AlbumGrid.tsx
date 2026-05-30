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
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5 px-4 pt-4">
      {albums.map((album, index) => (
        <AlbumCard
          key={album.slug}
          album={album}
          priority={index < 8}
        />
      ))}
    </div>
  );
}
