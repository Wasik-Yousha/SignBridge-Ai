# SignBridge AI — Frontend Implementation Plan

**Version:** 1.0  
**Last Updated:** February 28, 2026  
**Frontend Stack:** React 19 · Vite 7 · Tailwind 4 · @react-three/fiber · Zustand  

---

## Current State

The frontend already has a clean architecture with:
- ✅ React Router (/ and /about pages)
- ✅ Layout components (Navbar, Footer, RootLayout)
- ✅ UI components (FeatureCard, InfoCard, TabSwitch, TechBadge, SocialIcon)
- ✅ Translator feature module (InputPanel, AvatarPanel, PlayerControls, Transcript)
- ✅ Custom hook (useTranslator — word-by-word playback)
- ✅ Constants & utilities
- ✅ Pages (HomePage, AboutPage)

**What's missing:** 3D avatar, sign language data, backend API integration, state management upgrade, and several UX features.

---

## Phase 1: Cleanup & Infrastructure

### Step 1.1 — Delete dead code
- [ ] Delete `src/SignBridgeApp.jsx` (old 311-line monolith, not imported anywhere)

### Step 1.2 — Install new dependencies
- [ ] Install 3D packages: `npm install three @react-three/fiber @react-three/drei`
- [ ] Install state management: `npm install zustand`
- [ ] Verify: `npm run build` succeeds with new deps

### Step 1.3 — Configure path aliases (optional but recommended)
- [ ] Update `vite.config.js` to add `@/` alias pointing to `src/`:
  ```javascript
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  }
  ```
- [ ] This allows imports like `import { api } from '@/services'` instead of `'../../../services'`

### Step 1.4 — Add lazy loading for 3D scene
- [ ] In `HomePage.jsx`, wrap the avatar import with `React.lazy()`:
  ```javascript
  const AvatarScene = React.lazy(() => import('@/features/avatar/components/AvatarScene'));
  ```
- [ ] Wrap with `<Suspense fallback={<AvatarLoadingPlaceholder />}>` 
- [ ] Create `AvatarLoadingPlaceholder` component (shows skeleton/spinner while Three.js loads)
- [ ] This prevents the ~150KB Three.js bundle from blocking initial page paint

### Step 1.5 — Add error boundary for 3D
- [ ] Create `src/components/common/ErrorBoundary.jsx`:
  - [ ] Catches render errors from child components
  - [ ] Shows fallback UI: "3D rendering failed. Your browser may not support WebGL."
  - [ ] Provides "Try Again" button
- [ ] Wrap `<AvatarScene />` with this error boundary

---

## Phase 2: 3D Avatar Setup (Critical Path)

> **This is the most important phase.** Everything else depends on the avatar being able to display signs.

### Step 2.1 — Get the avatar model
- [ ] Export or place your local Mixamo-compatible avatar as `/public/avatar.glb`
  - Choose a neutral, professional-looking character
  - Export as `.glb` format
  - Download quality: "High" (includes finger bones)
- [ ] Save to `public/models/avatar.glb`
- [ ] Verify file size is 2–5 MB

### Step 2.2 — Create the avatar feature module structure
- [ ] Create `src/features/avatar/` directory
- [ ] Create `src/features/avatar/components/` directory
- [ ] Create `src/features/avatar/hooks/` directory
- [ ] Create `src/features/avatar/services/` directory
- [ ] Create barrel exports (`index.js`) for each subdirectory

### Step 2.3 — Create AvatarScene component
- [ ] Create `src/features/avatar/components/AvatarScene.jsx`:
  - [ ] R3F `<Canvas>` with:
    - Camera: perspective, position [0, 1.2, 2.5] (looking at upper body)
    - Background: transparent (inherits page bg)
    - Antialiasing enabled
    - Pixel ratio: `Math.min(window.devicePixelRatio, 2)` (cap for performance)
  - [ ] Lighting:
    - Ambient light (intensity 0.5)
    - Directional light from upper-right (intensity 1.0, casts shadows)
    - Fill light from left (intensity 0.3)
  - [ ] Load avatar model via `useGLTF('/models/avatar.glb')`
  - [ ] Render `<SignAvatar>` component with the loaded model
  - [ ] Optional: `<OrbitControls>` for debug (disable in production)

