# Handoff: LiftLog, a mobile workout tracker

## Overview
LiftLog is a phone app for tracking gym training. Several people can share one phone, and each one has a local profile. Each profile holds a weekly plan of routines. A routine is either strength (sets × reps × kg) or cardio (minutes, distance, heart-rate zone). The app covers onboarding, today's workout, live logging with a rest timer, a summary after each workout, an exercise library with photos and how-to steps, progress charts for lifts, cardio and body weight, and editors for the profile, plan and routines.

## About the design files
The files in this bundle are **design references built in HTML**. They are prototypes that show the intended look and behavior. They are not production code to copy. Your job is to **rebuild these designs in the target codebase** with its own patterns and libraries. If there is no codebase yet, pick a suitable stack. The recommended default is **React Native + Expo** (TypeScript), with on-device storage (SQLite or MMKV/AsyncStorage), because the app is phone-first and the profile picker states that profiles are stored only on the phone.

`LiftLog.dc.html` is one self-contained interactive prototype. Open it in a browser and click through it. All logic lives in the `<script data-dc-script>` block at the bottom (`class Component`). Read that block for exact data, copy and rules. `LiftLog Overview.dc.html` lays every screen out side by side. It uses the `screen` prop to put each phone into a specific state. `support.js` and `image-slot.js` are prototype runtime only, so do not port them.

## Fidelity
**High fidelity.** Colors, type, spacing, radii, copy and interactions are final. Rebuild them pixel-accurately. The design frame is an iPhone at **390 × 844 pt** (status bar 50 pt, home indicator 28 pt, tab bar 58 pt).

## Design tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| bg | `#0d0d0c` | App background |
| surface | `#181817` | Cards, rows, back buttons |
| surface2 | `#232321` | Inner controls, minus buttons, inactive segments |
| ink | `#f2f0ea` | Primary text, "+" buttons, secondary CTA fill |
| muted | `#9c9890` | Secondary text |
| line | `rgba(242,240,234,.13)` | Hairlines, dashed borders |
| accent | `#ffc531` | Primary CTA, active states, progress, links |
| accent-ink | `#0d0d0c` | Text on accent |
| press | `#e6ad1c` | Pressed primary CTA |
| red | `#ff5a3c` | Destructive confirm ("Tap again to end") |
| green | `#3ddc84` | Positive deltas, goal line on the chart |
| placeholder | `#6b6863` | Input placeholder |

**Routine plates.** Each routine key (A, B, C…) gets a color from `PLATES[(charCode-65) % 8]`: `#ff5a3c #3ddc84 #ffc531 #e9e6df #ff9f43 #b8e04a #ff7aa8 #c7c2b8`. Text on a plate is always `#0d0d0c`. Profile colors use the first 5 plates.

**Heart-rate zones 1–5:** `#c7c2b8 #3ddc84 #ffc531 #ff9f43 #ff5a3c`. Zone copy: 1 "Recovery, very easy", 2 "Easy, you can hold a conversation", 3 "Steady, short sentences only", 4 "Hard, a few words at a time", 5 "All out".

### Typography (Google Fonts)
- **Big Shoulders Display** 800/900, always UPPERCASE. Used for display headings and CTA labels.
  - Hero titles: 52–70 px, line-height .88–.92.
  - Section titles ("This week", "History"): 28 px / 800.
  - Card titles: 25–30 px / 800–900.
  - CTA labels: 26 px / 900, letter-spacing .02em.
  - Wordmark "LIFTLOG": 18–22 px / 900, letter-spacing .14em, accent color.
- **Archivo** 400–700. Used for all UI text: body 15–17 px, captions 13–14 px, labels 600, buttons 600–700.
- **Martian Mono** 400/500. Used for every number: weights, reps, timers, counts and chart labels.
  - Large values: 34–60 px, letter-spacing −0.05 to −0.06em.
  - Chart labels: 11 px.

### Radii and sizes
- Fully rounded pills everywhere (radius = height / 2).
- Primary CTA: 64 h / radius 32. The log CTA is 66 h / radius 33.
- Cards: radius 22–24. List rows and inputs: radius 20. Set rows: 48 h / radius 14.
- Thumbnails: 44–72 px square, radius 11–15.
- Stepper buttons: 74 px circles on the log screen, 52–58 px elsewhere.
  - Minus buttons use the surface2 fill.
  - Plus buttons use the ink fill with bg-colored text.
- Bottom sheet on the log screen: surface fill, top radius 28.
- Active outline: `inset 0 0 0 2px accent`. Inactive or empty outline: `inset 0 0 0 1px line`.
- No drop shadows inside the app.

### Spacing
- Screen side padding: 16–20 px.
- Content starts at 58–74 px from the top, below the status bar.
- Gaps follow a 4/6/8/10/12/14/18/22/28/34 rhythm.
- Lists are separated with 8 px gaps or 1 px `line` dividers.

### Photo heroes
Hero images run full-bleed at the top, 250–500 px tall. Each has a vertical dark gradient overlay: `rgba(13,13,12,.7)` at 0%, transparent from about 25–45%, then solid `#0d0d0c` at about 90–97%. The title sits on the dark bottom part of the image. The Back pill floats at top 54, left 16, with a `rgba(13,13,12,.72)` fill.

