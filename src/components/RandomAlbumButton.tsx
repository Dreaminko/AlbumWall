"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

interface RandomAlbumButtonProps {
  slugs: string[];
}

export default function RandomAlbumButton({ slugs }: RandomAlbumButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = useCallback(() => {
    if (slugs.length === 0) return;

    const currentSlug = pathname.startsWith("/album/")
      ? pathname.slice("/album/".length)
      : null;

    const candidates =
      slugs.length > 1 ? slugs.filter((slug) => slug !== currentSlug) : slugs;

    const randomSlug =
      candidates[Math.floor(Math.random() * candidates.length)];

    router.push(`/album/${randomSlug}`, { scroll: false });
  }, [router, pathname, slugs]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="随机跳转一张专辑"
      title="随机跳转一张专辑"
      className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:text-gray-900 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.16)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
    >
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="16" cy="8" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="8" cy="16" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}
