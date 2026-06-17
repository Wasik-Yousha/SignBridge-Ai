// Each letter is an array of keyframes.
// Each keyframe maps Mixamo bone names → [rx, ry, rz] Euler XYZ (radians).
// Single-frame = static handshape held until the engine advances.

// Right arm bones
const RA  = 'mixamorigRightArm';
const RFA = 'mixamorigRightForeArm';
const H1  = 'mixamorigRightHand';
const T1  = 'mixamorigRightHandThumb1';
const T2  = 'mixamorigRightHandThumb2';
const T3  = 'mixamorigRightHandThumb3';
const I1  = 'mixamorigRightHandIndex1';
const I2  = 'mixamorigRightHandIndex2';
const I3  = 'mixamorigRightHandIndex3';
const M1  = 'mixamorigRightHandMiddle1';
const M2  = 'mixamorigRightHandMiddle2';
const M3  = 'mixamorigRightHandMiddle3';
const R1  = 'mixamorigRightHandRing1';
const R2  = 'mixamorigRightHandRing2';
const R3  = 'mixamorigRightHandRing3';
const P1  = 'mixamorigRightHandPinky1';
const P2  = 'mixamorigRightHandPinky2';
const P3  = 'mixamorigRightHandPinky3';

// Left arm bones (support/rest position during signing)
const LA  = 'mixamorigLeftArm';
const LFA = 'mixamorigLeftForeArm';
const LH  = 'mixamorigLeftHand';

// ── Right arm signing position (delta from A-pose baseline) ────────────────
// A-pose already puts elbow at rib/solar-plexus height (arm X=1.0 in animator).
// Keep arm at A-pose height (X delta ≈ 0) — elbow stays near ribs.
// Z=-0.25 swings elbow just slightly forward from shoulder.
// Forearm Z=-1.40 swings forearm strongly toward viewer from the rib-level elbow
// — math gives ~98% world +Z (forward), hand ends up at rib height in front.
const SIGN_ARM = [ 0.0,  0.0, -0.25];
const SIGN_FA  = [ 0.0,  0.0, -1.40];

// ── Left arm rest position (Z sign flipped — left tip is world +X not -X) ───
const SIGN_ARM_L = [ 0.0,  0.0,  0.25];
const SIGN_FA_L  = [ 0.0,  0.0,  1.40];

// Palm direction presets [rx, ry, rz]
const PALM_LEFT   = [0,   0,   1.2];
const PALM_AWAY   = [0,   2.8, 0];
const PALM_DOWN   = [0.9, 0,   0];

// Finger curl presets
const OPEN   = [0.1,  0.1,  0.1];
const HALF   = [0.85, 0.85, 0.85];
const CURL   = [1.35, 1.35, 1.35];
const BENT   = [0.45, 0.45, 0.45];

const frame = (palm, thumb, idx, mid, ring, pink) => ({
  // Right arm — active signing hand
  [RA]:  SIGN_ARM,
  [RFA]: SIGN_FA,
  [H1]:  palm,
  [T1]: [thumb[0], -0.35, 0.2],
  [T2]: [thumb[1], -0.15, 0.1],
  [T3]: [thumb[2], -0.1,  0.05],
  [I1]: [idx[0],  0.02, 0],
  [I2]: [idx[1],  0,    0],
  [I3]: [idx[2],  0,    0],
  [M1]: [mid[0],  0,    0],
  [M2]: [mid[1],  0,    0],
  [M3]: [mid[2],  0,    0],
  [R1]: [ring[0], -0.02, 0],
  [R2]: [ring[1], 0,    0],
  [R3]: [ring[2], 0,    0],
  [P1]: [pink[0], -0.03, 0],
  [P2]: [pink[1], 0,    0],
  [P3]: [pink[2], 0,    0],
  // Left arm — relaxed support position, mirrors right arm geometry
  [LA]:  SIGN_ARM_L,
  [LFA]: SIGN_FA_L,
  [LH]:  [0.1, 0, -0.15],
});

