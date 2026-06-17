<div align="center">
  <img src="public/SignBridge%20logo.png" alt="SignBridge logo" width="180" />
  <h1>SignBridge AI</h1>
  <p><strong>English text and video transcripts to 3D sign animation in the browser.</strong></p>

  <p>
    <img alt="Frontend" src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge&logo=react" />
    <img alt="3D" src="https://img.shields.io/badge/3D-Three.js-black?style=for-the-badge&logo=threedotjs" />
    <img alt="State" src="https://img.shields.io/badge/State-Zustand-764ABC?style=for-the-badge" />
    <img alt="CI" src="https://img.shields.io/badge/CI-Lint%20%2B%20Build-2a7e75?style=for-the-badge&logo=githubactions" />
  </p>
</div>

## Overview

SignBridge AI is a React frontend for translating written English, or a backend-provided video transcript, into a 3D signing avatar experience.

The app is built around a simple flow:

1. A user types text or submits a video URL.
2. The app splits or receives the transcript as words.
3. The avatar plays a known word animation when available.
4. Unknown words are fingerspelled with A-Z hand poses.
5. The transcript highlights the active word during playback.

This repository contains the frontend client. Video transcription and optional text processing are expected from a FastAPI-compatible backend exposed under `/api`.

## Current Features

| Area | Status | Details |
| --- | --- | --- |
| Text to sign | Available | Users can enter text and start avatar playback. |
| Video URL transcription | Available with backend | The frontend calls `POST /api/transcribe` and displays the returned transcript. |
| 3D avatar | Available | Uses Three.js, React Three Fiber, Drei, and GLB avatar assets from `public/`. |
| Fingerspelling | Available | A-Z hand pose data is included in `src/lib/signLanguage/animations/alphabets.js`. |
| Word sign dictionary | Started | `home`, `person`, `time`, and `you` have word-level animation sequences. Other words fall back to fingerspelling. |
| Transcript highlight | Available | Shows the current sentence and highlights the active word. |
| Playback controls | Available | Play, pause, reset, progress, loop, and speed selection UI. |
| Avatar controls | Available | Zoom in, zoom out, reset view, and fullscreen modal. |
| Custom avatar picker | Available | Ready Player Me iframe can store an exported avatar URL in local storage. |
| Routing | Available | Home page and About page through React Router. |
| CI | Available | GitHub Actions runs `npm ci`, `npm run lint`, and `npm run build`. |

## Tech Stack

| Layer | Tools |
| --- | --- |
| App framework | React 19, Vite 7 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 |
| 3D rendering | Three.js, `@react-three/fiber`, `@react-three/drei` |
| State | Zustand, React hooks |
| Icons and motion | Lucide React, Framer Motion |
| Linting | ESLint 9 |
| Backend contract | FastAPI-style API under `/api` |

## How It Works

```text
User input
  |
  |-- Text mode
  |     |
  |     `-- split text into words in the browser
  |
  |-- Video mode
        |
        `-- POST /api/transcribe
              |
              `-- backend returns transcript text

Words
  |
  |-- known word in WORDS dictionary
  |     |
  |     `-- play authored keyframes
  |
  `-- unknown word
        |
        `-- fingerspell each letter with ALPHABETS poses

Avatar runtime
  |
  |-- load GLB model
  |-- discover Mixamo-style bones
  |-- interpolate bone rotations per frame
  `-- reset to default pose after each sign
```

## Repository Structure

```text
.
+-- .github/                         # CI, templates, code owners, Dependabot
+-- docs/                            # Product and technical notes
+-- public/                          # Static assets and GLB avatar models
|   +-- SignBridge logo.png
|   +-- model.glb                    # Default avatar loaded by the app
|   +-- ready_player_me_harry_potter.glb
+-- src/
|   +-- avatar/                      # Avatar runtime, model store, playback store
|   +-- components/
|   |   +-- common/                  # Error boundary
|   |   +-- layout/                  # Navbar, footer, root layout
|   |   +-- ui/                      # Reusable UI components
|   +-- constants/                   # App colors, speed options, labels
|   +-- features/
|   |   +-- avatar/                  # Avatar scene and Ready Player Me picker
|   |   +-- translator/              # Input, avatar panel, controls, transcript
|   +-- lib/signLanguage/animations/ # Alphabet poses, word poses, default pose
|   +-- pages/                       # Home and About pages
|   +-- services/                    # API client
|   +-- utils/                       # Text helpers
+-- CONTRIBUTING.md
+-- SECURITY.md
+-- eslint.config.js
+-- package.json
+-- vite.config.js
+-- README.md
```

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A browser with WebGL enabled
- A backend at `http://localhost:8000` if using video transcription

The required Node version is declared in `.nvmrc`.

## Quick Start

```bash
git clone https://github.com/Wasik-Yousha/SignBridge-Ai.git
cd SignBridge-Ai
npm ci
npm run dev
```

Open:

```text
http://localhost:5173
```

For a production build:

