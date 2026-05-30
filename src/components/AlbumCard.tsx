"use client";

import Link from "next/link";
import Image from "next/image";
import type { Album } from "@/types/album";

interface AlbumCardProps {
  album: Album;
  priority?: boolean;
}

export default function AlbumCard({ album, priority = false }: AlbumCardProps) {
  return (
    <Link
      href={`/album/${album.slug}`}
      className="block break-inside-avoid mb-4 group"
      scroll={false}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-lg">
        {album.coverUrl ? (
          <Image
            src={album.coverUrl}
            alt={album.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover"
            priority={priority}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
            <svg
              className="h-12 w-12"
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
    </Link>
  );
}
