# Bombay Medical — App

Pharmacy point-of-sale and stock app for Bombay Medical Pharmacy + General
Stores. One codebase (Expo SDK 56 / React Native) builds the web app and the
Android app. The API lives in `11Nov26-medical-back`.

## Run it locally

```bash
npm install
npm run web -- --port 8081      # web app at http://localhost:8081
```

Start the API first (`PORT=5002 npm run dev` in the backend repo). The app
talks to `http://localhost:5002` in development; override with
`EXPO_PUBLIC_API_URL_DEV` / `EXPO_PUBLIC_SOCKET_URL_DEV` in a local `.env`.

## Checks

```bash
npm test             # 71 unit tests (pricing parity with the backend, pack maths, …)
npm run typecheck    # tsc; the only errors are in 11Nov26-medical-web (its deps are not installed)
npm run lint
```

Browser smoke test (needs the web app on :8081 and the API on :5002; uses the
installed Chrome):

```bash
node tools/smokeLocal.mjs <screenshot-folder>
```

It signs in as the owner from the backend `.env` (`SMOKE_EMAIL` /
`SMOKE_PASSWORD` override, e.g. for the QA server), walks every main screen at
desktop and phone width, and fails on any console error or failed API call.

## Web deployment (Vercel)

Import the repository as a Vercel project; no settings need changing. Both
possible project roots build the app:

- repo root → `vercel.json` runs `npx expo export -p web` into `dist/`;
- `11Nov26-medical-web` (Vercel's import sometimes picks this folder because it
  holds a separate Vite site) → its `vercel.json` goes up to the repo root and
  builds the app into `app-dist/`.

The production API address is built in (`src/config/env.ts`:
`https://two3-jun26-medical-back.onrender.com`). To point a build elsewhere set
`EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` in Vercel's environment
variables before building. After the first deploy, set the backend's
`CORS_ORIGIN` and `FRONTEND_URL` to the Vercel URL.

`11Nov26-medical-web` is the old Plusveda marketing page. It is not part of
the app and has not been rebranded.

## Android build (EAS)

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview      # installable APK
npx eas-cli build -p android --profile production   # Play Store bundle
```

`eas.json` already points both profiles at the Render API. Before the first
Play Store upload, decide the package name (`android.package` in `app.json` is
still `com.medstock.app`; the iOS bundle id is `com.plusveda.app`) and the Expo
account that owns the project (`extra.eas.projectId` / `owner` in `app.json`).
The package name cannot change once an app is on the Play Store.

## Brand assets

Icons, splash and wordmark are generated from
`assets/brand/source/bombay-medical-logo.png`:

```bash
npm i sharp --no-save && node scripts/genIcons.mjs
```

Deliberately kept from the old brand (changing them would sign everyone out,
lose drafts or break the desktop shell): local storage keys (`medstock-*`,
`plusveda.*`), the service-worker cache names, the `medstock` deep-link scheme
and the `window.medstock` desktop bridge.

## Bill-photo scanning

Purchase → Scan bill reads a supplier bill with Gemini (configured on the API
with `GEMINI_API_KEY`). On a desktop browser "Take photo" opens the webcam
(`src/shared/WebcamCapture.tsx`); phones open their camera app. The first use
asks the browser for camera permission.
