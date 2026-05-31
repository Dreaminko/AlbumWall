import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { AlbumFrontmatter } from "@/types/album";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface MdxFile {
  slug: string;
  frontmatter: AlbumFrontmatter;
  content: string;
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  return String(value ?? "");
}

export function getAllMdxFiles(): MdxFile[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  return files.map((filename) => {
    const filePath = path.join(CONTENT_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    // 从文件名提取 slug: {yyyy-mm-dd}-{slug}.mdx
    const slugMatch = filename.match(/^\d{4}-\d{2}-\d{2}-(.+)\.mdx$/);
    const slug = slugMatch ? slugMatch[1] : filename.replace(/\.mdx$/, "");

    // Normalize: gray-matter 会将 date 解析为 Date 对象，需要转回字符串
    const frontmatter: AlbumFrontmatter = {
      id: Number(data.id),
      artist: data.artist ? String(data.artist) : undefined,
      album: data.album ? String(data.album) : undefined,
      date: normalizeDate(data.date),
      genre: data.genre ? String(data.genre) : undefined,
    };

    return {
      slug,
      frontmatter,
      content,
    };
  });
}
