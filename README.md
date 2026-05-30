# Album Wall

A personal album review blog.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** + Framer Motion
- **MDX** for reviews + `@mdx-js/mdx` runtime compilation
- **Netease Cloud Music API** for album metadata and cover art
- **Vercel** deployment

## Getting Started

```bash
npm install

# Set your Netease API server
echo 'NETEASE_API_BASE=http://your-server' > .env.local

# Clone content repo (optional — create content/ manually if preferred)
npm run content:clone

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Writing a Review

Create a file in `content/` named `{yyyy-mm-dd}-{slug}.mdx`:

```mdx
---
id: netease-album-id
artist: Artist Name (fallback if API fails)
album: Album Name  (fallback if API fails)
date: 2025-05-30
---

Your review here. Markdown and MDX are fully supported.
```

Rebuild and the page will be available at `/album/{slug}`.

## Deployment

1. Connect the repo to Vercel
2. Add environment variables:
   - `NETEASE_API_BASE` — Your Netease API server URL
   - `CONTENT_REPO_URL` — Content repo URL (optional, for decoupled content management)
3. Every push triggers automatic deployment

See `scripts/` for examples of setting up a separate content repo with auto-deploy hooks.

## Architecture

```
content/*.mdx  →  gray-matter  →  frontmatter + body
                                       │
                    Netease API  ←  album ID  →  cache/{id}.json
                         │
                    Album data  →  SSG pre-render  →  static pages
```

- **Homepage**: CSS column masonry, click to open modal (intercepting route)
- **Detail page**: left cover / right scrollable review on desktop, stacked on mobile
- **API caching**: file-based JSON cache with 7-day TTL

## Project Structure

```
src/
├── app/
│   ├── page.tsx                   # Home — masonry grid
│   ├── layout.tsx                 # Root layout
│   ├── album/[slug]/page.tsx      # Standalone detail page
│   └── @modal/(.)album/[slug]/    # Modal detail (intercepting route)
├── components/
│   ├── AlbumCard.tsx              # Cover card with hover effect
│   ├── AlbumGrid.tsx              # Responsive masonry container
│   ├── AlbumDetail.tsx            # Detail layout + metadata
│   ├── AlbumModal.tsx             # Modal wrapper with animation
│   └── ReviewContent.tsx          # MDX runtime renderer
├── lib/
│   ├── albums.ts                  # Data aggregation (MDX + API + cache)
│   ├── cache.ts                   # File cache read/write
│   ├── mdx.ts                     # MDX file parser
│   └── netease.ts                 # Netease API client
└── types/
    └── album.ts                   # Type definitions
```

## Special Thanks
[NeteaseCloudMusicApiEnhanced/api-enhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced)
