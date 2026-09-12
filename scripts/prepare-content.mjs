import fs from "node:fs/promises";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import matter from "gray-matter";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
await import("./fetch-content.mjs");

const contentDir = path.resolve("content");
const outputDir = path.resolve("src/generated");
const filenames = (await fs.readdir(contentDir)).filter((name) => name.endsWith(".mdx")).sort();
if (!filenames.length) throw new Error("No MDX reviews found in content/. Refusing to build an empty site.");

const albums = [];
const imports = [];
const reviews = [];
const slugs = new Set();
const metadata = new Map();
await fs.mkdir(outputDir, { recursive: true });

for (const [index, filename] of filenames.entries()) {
  const { data, content } = matter(await fs.readFile(path.join(contentDir, filename), "utf8"));
  const slug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.mdx$/, "");
  const id = Number(data.id);
  const date = new Date(data.date);
  if (!slug || slugs.has(slug) || !Number.isSafeInteger(id) || id <= 0 || Number.isNaN(date.getTime())) {
    throw new Error(`Invalid id, date, or duplicate slug in ${filename}`);
  }
  slugs.add(slug);
  if (!metadata.has(id)) metadata.set(id, await fetchAlbum(id));
  const album = metadata.get(id);
  albums.push({
    slug,
    neteaseId: id,
    name: album?.name ?? String(data.album ?? "Unknown Album"),
    artist: album?.artist?.name ?? String(data.artist ?? "Unknown Artist"),
    coverUrl: album?.picUrl ?? "",
    year: album ? new Date(album.publishTime).getFullYear() : date.getFullYear(),
    trackCount: album?.size ?? 0,
    date: date.toISOString().slice(0, 10),
    ...(data.genre ? { genre: String(data.genre) } : {}),
    reviewContent: content,
  });
  const moduleName = `review-${index}.js`;
  const compiled = await compile({ value: content, path: path.join(contentDir, filename) }, { development: false });
  await fs.writeFile(path.join(outputDir, moduleName), String(compiled));
  imports.push(`import Review${index} from ${JSON.stringify(`./${moduleName}`)};`);
  reviews.push(`${JSON.stringify(slug)}: Review${index}`);
}

albums.sort((a, b) => b.date.localeCompare(a.date));
await fs.writeFile(path.join(outputDir, "albums.json"), JSON.stringify(albums, null, 2));
await fs.writeFile(path.join(outputDir, "reviews.ts"), [
  'import type { ComponentType } from "react";',
  ...imports,
  `export const reviews: Record<string, ComponentType> = {${reviews.join(",\n")}};`,
].join("\n"));
console.log(`Prepared ${albums.length} album reviews.`);

async function fetchAlbum(id) {
  if (!process.env.NETEASE_API_BASE) {
    if (process.env.NODE_ENV === "production") throw new Error("NETEASE_API_BASE is required for production builds.");
    console.warn(`No NETEASE_API_BASE; using frontmatter for album ${id}.`);
    return null;
  }
  const url = new URL("/album", process.env.NETEASE_API_BASE);
  url.searchParams.set("id", String(id));
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const album = json.album ?? json;
      if (!album.id || !album.name || !album.picUrl || !Number.isFinite(album.publishTime)) {
        throw new Error("Invalid album metadata");
      }
      return album;
    } catch (error) {
      if (attempt === 1) throw new Error(`Failed to fetch album ${id}`, { cause: error });
    }
  }
}
