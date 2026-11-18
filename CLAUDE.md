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
- `src/data/catalog.ts` is generated verbatim from the prototype script; keep copy identical. The block
  marked "Added for the owner's training plan" (8 exercises) was written by hand; its photos were supplied by the owner. Exercise
  photos go in `assets/photos/` and the `PHOTOS` map in `src/data/photos.ts`.

## Product decisions (from the owner)
- Audience: very busy people (profile and plan in a few steps, everything clear at a glance) and
  gym beginners who need guidance. Prefer fewer steps and settings, plain words, a clear next step.
- First launch is empty (Welcome → onboarding), no demo profiles.
- Exercises without history start at 0 kg; later sessions start from the last working weight.
- No history → hide "Last time" lines and "Your numbers"; charts say "No workouts logged yet."
- Finishing with nothing logged asks to confirm, then closes without counting the day.
- PRs only count when the exercise already has history.
- Users build their own plan (added on request, not in the design): onboarding step 4 offers
  "Suggested plan" or "Build my own" (tap days → one empty routine per day → opens Training plan).
  Workouts a week always equal the days that have a routine (`workoutsPerWeek`); the stored
  `weekly` column is kept within its old 2–6 CHECK range and is never shown.
- Routines can be deleted (their days become rest days); exercises can be reordered, have a rep
  range (`reps`–`repsMax`, sessions start at the bottom) and their own rest (`rest`, else the
  profile setting).
- Profiles can be deleted from the bottom of Profile (added on request): a confirm that says the
  history goes too, then `repo.deleteProfile` clears every table for that profile and the app
  returns to the profile picker (Welcome when none is left).
- Approved by the owner after a review (not in the design): the screen stays on during a workout
  (`useScreenAwake`, re-requested on the web after the app comes back); two beeps and a vibration
  when a rest ends (`hooks/restSignal.ts`, audio unlocked by the Log set tap); routines without a
  design cover use their first exercise's photo; Progress → "All workouts" lists finished
  workouts (opens the summary with a Back button); Profile has Name, Weight step (1.25/2.5/5),
  Rest between sets and Workout buttons (right/left hand); Plank is `timed` (seconds, steps of 5);
  exercise hero photos are top-aligned.
- Design rules: the owner's `/Users/Matejdza/Desktop/Design edukacija/Pravila.txt` applies to all UI work
  (2 fonts, 60/30/10 colors, contrast ≥ 4.5:1, spacing 8/16/24/32/48/64/96, every control shows its
  states, no shadows / bento / three cards in a row). Finish design work with a self-check.
- Visual direction "Grafit i zlato" (2026-11-16): lighter graphite dark theme plus a light theme,
  switch in Profile (Auto / Light / Dark, stored in localStorage `liftlog-theme`, Auto follows the
  phone). Colors are CSS variables on the web (`src/theme/tokens.ts` ↔ `public/index.html`, kept equal
  by `tests/theme.test.ts`); photo sections stay dark via `DARK_SCOPE`. `accent` is for text/lines
  (darker gold in light mode), `accentFill` for the yellow fills, `onPlate` for text on colored plates.
  Only the main action is yellow; secondary buttons are outlined. Numbers use Archivo with tabular
  figures (Martian Mono was dropped to keep two fonts).
- Stepper numbers can be typed (`NumberField`: tap → empty field with the old value as hint; commas
  allowed; rest as 2:30 / 2.30 / 90 / 2 = minutes; invalid values show the range and are not saved).
- Progress starts with an overview (Week / Month / Year, workouts done of planned, sets, volume,
  time); the Workout tab is a week timeline; Training plan → "Import from text" builds a routine from
  pasted lines (`src/domain/importText.ts`, library names only, unknown lines listed and skipped).
- UX pass (2026-11-17): the app reopens in the profile used last (`src/state/lastProfile.ts`, localStorage
  `liftlog-profile`; "Switch profile" clears it); "Discard workout" (was "End workout") says nothing is
  saved; Finish with sets still open asks first; a finished day shows "Done for today. Next: …" and one
  quiet "View workout" button instead of a yellow one; list rows use a chevron, not a "View" pill;
  "Workout done" totals are one list card. Screen padding is 16; spacing follows 4/8/16/24/32; text is 14+
  (chart ticks and the routine pill captions stay 11).
- Approved 2026-11-17: set entry is buttons + typing only (Keypad and Scale removed; the
  `input_variant` column stays and is ignored); Height is no longer asked or shown (stored as 0 for new
  profiles); no "Home" title. Library and the Add-exercise picker have a search field
  (`searchExercises`). Logging 0 kg on a weighted exercise asks once per exercise. A finished workout
  can be deleted and has a note (summary screen; `workouts.note`, schema v2). Routine items are one
  line with Edit, one open at a time. Tab bar: icons in a pill + labels, active = ink pill
  (`src/components/TabBar.tsx`). Home also shows week totals, "Coming up" and "Last workout".
- Photos (2026-11-18): the home photo (`assets/photos/hero.jpg`, owner's photo of a man and a woman) is
  also on Welcome and the profile picker. Big photos go through `src/components/Hero.tsx`: dark theme =
  full-bleed photo with text over it; light theme = rounded photo card with the text below on the
  page (`useIsLight` in `src/theme/themePref.ts`), because all photos are dark gym shots.
- Don't invent screens or features; ask the owner first. Fixed sizes follow the 390 × 844 design and
  scale down on narrower phones via `useScale()` in `src/theme/layout.ts`.

## Layout
- `src/app/` routes (Expo Router), `src/screens/` larger screens, `src/components/` shared UI,
  `src/domain/` pure rules (tested in `tests/`), `src/data/` SQLite + catalog, `src/state/store.tsx` app state.
