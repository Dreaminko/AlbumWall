# Album Wall

A personal album review blog built with Next.js 16, Tailwind CSS and Framer Motion, deployed to Cloudflare Workers with OpenNext.

## Local development

Use Node.js 22 or later:

```bash
npm ci
# Create .env.local with the values below, or provide content/ manually.
npm run dev
```

```dotenv
NETEASE_API_BASE=https://your-netease-api-server
SITE_URL=https://music.dreamo.ink
CONTENT_REPO_URL=https://github.com/you/your-content-repo.git
CONTENT_REPO_BRANCH=main
```

`CONTENT_REPO_URL` is optional when maintaining `content/` locally. Private repositories require Git credentials in the build environment; do not put tokens in the repository URL.

Development and production builds prepare content automatically. After editing a local review, run `npm run content:prepare` or restart the dev server. Without `NETEASE_API_BASE`, local development uses frontmatter metadata without cover art.

## Writing reviews

Create `content/{yyyy-mm-dd}-{slug}.mdx`:

```mdx
---
id: 123456
artist: Artist Name
album: Album Name
date: 2026-09-12
genre: Jazz
---

Your **review** here. Markdown and inline JSX are supported.
```

Use a unique slug, a positive Netease album ID and a valid date. Reviews are compiled into React modules at build time. Relative imports must resolve from the generated modules in `src/generated/`; prefer self-contained reviews. Invalid MDX fails the build instead of publishing raw source.

## Cloudflare Workers

This project uses OpenNext to preserve the existing Next.js build and parallel/intercepting routes. It uses static assets for prerendered page caching; no R2, KV or database is required. Images are loaded directly from their source.

1. Connect this application repository to **Workers Builds**.
2. Set `name` in `wrangler.jsonc` to your existing Worker name (default: `albumwall`).
3. Use the repository root as the build directory and Node.js 22 or later.
4. Set build command to `npm run build:worker`, deploy command to `npx opennextjs-cloudflare deploy`.
5. For non-production branches, use `npx opennextjs-cloudflare upload` as the deploy command to create preview versions.
6. Add `NETEASE_API_BASE`, `CONTENT_REPO_URL`, `SITE_URL=https://music.dreamo.ink` and optionally `CONTENT_REPO_BRANCH` under **Build variables and secrets**. They are consumed during the build, not Worker requests. Install dev dependencies in the build environment; share-image rendering uses them.

Production builds require working album metadata and at least one review. Missing content or failed API requests stop deployment, preserving the previous version. API requests have a 15-second timeout and one retry. Each unique album is fetched once per build; rebuilding refreshes its metadata.

For local Workers verification and manual deployment:

```bash
npm run preview  # builds, then runs in the Workers runtime
npm run deploy   # builds, then deploys (Cloudflare authentication required)
```

`npm run build` creates the regular Next.js output; `npm run build:worker` also packages it for Workers. Both include content preparation. The generated `src/generated/`, `.next/`, and `.open-next/` directories are not committed.

### Content repository auto-deployment

Create a Deploy Hook in the Worker's Builds settings, targeting the application's production branch. Save the URL as `CLOUDFLARE_DEPLOY_HOOK` in the **content repository's** Actions secrets, then copy `scripts/trigger-deploy.yml.example` to that repository's `.github/workflows/trigger-deploy.yml`. Replace the old Vercel workflow there.

Content changes trigger a fresh build and deployment. There is no runtime ISR or seven-day filesystem cache. New slugs become available after deployment; unknown slugs return 404.

Before changing the production domain, verify the homepage, direct detail links, modal navigation, refresh/back/forward, unknown slugs and a content-triggered rebuild using the Worker preview.

## Architecture

```text
content/*.mdx + Netease API
        ↓ build time
src/generated/ (album data + compiled React reviews)
        ↓ Next.js + OpenNext
Cloudflare Worker + static assets
```

The Worker renders from bundled modules and never reads a content directory, writes a disk cache or evaluates MDX strings at request time.

## Share previews

`npm run content:prepare` prepares reviews, then generates a 1200 × 630 PNG for each article in `public/og/` and a manifest in `src/generated/share-images.json`. Both are generated locally and during builds, and are not committed. The Worker serves the images as static assets; it does not render them or fetch cover art at request time.

The design follows the article view: complete square cover on the left, right-aligned album name, artist and genre/year/track count at the bottom right. Fonts and their licenses live in `assets/share-fonts/`; rendering never downloads fonts. Unsupported glyphs stop the build with a diagnostic. Missing or unavailable PNG/JPEG covers use a placeholder after one retry, and missing genre is omitted.

Production requires an HTTPS origin in `SITE_URL`. Use `https://music.dreamo.ink` for production, or the public origin of a preview deployment when testing one. Development defaults to `http://localhost:3000` when unset. Article OG/Twitter images use the same absolute URL, and image filenames hash their PNG content so changed cards get new URLs.

To check a deployment, fetch an article with `Discordbot` and `TelegramBot` user agents, inspect the OG tags in the initial HTML head, and verify its image URL returns a PNG. Then share the article in Telegram and Discord with previews enabled. Platform layout and caching can differ; a changed image URL does not force old messages to refresh. Older image hashes are not retained across deployments.

## Special thanks

[NeteaseCloudMusicApiEnhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced)
