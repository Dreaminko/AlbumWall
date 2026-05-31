import Image from "next/image";
import { ReviewContent } from "./ReviewContent";
import type { Album } from "@/types/album";

interface AlbumDetailProps {
  album: Album;
}

export default function AlbumDetail({ album }: AlbumDetailProps) {
  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* 封面区域 */}
      <div className="md:w-1/2 md:sticky md:top-0 md:h-screen shrink-0">
        <div className="relative aspect-square md:aspect-auto md:h-full w-full bg-gray-100">
          {album.coverUrl ? (
            <Image
              src={album.coverUrl}
              alt={album.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
              <svg
                className="h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* 乐评区域 */}
      <div className="md:w-1/2 overflow-y-auto">
        <div className="px-6 py-8 md:px-10 md:py-12">
          {/* 元数据 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold leading-tight">{album.name}</h1>
            <p className="mt-2 text-xl text-gray-500">{album.artist}</p>
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-400">
              {album.genre && (
                <>
                  <span className="text-gray-500 font-medium">
                    {album.genre}
                  </span>
                  <span>·</span>
                </>
              )}
              <span>{album.year}</span>
              {album.trackCount > 0 && (
                <>
                  <span>·</span>
                  <span>{album.trackCount} tracks</span>
                </>
              )}
              <span>·</span>
              <span>{album.date}</span>
            </div>
          </div>

          {/* MDX 乐评内容 */}
          <div className="prose">
            <ReviewContent content={album.reviewContent} />
          </div>
        </div>
      </div>
    </div>
  );
}
