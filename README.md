# Dramatic Numbers Viz

Interactive static SvelteKit data story comparing Elon Musk's 2024 wealth growth with median American earnings.

## Stack

- SvelteKit with `@sveltejs/adapter-static`
- D3 for SVG visual layouts and scale logic
- GSAP for scene transitions and counters
- Vitest for derived-number checks

## Commands

```bash
npm install
npm run dev
npm test
npm run check
npm run build
npm run preview
```

The production build is written to `build/` and is suitable for Vercel static publishing.

## Sources

The story constants live in `src/lib/storyData.ts`.

- Fortune, citing Bloomberg Billionaires Index, for Musk's 2024 wealth gain.
- BLS archived Q4 2024 weekly earnings release for the `$1,192` median weekly earnings figure.
