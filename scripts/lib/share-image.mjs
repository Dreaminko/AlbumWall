import { readFile } from "node:fs/promises";
import { createElement as h } from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const fonts = Promise.all([
  ["Geist", "Geist-Regular.ttf", 400],
  ["Geist", "Geist-Bold.ttf", 700],
  ["Noto Sans SC", "NotoSansSC-Regular.otf", 400],
].map(async ([name, file, weight]) => ({
  name, weight, style: "normal",
  data: await readFile(new URL(`../../assets/share-fonts/${file}`, import.meta.url)),
})));

export async function renderAlbumShareImage(album, coverData) {
  const details = [album.genre?.trim(), album.year > 0 && album.year, album.trackCount > 0 && `${album.trackCount} tracks`].filter(Boolean).join(" · ");
  const text = (value, style) => h("div", { style: { width: "100%", textAlign: "right", ...style } }, value);
  const tree = h("div", { style: {
    display: "flex", width: 1200, height: 630, background: "#fff",
    fontFamily: "Geist, Noto Sans SC", color: "#171717",
  } },
  coverData
    ? h("img", { src: Uint8Array.from(coverData).buffer, width: 630, height: 630, style: { objectFit: "cover", flexShrink: 0 } })
    : h("div", { style: { width: 630, height: 630, flexShrink: 0, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" } },
      h("svg", { width: 80, height: 80, viewBox: "0 0 24 24", fill: "none", stroke: "#9ca3af", strokeWidth: 1.5 },
        h("path", { d: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" }))),
  h("div", { style: {
    width: 570, height: 630, display: "flex", flexDirection: "column", justifyContent: "flex-end",
    padding: "44px 44px 44px 48px", boxSizing: "border-box",
  } },
  text(album.name, { fontSize: album.name.length > 48 ? 48 : 60, fontWeight: 700, lineHeight: 1.15, lineClamp: 3 }),
  text(album.artist, { fontSize: 36, lineHeight: 1.5, color: "#6b7280", marginTop: 16, lineClamp: 2 }),
  details && text(details, { fontSize: 24, lineHeight: 1.5, color: "#9ca3af", marginTop: 24, lineClamp: 2 })));

  const svg = await satori(tree, {
    width: 1200, height: 630, fonts: await fonts,
    loadAdditionalAsset: (_code, segment) => { throw new Error(`Missing font glyphs: ${segment}`); },
  });
  return new Resvg(svg).render().asPng();
}
