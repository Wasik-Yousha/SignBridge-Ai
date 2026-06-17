// Default idle pose — all zeros.
// The A-pose baseline is now applied by useSignAnimator as a quaternion offset
// for arm/forearm bones, so delta = [0,0,0] = natural A-pose hanging position.
// All sign animation values are interpreted as deltas relative to this baseline.
const defaultPose = {
  // ── Right arm ──────────────────────────────────────────────────────────
  mixamorigRightArm:           [0, 0, 0],
  mixamorigRightForeArm:       [0, 0, 0],
  mixamorigRightHand:          [0, 0, 0],

  mixamorigRightHandThumb1:    [0, 0, 0],
  mixamorigRightHandThumb2:    [0, 0, 0],
  mixamorigRightHandThumb3:    [0, 0, 0],
  mixamorigRightHandIndex1:    [0, 0, 0],
  mixamorigRightHandIndex2:    [0, 0, 0],
  mixamorigRightHandIndex3:    [0, 0, 0],
  mixamorigRightHandMiddle1:   [0, 0, 0],
  mixamorigRightHandMiddle2:   [0, 0, 0],
  mixamorigRightHandMiddle3:   [0, 0, 0],
  mixamorigRightHandRing1:     [0, 0, 0],
  mixamorigRightHandRing2:     [0, 0, 0],
  mixamorigRightHandRing3:     [0, 0, 0],
  mixamorigRightHandPinky1:    [0, 0, 0],
  mixamorigRightHandPinky2:    [0, 0, 0],
  mixamorigRightHandPinky3:    [0, 0, 0],

  // ── Left arm ───────────────────────────────────────────────────────────
  mixamorigLeftArm:            [0, 0, 0],
  mixamorigLeftForeArm:        [0, 0, 0],
  mixamorigLeftHand:           [0, 0, 0],

  mixamorigLeftHandThumb1:     [0, 0, 0],
  mixamorigLeftHandThumb2:     [0, 0, 0],
  mixamorigLeftHandThumb3:     [0, 0, 0],
  mixamorigLeftHandIndex1:     [0, 0, 0],
  mixamorigLeftHandIndex2:     [0, 0, 0],
  mixamorigLeftHandIndex3:     [0, 0, 0],
  mixamorigLeftHandMiddle1:    [0, 0, 0],
  mixamorigLeftHandMiddle2:    [0, 0, 0],
  mixamorigLeftHandMiddle3:    [0, 0, 0],
  mixamorigLeftHandRing1:      [0, 0, 0],
  mixamorigLeftHandRing2:      [0, 0, 0],
  mixamorigLeftHandRing3:      [0, 0, 0],
  mixamorigLeftHandPinky1:     [0, 0, 0],
  mixamorigLeftHandPinky2:     [0, 0, 0],
  mixamorigLeftHandPinky3:     [0, 0, 0],
};

export default defaultPose;