### Step 2.4 — Create SignAvatar component
- [ ] Create `src/features/avatar/components/SignAvatar.jsx`:
  - [ ] Receive loaded GLTF scene/nodes/materials as props
  - [ ] Set up `<primitive object={scene} />` to render the model
  - [ ] Find and store references to all bone objects:
    ```javascript
    const bones = useMemo(() => {
      const boneMap = {};
      scene.traverse((child) => {
        if (child.isBone) {
          boneMap[child.name] = child;
        }
      });
      return boneMap;
    }, [scene]);
    ```
  - [ ] Log all bone names to console (needed for mapping sign data to actual bone names)
  - [ ] Accept `currentSign` prop — the sign data to animate
  - [ ] Use `useFrame()` to interpolate bone rotations each frame:
    - Read `currentSign.keyframes`
    - Calculate current keyframe based on elapsed time
    - SLERP between keyframe quaternions
    - Apply to corresponding bones

### Step 2.5 — Verify avatar renders
- [ ] Run `npm run dev`
- [ ] Navigate to home page
- [ ] Verify: 3D avatar appears in the avatar display area
- [ ] Verify: Avatar is properly lit and positioned
- [ ] Verify: No console errors
- [ ] Verify: 60fps (check with browser DevTools Performance tab)
- [ ] Open console → verify bone names are logged (need these for Step 3)

### Step 2.6 — Create bone name mapping
- [ ] From the console log in Step 2.5, record all bone names
- [ ] Create `src/features/avatar/constants/boneNames.js`:
  - Map standardized keys to Mixamo names via `src/avatar/boneMap.js`
  - Mixamo typically uses `mixamorigRightHandIndex1`, `mixamorigRightHandIndex2`, `mixamorigRightHandIndex3`, etc.
  - Document each bone's purpose

---

## Phase 3: Sign Language Data

### Step 3.1 — Create fingerspelling data
- [ ] Create `src/data/fingerspelling.js`:
  - [ ] Define 26 entries (A–Z), each with:
    - `duration`: 400ms (time to hold each letter pose)
    - `bones`: Object mapping bone names → quaternion `{x, y, z, w}`
  - [ ] Reference: ASL manual alphabet chart
  - [ ] Start with 5 letters (A, B, C, H, I) → test → expand to all 26
  - [ ] Each letter requires setting rotations for ~15 bones (3 per finger × 5 fingers)
  - [ ] Special cases: J and Z involve motion (multiple keyframes)

### Step 3.2 — Create common signs data
- [ ] Create `src/data/signs.js`:
  - [ ] Start with 10 essential signs:
    1. `hello` — open hand wave near head
    2. `thank-you` — flat hand from chin forward
    3. `yes` — fist nod
    4. `no` — index+middle fingers snap to thumb
    5. `please` — open hand circles on chest
    6. `sorry` — fist circles on chest
    7. `help` — fist on open palm, lift up
    8. `name` — two fingers tap on two fingers
    9. `want` — clawed hands pull toward body
    10. `like` — thumb+middle finger from chest, pull out
  - [ ] Each sign has `keyframes[]` with `time` (ms) and `bones` (quaternion map)
  - [ ] Each sign has `duration` (total ms)
  - [ ] Expand to ~50 signs over time

### Step 3.3 — Create sign dictionary
- [ ] Create `src/data/signDictionary.js`:
  - [ ] Map words to sign IDs: `{ "hello": "hello", "hi": "hello", "hey": "hello" }`
  - [ ] Include common synonyms for each sign
  - [ ] Export `hasSign(word)` function → boolean
  - [ ] Export `getSignId(word)` function → sign ID or null

