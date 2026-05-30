import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "p1.music.126.net",
      },
      {
        protocol: "https",
        hostname: "p2.music.126.net",
      },
      {
        protocol: "https",
        hostname: "p3.music.126.net",
      },
      {
        protocol: "https",
        hostname: "p4.music.126.net",
      },
    ],
  },
};

const withMDX = createMDX({
  // 可选：添加 remark/rehype 插件
});

export default withMDX(nextConfig);