## Screens
The `screen` values in brackets can be passed to the prototype to open each state.

1. **Welcome** (`welcome`). Full-screen photo, the "LIFTLOG" wordmark, the headline "Every set counts.", a subline, a "CREATE PROFILE" primary button and an "I already have a profile" text link.
2. **Profile picker** (`profiles`). Headline "Who's lifting today?". 2-column grid of 132 px circular avatars showing the initial on the profile color, plus a dashed "Add profile" tile. Footer: "Profiles are stored only on this phone."
3. **Onboarding, 4 steps** (`onboard1–4`). Header with a back button, 4 progress segments and a "1/4" counter.
   - Step 1: name input (44 px display font, accent underline), 5 color swatches and a live avatar preview.
   - Step 2: height and weight steppers.
   - Step 3: three goal cards (Build muscle / Get stronger / Lose fat) and a target weight stepper.
   - Step 4: workouts per week (2–6) and a preview of the generated 7-day schedule.
   - The primary button is disabled (opacity .35) until a name is entered.
4. **Home** (`home`). 500 px hero showing today's routine name, its meta line, "START WORKOUT" / "CONTINUE" / "DONE TODAY" and a "Details" pill.
   - On a rest day, the hero says "Rest day" with the next workout and a "PICK A WORKOUT" button.
   - "This week" strip of 7 day-circles.
     - Filled with the plate color when that day is done.
     - Ringed in the plate color when planned.
     - Today gets an accent ring.
   - "Recent records": horizontal cards, 156 px wide with a 112 px photo. Hidden for brand-new profiles.
   - "Body weight" card with a sparkline.
5. **Workout** (`workout`, tab). The 7 days of the week as cards: 72 px cover with a plate badge, day/date, routine name, meta and a status pill (Done / Today / In progress / Missed / Upcoming). Rest days are dashed 48 px rows.
6. **Day detail** (`day`, `dayA/B/C`, `dayCardio`). 330 px cover hero and the exercise list (thumbnail, name, "Last time …", scheme "4 × 6" or "20 min"). Below the list: an "Edit this routine" link. The sticky CTA reads START WORKOUT / CONTINUE WORKOUT / LOG AGAIN.
7. **Strength log** (`log`).
   - Top bar: Back, elapsed timer, Finish.
   - Exercise switcher: prev / next arrows, thumbnail, "Exercise n of N" and the name.
   - Per-exercise progress segments and a "Last time" line.
   - Set rows ("110 kg × 6", status Now / Done / PR). "Add set" and "End workout" (tap twice to confirm, red, resets after 3 s).
   - Bottom sheet: rest bar (countdown, "+30 s", "Skip", progress line), the input control, and the CTA "LOG SET n" → "NEXT EXERCISE" → "FINISH WORKOUT".
   - **Three input variants** (user setting):
     - Stepper: weight ± step, reps ± 1.
     - Keypad: two fields plus a 3×4 numpad.
     - Scale: two horizontal drag rulers with an accent center line.
   - Handedness "left" mirrors the stepper rows.
8. **Cardio log** (`logCardio`). Same header. Activity timer card:
   - 58 px mono timer "/ 20:00" target, zone pill, progress bar, zone description.
   - Start / Pause / Resume and Reset buttons. The timer turns green once the target is reached.
   - Activity rows. Bottom sheet with minutes and distance/floors steppers. CTA "LOG ACTIVITY" → "NEXT ACTIVITY" → "FINISH WORKOUT".
9. **Workout done** (`summary`, `summaryCardio`).
   - 300 px hero with `images/workout-done.png`, the routine name in accent and the headline "WORKOUT DONE".
   - 3 stat tiles: Time / Sets / Volume for strength, Time / Distance / Activities for cardio.
   - List of "New records" (accent pills) or "Activities". Button "BACK TO HOME" (ink fill).
10. **Exercises library** (`library`, tab). 2-column muscle-group tiles, 168 h, photo with a bottom gradient. Below them, a full-width 150 h Cardio card ("Conditioning" / "CARDIO" / "5 activities") with a left-to-right gradient. In "Add exercise" mode the title changes and a "‹ Routine X" back pill appears.
11. **Group** (`group`, `groupCardio`). 250 px hero and the exercise list with a "View" pill, or a yellow "Add" pill in pick mode.
12. **Exercise detail** (`exercise`, `exerciseCardio`).
    - 340 px hero with "Group, Equipment" in accent and the name.
    - 2 or 3 position photos with captions.
    - Description, numbered "How to do it" steps, "Your numbers" rows and a "View progress" button.
13. **Progress** (`progress`, `body`, `progressCardio`, tab).
    - Segmented control: Lifts / Cardio / Body weight.
    - Lift chips, a big number with a green delta, and a 12-week line chart (280 × 190, 3 grid lines, last point highlighted).
    - The body weight view adds a dashed green goal line, a "Today" stepper and a "Save for today" button.
    - "History" rows at the bottom.
