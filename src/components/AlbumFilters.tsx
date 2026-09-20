import { useEffect, useId, useRef, useState, type Ref } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import type { AlbumTag } from "@/lib/album-filters";

interface AlbumFiltersProps {
  tags: AlbumTag[];
  selected: AlbumTag | null;
  onSelect: (tag: AlbumTag | null) => void;
}

const tagClassName = "min-h-11 max-w-full shrink-0 cursor-pointer rounded-full border border-black/5 bg-[#f5f5f7] px-4 py-2 text-sm font-medium whitespace-normal [overflow-wrap:anywhere] text-[#1d1d1f] transition-colors duration-150 hover:bg-[#e8e8ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] aria-pressed:border-transparent aria-pressed:bg-[#0071e3] aria-pressed:text-white motion-reduce:transition-none";

function FilterTag({ ref, tag, selected, onSelect, reduceMotion }: {
  ref?: Ref<HTMLButtonElement>;
  tag: AlbumTag;
  selected: boolean;
  onSelect: () => void;
  reduceMotion: boolean;
}) {
  const isPresent = useIsPresent();
  return (
    <motion.button
      ref={ref}
      type="button"
      layout="position"
      inert={!isPresent}
      aria-pressed={selected}
      onClick={onSelect}
      onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.16 }}
      className={tagClassName}
    >
      {tag.value}
    </motion.button>
  );
}

export default function AlbumFilters({ tags, selected, onSelect }: AlbumFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeType, setActiveType] = useState<AlbumTag["type"]>("artist");
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    // Measure wrapping content so changing categories animates the panel height too.
    const observer = new ResizeObserver(() => setHeight(content.offsetHeight));
    observer.observe(content);
    return () => observer.disconnect();
  }, []);
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const groups = [
    { type: "artist", label: "Artist" },
    { type: "genre", label: "Genre" },
  ] as const;

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-4">
        {groups.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            aria-expanded={expanded && activeType === type}
            aria-controls={panelId}
            onClick={() => {
              setExpanded(!expanded || activeType !== type);
              setActiveType(type);
            }}
            className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-black/5 bg-[#f5f5f7] px-4 text-sm font-medium text-[#1d1d1f] transition-colors hover:bg-[#e8e8ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] motion-reduce:transition-none"
          >
            {label}
            <motion.svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              initial={false}
              animate={{ rotate: expanded && activeType === type ? 180 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </button>
        ))}
        {selected && <span className="truncate text-sm text-[#0071e3]">{selected.value}</span>}
      </div>
      <motion.div
        id={panelId}
        inert={!expanded}
        aria-hidden={!expanded}
        initial={false}
        animate={{ height: expanded ? height : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div
          ref={contentRef}
          role="group"
          aria-label={activeType === "artist" ? "Artist 筛选" : "Genre 筛选"}
          className="relative flex flex-wrap gap-2 px-4 pt-1 pb-4"
        >
          <button
            type="button"
            aria-pressed={selected === null}
            onClick={() => onSelect(null)}
            className={tagClassName}
          >
            全部
          </button>
          <AnimatePresence initial={false} mode="popLayout">
            {tags.filter((tag) => tag.type === activeType).map((tag) => (
              <FilterTag
                key={tag.id}
                tag={tag}
                selected={selected?.id === tag.id}
                onSelect={() => onSelect(selected?.id === tag.id ? null : tag)}
                reduceMotion={!!reduceMotion}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