### Step 3.4 — Create neutral/idle pose
- [ ] Define `IDLE_POSE` in sign data:
  - Arms relaxed at sides
  - Fingers slightly curled (natural rest position)
  - Used as the starting/ending pose for all signs
  - All transitions blend from/to this pose

---

## Phase 4: Animation Engine

### Step 4.1 — Create sign router service
- [ ] Create `src/features/avatar/services/signRouter.js`:
  - [ ] Function `resolveSign(word: string) -> SignData`:
    1. Lowercase the word
    2. Look up in `SIGN_DICTIONARY` → if found, return sign from `SIGNS`
    3. If not found, generate fingerspelling sequence:
       - Break word into letters
       - Map each letter to `FINGERSPELLING[letter]`
       - Return as a multi-keyframe sign with transitions between letters
    4. Return sign data object with type: `'sign'` or `'fingerspell'`
  - [ ] Function `resolveSequence(words: string[]) -> SignData[]`:
    - Map each word through `resolveSign`
    - Insert 200ms transition pause between each sign

### Step 4.2 — Create animation hook
- [ ] Create `src/features/avatar/hooks/useAvatarAnimation.js`:
  - [ ] State machine: `idle` → `signing` → `transitioning` → `idle`
  - [ ] Receives: `signSequence[]`, `isPlaying`, `speed`, `currentWordIndex`
  - [ ] Outputs: `currentBoneRotations` (quaternion map for current frame)
  - [ ] Uses `useFrame()` internally for 60fps updates:
    ```
    Each frame:
      1. Calculate elapsed time since sign started
      2. Find current keyframe pair (before/after)
      3. SLERP between keyframe quaternions using interpolation factor
      4. When sign completes → emit 'signComplete' → advance to next word
      5. Between signs → 200ms transition (SLERP from end pose to next start pose)
    ```
  - [ ] Respect `speed` multiplier: elapsed *= speed
  - [ ] Handle `pause`: freeze elapsed time
  - [ ] Handle `jumpToWord(index)`: immediately start that sign

### Step 4.3 — Wire animation to avatar
- [ ] Update `SignAvatar.jsx`:
  - [ ] Consume `useAvatarAnimation` hook
  - [ ] Apply `currentBoneRotations` to bones each frame
  - [ ] Smooth SLERP factor: 0.15 per frame (prevents jarring snaps)

### Step 4.4 — Test animation
- [ ] Hardcode a test sign sequence: `["hello", "world"]`
- [ ] Verify: Avatar performs "hello" sign → transitions → fingerspells "W-O-R-L-D"
- [ ] Verify: Transitions are smooth (no visible jumps)
- [ ] Verify: Speed matches expected duration
- [ ] Test at 0.5x and 1.5x speed

---

## Phase 5: State Management Migration

### Step 5.1 — Create Zustand stores
- [ ] Create `src/stores/useTranslatorStore.js`:
  ```javascript
  {
    inputText: '',
    activeTab: 'text',        // 'text' | 'video'
    videoUrl: '',
    processedWords: [],
    isProcessing: false,
    error: null,
    // Actions
    setInputText, setActiveTab, setVideoUrl,
    processText, transcribeVideo, clearError
  }
  ```
- [ ] Create `src/stores/usePlaybackStore.js`:
  ```javascript
  {
    isPlaying: false,
    currentWordIndex: -1,
    speed: 1,                 // 0.5 | 1 | 1.5
    signSequence: [],         // Resolved sign data for all words
    // Actions
    play, pause, reset, togglePlay,
    setSpeed, nextWord, jumpToWord,
    setSignSequence
  }
  ```
- [ ] Create barrel export `src/stores/index.js`