14. **Profile** (`profile`).
    - Avatar ring in the profile color around an optional photo, name and meta.
    - Height / weight / target steppers and a goal segmented control.
    - Training plan card with the week strip and an "Edit plan and routines" button.
    - Settings section with the set-entry variant (Buttons / Keypad / Scale). "Switch profile" sits top right.
15. **Training plan** (`plan`).
    - Workouts per week (2–6) and the 7-day schedule. Tapping a day cycles A → B → … → rest.
    - A warning line in accent appears when the assigned days don't match the weekly count.
    - Routine list, plus "New strength" and "New cardio" dashed buttons.
16. **Routine editor** (`routine`, `routineCardio`).
    - 150 px cover, plate badge with meta, and a rename input (44 px display font).
    - Item cards with Remove and steppers: sets / reps, or minutes (±5) / zone (1–5) with the zone text.
    - Button "Add exercise" / "Add activity" opens the library in pick mode.

The tab bar (Home, Workout, Exercises, Progress) shows only at the root of a tab. The active tab has ink text and a 22 × 6 accent bar. Inactive tabs have muted text and a 6 × 6 transparent dot.

## Interactions and behavior
- **Navigation:** a stack per tab. Switching tabs clears the stack. Back pops one level.
- **Starting a workout** creates a session. While it runs, CTAs say CONTINUE and the Workout list shows "In progress".
- **Logging a set:**
  - Marks the set done and moves to the next undone set.
  - Starts the rest timer (`restSeconds`, default 120).
  - Flags a PR if the weight beats the previous best for that exercise.
  - Changing the weight on the current set copies that weight to the remaining undone sets.
- **Finishing:** marks the day done, builds the summary and clears the session. Volume = Σ kg × reps over logged sets.
- **Cardio:** the timer adds up paused time. Logging an activity stores its minutes and distance, then jumps to the next undone activity.
- **Weekly plan generation:** `PATTERNS` maps 2–6 days per week to weekday indexes, and routine keys are assigned round-robin. See `mkPlan` / `schedule`.
- **Estimated 1RM** = weight × (1 + reps / 30), rounded to 0.5 kg.
- **Pressed states:** primary CTA → `press`; minus → `line`; plus → `muted`. Focus ring: 2 px accent outline, offset 2.
- **Edge cases to handle:**
  - Finishing with nothing logged (today the summary shows zeros; consider a confirm).
  - An empty routine.
  - A new profile with no history (hide records, show an empty state on charts).

## State and data model
```ts
Profile { id, name, color, height, weight, goal: 'muscle'|'strength'|'fat', target,
  plan: { weekly: 2..6, days: (RoutineKey|null)[7], routines: Record<RoutineKey, Routine> },
  done: number[] /* day indexes this week */, bodyLog: {date, kg}[] }
Routine { name, type?: 'cardio', items: StrengthItem[] | CardioItem[] }
StrengthItem { ex, sets, reps }   CardioItem { ex, min, zone: 1..5 }
Exercise { id, name, group, equipment, description, steps[], kind?: 'cardio', unit?: 'km'|'floors', photos[] }
Session (strength) { routineKey, day, startedAt, cur, sel, ex: [{id, sets:[{kg, reps, done, pr}]}] }
Session (cardio)   { ..., ex: [{id, target, zone, min, value, done}], accumulatedMs, runningSince }
Settings { inputVariant: 'stepper'|'keypad'|'scale', weightStep: 1.25|2.5|5, restSeconds, handedness }
```
- The exercise catalog (26 items, with full copy and how-to steps) is the `EX` object in the prototype.
- Default routines are in `routinesDefault()`. Demo profiles (Marko, Ana) are in `defaultProfiles()`.
- Chart series, dates and "recent records" are demo data. Replace them with real logged history.
- Everything persists on the device. No backend is required.

## Assets (`images/`)
All photos are AI-generated and were supplied by the user.

| Use | Files |
|---|---|
| Welcome and Home hero | `hero.jpg` |
| Muscle-group tiles and heroes | `group-{chest,back,legs,shoulders,arms,core}.jpg` |
| Strength routine covers | `routine-{chest-triceps,back-biceps,legs,shoulders-arms}.jpg` |
| Exercise photos | `{id}-1/-2/-3.jpg` (see the `PHOTOS` map in the prototype) |
| Cardio activities | `treadmill`, `bike`, `rower`, `stairs`, `elliptical` (`-1`, `-2`) |
| Cardio hero (group header, day hero, thumbnails) | `cardio-hero.png` |
| Cardio library card (subject on the right, text on the left) | `cardio-wide.png` |
| Cardio routine editor cover (subject centered) | `cardio-banner.png` |
| Workout done hero | `workout-done.png` |

`group-cardio.jpg` is the uncropped original of the cardio photo. The three cardio PNGs were made from it.

## Files
- `LiftLog.dc.html`: the full interactive prototype. Markup sits above, and the logic and data are in the script block at the bottom.
- `LiftLog Overview.dc.html`: all screens side by side (needs `LiftLog.dc.html` next to it).
- `support.js`, `image-slot.js`: prototype runtime only. Open the HTML files over a local server, for example `npx serve`.
- `images/`: every image asset.
