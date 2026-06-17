# Sign Language Converter — Complete Extraction & Integration Guide

> A complete, self-contained extraction of the **Sign Language Converter** feature from `ankon07/synapZ-AI`. This document contains **every file**, **every line of code**, and **every detail** required to drop this feature into a brand-new project and have it work identically to the original.
>
> Nothing has been abbreviated. Every alphabet animation (A–Z), every word animation (HOME, PERSON, TIME, YOU), the main React component, the page wrapper, the 3D avatar setup, and the backend YouTube transcript endpoint are reproduced in full below.

---

## Table of Contents

1. [What This Feature Does](#1-what-this-feature-does)
2. [Architecture & How It Works](#2-architecture--how-it-works)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [File / Folder Structure to Create in Your New Project](#4-file--folder-structure-to-create-in-your-new-project)
5. [Step-by-Step Setup Instructions](#5-step-by-step-setup-instructions)
6. [3D Avatar Models (xbot & ybot)](#6-3d-avatar-models-xbot--ybot)
7. [Source File: `types.ts`](#7-source-file-typests)
8. [Source File: `defaultPose.ts` (TypeScript)](#8-source-file-defaultposets-typescript)
9. [Source File: `defaultPose.js` (JavaScript — the one actually used)](#9-source-file-defaultposejs-javascript--the-one-actually-used)
10. [Index File: `alphabets.js`](#10-index-file-alphabetsjs)
11. [Index File: `words.js`](#11-index-file-wordsjs)
12. [All 26 Alphabet Animations (A through Z)](#12-all-26-alphabet-animations-a-through-z)
13. [All 4 Word Animations (HOME, PERSON, TIME, YOU)](#13-all-4-word-animations-home-person-time-you)
14. [Alternative TypeScript Alphabet (Reference: `alphabets/A.ts`)](#14-alternative-typescript-alphabet-reference-alphabetsats)
15. [The Main React Component: `SignLanguageConverter.tsx`](#15-the-main-react-component-signlanguageconvertertsx)
16. [The Page Wrapper: `VisualSchedule.tsx`](#16-the-page-wrapper-visualscheduletsx)
17. [Backend: YouTube Transcript Endpoint (Python FastAPI)](#17-backend-youtube-transcript-endpoint-python-fastapi)
18. [Required Backend Python Dependencies](#18-required-backend-python-dependencies)
19. [Deep Dive: How the Animation System Works](#19-deep-dive-how-the-animation-system-works)
20. [Extending: How to Add New Signs (Alphabets or Words)](#20-extending-how-to-add-new-signs-alphabets-or-words)
21. [Required shadcn/ui Components](#21-required-shadcnui-components)
22. [Troubleshooting Common Issues](#22-troubleshooting-common-issues)

---

## 1. What This Feature Does

The Sign Language Converter takes **text**, **speech**, or **video** as input and animates a **3D humanoid avatar** to perform the corresponding American Sign Language (ASL) finger-spelled letters and a few full-word signs in real time.

Three input modes are supported in one UI:

- **Text input** — User types a sentence; each word is either looked up in the word-dictionary (HOME, PERSON, TIME, YOU) or finger-spelled letter by letter.
- **Live speech** — Browser Speech Recognition API streams a transcript that can be animated on demand.
- **Video** — Either a YouTube URL (transcript fetched server-side via `youtube-transcript-api`) or an uploaded video file (transcribed locally via the browser's Web Speech API listening to the video's audio).

Two avatars are interchangeable at runtime: **xbot** and **ybot** (Mixamo characters with the standard Mixamo rig — bone names prefixed `mixamorig`). Animation **speed** and inter-sign **pause** are both user-adjustable via sliders.

---

## 2. Architecture & How It Works

### High-level flow

```
User Input  ───┐
(text/speech/  │
 video)        ▼
       ┌───────────────┐
       │  sign(textRef)│  ── splits string into words
       └───────┬───────┘
               ▼
       For each word:
       ┌───────────────────────────────────┐
       │ Is the word in the word-dict?     │
       │   YES → call words[WORD](ref)     │
       │   NO  → split into characters,    │
       │         call alphabets[CHAR](ref) │
       │         for each character        │
       └───────────────┬───────────────────┘
                       ▼
       Each call pushes one or more "animation arrays"
       onto ref.animations queue. An animation array is
       a list of [boneName, action, axis, limit, sign]
       5-tuples that describe target bone rotations.
                       ▼
       ┌───────────────────────────────────┐
       │  ref.animate() — requestAnimation │
       │  Frame loop. Each frame, nudges   │
       │  every bone in the current array  │
       │  toward its target by `speed` per │
       │  frame. When all bones reach      │
       │  their targets, shift the array   │
       │  off the queue, pause `pause` ms, │
       │  then proceed to the next array.  │
       └───────────────────────────────────┘
                       ▼
              Three.js renders the
              avatar each frame.
```

### Key data structure: the animation tuple

Every bone movement is encoded as a 5-element array:

```js
[boneName,   action,     axis,  limit,         sign]
// e.g.
["mixamorigRightHand", "rotation", "z", Math.PI / 4, "+"]
```

Meaning: keep increasing (`"+"`) `bone.rotation.z` of the bone named `mixamorigRightHand` by `speed` per frame until it reaches `Math.PI / 4`. If the sign is `"-"`, decrease instead.

A **sign function** (e.g. `A`, `HOME`, `TIME`) pushes an array of these tuples onto `ref.animations`, followed by a second array that resets the same bones back to 0 — this gives every sign a "play then return to neutral" behaviour automatically.

### Special queue entry: `['add-text', '...']`

While walking through the input string, the component also pushes `['add-text', 'A']`-style entries onto the queue. When the animator encounters one of these, it appends that string to the on-screen "Processed Output" panel and immediately moves to the next entry. This synchronises the printed letters/words with the avatar's gestures.

---

## 3. Tech Stack & Dependencies

### Frontend

| Purpose | Package | Version (from package.json) |
|---|---|---|
| Framework | `react`, `react-dom` | `^18.3.1` |
| Build tool | `vite`, `@vitejs/plugin-react-swc` | `^5.4.19`, `^3.11.0` |
| Language | `typescript` | `^5.8.3` |
| 3D engine | `three` | `^0.180.0` |
| 3D types | `@types/three` | `^0.180.0` |
| Speech recognition (text→speech for input) | `react-speech-recognition` | `^4.0.1` |
| Sliders (speed / pause) | `react-input-slider` | `^6.0.1` |
| Icons | `lucide-react` | `^0.462.0` |
| Styling | `tailwindcss` | `^3.4.17` |
| UI primitives | `shadcn/ui` (Radix-based) | — |
| Routing | `react-router-dom` | `^6.30.1` |

> Note: `@react-three/fiber` and `@react-three/drei` are also in `package.json` but the Sign Language Converter component itself uses **raw Three.js** via `GLTFLoader`, not React-Three-Fiber. You can skip R3F if you only port this feature.

### Backend (optional — only required for the YouTube URL input mode)

| Purpose | Package |
|---|---|
| Web framework | `fastapi` |
| ASGI server | `uvicorn` |
| YouTube transcripts | `youtube-transcript-api` |
| Request models | `pydantic` |
| Env vars | `python-dotenv` |
| CORS | (built into FastAPI) |

### Minimum install command

```bash
npm install react react-dom three @types/three \
            react-speech-recognition react-input-slider \
            lucide-react
# plus shadcn/ui components: button, card, label, textarea, input
```

---

## 4. File / Folder Structure to Create in Your New Project

Recreate this exact tree (paths are relative to your `src/` and `public/` folders):

```
src/
├── components/
│   └── SignLanguageConverter.tsx       ◄── main React component (709 lines)
├── lib/
│   └── signLanguage/
│       ├── types.ts                    ◄── TypeScript interfaces
│       └── animations/
│           ├── alphabets.js            ◄── barrel export for A–Z
│           ├── words.js                ◄── barrel export for HOME/PERSON/TIME/YOU
│           ├── defaultPose.js          ◄── neutral starting pose
│           ├── defaultPose.ts          ◄── (alt TS variant — see §8)
│           ├── Alphabets/              ◄── 26 files: A.js .. Z.js
│           │   ├── A.js
│           │   ├── B.js
│           │   ├── ... (all 26)
│           │   └── Z.js
│           ├── alphabets/              ◄── (alt TS variant — optional)
│           │   └── A.ts
│           └── Words/
│               ├── HOME.js
│               ├── PERSON.js
│               ├── TIME.js
│               └── YOU.js
└── pages/
    └── VisualSchedule.tsx              ◄── page that mounts the component

public/
└── Models/
    ├── xbot/
    │   ├── xbot.glb                    ◄── 3D avatar #1 (~2.2 MB)
    │   └── xbot.png                    ◄── thumbnail preview (~249 KB)
    └── ybot/
        ├── ybot.glb                    ◄── 3D avatar #2 (~2.2 MB)
        └── ybot.png                    ◄── thumbnail preview (~262 KB)
```

> **Important capitalisation note:** the folder containing the alphabet `.js` files is `Alphabets` with a **capital A**. The barrel file `alphabets.js` imports from `./Alphabets/A`, `./Alphabets/B`, … case-sensitively (matters on Linux/macOS — Windows is forgiving). Keep the casing exactly as shown above.

---

## 5. Step-by-Step Setup Instructions

### 5.1 Bootstrap a new Vite + React + TS + Tailwind project

```bash
npm create vite@latest my-sign-lang-app -- --template react-ts
cd my-sign-lang-app

# Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Add Tailwind directives to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5.2 Install the required packages

```bash
npm install three @types/three \
            react-speech-recognition react-input-slider \
            lucide-react
```

### 5.3 Install shadcn/ui and add the needed primitives

```bash
npx shadcn@latest init           # accept defaults
npx shadcn@latest add button card label textarea input
```

This will create `src/components/ui/button.tsx`, `card.tsx`, `label.tsx`, `textarea.tsx`, `input.tsx` and configure the `@/` import alias in `tsconfig.json` and `vite.config.ts`.

### 5.4 Create the folder tree

```bash
mkdir -p src/lib/signLanguage/animations/Alphabets
mkdir -p src/lib/signLanguage/animations/Words
mkdir -p src/lib/signLanguage/animations/alphabets
mkdir -p public/Models/xbot
mkdir -p public/Models/ybot
```

### 5.5 Copy every file from sections §7 through §16 below

Each section below contains one file. Copy its contents verbatim to the path indicated.

### 5.6 Drop the avatar `.glb` files into `public/Models/...`

See section 6 for where to obtain them.

### 5.7 Mount the page in your router

In `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VisualSchedule from "./pages/VisualSchedule";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-language" element={<VisualSchedule />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 5.8 (Optional) Wire up the backend for YouTube URL transcripts

See section 17 for the FastAPI endpoint. If you skip this, the YouTube URL feature will fail but the text input, speech input, and uploaded-video-file modes will still work.

### 5.9 Run it

```bash
npm run dev
# open http://localhost:5173/sign-language
```

---

## 6. 3D Avatar Models (xbot & ybot)

The component loads two GLB files at:

- `/Models/xbot/xbot.glb` (referenced as constant `xbot` in the component)
- `/Models/ybot/ybot.glb` (referenced as constant `ybot` in the component, **and** used as the default avatar on first mount)

Plus two thumbnail images used as clickable previews in the right-hand "Avatar Settings" card:

- `/Models/xbot/xbot.png`
- `/Models/ybot/ybot.png`

### Where to get the models

`xbot` and `ybot` are the two stock characters Adobe provides on **Mixamo** (https://www.mixamo.com). The exact workflow is:

1. Sign in to Mixamo with a free Adobe ID.
2. From the Characters list, pick **X Bot** and download it as **FBX for Unity** (or directly as GLB if available).
3. Convert FBX → GLB with any free converter (online converters like `aspose.app`, the Blender FBX import + glTF export workflow, or `gltf-pipeline`).
4. Repeat for **Y Bot**.
5. Save the resulting files as `xbot.glb` and `ybot.glb` at the paths above.
6. Take a screenshot of each character (or render a still in Blender) and save as `xbot.png` / `ybot.png` next to the GLBs.

### Why these specifically?

The 30+ animation files reference bones by **Mixamo's standard rig naming convention**: `mixamorigLeftHand`, `mixamorigRightHandIndex1`, `mixamorigNeck`, etc. Any GLB exported through Mixamo's pipeline will have these exact bone names, which is why the same animation code drives both bots. **If you substitute a model with a different rig naming convention, none of the alphabet/word files will work** without renaming every bone reference.

### File sizes (for reference)

- `xbot.glb` ≈ 2,233,444 bytes (~2.2 MB)
- `xbot.png` ≈ 249,018 bytes
- `ybot.glb` ≈ 2,233,440 bytes (~2.2 MB)
- `ybot.png` ≈ 261,708 bytes

---


## 7. Source File: `types.ts`

**Target path in your project:** `src/lib/signLanguage/types.ts`

```typescript
import * as THREE from 'three';

export interface AnimationRef {
  flag: boolean;
  pending: boolean;
  animations: (Animation[] | string[])[];
  characters: string[];
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  avatar: any;
  animate: () => void;
  speed: number;
  pause: number;
}

export type Animation = [string, string, string, number, string];

export interface SignLanguageAvatarProps {
  text?: string;
  speed?: number;
  pause?: number;
  onTextUpdate?: (text: string) => void;
  className?: string;
}

## 8. Source File: `defaultPose.ts` (TypeScript)

> This is a TypeScript-typed reset variant. The component actually imports the **JavaScript** version (§9) which performs a posed neutral (arms at the sides). Both files are reproduced for completeness — the JS one in §9 is the one executed.

**Target path:** `src/lib/signLanguage/animations/defaultPose.ts`

```typescript
import { AnimationRef } from '../types';

export const defaultPose = (ref: AnimationRef): void => {
  if (!ref.avatar) return;

  // Reset all rotations to default pose
  const resetBone = (boneName: string) => {
    const bone = ref.avatar?.getObjectByName(boneName);
    if (bone && 'rotation' in bone) {
      bone.rotation.x = 0;
      bone.rotation.y = 0;
      bone.rotation.z = 0;
    }
  };

  // Reset left hand
  resetBone('mixamorigLeftHandIndex1');
  resetBone('mixamorigLeftHandMiddle1');
  resetBone('mixamorigLeftHandRing1');
  resetBone('mixamorigLeftHandPinky1');
  resetBone('mixamorigLeftHand');
  resetBone('mixamorigLeftForeArm');
  resetBone('mixamorigLeftArm');

  // Reset right hand
  resetBone('mixamorigRightHandIndex1');
  resetBone('mixamorigRightHandMiddle1');
  resetBone('mixamorigRightHandMiddle2');
  resetBone('mixamorigRightHandMiddle3');
  resetBone('mixamorigRightHandRing1');
  resetBone('mixamorigRightHandRing2');
  resetBone('mixamorigRightHandRing3');
  resetBone('mixamorigRightHandPinky1');
  resetBone('mixamorigRightHandPinky2');
  resetBone('mixamorigRightHandPinky3');
  resetBone('mixamorigRightHandThumb2');
  resetBone('mixamorigRightHandThumb3');
  resetBone('mixamorigRightHand');
  resetBone('mixamorigRightForeArm');
  resetBone('mixamorigRightArm');
};

## 9. Source File: `defaultPose.js` (JavaScript — the one actually used)

**Target path:** `src/lib/signLanguage/animations/defaultPose.js`

```javascript
export const defaultPose = (ref) => {
    
    ref.characters.push(' ')
    let animations = []
    
    animations.push(["mixamorigNeck", "rotation", "x", Math.PI/12, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "y", Math.PI/1.5, "+"]);
    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
    
}
## 10. Index File: `alphabets.js`

Barrel export that re-exports every letter function so the main component can do `import * as alphabets from "./alphabets"` and then `alphabets[char](ref)`.

**Target path:** `src/lib/signLanguage/animations/alphabets.js`

```javascript
import { A } from './Alphabets/A';
import { B } from './Alphabets/B';
import { C } from './Alphabets/C';
import { D } from './Alphabets/D';
import { E } from './Alphabets/E';
import { F } from './Alphabets/F';
import { G } from './Alphabets/G';
import { H } from './Alphabets/H';
import { I } from './Alphabets/I';
import { J } from './Alphabets/J';
import { K } from './Alphabets/K';
import { L } from './Alphabets/L';
import { M } from './Alphabets/M';
import { N } from './Alphabets/N';
import { O } from './Alphabets/O';
import { P } from './Alphabets/P';
import { Q } from './Alphabets/Q';
import { R } from './Alphabets/R';
import { S } from './Alphabets/S';
import { T } from './Alphabets/T';
import { U } from './Alphabets/U';
import { V } from './Alphabets/V';
import { W } from './Alphabets/W';
import { X } from './Alphabets/X';
import { Y } from './Alphabets/Y';
import { Z } from './Alphabets/Z';

export {
    A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z
}
## 11. Index File: `words.js`

**Target path:** `src/lib/signLanguage/animations/words.js`

```javascript
import { TIME } from './Words/TIME';
import { HOME } from './Words/HOME';
import { PERSON } from './Words/PERSON';
import { YOU } from './Words/YOU';

var wordList = ['TIME', 'HOME', 'PERSON', 'YOU'];

export {
    TIME, HOME, PERSON, YOU, wordList
}
## 12. All 26 Alphabet Animations (A through Z)

Each file exports a single named function (e.g. `export const A = (ref) => { ... }`). The function takes the shared animation `ref` object, pushes two animation arrays onto `ref.animations` (the **pose** array followed by the **reset-to-zero** array), and kicks off the animation loop if it is not already running.

All bone-rotation values are in **radians** and are deliberately written as `Math.PI / N` expressions so they are easy to tweak visually.

### 12.A — Letter 'A'

**Target path:** `src/lib/signLanguage/animations/Alphabets/A.js`

```javascript
export const A = (ref) => {

    let animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", -Math.PI/9, "-"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "y", -Math.PI/18, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", Math.PI/18, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", Math.PI/9, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", Math.PI/2, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", Math.PI/9, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/10, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/18, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/11, "-"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/2.5, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/2.5, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "x", -Math.PI/2, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/12, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/4, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", -Math.PI/36, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/9, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "y", -Math.PI/72, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "y", 0, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }

}
### 12.B — Letter 'B'

**Target path:** `src/lib/signLanguage/animations/Alphabets/B.js`

```javascript
export const B = (ref) => {

    let animations = []
    
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/4.5, "+"]);
    
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/6, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/6, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/10, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/4, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/9, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/18, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/6.5, "-"]);

    animations.push(["mixamorigLeftHandIndex1", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandIndex2", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandIndex3", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/4.5, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/4.5, "-"]);
    
    animations.push(["mixamorigLeftHandThumb1", "rotation", "x", Math.PI/6, "+"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", Math.PI/6, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/10, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", -Math.PI/4, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/9, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/18, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/6.5, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftHandIndex1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandIndex2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandIndex3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    
    animations.push(["mixamorigLeftHandThumb1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
    
}
### 12.C — Letter 'C'

**Target path:** `src/lib/signLanguage/animations/Alphabets/C.js`

```javascript
export const C = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/6, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/7, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/10, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/4, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/9, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/18, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/6.5, "-"]);

    ref.animations.push(animations);

    animations = []
    
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}
### 12.D — Letter 'D'

**Target path:** `src/lib/signLanguage/animations/Alphabets/D.js`

```javascript
export const D = (ref) => {

    let animations = []
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/6, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/7, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/7.5, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/6, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/18, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/6.5, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/2.7, "+"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", Math.PI/2.5, "+"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", Math.PI/2.5, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/4, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", -Math.PI/4, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/18, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/33, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.7, "-"]);

    ref.animations.push(animations);

    animations = []
    
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "z", 1.0471975511965976, "-"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}

### 12.E — Letter 'E'

**Target path:** `src/lib/signLanguage/animations/Alphabets/E.js`

```javascript
export const E = (ref) => {

    let animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", -Math.PI/9, "-"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "y", -Math.PI/18, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", Math.PI/18, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", Math.PI/9, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", Math.PI/2, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", Math.PI/9, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/9, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/12, "-"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/2.5, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/2.5, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "x", -Math.PI/2, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/12, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", -Math.PI/36, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/15, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
    
}
### 12.F — Letter 'F'

**Target path:** `src/lib/signLanguage/animations/Alphabets/F.js`

```javascript
export const F = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/2.5, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/2.5, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/4, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "x", Math.PI/18, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/9, "+"]);

    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", Math.PI/2.5, "+"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", Math.PI/2.5, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", -Math.PI/3, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/9, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }

}
### 12.G — Letter 'G'

**Target path:** `src/lib/signLanguage/animations/Alphabets/G.js`

```javascript
export const G = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/3, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "x", -Math.PI/2, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/9, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", -Math.PI/18, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/12, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/3.5, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "y", Math.PI/12, "+"]);

    animations.push(["mixamorigLeftHandIndex1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandIndex2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandIndex3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "x", Math.PI/3, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", -Math.PI/2.5, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", -Math.PI/9, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", Math.PI/18, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/12, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/6, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/12, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHandIndex1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandIndex2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandIndex3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }

}
### 12.H — Letter 'H'

**Target path:** `src/lib/signLanguage/animations/Alphabets/H.js`

```javascript
export const H = (ref) => {

    let animations = []
  
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", -Math.PI/6, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "z", -Math.PI/15, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/18, "+"]);
  
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/60, "-"]);

    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", Math.PI/12, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/4, "+"]);
  
    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -Math.PI/1.5, "-"]);
  
    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/30, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.6, "-"]);
  
    ref.animations.push(animations);

    animations = []
  
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "z", 0, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
  
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
  
    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -2.0943951023931953, "+"]);
  
    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);
  
    ref.animations.push(animations);
  
    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}
### 12.I — Letter 'I'

**Target path:** `src/lib/signLanguage/animations/Alphabets/I.js`

```javascript
export const I = (ref) => {

    let animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", -Math.PI/9, "-"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "y", -Math.PI/18, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", Math.PI/18, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", Math.PI/9, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", Math.PI/1.55, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", Math.PI/9, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/9, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/12, "-"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/2.5, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/2.5, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "x", -Math.PI/2, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/12, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", -Math.PI/36, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/13, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
    
}
### 12.J — Letter 'J'

**Target path:** `src/lib/signLanguage/animations/Alphabets/J.js`

```javascript
export const J = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "z", Math.PI/2, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "y", -Math.PI/5, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/6, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "y", Math.PI/6, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/36, "-"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "y", -Math.PI/2, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/3.7, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", -Math.PI/6, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.4, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", -Math.PI/7, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", Math.PI/12, "+"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "-"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}

### 12.K — Letter 'K'

**Target path:** `src/lib/signLanguage/animations/Alphabets/K.js`

```javascript
export const K = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI/12, "+"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", Math.PI/1.7, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);

    animations.push(["mixamorigRightHandThumb1", "rotation", "y", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", -Math.PI/6, "-"]);
    
    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/5, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "x", Math.PI/8, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/9, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/9, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/4, "-"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", Math.PI/2.5, "+"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", Math.PI/2.5, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/4.1, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", -Math.PI/4, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/18, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/33, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.7, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightHandThumb1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "+"]);
    
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}

### 12.L — Letter 'L'

**Target path:** `src/lib/signLanguage/animations/Alphabets/L.js`

```javascript
export const L = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "z", Math.PI/4, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/2.3, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", -Math.PI/5, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/2.65, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/30, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/4, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
    
}
### 12.M — Letter 'M'

**Target path:** `src/lib/signLanguage/animations/Alphabets/M.js`

```javascript
export const M = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/2.3, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", -Math.PI/25, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/10, "-"]);
  
    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/18, "+"]);
  
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/60, "-"]);

    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", Math.PI/12, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/4, "+"]);
  
    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -Math.PI/1.5, "-"]);
  
    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/30, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.6, "-"]);
  
    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);
  
    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
  
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
  
    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -2.0943951023931953, "+"]);
  
    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);
  
    ref.animations.push(animations);
  
    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}
### 12.N — Letter 'N'

**Target path:** `src/lib/signLanguage/animations/Alphabets/N.js`

```javascript
export const N = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/2.3, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", -Math.PI/25, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/10, "-"]);
  
    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/18, "+"]);
  
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/60, "-"]);

    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", Math.PI/12, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/4, "+"]);
  
    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -Math.PI/1.5, "-"]);
  
    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/30, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.6, "-"]);
  
    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);
  
    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
  
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
  
    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -2.0943951023931953, "+"]);
  
    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);
  
    ref.animations.push(animations);
  
    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}
### 12.O — Letter 'O'

**Target path:** `src/lib/signLanguage/animations/Alphabets/O.js`

```javascript
export const O = (ref) => {

    let animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", -Math.PI/9, "-"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "y", -Math.PI/18, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", Math.PI/18, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", Math.PI/9, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", Math.PI/1.45, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", Math.PI/9, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/9, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/12, "-"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/2.5, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/2.5, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "x", -Math.PI/2, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/12, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/15, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", -Math.PI/36, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/13, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "y", Math.PI/18, "+"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "y", 0, "-"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
    
}
### 12.P — Letter 'P'

**Target path:** `src/lib/signLanguage/animations/Alphabets/P.js`

```javascript
export const P = (ref) => {

    let animations = []
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI/4.2, "+"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", Math.PI/4.2, "+"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", Math.PI/4.2, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/2.3, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", Math.PI/15, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/10, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/10, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/5, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/6, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/5.3, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/18, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/6.5, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/2.7, "+"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", Math.PI/2.5, "+"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", Math.PI/2.5, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/4, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", -Math.PI/4, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/5.85, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/18, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/33, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.7, "-"]);

    ref.animations.push(animations);

    animations = []
    
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "z", 1.0471975511965976, "-"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}

### 12.Q — Letter 'Q'

**Target path:** `src/lib/signLanguage/animations/Alphabets/Q.js`

```javascript
export const Q = (ref) => {

  let animations = []
  animations.push(["mixamorigRightHandIndex2", "rotation", "z", Math.PI/4.2, "+"]);
  animations.push(["mixamorigRightHandIndex3", "rotation", "z", Math.PI/4.2, "+"]);
  animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/1.5, "+"]);
  animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/1.5, "+"]);
  animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/1.5, "+"]);
  animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.6, "+"]);
  animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.6, "+"]);
  animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.6, "+"]);
  animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
  animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
  animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
  animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/2.3, "+"]);
  animations.push(["mixamorigRightHandThumb1", "rotation", "y", -Math.PI/25, "-"]);
  animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/10, "-"]);
  animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/10, "-"]);

  animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/4, "-"]);

  animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/5.3, "+"]);
  animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/18, "+"]);

  animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/2.4, "+"]);
  
  animations.push(["mixamorigLeftHandIndex1", "rotation", "z", -Math.PI/3, "-"]);
  animations.push(["mixamorigLeftHandIndex2", "rotation", "z", -Math.PI/3, "-"]);
  animations.push(["mixamorigLeftHandIndex3", "rotation", "z", -Math.PI/3, "-"]);
  animations.push(["mixamorigLeftHandThumb1", "rotation", "x", Math.PI/10, "+"]);
  animations.push(["mixamorigLeftHandThumb2", "rotation", "y", Math.PI/10, "+"]);

  animations.push(["mixamorigLeftHand", "rotation", "y", Math.PI/2.8, "+"]);
  animations.push(["mixamorigLeftHand", "rotation", "x", Math.PI/3, "+"]);

  animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);
  animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/18, "+"]);

  animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/33, "-"]);
  animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.4, "-"]);
  animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/8.3, "-"]);

  ref.animations.push(animations);

  animations = []

  animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandIndex3", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);
  animations.push(["mixamorigRightHandThumb1", "rotation", "y", 0, "+"]);
  animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
  animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

  animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);

  animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
  animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);

  animations.push(["mixamorigRightArm", "rotation", "z", 1.0471975511965976, "-"]);

  animations.push(["mixamorigLeftHandIndex1", "rotation", "z", 0, "+"]);
  animations.push(["mixamorigLeftHandIndex2", "rotation", "z", 0, "+"]);
  animations.push(["mixamorigLeftHandIndex3", "rotation", "z", 0, "+"]);
  animations.push(["mixamorigLeftHandThumb1", "rotation", "x", 0, "-"]);
  animations.push(["mixamorigLeftHandThumb2", "rotation", "y", 0, "-"]);

  animations.push(["mixamorigLeftHand", "rotation", "y", 0, "-"]);
  animations.push(["mixamorigLeftHand", "rotation", "x", 0, "-"]);

  animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
  animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);

  animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);
  animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);
  animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);

  ref.animations.push(animations);

  if(ref.pending === false){
    ref.pending = true;
    ref.animate();
  }
}


