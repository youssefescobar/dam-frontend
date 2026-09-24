# Damic — Stage 1

The cinematic loader, logo transition, navigation reveal, and hero for Durrah Al
Munawwara Transportation.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Animation tuning

All loader, scroll, easing, smooth-scroll, and ambient timing values live in
`src/animations/config.ts`. The scroll choreography is implemented in
`src/animations/introTimeline.ts`.
