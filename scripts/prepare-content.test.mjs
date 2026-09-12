import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";

const run = promisify(execFile);
const script = path.resolve("scripts/prepare-content.mjs");
const review = "---\nid: 123\nalbum: Fallback\ndate: 2026-09-12\n---\n# Review\n\n**Great** record. <span>JSX works</span>\n";

test("content preparation", async (t) => {
  let requests = 0;
  let status = 200;
  const server = createServer((request, response) => {
    requests++;
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ album: { id: 123, name: "Test Album", picUrl: "https://example.com/cover.jpg", artist: { name: "Test Artist" }, publishTime: 0, size: 8 } }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const env = { ...process.env, NODE_ENV: "production", CONTENT_REPO_URL: "", NETEASE_API_BASE: `http://127.0.0.1:${server.address().port}` };

  async function fixture(files) {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "albumwall-test-"));
    t.after(() => rm(cwd, { recursive: true, force: true }));
    await mkdir(path.join(cwd, "content"));
    for (const [name, value] of Object.entries(files)) await writeFile(path.join(cwd, "content", name), value);
    return cwd;
  }

  await t.test("bundles MDX and fetches repeated album IDs only once", async () => {
    requests = 0;
    const cwd = await fixture({ "2026-09-12-first.mdx": review, "2026-09-11-second.mdx": review.replace("date: 2026-09-12", "date: 2026-09-11") });
    await run(process.execPath, [script], { cwd, env });
    const albums = JSON.parse(await readFile(path.join(cwd, "src/generated/albums.json"), "utf8"));
    assert.deepEqual(albums.map((album) => album.slug), ["first", "second"]);
    assert.equal(albums[0].name, "Test Album");
    assert.equal(requests, 1);
    const compiled = await readFile(path.join(cwd, "src/generated/review-0.js"), "utf8");
    assert.match(compiled, /react\/jsx-runtime/);
    assert.doesNotMatch(compiled, /new Function|evaluate\(/);
  });

  await t.test("rejects an empty content directory", async () => {
    const cwd = await fixture({});
    await assert.rejects(run(process.execPath, [script], { cwd, env }), /No MDX reviews/);
  });

  await t.test("rejects duplicate slugs", async () => {
    const cwd = await fixture({ "2026-09-12-same.mdx": review, "2026-09-11-same.mdx": review });
    await assert.rejects(run(process.execPath, [script], { cwd, env }), /duplicate slug/);
  });

  await t.test("retries API failures once and stops the build", async () => {
    const cwd = await fixture({ "test.mdx": review });
    requests = 0;
    status = 503;
    try {
      await assert.rejects(run(process.execPath, [script], { cwd, env }), /Failed to fetch album 123/);
      assert.equal(requests, 2);
    } finally {
      status = 200;
    }
  });

  await t.test("rejects malformed MDX instead of publishing raw text", async () => {
    const cwd = await fixture({ "test.mdx": review + "\n<Unclosed>" });
    await assert.rejects(run(process.execPath, [script], { cwd, env }), /Expected a closing tag/);
  });

  await t.test("requires API configuration in production", async () => {
    const cwd = await fixture({ "test.mdx": review });
    await assert.rejects(run(process.execPath, [script], { cwd, env: { ...env, NETEASE_API_BASE: "" } }), /NETEASE_API_BASE is required/);
  });
});
