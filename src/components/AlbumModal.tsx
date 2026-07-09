"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";

interface AlbumModalProps {
  children: React.ReactNode;
}

export default function AlbumModal({ children }: AlbumModalProps) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

  // 将焦点放入 Modal，并在关闭后恢复到打开它的元素
  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Album detail"
      className="fixed inset-0 z-50 bg-white overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* 返回按钮 */}
      <button
        ref={closeButtonRef}
        onClick={onDismiss}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
        aria-label="Close album detail"
      >
        <svg
          className="h-5 w-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* 内容 */}
      <div className="min-h-screen md:h-screen">{children}</div>
    </motion.div>
  );
}
