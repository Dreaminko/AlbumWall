import { getAlbums } from "@/lib/albums";
import AlbumGrid from "@/components/AlbumGrid";

export default async function Home() {
  const albums = await getAlbums();

  return (
    <main className="min-h-screen">
      <AlbumGrid albums={albums} />
    </main>
  );
}