### Step 5.2 — Migrate from useTranslator hook
- [ ] Replace `useTranslator` hook usage in `HomePage.jsx` with Zustand stores
- [ ] Update `InputPanel` to read/write from `useTranslatorStore`
- [ ] Update `PlayerControls` to read/write from `usePlaybackStore`
- [ ] Update `Transcript` to read from both stores
- [ ] Delete or deprecate `src/features/translator/hooks/useTranslator.js`

### Step 5.3 — Connect stores to avatar
- [ ] `usePlaybackStore.currentWordIndex` drives which sign is active
- [ ] `usePlaybackStore.signSequence[currentWordIndex]` feeds into `useAvatarAnimation`
- [ ] When avatar completes a sign → calls `usePlaybackStore.nextWord()`
- [ ] When playback reaches end → calls `usePlaybackStore.reset()` + sets `isPlaying = false`

---

## Phase 6: Backend API Integration

### Step 6.1 — Create API service
- [ ] Create `src/services/api.js`:
  - [ ] `const BASE_URL = 'http://localhost:8000'`
  - [ ] Function `checkHealth() -> { status, whisper_loaded, ollama_available }`:
    - GET `/api/health`
    - Used on app load to check if backend is running
  - [ ] Function `transcribeVideo(url: string) -> { text, words, duration }`:
    - POST `/api/transcribe` with `{ url }`
    - Includes timeout: 30 seconds
    - Throws descriptive error on failure
  - [ ] Function `processText(text: string) -> { processed_words, changes }`:
    - POST `/api/process-text` with `{ text }`
    - Timeout: 10 seconds
    - On failure: return `null` (frontend falls back to simple split)
  - [ ] All functions handle network errors with user-friendly messages

### Step 6.2 — Wire transcription flow
- [ ] Update `useTranslatorStore.transcribeVideo`:
  1. Set `isProcessing = true`
  2. Call `api.transcribeVideo(videoUrl)`
  3. Set `inputText` to transcribed text
  4. Process text through `api.processText()` or fallback
  5. Set `processedWords`
  6. Set `isProcessing = false`
  7. On error: Set `error` message, `isProcessing = false`

### Step 6.3 — Wire text processing flow
- [ ] Update `useTranslatorStore.processText`:
  1. If backend available → call `api.processText(inputText)`
  2. If backend unavailable → use local `splitIntoWords()` from utils
  3. Resolve sign sequence via `signRouter.resolveSequence(words)`
  4. Set `usePlaybackStore.signSequence`
  5. Auto-start playback: `usePlaybackStore.play()`

### Step 6.4 — Update InputPanel for video mode
- [ ] When `activeTab === 'video'`:
  - [ ] Show single-line URL input instead of textarea
  - [ ] Placeholder: "Paste YouTube or video link here..."
  - [ ] URL validation (basic format check)
- [ ] When `activeTab === 'text'`:
  - [ ] Show textarea (existing behavior)
- [ ] Convert button: show loading spinner during processing
- [ ] Show error message inline if processing fails

### Step 6.5 — Backend status indicator
- [ ] On app mount, call `api.checkHealth()`
- [ ] If backend is unreachable:
  - [ ] Disable "Video Link" tab (grayed out with tooltip: "Start backend to enable video transcription")
  - [ ] Text mode still works (local processing only)
  - [ ] Show subtle banner: "Backend offline — video transcription unavailable"
- [ ] If backend is healthy:
  - [ ] Both tabs fully functional
  - [ ] No banner

---

## Phase 7: UX Polish & Features

### Step 7.1 — Working speed control
- [ ] Update `PlayerControls.jsx`:
  - [ ] Replace hardcoded "1x" label with actual speed value
  - [ ] Click cycles through: 0.5x → 1x → 1.5x → 0.5x
  - [ ] Speed multiplies animation duration (0.5x = 2× slower, 1.5x = 1.5× faster)
  - [ ] Visual feedback: current speed highlighted