```bash
npm run build
npm run preview
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint across the project. |

## Backend Integration

The frontend API client is in `src/services/api.js`.

During local development, Vite proxies `/api` requests to:

```text
http://localhost:8000
```

That proxy is configured in `vite.config.js`.

Expected endpoints:

```http
GET /api/health
```

Returns backend status.

```http
POST /api/transcribe
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=example",
  "max_duration": 300
}
```

Returns transcript text, word timings, duration, and language.

```http
POST /api/process-text
Content-Type: application/json

{
  "text": "Hello, my name is Sarah."
}
```

Returns a processed word list. The API client supports this endpoint, but the current text flow uses local word splitting.

For production, serve the frontend and backend behind the same origin or route `/api/*` from the frontend host to the backend. If your backend uses a different base path, update `API_BASE` in `src/services/api.js`.

## Avatar Setup

The default local model is:

```text
public/model.glb
```

The avatar runtime expects a rig with discoverable bone names. Mixamo-style names such as `mixamorigRightHandIndex1` are supported. The runtime also normalizes common variants, including colon-style Mixamo names and some non-prefixed bone names.

Avatar loading path:

1. `src/avatar/Avatar.jsx` loads `/model.glb` by default.
2. If the Ready Player Me picker exports a model URL, `src/avatar/avatarModelStore.js` saves it in local storage under `signbridge-avatar-url`.
3. The avatar remounts with the stored model URL.
4. Clearing the stored URL returns the app to `/model.glb`.

If the avatar is not visible:

- Confirm `public/model.glb` exists.
- Open the browser console and check the registered `mixamorig*` bone count.
- Confirm WebGL is enabled in the browser.
- Check that the GLB contains a skinned mesh and finger bones.

## Sign Animation Data

Animation data lives in:

```text
src/lib/signLanguage/animations/
+-- alphabets.js
+-- defaultPose.js
+-- words.js
```

`alphabets.js` contains A-Z fingerspelling poses. `words.js` contains authored word signs. `defaultPose.js` is the neutral pose applied when playback stops or completes.

To add a new word sign:

1. Add a keyframe array in `words.js`.
2. Use lowercase English for the dictionary key.
3. Use bone names that the avatar runtime can resolve.
4. Keep each keyframe small and readable.
5. Run the app and check the sign from multiple camera angles.
6. Run `npm run lint` and `npm run build`.

## Development Workflow

Recommended local loop:

```bash
npm ci
npm run dev
npm run lint
npm run build
```

Keep changes focused. For UI changes, verify desktop and mobile widths. For avatar changes, verify the default model and at least one Ready Player Me model if possible.

## CI

The workflow in `.github/workflows/ci.yml` runs on pushes and pull requests to `main`.

CI steps:

1. Check out the repository.
2. Install Node using `.nvmrc`.
3. Install dependencies with `npm ci`.
4. Run ESLint.
5. Build the Vite app.

## Deployment Notes

The app builds to static files in `dist/`, so it can be hosted on services such as Vercel, Netlify, Cloudflare Pages, Render Static Sites, or any static web server.

Production checklist:

- Build with `npm run build`.
- Serve `dist/` as static files.
- Route `/api/*` to the backend service.
- Keep GLB files available under the same public paths.
- Set cache headers for hashed build assets.
- Avoid long-term immutable caching for replaceable avatar files such as `model.glb`.

## Troubleshooting

| Problem | Check |
| --- | --- |
| Blank avatar panel | Confirm WebGL support and that `public/model.glb` loads in the Network tab. |
| Video transcription fails | Start the backend on `localhost:8000` and confirm `GET /api/health` works. |
| `/api` calls return 404 in production | Add a reverse proxy rule or update `API_BASE`. |
| Words are only fingerspelled | Add word-level entries to `src/lib/signLanguage/animations/words.js`. |
| New avatar does not animate | Confirm bone names map to Mixamo-style names and include finger bones. |
| Build fails after dependency changes | Delete `node_modules`, run `npm ci`, then run `npm run build`. |

## Known Limits

- The current frontend signs English words in order. It does not perform full ASL grammar conversion.
- The word dictionary is small. Fingerspelling gives broad coverage, but it is not a replacement for authored signs.
- Video transcription depends on a separate backend. This repository does not include that backend.
- The speed selector is present in the UI. Before release, verify that selected speed is wired into the avatar timing behavior expected by the product.
- Generated or externally hosted avatar URLs depend on browser access to those assets.

## Roadmap

- Expand the authored word sign dictionary.
- Wire text processing into the active text flow when the backend is available.
- Add backend health status to the UI.
- Add tests for text parsing, API errors, and playback state.
- Add more avatar calibration tools for new GLB models.
- Add a documented backend repository link when the backend is published.

## Contributing

Read `CONTRIBUTING.md` before opening a pull request.

Before submitting changes:

```bash
npm run lint
npm run build
```

## Security

Do not report security issues through public issues. Follow `SECURITY.md` and contact the maintainer privately with reproduction steps and impact.

## License

No license file is currently included in this repository. Add a license before distributing or reusing the project outside the owner team.
