@AGENTS.md

# LiftLog

Personal workout tracker, rebuilt from the design handoff in `design/` (read `design/README.md`
and the `<script data-dc-script>` block of `design/LiftLog.dc.html` before changing screens).
The owner uses it day to day as a web app: https://matejdza.github.io/MyGym/ (added to the phone's
home screen). The owner writes in Serbian; answer in Serbian.

## How it ships
- Every push to `main` runs `.github/workflows/deploy.yml`: typecheck, tests, `expo export -p web`,
  publish to GitHub Pages. Never break `main`: run `npm run typecheck`, `npm test` and `npx expo lint` first.
- `app.json` → `experiments.baseUrl` is `/MyGym` (the repo name). `public/index.html` and
  `public/manifest.json` hard-code that path too; change all three together.
- Nothing is kept on the owner's Mac. Work happens in cloud sessions on this repo.

## Data
- Everything is stored on the phone (expo-sqlite; on the web it lives in the browser's storage).
  There is no backend and no export/import (the owner declined it). History must never be lost:
  schema changes go through `migrate()` in `src/data/db.ts` with a new `user_version`, never by
  dropping tables.
- `src/data/catalog.ts` is generated verbatim from the prototype script; keep copy identical.

## Product decisions (from the owner)
- First launch is empty (Welcome → onboarding), no demo profiles.
- Exercises without history start at 0 kg; later sessions start from the last working weight.
- No history → hide "Last time" lines and "Your numbers"; charts say "No workouts logged yet."
- Finishing with nothing logged asks to confirm, then closes without counting the day.
- PRs only count when the exercise already has history.
- Don't invent screens or features; ask the owner first. Fixed sizes follow the 390 × 844 design and
  scale down on narrower phones via `useScale()` in `src/theme/layout.ts`.

## Layout
- `src/app/` routes (Expo Router), `src/screens/` larger screens, `src/components/` shared UI,
  `src/domain/` pure rules (tested in `tests/`), `src/data/` SQLite + catalog, `src/state/store.tsx` app state.
