# LiftLog

A phone-first workout tracker: weekly plan, live set logging with a rest timer, cardio timer,
exercise library and progress charts. Built with Expo (React Native) and published as a web app.

**Open it:** https://matejdza.github.io/MyGym/

## Install on your phone
- **iPhone (Safari):** open the link → Share → **Add to Home Screen**.
- **Android (Chrome):** open the link → ⋮ menu → **Add to Home screen** / **Install app**.

Open LiftLog from the home-screen icon. Your profiles and training history are stored only on that
phone, in that browser. Clearing the browser's website data deletes them.

## Development
```bash
npm ci
npm run web        # dev server in the browser
npm test           # rules and database tests
npm run typecheck
npx expo lint
```
Pushing to `main` publishes the site automatically (see `.github/workflows/deploy.yml`).
The original design is in `design/`.