export const ALPHABETS = {
  A: [frame(PALM_LEFT,  [0.2,  0.12, 0.08], CURL, CURL, CURL, CURL)],
  B: [frame(PALM_AWAY,  [0.6,  0.5,  0.35], OPEN, OPEN, OPEN, OPEN)],
  C: [frame(PALM_AWAY,  [0.45, 0.35, 0.25],
    [0.55, 0.45, 0.35], [0.55, 0.45, 0.35], [0.5, 0.4, 0.32], [0.45, 0.35, 0.28])],
  D: [frame(PALM_AWAY,  [0.5,  0.35, 0.25], OPEN, CURL, CURL, CURL)],
  E: [frame(PALM_LEFT,  [0.72, 0.52, 0.35], HALF, HALF, HALF, HALF)],
  F: [frame(PALM_AWAY,  [0.2,  0.15, 0.08],
    [0.2, 0.18, 0.12], OPEN, OPEN, OPEN)],
  G: [frame(PALM_DOWN,  [0.2,  0.12, 0.05],
    [0.08, 0.08, 0.05], CURL, CURL, CURL)],
  H: [frame(PALM_DOWN,  [0.45, 0.35, 0.2],
    [0.1, 0.1, 0.08], [0.1, 0.1, 0.08], CURL, CURL)],
  I: [frame(PALM_LEFT,  [0.48, 0.32, 0.22], CURL, CURL, CURL, OPEN)],
  J: [frame(PALM_LEFT,  [0.45, 0.3,  0.2],  CURL, CURL, CURL,
    [0.15, 0.1, 0.08])],
  K: [frame(PALM_AWAY,  [0.2,  0.1,  0.05],
    [0.1, 0.08, 0.06], [0.15, 0.12, 0.1], CURL, CURL)],
  L: [frame(PALM_AWAY,  [0.05, 0.02, 0],
    [0.08, 0.08, 0.08], CURL, CURL, CURL)],
  M: [frame(PALM_LEFT,  [0.78, 0.64, 0.5],  HALF, HALF, HALF, CURL)],
  N: [frame(PALM_LEFT,  [0.74, 0.56, 0.4],  HALF, HALF, CURL, CURL)],
  O: [frame(PALM_AWAY,  [0.4,  0.3,  0.2],
    [0.52, 0.4, 0.3], [0.52, 0.4, 0.3], [0.52, 0.4, 0.3], [0.5, 0.38, 0.28])],
  P: [frame(PALM_DOWN,  [0.15, 0.08, 0.04],
    [0.15, 0.12, 0.1], [0.15, 0.12, 0.1], CURL, CURL)],
  Q: [frame(PALM_DOWN,  [0.15, 0.08, 0.04],
    [0.15, 0.12, 0.1], CURL, CURL, CURL)],
  R: [frame(PALM_AWAY,  [0.48, 0.35, 0.25],
    [0.08, 0.08, 0.05], [0.08, 0.08, 0.05], CURL, CURL)],
  S: [frame(PALM_LEFT,  [0.3,  0.24, 0.16], CURL, CURL, CURL, CURL)],
  T: [frame(PALM_LEFT,  [0.6,  0.46, 0.32], CURL, CURL, CURL, CURL)],
  U: [frame(PALM_AWAY,  [0.5,  0.35, 0.2],  OPEN, OPEN, CURL, CURL)],
  V: [frame(PALM_AWAY,  [0.42, 0.28, 0.18], OPEN, OPEN, CURL, CURL)],
  W: [frame(PALM_AWAY,  [0.5,  0.35, 0.2],  OPEN, OPEN, OPEN, CURL)],
  X: [frame(PALM_LEFT,  [0.5,  0.35, 0.2],  BENT, CURL, CURL, CURL)],
  Y: [frame(PALM_LEFT,  [0.04, 0.02, 0],    CURL, CURL, CURL, OPEN)],
  Z: [frame(PALM_AWAY,  [0.5,  0.35, 0.2],
    [0.2, 0.15, 0.1], CURL, CURL, CURL)],
};
