import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/share-metadata.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 } });
const { resolveSiteUrl, buildAlbumShareMetadata } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const album = { slug: "浮躁 test", name: "浮躁", artist: "王菲", year: 1996, genre: "Pop", reviewContent: "# 乐评\n\n**好听** <span>的专辑</span>" };
const image = { path: "/og/hash.png", width: 1200, height: 630, alt: "浮躁 — 王菲" };

test("requires an HTTPS origin in production and allows a local development default", () => {
  assert.equal(resolveSiteUrl(undefined, false).href, "http://localhost:3000/");
  assert.equal(resolveSiteUrl("https://music.dreamo.ink/", true).origin, "https://music.dreamo.ink");
  for (const value of [undefined, "not a url", "http://example.com", "https://user:pass@example.com", "https://example.com/path", "https://example.com/?key=value", "https://example.com/#fragment"]) {
    assert.throws(() => resolveSiteUrl(value, true), /SITE_URL/);
  }
});

test("uses one absolute image for OG and Twitter, encodes slugs and retains full text", () => {
  const result = buildAlbumShareMetadata(album, new URL("https://music.dreamo.ink"), image);
  assert.equal(result.title, "浮躁 — 王菲 | Album Wall");
  assert.equal(result.openGraph.type, "article");
  assert.equal(result.openGraph.siteName, "Album Wall");
  assert.equal(result.openGraph.url, "https://music.dreamo.ink/album/%E6%B5%AE%E8%BA%81%20test");
  assert.equal(result.alternates.canonical, result.openGraph.url);
  assert.equal(result.openGraph.images[0].url, "https://music.dreamo.ink/og/hash.png");
  assert.equal(result.openGraph.images[0].type, "image/png");
  assert.equal(result.twitter.images[0], result.openGraph.images[0].url);
  assert.equal(result.twitter.card, "summary_large_image");
  assert.match(result.description, /^Pop · 1996/);
  assert.doesNotMatch(result.description, /<|\*|#/);
});

test("omits absent genre and year without empty separators and rejects missing image entries", () => {
  const result = buildAlbumShareMetadata({ ...album, genre: undefined, year: 0, reviewContent: "" }, new URL("https://music.dreamo.ink"), image);
  assert.equal(result.description, "王菲 的专辑《浮躁》乐评");
  assert.throws(() => buildAlbumShareMetadata(album, new URL("https://music.dreamo.ink"), undefined), /share image|分享图/i);
});
