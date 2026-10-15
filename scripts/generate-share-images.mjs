import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { renderAlbumShareImage } from "./lib/share-image.mjs";

async function fetchCover(url, fetchImpl) {
  if (!url) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = Buffer.from(await response.arrayBuffer());
      const png = data.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
      const jpeg = data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
      if ((!png && !jpeg) || data.length > 10 * 1024 * 1024) throw new Error("Invalid or oversized PNG/JPEG cover");
      return await sharp(data).resize(630, 630, { fit: "cover" }).png().toBuffer();
    } catch (error) {
      if (attempt === 1) console.warn(`Share image: using placeholder for ${url}: ${error.message}`);
    }
  }
  return null;
}

export async function generateShareImages({ albums, outputDir, manifestPath, fetchImpl = fetch }) {
  const images = {};
  const covers = new Map();
  // This directory is owned exclusively by this generator.
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  for (const { coverUrl } of albums) {
    if (!covers.has(coverUrl)) covers.set(coverUrl, fetchCover(coverUrl, fetchImpl));
  }
  for (const album of albums) {
    const png = await renderAlbumShareImage(album, await covers.get(album.coverUrl));
    if (png.length > 5 * 1024 * 1024) throw new Error(`Share image exceeds 5 MB: ${album.slug}`);
    if (png.length > 1024 * 1024) console.warn(`Share image exceeds 1 MB target: ${album.slug}`);
    const filename = `${createHash("sha256").update(png).digest("hex")}.png`;
    await writeFile(path.join(outputDir, filename), png);
    images[album.slug] = { path: `/og/${filename}`, width: 1200, height: 630, alt: `${album.name} — ${album.artist}` };
  }
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(images, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const albums = JSON.parse(await readFile("src/generated/albums.json", "utf8"));
  await generateShareImages({ albums, outputDir: "public/og", manifestPath: "src/generated/share-images.json" });
  console.log(`Prepared ${albums.length} share images.`);
}
