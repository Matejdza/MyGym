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
  "Workout done" totals are one list card. Screen padding is 16; spacing follows 4/8/16/24/32; text follows the type scale below.
- Approved 2026-11-17: set entry is buttons + typing only (Keypad and Scale removed; the
  `input_variant` column stays and is ignored); Height is no longer asked or shown (stored as 0 for new
  profiles); no "Home" title. Library and the Add-exercise picker have a search field
  (`searchExercises`). Logging 0 kg on a weighted exercise asks once per exercise. A finished workout
  has a note (summary screen; `workouts.note`, schema v2) and can be deleted only when opened from All workouts
  (not on "Workout done" right after finishing, owner 2026-11-20). Routine items are one
  line with Edit, one open at a time. Tab bar: icons in a pill + labels, active = ink pill
  (`src/components/TabBar.tsx`). Home also shows week totals, "Coming up" and "Last workout".
- Photos (2026-11-18): the home photo (`assets/photos/hero.jpg`, owner's photo of a man and a woman) is
  also on Welcome and the profile picker. Big photos go through `src/components/Hero.tsx`: dark theme =
  full-bleed photo with text over it; light theme = rounded photo card (title and meta on the card's bottom over a blurred strip via the `caption` prop on every hero screen; buttons below) with the text below on the
  page (`useIsLight` in `src/theme/themePref.ts`), because all photos are dark gym shots.
- 2026-11-19 (owner's choices): light theme is "Kobalt" (cobalt #2457D6 fills, white text on them,
  cool near-white page); photos in light mode are a little lighter with a faint warm tone (2026-11-20, was blue) by CSS on `[data-photo]`
  in public/index.html. Home shows a body map (`src/components/BodyMap.tsx`, muscles per exercise in
  `src/domain/muscles.ts`; worked muscles in red `#E0353B` in both themes, owner's choice) with today's muscles pulsing, or the next workout's on a rest day.
  Motion is moderate (`src/components/Motion.tsx`: Appear, Pop, Pressy, useCountUp, Fill). Do not use
  Reanimated "entering" presets on the web: they leave elements absolutely positioned.
- 2026-11-19 (owner): strength group tiles in the library and the group pages show a close-up of the body
  part (`BodyZoom` in `BodyMap.tsx`) with its muscles in red instead of photos; Cardio (heart, lungs, legs), Functional (every muscle)
  and Warm-up & stretching (joints) use `BodyBadge` the same way. Light theme is a light gray (`bg #E8EAEE`), and has no yellow text anywhere: inside
  dark photo strips `--c-accent` becomes light cobalt `#A9C0FF` (public/index.html).
- Home "Your goal" card (owner, 2026-11-20) replaces the body weight card: current weight on top, a bar
  from the first weigh-in (left label) to the target (right label, no "Goal" word), "x kg to go" riding on the
  moving dot (counts up) (`src/components/GoalCard.tsx`, `domain/goal.ts`),
  the last weigh-in date (asks for a new one after 7 days) and "Weigh in" with a stepper right on the card.
  Weight changes on Profile are saved as today's weigh-in too (`saveBodyWeight`).
- Review fixes (owner, 2026-11-20): "workouts done" counts days with a workout everywhere (Home and Progress);
  days before the profile was made are neither planned nor "Missed" (`firstPlanDay`, `plannedFrom` in
  domain/week.ts, `plannedWorkouts(…, since)`). On the web, confirms open the app's own dialog
  (`ConfirmHost` in the root layout, `confirm(title, label, message, danger)`), not the browser popup.
  Every routine plate is one neutral shade (`plate()`); planned days a neutral ring. Week strips (Home, Progress)
  show the day's initial on top (`DAY_INITIALS`) and the date in the circle; done days are green with a check
  (also the Workout timeline).
- Type scale (owner, 2026-11-20): 56 display / 40 / 32 / 24 / 20 / 16 / 14 with line heights 56/40/40/32/28/24/20
  (`TYPE`, `TYPE_LINE` in tokens.ts; Txt components use the scale's line height unless `lh` is set). Only
  exceptions: big typed numbers (Mono ≥ 66) and chart ticks (LineChart). `tests/typescale.test.ts` guards it.
- Onboarding keeps its answers in a module-level draft (`draft` in onboarding.tsx) so a language change
  (which remounts the screens) loses nothing; cleared when the profile is made or onboarding is left.
  Changing sex only re-suggests the focus until the user picks one. On the web the remount keeps the open
  screen, so it is not pushed again (no stale copy underneath).
- Language (2026-11-19): English (default) or Serbian in Latin script, chosen per profile in
  onboarding step 1 and in Profile → Settings → Language (`settings.language`, schema v3). Texts are
  written in English and wrapped in `t()` from `src/i18n`; Serbian is in `src/i18n/sr.ts` and
  `src/i18n/exercises.sr.ts` (tests/i18n.test.ts fails on a missing translation). A language change
  remounts the screens (key on the root Stack) and reopens the screen that was open. Routine names
  the user already saved are their own text and are not translated. No pulse on the tab bar.
- Exercise library (2026-11-19): 104 exercises = the original 34 + 70 from the owner's list of 103
  (`src/data/catalog.more.ts`: texts, `ORDER` = the owner's order, `SECTIONS` = sub-headings in Arms and
  Legs). New group `functional` (wide card in the library, home photo as cover). Exercises without
  photos show a body figure (`ExerciseThumb`). Every exercise page opens with a body map of its muscles instead
  of a hero photo (owner's choice); the photos sit below (two side by side, or start + mid-rep with the end below); the owner will
  send photos later → add them to `PHOTOS` in `src/data/photos.ts`. Serbian names follow the owner's list.
- Plan builder (2026-11-19): onboarding = about you (incl. sex, language) → "Make my plan" or "Build my own"
  → body; own plan then only picks days (4 steps); a made plan continues (8 steps): main +
  optional second goal (a closed "+ Add a second goal" row), focus, experience + equipment, week:
  strength/cardio days and minutes, plan preview. The focus is suggested from sex, then the main goal
  (`suggestFocus`: fat loss / fitness → whole body; strength → legs, back (+ chest for men); tone → glutes, legs,
  core / chest, arms, core; muscle → glutes + legs / chest, back, arms) and is the user's once they change it. `src/domain/generate.ts` builds the plan (tested in
  tests/generate.test.ts); answers are stored as `profiles.setup` (JSON, schema v4).
- Every workout has a warm-up (1–3 moves) and stretching (2–4) as timed lists (`src/domain/mobility.ts`
  picks them from the routine's muscles unless the routine has its own, `routines.extra` JSON); the
  live flow is warm-up → exercises → stretching (`screens/MobilityLog.tsx`, `domain/mobilitySession.ts`),
  none of it logged. 22 warm-up / stretching moves live in the `mobility` group.
- Onboarding details (2026-11-19): target weight sits with the current weight (body step); "Where do
  you train?" is its own step; workout length is Short (≤45) / About an hour / Long (>1 h) → `Setup.minutes`
  45 | 60 | 90. Profile color (10 quick picks + "Any color": hue strip and 5 tones, all readable with dark text, `src/theme/profileColor.ts`) and picture (letter, 8 flat avatars, 17 icons), each behind a row that opens a card over a blurred, dimmed screen with a preview; only Done saves, close or tapping outside discards (`AvatarPicker`); the picture is the letter, an avatar or a sport icon (`ProfileIcon.tsx`,
  no emoji per the design rules), stored in `profiles.avatar` (schema v5), changeable on Profile.
- Don't invent screens or features; ask the owner first. Fixed sizes follow the 390 × 844 design and
  scale down on narrower phones via `useScale()` in `src/theme/layout.ts`.

## Layout
- `src/app/` routes (Expo Router), `src/screens/` larger screens, `src/components/` shared UI,
  `src/domain/` pure rules (tested in `tests/`), `src/data/` SQLite + catalog, `src/state/store.tsx` app state.