### 12.R — Letter 'R'

**Target path:** `src/lib/signLanguage/animations/Alphabets/R.js`

```javascript
export const R = (ref) => {

    let animations = []
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", Math.PI/8, "+"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", Math.PI/4.2, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/2.3, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", -Math.PI/25, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/10, "-"]);
  
    animations.push(["mixamorigRightHand", "rotation", "x", -Math.PI/2.3, "-"]);
  
    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/5.3, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/18, "+"]);
  
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/60, "-"]);

    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", Math.PI/12, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", -Math.PI/1.3, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/4, "+"]);
  
    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -Math.PI/1.5, "-"]);
  
    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/30, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.6, "-"]);
  
    ref.animations.push(animations);

    animations = []
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);
  
    animations.push(["mixamorigRightHand", "rotation", "x", 0, "+"]);
  
    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
  
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
  
    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -2.0943951023931953, "+"]);
  
    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);
  
    ref.animations.push(animations);
  
    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}
### 12.S — Letter 'S'

**Target path:** `src/lib/signLanguage/animations/Alphabets/S.js`

```javascript
export const S = (ref) => {

    let animations = []
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", -Math.PI/4, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/2.5, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/2.5, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/6, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "x", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/6, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "y", Math.PI/33, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/2.6, "+"]);

    animations.push(["mixamorigLeftHandIndex1", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandIndex2", "rotation", "z", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftHandIndex3", "rotation", "z", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", Math.PI/4, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", Math.PI/2.5, "+"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", Math.PI/2.5, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", -Math.PI/10, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", -Math.PI/6, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/2.7, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -Math.PI*0.75, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.6, "-"]);

    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "z", 1.0471975511965976, "-"]);

    animations.push(["mixamorigLeftHandIndex1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandIndex2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandIndex3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -2.0943951023931953, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);
    ref.animations.push(animations);


    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}

### 12.T — Letter 'T'

**Target path:** `src/lib/signLanguage/animations/Alphabets/T.js`

```javascript
export const T = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", Math.PI/2.5, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", Math.PI/2.5, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/2.3, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/6, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/2.65, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/30, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/6.5, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/2.5, "+"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", Math.PI/5.5, "+"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", Math.PI/2.5, "+"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", Math.PI/2.5, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", -Math.PI/2.7, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", -Math.PI/4, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", Math.PI/30, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/8.5, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/6, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.4, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "z", 1.0471975511965976, "-"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
    
}
### 12.U — Letter 'U'

**Target path:** `src/lib/signLanguage/animations/Alphabets/U.js`

```javascript
export const U = (ref) => {

    let animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", -Math.PI/9, "-"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "y", -Math.PI/18, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", Math.PI/18, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", Math.PI/9, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", Math.PI/1.45, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", Math.PI/36, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/9, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/12, "-"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/2.5, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/2.5, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "x", -Math.PI/2, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/12, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/15, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", -Math.PI/36, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/13, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "y", Math.PI/18, "+"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "y", 0, "-"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
    
}
### 12.V — Letter 'V'

**Target path:** `src/lib/signLanguage/animations/Alphabets/V.js`

```javascript
export const V = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "y", Math.PI/16, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "y", -Math.PI/16, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/3, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/3, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/2.3, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", -Math.PI/5, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/2.65, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/30, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/4, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
    
}
### 12.W — Letter 'W'

**Target path:** `src/lib/signLanguage/animations/Alphabets/W.js`

```javascript
export const W = (ref) => {

    let animations = []
    animations.push(["mixamorigRightHandIndex1", "rotation", "y", Math.PI/16, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "y", -Math.PI/12, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "y", -Math.PI/8, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", Math.PI/5, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "z", -Math.PI/6, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", Math.PI/6, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "x", -Math.PI/6, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/2.4, "+"]);

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", -Math.PI/16, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", Math.PI/8, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", Math.PI/8, "+"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "y", -Math.PI/5, "-"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "z", Math.PI/6, "+"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", -Math.PI/6, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "y", -Math.PI/24, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", -Math.PI/6, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.4, "-"]);

    ref.animations.push(animations);


    animations = []
    animations.push(["mixamorigRightHandIndex1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "z", 1.0471975511965976, "-"]);

    animations.push(["mixamorigLeftHandIndex1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}

### 12.X — Letter 'X'

**Target path:** `src/lib/signLanguage/animations/Alphabets/X.js`

```javascript
export const X = (ref) => {

    let animations = []
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/2.5, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/2.5, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/32, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/4.5, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/6, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "y", Math.PI/33, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/3, "-"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", Math.PI/2.5, "+"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", Math.PI/2.5, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/14, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", -Math.PI/6, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", -Math.PI/33, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/3, "+"]);

    ref.animations.push(animations);

    animations = []
    
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "z", 1.0471975511965976, "+"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb2", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHandThumb3", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "-"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}

### 12.Y — Letter 'Y'

**Target path:** `src/lib/signLanguage/animations/Alphabets/Y.js`

```javascript
export const Y = (ref) => {

    let animations = []
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/1.5, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/1.6, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/1.8, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/2.5, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/2.5, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", +Math.PI/2.5, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "x", -Math.PI/8, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/15, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", -Math.PI/10, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "y", Math.PI/33, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/2.2, "+"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/1.6, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/1.8, "-"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "y", -Math.PI/4, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "y", Math.PI/2, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", Math.PI/2, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/3.5, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/5, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.2, "-"]);

    ref.animations.push(animations);

    animations = []
    
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "z", 1.0471975511965976, "-"]);

    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}

### 12.Z — Letter 'Z'

**Target path:** `src/lib/signLanguage/animations/Alphabets/Z.js`

```javascript
export const Z = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/3, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/10, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/4, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/7, "+"]); //7
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/18, "+"]);
    
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/6.5, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/2.7, "+"]);
    
    animations.push(["mixamorigLeftHandThumb1", "rotation", "x", -Math.PI/3, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", Math.PI/4, "+"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", -Math.PI/9, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/6, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/18, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/5, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.7, "-"]);

    ref.animations.push(animations);


    animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]); //7
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
    
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "z", 1.0471975511965976, "-"]);
    
    animations.push(["mixamorigLeftHandThumb1", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigLeftHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "z", -1.0471975511965976, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}
---

## 13. All 4 Word Animations (HOME, PERSON, TIME, YOU)

Words are full-sign gestures that take precedence over letter-by-letter spelling. If the user types "YOU GO HOME", the converter will look up "YOU" (found, plays YOU sign), look up "GO" (not found, spells G, O letter-by-letter), then look up "HOME" (found, plays HOME sign).

To extend the word dictionary: add a new file in `Words/`, import & re-export it in `words.js`, and add the uppercase word string to the `wordList` array in `words.js`.

### 13.HOME — Word 'HOME'

**Target path:** `src/lib/signLanguage/animations/Words/HOME.js`

```javascript
export const HOME = (ref) => {

    let animations = []

    animations.push(["mixamorigLeftHandThumb1", "rotation", "x", -Math.PI/3, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", Math.PI/70, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/7, "-"]);
    animations.push(["mixamorigLeftArm", "rotation", "x", -Math.PI/6, "-"]);

    animations.push(["mixamorigRightHandThumb1", "rotation", "x", -Math.PI/3, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", Math.PI/70, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/7, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/6, "-"]);

    ref.animations.push(animations);

    animations = []
    animations.push(["mixamorigLeftForeArm", "rotation", "y", -Math.PI/2.5, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "y", Math.PI/2.5, "-"]);

    ref.animations.push(animations);
    
    animations = []
    animations.push(["mixamorigLeftHandThumb1", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "y", -Math.PI/1.5, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "y", Math.PI/1.5, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }

}
### 13.PERSON — Word 'PERSON'

**Target path:** `src/lib/signLanguage/animations/Words/PERSON.js`

```javascript
export const PERSON = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI/9, "+"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", Math.PI/4.5, "+"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", Math.PI/8, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/6, "-"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", -Math.PI/10, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI/4, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", -Math.PI/3, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/2.2, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/5, "-"]);

    ref.animations.push(animations);

    animations = []
    animations.push(["mixamorigRightArm", "rotation", "x", Math.PI/90, "+"]);
    ref.animations.push(animations);

    animations = []
    
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandIndex3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHandThumb1", "rotation", "y", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);
    animations.push(["mixamorigRightHandThumb3", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/3, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "-"]);

    ref.animations.push(animations);

    if(ref.pending === false){
      ref.pending = true;
      ref.animate();
    }
}
### 13.TIME — Word 'TIME'

**Target path:** `src/lib/signLanguage/animations/Words/TIME.js`

```javascript
export const TIME = (ref) => {

    let animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandIndex2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandIndex3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", -Math.PI/2, "-"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "y", -Math.PI/4, "-"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", -Math.PI/4, "-"]);

    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/2.5, "-"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", Math.PI/6, "+"]);

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/3.5, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "y", Math.PI/9, "+"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/12, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "x", Math.PI/6, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", Math.PI/6, "+"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI/12, "+"]);

    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigLeftHandIndex1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandIndex2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandIndex3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandMiddle3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandRing3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky2", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandPinky3", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigLeftHandThumb1", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigLeftForeArm", "rotation", "z", 0, "+"]);

    animations.push(["mixamorigLeftArm", "rotation", "z", -Math.PI/3, "+"]);

    animations.push(["mixamorigLeftHand", "rotation", "x", 0, "-"]);

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "z", Math.PI/3, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "y", 0, "-"]);

    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "-"]);

    ref.animations.push(animations);

    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }

}
### 13.YOU — Word 'YOU'

**Target path:** `src/lib/signLanguage/animations/Words/YOU.js`

```javascript
export const YOU = (ref) => {

    let animations = []

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", Math.PI/2, "+"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", -Math.PI/2, "-"]);

    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI/6, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "x", Math.PI/6, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "z", Math.PI/3, "+"]);
    animations.push(["mixamorigRightHand", "rotation", "y", -Math.PI/6, "-"]);
    
    ref.animations.push(animations);

    animations = []

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky2", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky3", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandThumb2", "rotation", "y", 0, "+"]);

    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "x", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHand", "rotation", "y", 0, "+"]);

    ref.animations.push(animations);

    if(ref.pending === false){
        ref.pending = true;
        ref.animate();
    }

}
---

## 14. Alternative TypeScript Alphabet (Reference: `alphabets/A.ts`)

The repository also contains a single TypeScript-typed alphabet file at `alphabets/A.ts` (note: **lowercase** folder), reproduced here purely as a reference if you prefer porting the alphabet library to TS. The component does **not** currently import from this folder — it imports the JS files in §12. Skip this section if you only want the project to run.

**Target path:** `src/lib/signLanguage/animations/alphabets/A.ts` (optional)

```typescript
import { AnimationRef, Animation } from '../../types';

export const A = (ref: AnimationRef): void => {
  let animations: Animation[] = [];

  // Create the 'A' sign animation
  animations.push(['mixamorigLeftHandIndex1', 'rotation', 'y', -Math.PI / 9, '-']);
  animations.push(['mixamorigLeftHandMiddle1', 'rotation', 'y', -Math.PI / 18, '-']);
  animations.push(['mixamorigLeftHandRing1', 'rotation', 'y', Math.PI / 18, '+']);
  animations.push(['mixamorigLeftHandPinky1', 'rotation', 'y', Math.PI / 9, '+']);

  animations.push(['mixamorigLeftHand', 'rotation', 'x', Math.PI / 2, '+']);
  animations.push(['mixamorigLeftHand', 'rotation', 'z', Math.PI / 6, '+']);
  animations.push(['mixamorigLeftHand', 'rotation', 'y', Math.PI / 9, '+']);

  animations.push(['mixamorigLeftForeArm', 'rotation', 'x', Math.PI / 10, '+']);
  animations.push(['mixamorigLeftForeArm', 'rotation', 'z', -Math.PI / 18, '-']);

  animations.push(['mixamorigLeftArm', 'rotation', 'x', -Math.PI / 11, '-']);

  animations.push(['mixamorigRightHandMiddle1', 'rotation', 'z', Math.PI / 2, '+']);
  animations.push(['mixamorigRightHandMiddle2', 'rotation', 'z', Math.PI / 2, '+']);
  animations.push(['mixamorigRightHandMiddle3', 'rotation', 'z', Math.PI / 2, '+']);
  animations.push(['mixamorigRightHandRing1', 'rotation', 'z', Math.PI / 2, '+']);
  animations.push(['mixamorigRightHandRing2', 'rotation', 'z', Math.PI / 2, '+']);
  animations.push(['mixamorigRightHandRing3', 'rotation', 'z', Math.PI / 2, '+']);
  animations.push(['mixamorigRightHandPinky1', 'rotation', 'z', Math.PI / 2, '+']);
  animations.push(['mixamorigRightHandPinky2', 'rotation', 'z', Math.PI / 2, '+']);
  animations.push(['mixamorigRightHandPinky3', 'rotation', 'z', Math.PI / 2, '+']);
  animations.push(['mixamorigRightHandThumb2', 'rotation', 'y', -Math.PI / 2.5, '-']);
  animations.push(['mixamorigRightHandThumb3', 'rotation', 'y', -Math.PI / 2.5, '-']);

  animations.push(['mixamorigRightHand', 'rotation', 'x', -Math.PI / 2, '-']);
  animations.push(['mixamorigRightHand', 'rotation', 'z', Math.PI / 12, '+']);

  animations.push(['mixamorigRightForeArm', 'rotation', 'z', Math.PI / 4, '+']);
  animations.push(['mixamorigRightForeArm', 'rotation', 'x', -Math.PI / 36, '-']);

  animations.push(['mixamorigRightArm', 'rotation', 'x', -Math.PI / 9, '-']);
  animations.push(['mixamorigRightArm', 'rotation', 'y', -Math.PI / 72, '-']);

  ref.animations.push(animations);

  // Reset animation
  animations = [];

  animations.push(['mixamorigLeftHandIndex1', 'rotation', 'y', 0, '+']);
  animations.push(['mixamorigLeftHandMiddle1', 'rotation', 'y', 0, '+']);
  animations.push(['mixamorigLeftHandRing1', 'rotation', 'y', 0, '-']);
  animations.push(['mixamorigLeftHandPinky1', 'rotation', 'y', 0, '-']);

  animations.push(['mixamorigLeftHand', 'rotation', 'x', 0, '-']);
  animations.push(['mixamorigLeftHand', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigLeftHand', 'rotation', 'y', 0, '-']);

  animations.push(['mixamorigLeftForeArm', 'rotation', 'x', 0, '-']);
  animations.push(['mixamorigLeftForeArm', 'rotation', 'z', 0, '+']);

  animations.push(['mixamorigLeftArm', 'rotation', 'x', 0, '+']);

  animations.push(['mixamorigRightHandMiddle1', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigRightHandMiddle2', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigRightHandMiddle3', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigRightHandRing1', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigRightHandRing2', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigRightHandRing3', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigRightHandPinky1', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigRightHandPinky2', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigRightHandPinky3', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigRightHandThumb2', 'rotation', 'y', 0, '+']);
  animations.push(['mixamorigRightHandThumb3', 'rotation', 'y', 0, '+']);

  animations.push(['mixamorigRightHand', 'rotation', 'x', 0, '+']);
  animations.push(['mixamorigRightHand', 'rotation', 'z', 0, '-']);

  animations.push(['mixamorigRightForeArm', 'rotation', 'z', 0, '-']);
  animations.push(['mixamorigRightForeArm', 'rotation', 'x', 0, '+']);

  animations.push(['mixamorigRightArm', 'rotation', 'x', 0, '+']);
  animations.push(['mixamorigRightArm', 'rotation', 'y', 0, '+']);

  ref.animations.push(animations);

  if (ref.pending === false) {
    ref.pending = true;
    ref.animate();
  }
};

## 15. The Main React Component: `SignLanguageConverter.tsx`

This is the heart of the feature — a single 709-line React component that:

- Boots a Three.js scene with ambient + directional + spot lighting and a grey background.
- Loads the selected `.glb` avatar via `GLTFLoader`, marks its `SkinnedMesh` children with `frustumCulled = false` (otherwise the avatar disappears off-camera even though it's actually inside the viewport), and calls `defaultPose` to put the arms at the sides.
- Sets up a custom animation loop (`requestAnimationFrame`) that walks the `ref.animations` queue tuple-by-tuple, nudging bone rotations by `speed` per frame until they reach their targets.
- Integrates `react-speech-recognition` for live speech-to-text.
- Accepts YouTube URLs (calls `POST /api/youtube/transcript` on the backend) and uploaded video files (uses the browser's Web Speech API to transcribe their audio).
- Renders the entire UI: video input column, avatar column, plus three control cards (Speech Recognition, Text Input, Avatar Settings).

**Target path:** `src/components/SignLanguageConverter.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';
import Slider from 'react-input-slider';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Trash2, Video, Upload, Loader2, MessageSquare, Settings } from 'lucide-react';
import * as words from '../lib/signLanguage/animations/words';
import * as alphabets from '../lib/signLanguage/animations/alphabets';
import { defaultPose } from '../lib/signLanguage/animations/defaultPose';
import type { AnimationRef } from '../lib/signLanguage/types';

const xbot = '/Models/xbot/xbot.glb';
const ybot = '/Models/ybot/ybot.glb';
const xbotPic = '/Models/xbot/xbot.png';
const ybotPic = '/Models/ybot/ybot.png';

const SignLanguageConverter: React.FC = () => {
  const [text, setText] = useState('');
  const [bot, setBot] = useState(ybot);
  const [speed, setSpeed] = useState(0.1);
  const [pause, setPause] = useState(800);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoProcessing, setVideoProcessing] = useState(false);
  const [videoText, setVideoText] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<AnimationRef>({
    flag: false,
    pending: false,
    animations: [],
    characters: [],
    scene: new THREE.Scene(),
    renderer: new THREE.WebGLRenderer(),
    camera: new THREE.PerspectiveCamera(),
    avatar: null,
    animate: () => {},
    speed: 0.1,
    pause: 800,
  });

  const textFromAudioRef = useRef<HTMLTextAreaElement>(null);
  const textFromInputRef = useRef<HTMLTextAreaElement>(null);
  const videoTextRef = useRef<HTMLTextAreaElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    const ref = componentRef.current;
    ref.flag = false;
    ref.pending = false;
    ref.animations = [];
    ref.characters = [];
    ref.speed = speed;
    ref.pause = pause;

    ref.scene = new THREE.Scene();
    ref.scene.background = new THREE.Color(0xdddddd);

    // Add ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    ref.scene.add(ambientLight);

    // Add directional light for better visibility
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    ref.scene.add(directionalLight);

    // Add spot light
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 5, 5);
    ref.scene.add(spotLight);

    ref.renderer = new THREE.WebGLRenderer({ antialias: true });

    const canvasElement = canvasRef.current;
    if (canvasElement) {
      const width = canvasElement.clientWidth;
      const height = canvasElement.clientHeight || 500;

      ref.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
      ref.renderer.setSize(width, height);

      canvasElement.innerHTML = '';
      canvasElement.appendChild(ref.renderer.domElement);

      ref.camera.position.z = 1.6;
      ref.camera.position.y = 1.4;

      const loader = new GLTFLoader();
      loader.load(
        bot,
        (gltf) => {
          gltf.scene.traverse((child) => {
            if (child.type === 'SkinnedMesh') {
              (child as any).frustumCulled = false;
            }
          });
          ref.avatar = gltf.scene;
          ref.scene.add(ref.avatar);
          defaultPose(ref);
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
          console.error('Error loading model:', error);
        }
      );
    }

    ref.animate = () => {
      if (ref.animations.length === 0) {
        ref.pending = false;
        return;
      }
      requestAnimationFrame(ref.animate);
      
      const currentAnimation = ref.animations[0];
      
      if (currentAnimation && currentAnimation.length > 0) {
        if (!ref.flag) {
          const firstElement = currentAnimation[0];
          
          if (Array.isArray(currentAnimation) && 
              currentAnimation.length === 2 && 
              typeof firstElement === 'string' && 
              firstElement === 'add-text' &&
              typeof currentAnimation[1] === 'string') {
            setText((prev) => prev + currentAnimation[1]);
            ref.animations.shift();
          } 
          else if (Array.isArray(firstElement)) {
            for (let i = 0; i < currentAnimation.length; ) {
              const animFrame = currentAnimation[i] as any;
              if (!animFrame || !Array.isArray(animFrame) || animFrame.length !== 5) {
                currentAnimation.splice(i, 1);
                continue;
              }
              const [boneName, action, axis, limit, sign] = animFrame;
              
              try {
                const bone = ref.avatar?.getObjectByName(boneName);
                if (!bone || !bone[action]) {
                  currentAnimation.splice(i, 1);
                  continue;
                }
                
                if (sign === '+' && bone[action][axis] < (limit as number)) {
                  bone[action][axis] += speed;
                  bone[action][axis] = Math.min(bone[action][axis], limit as number);
                  i++;
                } else if (sign === '-' && bone[action][axis] > (limit as number)) {
                  bone[action][axis] -= speed;
                  bone[action][axis] = Math.max(bone[action][axis], limit as number);
                  i++;
                } else {
                  currentAnimation.splice(i, 1);
                }
              } catch (e) {
                currentAnimation.splice(i, 1);
              }
            }
          } else {
            ref.animations.shift();
          }
        }
      } else {
        ref.flag = true;
        setTimeout(() => {
          ref.flag = false;
        }, pause);
        ref.animations.shift();
      }
      ref.renderer.render(ref.scene, ref.camera);
    };

    return () => {
      if (ref.renderer) {
        ref.renderer.dispose();
      }
    };
  }, [bot, speed, pause]);

  const sign = (inputRef: React.RefObject<HTMLTextAreaElement>) => {
    if (!inputRef.current?.value) return;

    const str = inputRef.current.value.toUpperCase();
    const strWords = str.split(' ');
    setText('');

    const ref = componentRef.current;

    for (const word of strWords) {
      if ((words as any)[word]) {
        ref.animations.push(['add-text', word + ' ']);
        (words as any)[word](ref);
      } else {
        const wordChars = word.split('');
        for (let index = 0; index < wordChars.length; index++) {
          const ch = wordChars[index];
          if (index === wordChars.length - 1) {
            ref.animations.push(['add-text', ch + ' ']);
          } else {
            ref.animations.push(['add-text', ch]);
          }
          if ((alphabets as any)[ch]) {
            (alphabets as any)[ch](ref);
          }
        }
      }
    }

    if (ref.pending === false) {
      ref.pending = true;
      ref.animate();
    }
  };

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const processVideoFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const videoElement = videoElementRef.current;
      if (!videoElement) {
        reject(new Error('Video element not available'));
        return;
      }

      const url = URL.createObjectURL(file);
      videoElement.src = url;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(videoElement);
      source.connect(audioContext.destination);

      videoElement.onloadedmetadata = () => {
        videoElement.muted = true;
        videoElement.play();

        const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = false;

        let fullTranscript = '';

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              fullTranscript += event.results[i][0].transcript + ' ';
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          videoElement.pause();
          URL.revokeObjectURL(url);
          reject(new Error(`Speech recognition failed: ${event.error}`));
        };

        recognition.onend = () => {
          videoElement.pause();
          URL.revokeObjectURL(url);
          resolve(fullTranscript.trim());
        };

        recognition.start();

        videoElement.onended = () => {
          recognition.stop();
        };
      };

      videoElement.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video file'));
      };
    });
  };

  const handleProcessYouTube = async () => {
    if (!videoUrl.trim()) {
      alert('Please enter a YouTube URL');
      return;
    }

    setVideoProcessing(true);
    try {
      const videoId = extractYouTubeId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      }

      // Call backend API to fetch transcript
      const response = await fetch('http://localhost:8000/api/youtube/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: videoUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch transcript');
      }

      const data = await response.json();
      
      if (data.success && data.transcript) {
        setVideoText(data.transcript);
        if (videoTextRef.current) {
          videoTextRef.current.value = data.transcript;
        }
        alert(`Successfully extracted transcript in ${data.language || 'default language'}!`);
      } else {
        throw new Error('Failed to extract transcript from video');
      }
    } catch (error) {
      console.error('Error processing YouTube video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process YouTube video';
      alert(errorMessage);
    } finally {
      setVideoProcessing(false);
    }
  };

  const handleProcessVideoFile = async () => {
    if (!videoFile) {
      alert('Please select a video file');
      return;
    }

    setVideoProcessing(true);
    try {
      const transcript = await processVideoFile(videoFile);
      setVideoText(transcript);
      if (videoTextRef.current) {
        videoTextRef.current.value = transcript;
      }
    } catch (error) {
      console.error('Error processing video file:', error);
      alert(
        'Failed to process video file.\n\n' +
        'Note: This feature requires:\n' +
        '1. Browser support for Web Speech API\n' +
        '2. Clear audio in the video\n' +
        '3. Chrome or Edge browser (recommended)\n\n' +
        'Alternatively, you can:\n' +
        '- Type the text manually\n' +
        '- Use the speech recognition feature'
      );
    } finally {
      setVideoProcessing(false);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }
      setVideoFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden video element for processing */}
      <video ref={videoElementRef} style={{ display: 'none' }} />
      
      {/* Video Player Section */}
      <Card className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Player */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Video Input</h3>
            </div>
            
            {/* Video Display Area */}
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
              {videoFile ? (
                <video
                  src={URL.createObjectURL(videoFile)}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : videoUrl ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl) || ''}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center text-gray-400 p-8">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Upload a video or enter a YouTube URL</p>
                  <p className="text-xs mt-2">The avatar will demonstrate sign language from the video content</p>
                </div>
              )}
            </div>

            {/* Video URL Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">YouTube URL</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={videoProcessing}
                  className="flex-1"
                />
                <Button
                  onClick={handleProcessYouTube}
                  disabled={videoProcessing || !videoUrl.trim()}
                  variant="secondary"
                >
                  {videoProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Or Upload Video File</Label>
              <div className="flex gap-2">
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  disabled={videoProcessing}
                  className="flex-1"
                />
                <Button
                  onClick={handleProcessVideoFile}
                  disabled={videoProcessing || !videoFile}
                  variant="secondary"
                >
                  {videoProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {videoFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {videoFile.name}
                </p>
              )}
            </div>

            {/* Extracted Text from Video */}
            {videoText && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Extracted Text</Label>
                <Textarea
                  ref={videoTextRef}
                  rows={3}
                  value={videoText}
                  onChange={(e) => setVideoText(e.target.value)}
                  className="w-full resize-none"
                />
                <Button
                  onClick={() => sign(videoTextRef)}
                  className="w-full"
                >
                  Animate from Video Text
                </Button>
              </div>
            )}
          </div>

          {/* Avatar Display */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-lg font-semibold">Sign Language Avatar</h3>
            </div>
            <Card className="p-4 bg-gray-50">
              <div
                ref={canvasRef}
                className="w-full bg-gray-100 rounded-lg"
                style={{ minHeight: '400px', maxHeight: '500px' }}
              />
              <div className="mt-4 p-3 bg-white rounded border">
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                  PROCESSED OUTPUT
                </Label>
                <div className="text-sm font-mono bg-gray-50 p-2 rounded min-h-[60px] max-h-[100px] overflow-y-auto">
                  {text || <span className="text-gray-400">Avatar will show sign language here...</span>}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speech Recognition */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Speech Recognition</h3>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2">
              Status: {listening ? <span className="text-green-600">ON</span> : <span className="text-gray-500">OFF</span>}
            </Label>
            <div className="flex gap-2">
              <Button
                onClick={startListening}
                size="sm"
                className="flex-1"
                variant={listening ? 'default' : 'outline'}
              >
                <Mic className="w-4 h-4 mr-1" />
                Start
              </Button>
              <Button
                onClick={stopListening}
                size="sm"
                className="flex-1"
                variant="outline"
              >
                <MicOff className="w-4 h-4 mr-1" />
                Stop
              </Button>
              <Button
                onClick={resetTranscript}
                size="sm"
                variant="outline"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              ref={textFromAudioRef}
              rows={3}
              value={transcript}
              placeholder="Speak and your words will appear here..."
              className="w-full resize-none mt-2"
              readOnly
            />
            <Button
              onClick={() => sign(textFromAudioRef)}
              className="w-full mt-2"
            >
              Animate from Speech
            </Button>
          </div>
        </Card>

        {/* Text Input */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Text Input</h3>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2">Type Your Message</Label>
            <Textarea
              ref={textFromInputRef}
              rows={5}
              placeholder="Type text to convert to sign language..."
              className="w-full resize-none"
            />
            <Button
              onClick={() => sign(textFromInputRef)}
              className="w-full mt-2"
            >
              Animate from Text
            </Button>
          </div>
        </Card>

        {/* Avatar Settings */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Avatar Settings</h3>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2">Select Avatar</Label>
            <div className="space-y-2">
              <img
                src={xbotPic}
                className="w-full cursor-pointer rounded border-2 hover:border-primary transition-colors"
                onClick={() => setBot(xbot)}
                alt="Avatar 1: XBOT"
              />
              <img
                src={ybotPic}
                className="w-full cursor-pointer rounded border-2 hover:border-primary transition-colors"
                onClick={() => setBot(ybot)}
                alt="Avatar 2: YBOT"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2">
              Animation Speed: {Math.round(speed * 100) / 100}
            </Label>
            <Slider
              axis="x"
              xmin={0.05}
              xmax={0.5}
              xstep={0.01}
              x={speed}
              onChange={({ x }: { x: number }) => setSpeed(x)}
              styles={{
                track: {
                  backgroundColor: '#e2e8f0',
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                },
                active: {
                  backgroundColor: '#3b82f6',
                },
                thumb: {
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#3b82f6',
                },
              }}
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2">
              Pause Time: {pause} ms
            </Label>
            <Slider
              axis="x"
              xmin={0}
              xmax={2000}
              xstep={100}
              x={pause}
              onChange={({ x }: { x: number }) => setPause(x)}
              styles={{
                track: {
                  backgroundColor: '#e2e8f0',
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                },
                active: {
                  backgroundColor: '#3b82f6',
                },
                thumb: {
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#3b82f6',
                },
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignLanguageConverter;

## 16. The Page Wrapper: `VisualSchedule.tsx`

This is a minimal page that mounts the converter. The original project also has a separate `BdslTranslator.tsx` page, but that page is a UI mockup that does **not** actually use the converter component — it just shows placeholder cards. The page that really hosts the working feature is `VisualSchedule.tsx`, shown here. (Despite the file name, this is where the Sign Language Converter actually lives in the original app.)

If you don't use the `MainLayout` wrapper component, replace the `<MainLayout>...</MainLayout>` wrapper with your own layout or just a `<div>`.

**Target path:** `src/pages/VisualSchedule.tsx`

```tsx
import { Hand } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import SignLanguageConverter from '@/components/SignLanguageConverter';

const VisualSchedulePage = () => {
  return (
    <MainLayout>
      <div className="p-8 max-w-[1800px] mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Hand className="w-8 h-8" />
          Sign Language Converter
        </h1>
        <p className="text-muted-foreground mb-6">
          Convert text or speech to sign language animations. Use the controls below to interact with the 3D avatar.
        </p>
        <SignLanguageConverter />
      </div>
    </MainLayout>
  );
};

export default VisualSchedulePage;
```

---

## 17. Backend: YouTube Transcript Endpoint (Python FastAPI)

The React component sends a `POST` to `http://localhost:8000/api/youtube/transcript` with a JSON body `{ "video_url": "..." }` and expects back `{ success, video_id, transcript, language, language_code }`.

Below is a **minimal standalone FastAPI app** that implements this endpoint. The original repo's `ai-avatar/server.py` contains additional LiveKit & payment routes that are unrelated to sign language — only the transcript endpoint is required here.

**Target path:** `backend/server.py` (or any path you choose)

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)
import re

load_dotenv()

app = FastAPI()

# Configure CORS so the React frontend can call this endpoint
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:3081",
).split(",")

FRONTEND_URL = os.environ.get("FRONTEND_URL")
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3081",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3081",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
    ] + ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)


@app.get("/")
def read_root():
    return {"message": "Sign Language Converter Backend", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


class YouTubeTranscriptRequest(BaseModel):
    video_url: str


def extract_video_id(url: str) -> str:
    """Extract video ID from various YouTube URL formats."""
    patterns = [
        r"(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)",
        r"youtube\.com\/embed\/([^&\n?#]+)",
        r"youtube\.com\/v\/([^&\n?#]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    raise ValueError("Invalid YouTube URL")


@app.post("/api/youtube/transcript")
async def get_youtube_transcript(request: YouTubeTranscriptRequest):
    """
    Fetch transcript/captions from a YouTube video using youtube-transcript-api.
    Tries English first, falls back to whatever transcript is available.
    """
    try:
        try:
            video_id = extract_video_id(request.video_url)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

            try:
                transcript = transcript_list.find_transcript(["en"])
            except NoTranscriptFound:
                available_transcripts = list(transcript_list)
                if not available_transcripts:
                    raise HTTPException(
                        status_code=404,
                        detail="No transcripts available for this video",
                    )
                transcript = available_transcripts[0]

            transcript_data = transcript.fetch()

            full_text = " ".join([entry["text"] for entry in transcript_data])
            full_text = " ".join(full_text.split())  # normalise whitespace

            return {
                "success": True,
                "video_id": video_id,
                "transcript": full_text,
                "language": transcript.language,
                "language_code": transcript.language_code,
            }

        except TranscriptsDisabled:
            raise HTTPException(
                status_code=403,
                detail="Transcripts are disabled for this video",
            )
        except VideoUnavailable:
            raise HTTPException(
                status_code=404,
                detail="Video not found or unavailable",
            )
        except NoTranscriptFound:
            raise HTTPException(
                status_code=404,
                detail="No transcripts found for this video",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching YouTube transcript: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

## 18. Required Backend Python Dependencies

Save this as `backend/requirements.txt`:

```
fastapi
uvicorn[standard]
youtube-transcript-api
python-dotenv
pydantic
```

Then `pip install -r requirements.txt`.

Optionally create a `backend/.env`:

```
# Comma-separated list of additional CORS origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# (Optional) Public frontend URL for production CORS
FRONTEND_URL=https://your-app.example.com
```

---

## 19. Deep Dive: How the Animation System Works

### 19.1 The shared ref object

The whole feature is driven by a single mutable object stored in a React `useRef`. Its shape is defined in `types.ts` (§7). The component allocates one at mount:

```tsx
const componentRef = useRef<AnimationRef>({
  flag: false,           // when true, the loop is paused waiting `pause` ms
  pending: false,        // true while animate() is running, prevents double-starts
  animations: [],        // queue of animation arrays to apply
  characters: [],        // legacy, populated by defaultPose() — unused by main code
  scene: new THREE.Scene(),
  renderer: new THREE.WebGLRenderer(),
  camera: new THREE.PerspectiveCamera(),
  avatar: null,          // populated after GLTFLoader callback
  animate: () => {},     // assigned inside useEffect
  speed: 0.1,            // radians per frame to nudge each bone
  pause: 800,            // ms gap between consecutive signs
});
```

### 19.2 The animation tuple format

Every primitive bone movement is a 5-element array:

```js
[boneName, action, axis, limit, sign]

// boneName : string, the Mixamo bone name, e.g. "mixamorigRightHand"
// action  : string, the THREE.Object3D property whose component to nudge,
//           almost always "rotation" (could also be "position" or "scale")
// axis    : "x" | "y" | "z"
// limit   : number, the target value (radians) to reach
// sign    : "+" | "-", direction of nudge
```

Per frame, the animator does roughly:

```js
if (sign === "+" && bone[action][axis] < limit) {
  bone[action][axis] = Math.min(bone[action][axis] + speed, limit);
} else if (sign === "-" && bone[action][axis] > limit) {
  bone[action][axis] = Math.max(bone[action][axis] - speed, limit);
} else {
  /* this tuple is done, remove it from the current array */
}
```

### 19.3 The queue (`ref.animations`)

`ref.animations` is an array of arrays. Each outer element is one *frame of activity*, which is either:

- An array of 5-tuples (the bone nudges to make until they all complete);
- A 2-element array `['add-text', '...string...']` (instruction to append text to the on-screen output panel and immediately move on).

Sign functions (e.g. `A(ref)`) typically push **two** such arrays in sequence: first the target pose, then a reset-to-zero pose. This makes every sign self-contained — after the hand performs the letter A, it springs back to a neutral stance before the next letter begins.

### 19.4 The animate loop

Inside `useEffect`, `ref.animate` is assigned a function that:

1. If `ref.animations` is empty, sets `pending = false` and returns (loop self-terminates).
2. Otherwise requests another animation frame, then inspects `ref.animations[0]`.
3. If it's an `['add-text', '...']` entry, appends the string to React state and shifts the entry off.
4. If it's an array of bone tuples, iterates over them, nudging each bone. Removes completed tuples in-place. When the inner array becomes empty, the outer entry has nothing left to do and gets shifted off — but first `flag` is set true and a `setTimeout` schedules clearing it after `pause` ms, creating the inter-sign gap.
5. Calls `ref.renderer.render(ref.scene, ref.camera)` each frame.

### 19.5 Why `frustumCulled = false` on SkinnedMesh

GLTF skinned meshes have their bounding boxes computed at bind time. After the rig deforms, the visible vertices can be far outside that original box. Three.js's default frustum culling will then mark the avatar as off-screen and skip rendering it, even when it is clearly in the camera's view. The component disables culling per skinned mesh:

```js
gltf.scene.traverse((child) => {
  if (child.type === "SkinnedMesh") {
    (child as any).frustumCulled = false;
  }
});
```

Without this line the avatar disappears the moment its rest-pose AABB drifts out of the frustum.

### 19.6 Camera framing

Camera placement is tuned for the Mixamo rig's roughly 1.8-unit-tall avatar standing at the origin:

```js
ref.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
ref.camera.position.z = 1.6;
ref.camera.position.y = 1.4;
```

Field of view 30° gives a flattering, almost portrait-lens look; `y = 1.4` is roughly head height so the camera is at eye-level.

### 19.7 Lighting

```js
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
ref.scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
ref.scene.add(directionalLight);

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 5, 5);
ref.scene.add(spotLight);
```

A standard three-light setup: ambient for overall illumination so no part of the avatar goes pitch-black, a directional light from upper-right for primary modelling, and a spotlight from above-front for additional rim/face highlighting.

---

## 20. Extending: How to Add New Signs (Alphabets or Words)

### 20.1 Add a new word sign (e.g. `HELLO`)

**Step 1.** Create `src/lib/signLanguage/animations/Words/HELLO.js`:

```js
export const HELLO = (ref) => {
  let animations = [];

  // POSE PHASE — push the bones into the gesture
  animations.push(["mixamorigRightHand",    "rotation", "x", -Math.PI / 2.5, "-"]);
  animations.push(["mixamorigRightForeArm", "rotation", "x", -Math.PI / 4,   "-"]);
  animations.push(["mixamorigRightArm",     "rotation", "z",  Math.PI / 3,   "+"]);
  // ... add as many bone tuples as the gesture needs
  ref.animations.push(animations);

  // RESET PHASE — return the same bones to zero so chained signs work
  animations = [];
  animations.push(["mixamorigRightHand",    "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightForeArm", "rotation", "x", 0, "+"]);
  animations.push(["mixamorigRightArm",     "rotation", "z", 0, "-"]);
  ref.animations.push(animations);

  if (ref.pending === false) {
    ref.pending = true;
    ref.animate();
  }
};
```

**Step 2.** Register it in `src/lib/signLanguage/animations/words.js`:

```js
import { TIME } from "./Words/TIME";
import { HOME } from "./Words/HOME";
import { PERSON } from "./Words/PERSON";
import { YOU } from "./Words/YOU";
import { HELLO } from "./Words/HELLO";   // ← added

var wordList = ["TIME", "HOME", "PERSON", "YOU", "HELLO"];   // ← added

export {
    TIME, HOME, PERSON, YOU, HELLO, wordList   // ← added
};
```

That's it. The main component does `if ((words as any)[word]) { ... (words as any)[word](ref); ... }`, so any uppercase-keyed export from this barrel becomes a recognised word.

### 20.2 Replace or add an alphabet letter

Same pattern but in `Alphabets/` (capital A). The function name must be the single uppercase character it represents. To override an existing letter, just edit that file in place — the barrel `alphabets.js` already imports all 26.

### 20.3 Tuning a sign visually — degrees ↔ radians cheat sheet

The `Math.PI / N` denominators are the angular targets. Larger `N` → smaller rotation.

| Expression | Radians | Degrees |
|---|---|---|
| `Math.PI / 2` | 1.5708 | 90° |
| `Math.PI / 3` | 1.0472 | 60° |
| `Math.PI / 4` | 0.7854 | 45° |
| `Math.PI / 6` | 0.5236 | 30° |
| `Math.PI / 9` | 0.3491 | 20° |
| `Math.PI / 12` | 0.2618 | 15° |
| `Math.PI / 18` | 0.1745 | 10° |

If a finger curls the wrong way, flip the `sign` between `"+"` and `"-"` **and** negate the `limit`. To iterate quickly, edit the file, save, watch hot-reload, and re-trigger the letter by typing it again.

### 20.4 The standard Mixamo bone names

Every animation file uses these prefixed names. Knowing them is essential for authoring new signs:

| Body region | Bones |
|---|---|
| Head/neck | `mixamorigNeck`, `mixamorigHead` |
| Right arm | `mixamorigRightArm`, `mixamorigRightForeArm`, `mixamorigRightHand` |
| Right fingers | `mixamorigRightHandThumb1/2/3`, `mixamorigRightHandIndex1/2/3`, `mixamorigRightHandMiddle1/2/3`, `mixamorigRightHandRing1/2/3`, `mixamorigRightHandPinky1/2/3` |
| Left arm | `mixamorigLeftArm`, `mixamorigLeftForeArm`, `mixamorigLeftHand` |
| Left fingers | `mixamorigLeftHandThumb1/2/3`, ...`Index1/2/3`, ...`Middle1/2/3`, ...`Ring1/2/3`, ...`Pinky1/2/3` |

Each finger has three phalanx bones: `1` (knuckle), `2` (PIP joint), `3` (DIP joint). To curl a whole finger into a fist, push all three towards `Math.PI / 2` on the `z` axis (right hand) or `-Math.PI / 2` (left hand).

---

## 21. Required shadcn/ui Components

The main `SignLanguageConverter.tsx` component imports these from `@/components/ui/...`:

| Import | shadcn command to install |
|---|---|
| `Button` | `npx shadcn@latest add button` |
| `Card` | `npx shadcn@latest add card` |
| `Label` | `npx shadcn@latest add label` |
| `Textarea` | `npx shadcn@latest add textarea` |
| `Input` | `npx shadcn@latest add input` |

If you do **not** want to pull in shadcn/ui, replace these imports with plain HTML elements:

```tsx
// replace:  import { Button } from '@/components/ui/button';
// with:     const Button = (p: any) => <button {...p} />;

// replace:  import { Card } from '@/components/ui/card';
// with:     const Card = (p: any) => <div {...p} />;

// replace:  import { Label } from '@/components/ui/label';
// with:     const Label = (p: any) => <label {...p} />;

// replace:  import { Textarea } from '@/components/ui/textarea';
// with:     const Textarea = React.forwardRef<HTMLTextAreaElement, any>((p, ref) =>
//             <textarea ref={ref} {...p} />
//           );

// replace:  import { Input } from '@/components/ui/input';
// with:     const Input = (p: any) => <input {...p} />;
```

The styling will look unstyled, but functionality is identical.

The `lucide-react` icon imports (`Mic`, `MicOff`, `Trash2`, `Video`, `Upload`, `Loader2`, `MessageSquare`, `Settings`, `Hand`) can all be replaced with emoji or plain SVG if you don't want that dependency either.

---

## 22. Troubleshooting Common Issues

### "The avatar loads but disappears as soon as I trigger a sign"

You forgot to set `frustumCulled = false` on the skinned meshes. Re-check the GLTFLoader callback in `SignLanguageConverter.tsx` around line 99-103. The deformed avatar exits its rest-pose bounding box and Three.js culls it.

### "Console says 'Cannot read properties of undefined (reading rotation)'"

The animation tuple is referencing a bone name that doesn't exist on this rig. Either:

- Your `.glb` is not from Mixamo and uses different bone names → re-export from Mixamo, or rename every bone reference in every alphabet/word file.
- The bone names are correct but the GLB hasn't finished loading yet → make sure no sign function is called before the `loader.load(..., (gltf) => { ... })` callback has fired and `ref.avatar` is non-null.

### "The avatar loads but the sliders don't change anything"

The `useEffect` that builds the scene has `[bot, speed, pause]` in its dependency array. Each slider drag re-runs the effect, dispoes the renderer, and recreates the scene. This is intentional but can flicker. To avoid flicker, you can move `speed` and `pause` reads inside `ref.animate` and remove them from the deps array, then only the bot dependency causes a full rebuild.

### "react-speech-recognition: 'Browser does not support speech recognition'"

Chrome and Edge support the Web Speech API; Firefox and Safari historically do not (or only partially). Test in Chrome first. Also, microphone permission must be granted to the page.

### "YouTube transcript fetch fails with CORS"

The `/api/youtube/transcript` URL in `SignLanguageConverter.tsx` is hardcoded as `http://localhost:8000`. If your backend is on a different origin, add that origin to the `ALLOWED_ORIGINS` env var of the FastAPI server, and update the URL in the component.

### "youtube-transcript-api returns NoTranscriptFound for every video"

Some videos genuinely have no captions. The endpoint falls back to "the first available transcript" if English isn't found, but if the video has *zero* captions of any kind, you'll get a 404. Try a TED talk or any news video — those almost always have captions.

### "Uploaded video file processing fails"

The `processVideoFile` function uses the browser's Web Speech API to listen to the video's playback audio. This only works in Chrome/Edge, requires microphone permission (even though no microphone is used — it's a quirk of the API), and is unreliable. As a fallback, ask the user to paste the transcript manually into the text input.

### "Vite cannot resolve 'three/addons/loaders/GLTFLoader.js'"

This import path is the one Three.js uses for its addon modules from r150+. If you're on an older Three.js version, change it to:

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
```

### "Build succeeds but the GLB doesn't load in production"

Vite serves `public/` files at the root in development but they need to be present in the build output. Check that `dist/Models/xbot/xbot.glb` exists after `npm run build`. If not, verify the files really are under `public/Models/...` in your source tree and not somewhere else.

### "Animation is jittery or too slow"

The `speed` value (default `0.1` radians per frame) is the maximum rotation step per animation frame. Higher values make signs snappier but less natural; lower values are smoother but feel sluggish. Tune via the in-UI slider or change the initial value in the `useState`. The `pause` value (default `800` ms) is the gap between consecutive signs; lower it for faster signing speed at the cost of clarity.

---

## Appendix A: Original Repository Reference

This documentation extracts the Sign Language Converter feature from:

- **Repository:** `ankon07/synapZ-AI`
- **License:** MIT (per the project's README)
- **Key paths within the original tree:**
  - `synapz-learn-connect/src/components/SignLanguageConverter.tsx`
  - `synapz-learn-connect/src/lib/signLanguage/`
  - `synapz-learn-connect/src/pages/VisualSchedule.tsx`
  - `synapz-learn-connect/public/Models/`
  - `ai-avatar/server.py` (YouTube transcript endpoint)

## Appendix B: Quick Sanity-Check After Setup

After completing all the setup steps above, run through this 60-second smoke test:

1. `npm run dev` — Vite starts on port 5173.
2. Open `/sign-language` (or whatever route you used).
3. Avatar should appear within ~2 seconds in the right column.
4. Type `HELLO` in the "Type Your Message" box and click **Animate from Text**.
5. Since `HELLO` is not in the word dictionary, the avatar will finger-spell H, E, L, L, O. Watch each letter appear in the "PROCESSED OUTPUT" box as the corresponding hand gesture plays.
6. Type `HOME` and click animate — this time the avatar should perform a single "roof shape" gesture rather than spelling H-O-M-E.
7. Drag the speed slider — sign speed visibly changes.
8. Click the xbot.png thumbnail — avatar swaps to xbot mid-session.

If all 8 work, the feature is fully integrated.

---

**End of document.** Every file referenced above is reproduced in full in sections 7 through 17. The total markdown is intentionally exhaustive so you can drop the feature into a new project by copy-pasting one file at a time without referring back to the original repository.
