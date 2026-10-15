# Build-time share-image fonts

- Geist Regular / Bold: https://github.com/vercel/geist-font/tree/main/fonts/Geist/ttf
- Noto Sans SC Regular (official CJK subset, including kana and common Japanese characters): https://github.com/notofonts/noto-cjk/tree/main/Sans/SubsetOTF/SC

Original font binaries are stored locally for offline, deterministic builds. See the accompanying OFL licenses. Satori uses Geist for Latin text and Noto Sans SC for supported CJK characters; unsupported glyphs fail the build rather than silently rendering empty boxes. These fonts are only read by the build script, not served to website visitors or bundled into the Worker.
