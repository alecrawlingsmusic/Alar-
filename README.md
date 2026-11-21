# Alar · Curtain Lab

**Alpha 0.1**: an early, mobile-friendly, music-first stage show designer.

## Start

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

To build: `npm run build`. Deploy the repository on Vercel with the **Vite** preset and `dist` output.

## Rooms

- **Mel**: continuous show thread, songs, talking, segues, lighting cue blocks, transport, timeline zoom and block inspector.
- **Newt**: MusicXML metadata import and timeline segment attachment. First-page rendering is experimental and needs internet access.
- **Lumen**: lighting look drafts.
- **Stage**: stage-position planner.
- **Archive**: browser-local project persistence and JSON import/export.

## Current limitations

This is a fresh modular foundation based on the established Alar concepts, **not a complete port** of the earlier 2.3 MB v18 integrated prototype. The earlier artwork and advanced interactions are not yet carried over. This alpha is not production-ready. There is no cloud sync, authentication, AI arranging, playable virtual band, full score editor, working click-track engine or offline service worker. The Newt renderer uses an external CDN and must be hardened and bundled before offline release.

The repository is public. Never commit private scores, credentials or client data.
