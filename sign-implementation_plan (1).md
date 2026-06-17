# Rewrite Animation Engine for synapZ-AI Compatibility

Rewrite the internal animation engine so the 26 alphabet files (A.js–Z.js), 4 word files (HOME.js, PERSON.js, TIME.js, YOU.js), and defaultPose.js from `synapZ-AI` work directly without modification. Keep the existing SignBridge UI, R3F canvas, and translator panel.

## What Changes

### Core Engine Rewrite

#### [MODIFY] [useSignAnimator.js](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/avatar/useSignAnimator.js)

**Complete rewrite.** Replace the SLERP/quaternion system with the synapZ-AI queue-based incremental engine:

- Create the `ref` object with: `flag`, `pending`, `animations` (queue), `characters`, `avatar`, `animate`, `speed`, `pause`
- `ref.avatar` = the loaded GLTF scene (supports `getObjectByName(boneName)`)
- `ref.animate()` runs inside R3F's `useFrame` instead of raw `requestAnimationFrame`
- Process 5-tuples: `[boneName, "rotation", axis, limit, "+"/"-"]` — increment/decrement `bone.rotation[axis]` by `speed` per frame until it reaches `limit`
- Handle `['add-text', '...']` queue entries (emit to on-screen output)
- Pause between signs using the `flag` + `setTimeout` pattern
- Expose `sign(text)` function that splits words, looks up word dictionary, falls back to letter-by-letter fingerspelling

#### [MODIFY] [Avatar.jsx](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/avatar/Avatar.jsx)

- Pass the loaded GLTF `scene` to `useSignAnimator` as `ref.avatar` (for `getObjectByName`)
- Add `frustumCulled = false` on SkinnedMesh children (from synapZ-AI — prevents avatar disappearing during extreme poses)
- Remove the old `runtimeNodes` bone traversal (no longer needed — synapZ uses `getObjectByName` directly)

---

### Drop-in Animation Files

#### [NEW] `src/lib/signLanguage/animations/Alphabets/A.js` through `Z.js`
26 files, copied verbatim from the document. Each exports a function like `export const A = (ref) => { ... }`.

#### [NEW] `src/lib/signLanguage/animations/Words/HOME.js`, `PERSON.js`, `TIME.js`, `YOU.js`
4 files, copied verbatim.

#### [NEW] `src/lib/signLanguage/animations/defaultPose.js`
The JavaScript version from §9 — sets the neutral "arms at sides" pose.

#### [NEW] `src/lib/signLanguage/animations/alphabets.js`
Barrel export: re-exports A–Z from `./Alphabets/`.

#### [NEW] `src/lib/signLanguage/animations/words.js`
Barrel export: re-exports HOME, PERSON, TIME, YOU + `wordList`.

---

### Files to Delete (replaced by synapZ-AI equivalents)

#### [DELETE] [neutralPose.js](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/avatar/neutralPose.js)
Replaced by `defaultPose.js`.

#### [DELETE] [palmOrientations.js](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/avatar/palmOrientations.js)
Not used in synapZ-AI format — palm orientation is encoded directly in the bone rotations.

#### [DELETE] [boneMap.js](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/avatar/boneMap.js)
Not needed — synapZ-AI uses raw bone name strings like `"mixamorigRightHand"` directly.

#### [DELETE] [dictionary.js](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/signs/dictionary.js)
Replaced by `words.js` barrel.

#### [DELETE] [handshapes.js](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/signs/handshapes.js)
Replaced by `alphabets.js` barrel (A–Z files).

#### [DELETE] [fingerspell.js](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/signs/fingerspell.js)
Fingerspelling is now handled by the `sign()` function inside the animator — it splits words into chars and calls `alphabets[char](ref)`.

---

### Adapter Updates

#### [MODIFY] [playbackStore.js](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/avatar/playbackStore.js)
Update the API shape: `sign(text)` and `stop()` instead of `playSign(signData)` and `stopSign()`.

#### [MODIFY] [Avatar.jsx](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/avatar/Avatar.jsx)
The playback effect (lines 112-142) currently looks up `SIGNS[normalized]` and calls `fingerspellWord`. Replace with a single call to `animator.sign(currentWord)` which internally handles word lookup + fingerspelling.

#### [MODIFY] [AvatarScene.jsx](file:///Users/jarinananjasia/Downloads/Ai%20proj/SignBridge-Ai-main/src/features/avatar/components/AvatarScene.jsx)
Update imperative handle to expose `sign(text)` and `stop()`.

---

## What Stays the Same

- **All UI components** — HomePage, InputPanel, AvatarPanel, AvatarDisplay, FullscreenAvatar, ErrorBoundary, AvatarLoadingPlaceholder
- **R3F Canvas** — still renders via `@react-three/fiber` and `drei`
- **Auto-framing** — the `Box3` bounding box calculation stays
- **OrbitControls** — zoom/pan/rotate stays
- **useTranslator hook** — word splitting + playback timer stays
- **Backend API** — transcription service stays
- **Styling** — all CSS/Tailwind stays

## Verification Plan

1. Drop in a Mixamo xbot/ybot GLB as `public/Avatar.glb`
2. Run `npm run dev`
3. Type "hello" → avatar should fingerspell H-E-L-L-O
4. Type "home" → avatar should perform the HOME word sign
5. Type "time person you" → avatar should sign TIME, PERSON, YOU as word signs
6. Console should show no errors
