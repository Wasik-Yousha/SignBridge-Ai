// Word sign sequences keyed by lowercase English word.
// Each value is an array of keyframes (same format as alphabets.js).
// Multi-frame signs animate through each pose sequentially.
//
// NOTE: arm/forearm values are DELTAS from the A-pose baseline applied in
// useSignAnimator (RightArm/LeftArm base X=1.0, RightForeArm/LeftForeArm
// base X=0.2). Converted from old absolutes by subtracting the base on X.

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

// HOME — O-shape near mouth, then flat hand at cheek
const HOME = [
  {
    [RA]:  [-0.65, -0.45, -0.18],
    [RFA]: [ 0.35, -0.28, -0.1],
    [H1]:  [0, -0.35, 0],
    [T1]:  [0.4,  -0.35, 0.2],   [T2]: [0.3,  -0.15, 0.1],  [T3]: [0.2, -0.1, 0.05],
    [I1]:  [0.52, 0.02,  0],     [I2]: [0.4,  0,     0],     [I3]: [0.3, 0,    0],
    [M1]:  [0.52, 0,     0],     [M2]: [0.4,  0,     0],     [M3]: [0.3, 0,    0],
    [R1]:  [0.52, -0.02, 0],     [R2]: [0.4,  0,     0],     [R3]: [0.3, 0,    0],
    [P1]:  [0.5,  -0.03, 0],     [P2]: [0.38, 0,     0],     [P3]: [0.28, 0,   0],
  },
  {
    [RA]:  [-0.70, -0.52, -0.15],
    [RFA]: [ 0.25, -0.32, -0.08],
    [H1]:  [0, -0.35, 0],
    [T1]:  [0.45, -0.35, 0.2],   [T2]: [0.35, -0.15, 0.1],  [T3]: [0.2, -0.1, 0.05],
    [I1]:  [0.1,  0.02,  0],     [I2]: [0.1,  0,     0],     [I3]: [0.1, 0,    0],
    [M1]:  [0.1,  0,     0],     [M2]: [0.1,  0,     0],     [M3]: [0.1, 0,    0],
    [R1]:  [0.1,  -0.02, 0],     [R2]: [0.1,  0,     0],     [R3]: [0.1, 0,    0],
    [P1]:  [0.1,  -0.03, 0],     [P2]: [0.1,  0,     0],     [P3]: [0.1, 0,    0],
  },
];

// PERSON — P-handshape tracing body outline downward
const PERSON = [
  {
    [RA]:  [-0.50, -0.2, -0.15],
    [RFA]: [ 0.30, -0.15, -0.05],
    [H1]:  [0.9, 0, 0],
    [T1]:  [0.15, -0.35, 0.2],   [T2]: [0.08, -0.15, 0.1],  [T3]: [0.04, -0.1, 0.05],
    [I1]:  [0.15, 0.02,  0],     [I2]: [0.12, 0,     0],     [I3]: [0.1,  0,    0],
    [M1]:  [0.15, 0,     0],     [M2]: [0.12, 0,     0],     [M3]: [0.1,  0,    0],
    [R1]:  [1.35, -0.02, 0],     [R2]: [1.35, 0,     0],     [R3]: [1.35, 0,    0],
    [P1]:  [1.35, -0.03, 0],     [P2]: [1.35, 0,     0],     [P3]: [1.35, 0,    0],
  },
  {
    [RA]:  [-0.40, -0.18, -0.12],
    [RFA]: [ 0.45, -0.1, -0.04],
    [H1]:  [0.9, 0, 0],
    [T1]:  [0.15, -0.35, 0.2],   [T2]: [0.08, -0.15, 0.1],  [T3]: [0.04, -0.1, 0.05],
    [I1]:  [0.15, 0.02,  0],     [I2]: [0.12, 0,     0],     [I3]: [0.1,  0,    0],
    [M1]:  [0.15, 0,     0],     [M2]: [0.12, 0,     0],     [M3]: [0.1,  0,    0],
    [R1]:  [1.35, -0.02, 0],     [R2]: [1.35, 0,     0],     [R3]: [1.35, 0,    0],
    [P1]:  [1.35, -0.03, 0],     [P2]: [1.35, 0,     0],     [P3]: [1.35, 0,    0],
  },
];

// TIME — index finger taps wrist (wrist-watch gesture)
const TIME = [
  {
    [RA]:  [-0.45, -0.05, -0.1],
    [RFA]: [ 0.30, -0.05, -0.05],
    [H1]:  [0, 0, 1.2],
    [T1]:  [0.5,  -0.35, 0.2],   [T2]: [0.35, -0.15, 0.1],  [T3]: [0.2, -0.1, 0.05],
    [I1]:  [0.08, 0.02,  0],     [I2]: [0.08, 0,     0],     [I3]: [0.08, 0,   0],
    [M1]:  [1.35, 0,     0],     [M2]: [1.35, 0,     0],     [M3]: [1.35, 0,   0],
    [R1]:  [1.35, -0.02, 0],     [R2]: [1.35, 0,     0],     [R3]: [1.35, 0,   0],
    [P1]:  [1.35, -0.03, 0],     [P2]: [1.35, 0,     0],     [P3]: [1.35, 0,   0],
  },
  {
    [RA]:  [-0.40, -0.05, -0.1],
    [RFA]: [ 0.36, -0.05, -0.05],
    [H1]:  [0, 0, 1.2],
    [T1]:  [0.5,  -0.35, 0.2],   [T2]: [0.35, -0.15, 0.1],  [T3]: [0.2, -0.1, 0.05],
    [I1]:  [0.08, 0.02,  0],     [I2]: [0.08, 0,     0],     [I3]: [0.08, 0,   0],
    [M1]:  [1.35, 0,     0],     [M2]: [1.35, 0,     0],     [M3]: [1.35, 0,   0],
    [R1]:  [1.35, -0.02, 0],     [R2]: [1.35, 0,     0],     [R3]: [1.35, 0,   0],
    [P1]:  [1.35, -0.03, 0],     [P2]: [1.35, 0,     0],     [P3]: [1.35, 0,   0],
  },
];

// YOU — index finger pointing toward viewer
const YOU = [
  {
    [RA]:  [-0.50, -0.25, -0.15],
    [RFA]: [ 0.25, -0.15, -0.1],
    [H1]:  [0, 2.8, 0],
    [T1]:  [0.5,  -0.35, 0.2],   [T2]: [0.35, -0.15, 0.1],  [T3]: [0.2, -0.1, 0.05],
    [I1]:  [0.1,  0.02,  0],     [I2]: [0.1,  0,     0],     [I3]: [0.1, 0,    0],
    [M1]:  [1.35, 0,     0],     [M2]: [1.35, 0,     0],     [M3]: [1.35, 0,   0],
    [R1]:  [1.35, -0.02, 0],     [R2]: [1.35, 0,     0],     [R3]: [1.35, 0,   0],
    [P1]:  [1.35, -0.03, 0],     [P2]: [1.35, 0,     0],     [P3]: [1.35, 0,   0],
  },
];

export const WORDS = { home: HOME, person: PERSON, time: TIME, you: YOU };
