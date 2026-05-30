"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        // 有浏览器历史就返回，没有就跳首页
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition-colors"
      aria-label="Go back"
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
  );
}