### Step 7.2 — Clickable transcript words
- [ ] Update `Transcript.jsx`:
  - [ ] Each word chip is a `<button>`
  - [ ] onClick: `usePlaybackStore.jumpToWord(index)`
  - [ ] Avatar immediately starts signing that word
  - [ ] Cursor: pointer on hover
  - [ ] Tooltip: "Click to jump to this sign"

### Step 7.3 — Fullscreen avatar
- [ ] Wire the Expand button in `AvatarPanel.jsx`:
  - [ ] Use browser Fullscreen API on the canvas container
  - [ ] Toggle icon: Expand ↔ Minimize
  - [ ] Maintain animation state during fullscreen transition

### Step 7.4 — Loading & error UI components
- [ ] Create `src/components/ui/LoadingSpinner.jsx`:
  - [ ] Animated spinner with optional label text
  - [ ] Used during: video transcription, text processing
- [ ] Create `src/components/ui/ErrorMessage.jsx`:
  - [ ] Red/orange alert box with error text
  - [ ] Dismissable (X button)
  - [ ] Used for: API errors, validation errors

### Step 7.5 — Web Speech API (bonus mic input)
- [ ] Create `src/hooks/useSpeechRecognition.js`:
  - [ ] Wraps `window.SpeechRecognition` / `webkitSpeechRecognition`
  - [ ] Returns: `{ isListening, transcript, startListening, stopListening, isSupported }`
  - [ ] Language: `'en-US'`
  - [ ] Continuous: false (single utterance)
  - [ ] Interim results: true (show while speaking)
- [ ] Add microphone button to `InputPanel`:
  - [ ] Only shown if `isSupported`
  - [ ] Click: toggle recording
  - [ ] Transcript fills into textarea
  - [ ] Visual: pulsing red dot while recording

### Step 7.6 — Responsive design check
- [ ] Test on mobile viewport (375px width):
  - [ ] Grid collapses to single column
  - [ ] Avatar canvas resizes properly
  - [ ] Controls remain usable with touch
  - [ ] Video link input works on mobile
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1280px+)

---

## Phase 8: Final Integration & Testing

### Step 8.1 — Full flow testing: Text mode
- [ ] Type "Hello, my name is Sarah" in text input
- [ ] Click "Convert to Sign Language"
- [ ] Verify: Text processed (articles/prepositions removed)
- [ ] Verify: Avatar signs "hello" (full sign animation)
- [ ] Verify: Avatar signs "my" (full sign or fingerspell)
- [ ] Verify: Avatar signs "name" (full sign)
- [ ] Verify: Avatar fingerspells "S-A-R-A-H"
- [ ] Verify: Each word highlighted in transcript as it's signed
- [ ] Verify: Progress bar advances correctly
- [ ] Test: Pause → resume → verify playback continues correctly
- [ ] Test: Click word "name" in transcript → avatar jumps to that sign
- [ ] Test: Speed 0.5x → verify slower. Speed 1.5x → verify faster.

### Step 8.2 — Full flow testing: Video mode
- [ ] Ensure backend is running
- [ ] Switch to "Video Link" tab
- [ ] Paste a short YouTube video URL (~30 seconds)
- [ ] Click "Convert to Sign Language"
- [ ] Verify: Loading spinner appears
- [ ] Verify: After 3–10 seconds, transcript text appears
- [ ] Verify: Avatar begins signing the transcribed text
- [ ] Verify: Same playback controls work as text mode

### Step 8.3 — Error case testing
- [ ] Backend not running → "Video Link" tab disabled, text mode works locally
- [ ] Invalid YouTube URL → helpful error message
- [ ] Empty text input → convert button disabled / validation warning
- [ ] WebGL unavailable → error boundary shows fallback message
- [ ] Network drops during transcription → timeout error message

