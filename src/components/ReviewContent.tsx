/**
 * Simple client-side component to render MDX content.
 * Uses @mdx-js/mdx evaluate to compile and render MDX strings dynamically.
 */
"use client";

import { useEffect, useState } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";

interface ReviewContentProps {
  content: string;
}

export function ReviewContent({ content }: ReviewContentProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function compileMDX() {
      try {
        const result = await evaluate(content, {
          ...runtime,
          development: false,
        });
        if (!cancelled) {
          setComponent(() => result.default);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("MDX compilation error:", e);
          setError(String(e));
        }
      }
    }

    compileMDX();

    return () => {
      cancelled = true;
    };
  }, [content]);

  if (error) {
    return (
      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
        {content}
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
      </div>
    );
  }

  return <Component />;
}
