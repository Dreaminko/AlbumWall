"use client";

import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface AlbumModalProps {
  children: React.ReactNode;
}

export default function AlbumModal({ children }: AlbumModalProps) {
  const router = useRouter();

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

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
      className="fixed inset-0 z-50 bg-white overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 返回按钮 */}
      <button
        onClick={onDismiss}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition-colors"
        aria-label="Close"
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
      <div className="min-h-screen md:h-screen">
        {children}
      </div>
    </motion.div>
  );
}
