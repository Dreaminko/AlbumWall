import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Resvg } from "@resvg/resvg-js";
import { renderAlbumShareImage } from "./lib/share-image.mjs";
import { generateShareImages } from "./generate-share-images.mjs";

const album = { slug: "sample", name: "Imaginal Disk", artist: "Magdalena Bay", genre: "Indie Pop", year: 2024, trackCount: 15, coverUrl: "https://example.com/cover.png" };
const cover = (color) => new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="${color}"/></svg>`).render().asPng();

test("renders a deterministic 1200 × 630 PNG with cover or missing metadata", async () => {
  const image = await renderAlbumShareImage(album, cover("red"));
  assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
  const pixels = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><image href="data:image/png;base64,${image.toString("base64")}" width="1200" height="630"/></svg>`).render().pixels;
  let titleInk = 0;
  for (let y = 390; y < 450; y++) {
    for (let x = 680; x < 1156; x++) {
      if (pixels[(y * 1200 + x) * 4] < 100) titleInk++;
    }
  }
  assert.ok(titleInk > 100, "title stays in the lower-right information block with room for artist and details below");
  assert.deepEqual(image, await renderAlbumShareImage(album, cover("red")));
  const fallback = await renderAlbumShareImage({ ...album, genre: undefined, year: 0, trackCount: 0 }, null);
  assert.equal(fallback.readUInt32BE(16), 1200);
});

test("renders Chinese, Japanese and long titles, rejecting unsupported glyphs", async () => {
  for (const [name, artist] of [["浮躁", "王菲"], ["児童カルテ", "神聖かまってちゃん"], ["初音ミクシンフォニー 〜Miku Symphony 2019 オーケストラ ライブ", "東京フィルハーモニー交響楽団 / 初音ミク"], ["A Brief Inquiry Into Online Relationships", "The 1975"]]) {
    const image = await renderAlbumShareImage({ ...album, name, artist }, null);
    assert.equal(image.readUInt32BE(20), 630);
  }
  await assert.rejects(renderAlbumShareImage({ ...album, name: "🦄" }, null), /glyph|font|字形/i);
});

test("generates a complete manifest, deduplicates cover downloads and hashes rendered content", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "albumwall-share-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const outputDir = path.join(dir, "og");
  const manifestPath = path.join(dir, "images.json");
  let requests = 0;
  let color = "red";
  const fetchImpl = async () => {
    requests++;
    return new Response(cover(color), { headers: { "Content-Type": "image/png" } });
  };
  const options = { albums: [album, { ...album, slug: "second", name: "Second" }], outputDir, manifestPath, fetchImpl };
  await generateShareImages(options);
  assert.equal(requests, 1);
  const first = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.deepEqual(Object.keys(first).sort(), ["sample", "second"]);
  assert.match(first.sample.path, /^\/og\/[a-f0-9]{64}\.png$/);
  for (const image of Object.values(first)) {
    assert.equal(image.width, 1200);
    assert.equal(image.height, 630);
    await readFile(path.join(outputDir, path.basename(image.path)));
  }
  await writeFile(path.join(outputDir, "stale.png"), "old");
  color = "blue";
  await generateShareImages({ ...options, albums: [album] });
  const second = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.notEqual(first.sample.path, second.sample.path);
  assert.deepEqual(Object.keys(second), ["sample"]);
  assert.equal((await readdir(outputDir)).length, 1);
});

test("retries unavailable, invalid and timed-out covers then produces placeholder cards", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "albumwall-share-fallback-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const failure of [() => new Response("unavailable", { status: 503 }), () => new Response("not an image", { headers: { "Content-Type": "image/png" } }), () => new Response(Buffer.from("89504e470d0a1a0a", "hex")), () => new Response(Buffer.from("ffd8ff", "hex")), () => { throw new DOMException("Timed out", "TimeoutError"); }]) {
    let requests = 0;
    await generateShareImages({ albums: [album], outputDir: path.join(dir, "og"), manifestPath: path.join(dir, "images.json"), fetchImpl: async (_url, options) => {
      assert.ok(options.signal instanceof AbortSignal);
      requests++;
      return failure();
    } });
    assert.equal(requests, 2);
    const images = JSON.parse(await readFile(path.join(dir, "images.json"), "utf8"));
    assert.ok(images.sample.path);
  }
});
