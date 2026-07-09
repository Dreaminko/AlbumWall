import { evaluate } from "@mdx-js/mdx";
import type { ComponentType } from "react";
import * as runtime from "react/jsx-runtime";

interface ReviewContentProps {
  content: string;
}

export async function ReviewContent({ content }: ReviewContentProps) {
  let Component: ComponentType;

  try {
    const result = await evaluate(content, {
      ...runtime,
      development: false,
    });
    Component = result.default as ComponentType;
  } catch (error) {
    console.error("MDX compilation error:", error);
    return (
      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
        {content}
      </div>
    );
  }

  return <Component />;
}