### Step 8.4 — Performance testing
- [ ] Verify: 60fps during signing animation (DevTools → Performance)
- [ ] Verify: Page loads in < 3 seconds (Three.js lazy loaded)
- [ ] Verify: No memory leaks (DevTools → Memory, sign 10 different texts sequentially)
- [ ] Verify: Text processing < 1 second
- [ ] Verify: Avatar transitions are smooth (200ms, no visible jank)

### Step 8.5 — Build verification
- [ ] Run `npm run lint` → zero errors
- [ ] Run `npm run build` → succeeds
- [ ] Run `npm run preview` → app works in production mode
- [ ] Check bundle size: Three.js chunk should be lazy-loaded, main bundle < 100KB gzipped

---

## Implementation Priority & Dependencies

```
Phase 1 (Cleanup)
    │
    ▼
Phase 2 (Avatar) ◄──── CRITICAL: Everything depends on this
    │
    ├──▶ Phase 3 (Sign Data) ◄──── HARD: Manual bone rotation authoring
    │       │
    │       ▼
    │    Phase 4 (Animation Engine) ◄──── Wires data to avatar
    │
    ├──▶ Phase 5 (Zustand) ◄──── Can be done in parallel with Phase 3
    │
    └──▶ Phase 6 (API Integration) ◄──── Depends on backend being done
            │
            ▼
         Phase 7 (Polish) ◄──── After core features work
            │
            ▼
         Phase 8 (Testing) ◄──── Final verification
```

---

## File Checklist Summary

### New Files to Create

| # | File | Phase |
|---|------|-------|
| 1 | `src/features/avatar/components/AvatarScene.jsx` | 2 |
| 2 | `src/features/avatar/components/SignAvatar.jsx` | 2 |
| 3 | `src/features/avatar/components/index.js` | 2 |
| 4 | `src/features/avatar/hooks/useAvatarAnimation.js` | 4 |
| 5 | `src/features/avatar/hooks/index.js` | 4 |
| 6 | `src/features/avatar/services/signRouter.js` | 4 |
| 7 | `src/features/avatar/services/index.js` | 4 |
| 8 | `src/features/avatar/constants/boneNames.js` | 2 |
| 9 | `src/features/avatar/index.js` | 2 |
| 10 | `src/data/fingerspelling.js` | 3 |
| 11 | `src/data/signs.js` | 3 |
| 12 | `src/data/signDictionary.js` | 3 |
| 13 | `src/services/api.js` | 6 |
| 14 | `src/services/index.js` | 6 |
| 15 | `src/hooks/useSpeechRecognition.js` | 7 |
| 16 | `src/hooks/index.js` | 7 |
| 17 | `src/stores/useTranslatorStore.js` | 5 |
| 18 | `src/stores/usePlaybackStore.js` | 5 |
| 19 | `src/stores/index.js` | 5 |
| 20 | `src/components/ui/LoadingSpinner.jsx` | 7 |
| 21 | `src/components/ui/ErrorMessage.jsx` | 7 |
| 22 | `src/components/common/ErrorBoundary.jsx` | 1 |
| 23 | `public/models/avatar.glb` | 2 (manual download) |

### Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/features/translator/components/AvatarDisplay.jsx` | Replace Hand icon with `<AvatarScene />` |
| 2 | `src/features/translator/components/InputPanel.jsx` | Add video URL input mode |
| 3 | `src/features/translator/components/PlayerControls.jsx` | Working speed toggle |
| 4 | `src/features/translator/components/Transcript.jsx` | Clickable words |
| 5 | `src/features/translator/components/AvatarPanel.jsx` | Wire to Zustand stores |
| 6 | `src/pages/HomePage.jsx` | Lazy load avatar, connect to stores |
| 7 | `src/components/ui/index.js` | Export new UI components |
| 8 | `package.json` | New dependencies |
| 9 | `vite.config.js` | Path aliases |

### Files to Delete

| # | File | Reason |
|---|------|--------|
| 1 | `src/SignBridgeApp.jsx` | Dead code — old monolith |

**Total: 23 new files, 9 modified files, 1 deleted file**
