"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import type { Album } from "@/types/album";
import { filterAlbums, getAlbumTags, type AlbumTag } from "@/lib/album-filters";
import AlbumCard from "./AlbumCard";
import AlbumFilters from "./AlbumFilters";

function AnimatedAlbum({ album, reduceMotion }: { album: Album; reduceMotion: boolean }) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      layout="position"
      inert={!isPresent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.16, layout: { duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] } }}
    >
      <AlbumCard album={album} />
    </motion.div>
  );
}

export default function AlbumGrid({ albums }: { albums: Album[] }) {
  const [selected, setSelected] = useState<AlbumTag | null>(null);
  const tags = useMemo(() => getAlbumTags(albums), [albums]);
  const filtered = filterAlbums(albums, selected);
  const reduceMotion = !!useReducedMotion();

  if (albums.length === 0) {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-400"><p className="text-lg">No albums yet.</p></div>;
  }

  return (
    <>
      <AlbumFilters tags={tags} selected={selected} onSelect={setSelected} />
      <p role="status" className="sr-only">{filtered.length} 张专辑</p>
      <div className="grid grid-cols-2 gap-4 p-4 pt-0 sm:grid-cols-3 lg:grid-cols-5">
        {/* Default sync mode keeps exiting cards in flow until their fade finishes. */}
        <AnimatePresence initial={false}>
          {filtered.map((album) => (
            <AnimatedAlbum key={album.slug} album={album} reduceMotion={reduceMotion} />
          ))}
        </AnimatePresence>
      </div>
      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-500">
          <p>没有匹配的专辑</p>
          <button type="button" onClick={() => setSelected(null)} className="mt-3 min-h-11 cursor-pointer text-[#0071e3] underline">显示全部</button>
        </div>
      )}
    </>
  );
}
