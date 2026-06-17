import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion } from 'three';
import defaultPose from '../lib/signLanguage/animations/defaultPose';
import { ALPHABETS } from '../lib/signLanguage/animations/alphabets';
import { WORDS } from '../lib/signLanguage/animations/words';

const SPEED   = 0.1;   // radians moved per frame toward target
const HOLD_MS = 350;   // ms to hold each completed keyframe before advancing
const EPSILON = 0.008; // "close enough" threshold in radians

// A-pose baseline (Euler XYZ). Composed as bone.quaternion = BASE * delta,
// so a delta of [0,0,0] leaves the bone in A-pose. Sign animation values are
// now interpreted as rotations relative to A-pose, matching synapZ-style data.
const A_POSE_BASE_EULER = {
  mixamorigRightArm:     [1.0, 0, 0],
  mixamorigRightForeArm: [0.2, 0, 0],
  mixamorigLeftArm:      [1.0, 0, 0],
  mixamorigLeftForeArm:  [0.2, 0, 0],
};

const A_POSE_BASE_QUAT = {};
for (const [name, [x, y, z]] of Object.entries(A_POSE_BASE_EULER)) {
  A_POSE_BASE_QUAT[name] = new Quaternion().setFromEuler(new Euler(x, y, z, 'XYZ'));
}

const _tmpEuler = new Euler();
const _tmpQuat  = new Quaternion();

/**
 * Queue-based sign animator driven by R3F's useFrame.
 * Bones with an A-pose offset use bone.quaternion = BASE * delta composition;
 * all other bones use bone.rotation directly. The animator tracks current
 * Euler deltas in deltaRef so interpolation works in delta-space.
 * Exposes sign(word) → Promise<boolean> and stop().
 */
export function useSignAnimator(runtimeNodes) {
  const bonesRef  = useRef({});
  const deltaRef  = useRef({}); // bone name → [rx, ry, rz] current animated delta
  const tokenRef  = useRef(0);

  const stateRef = useRef({
    active:    false,
    frames:    [],
    frameIdx:  0,
    targets:   {},
    holdUntil: -1,
    resolve:   null,
  });

  // ── Set a bone's rotation (delta from A-pose if applicable) ─────────────
  const _setBoneRotation = useCallback((name, rx, ry, rz) => {
    const bone = bonesRef.current[name];
    if (!bone) return;
    deltaRef.current[name] = [rx, ry, rz];
    const base = A_POSE_BASE_QUAT[name];
    if (base) {
      _tmpEuler.set(rx, ry, rz, 'XYZ');
      _tmpQuat.setFromEuler(_tmpEuler);
      bone.quaternion.copy(base).multiply(_tmpQuat);
    } else {
      bone.rotation.set(rx, ry, rz);
    }
  }, []);

  // ── Immediate pose — no interpolation ───────────────────────────────────
  const _applyImmediate = useCallback((pose) => {
    Object.entries(pose).forEach(([name, rot]) => {
      _setBoneRotation(name, rot[0], rot[1], rot[2]);
    });
  }, [_setBoneRotation]);

  // ── Get current delta (start from zero if not yet tracked) ──────────────
  const _getDelta = useCallback((name) => {
    let d = deltaRef.current[name];
    if (!d) {
      d = [0, 0, 0];
      deltaRef.current[name] = d;
    }
    return d;
  }, []);

  // ── Cancel current sign ──────────────────────────────────────────────────
  const _cancel = useCallback(() => {
    const s = stateRef.current;
    if (s.resolve) s.resolve(false);
    stateRef.current = { active: false, frames: [], frameIdx: 0, targets: {}, holdUntil: -1, resolve: null };
  }, []);

  // ── Play an array of keyframes, returns Promise ──────────────────────────
  const _playFrames = useCallback((frames, token) =>
    new Promise((resolve) => {
      if (tokenRef.current !== token) { resolve(false); return; }
      stateRef.current = {
        active:    true,
        frames,
        frameIdx:  0,
        targets:   frames[0] || {},
        holdUntil: -1,
        resolve,
      };
    }), []);

  // ── Bone discovery ──────────────────────────────────────────────────────
  useEffect(() => {
    const byName = {};
    Object.values(runtimeNodes || {}).forEach((node) => {
      if (!node?.isBone || !node.name) return;

      // Register under original name
      byName[node.name] = node;

      // Strip Sketchfab numeric suffix e.g. "RightArm_51" → "RightArm"
      const bare = node.name.replace(/_\d+$/, '');
      if (bare !== node.name) byName[bare] = node;

      // Normalize "mixamorig:X" → "mixamorigX" (colon-style Mixamo exports)
      const noColon = bare.replace('mixamorig:', 'mixamorig');
      if (noColon !== bare) byName[noColon] = node;

      // Support RPM / non-prefixed bones: register "RightArm" as "mixamorigRightArm"
      if (!noColon.startsWith('mixamorig')) {
        const aliased = 'mixamorig' + noColon;
        if (!byName[aliased]) byName[aliased] = node;
      }
    });
    bonesRef.current = byName;
    deltaRef.current = {};
    const mixamoCount = Object.keys(byName).filter((n) => n.startsWith('mixamorig')).length;
    console.log(`[SignAnimator] Registered ${mixamoCount} mixamorig* entries.`);
    _applyImmediate(defaultPose);
  }, [runtimeNodes, _applyImmediate]);

  // ── Public: stop ─────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    tokenRef.current += 1;
    _cancel();
    _applyImmediate(defaultPose);
  }, [_applyImmediate, _cancel]);

  // ── Public: sign(word) → Promise<boolean> ────────────────────────────────
  const sign = useCallback(async (text) => {
    if (!text) return true;

    tokenRef.current += 1;
    const token = tokenRef.current;
    _cancel();

    const word = String(text).trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!word) return true;

    if (WORDS[word]) {
      const ok = await _playFrames(WORDS[word], token);
      if (ok && tokenRef.current === token) _applyImmediate(defaultPose);
      return ok;
    }

    // Fingerspell letter by letter — arm stays raised between letters
    for (const char of word.toUpperCase()) {
      if (tokenRef.current !== token) return false;
      const frames = ALPHABETS[char];
      if (frames) {
        const ok = await _playFrames(frames, token);
        if (!ok || tokenRef.current !== token) return false;
      }
    }
    if (tokenRef.current === token) _applyImmediate(defaultPose);
    return true;
  }, [_applyImmediate, _cancel, _playFrames]);

  // ── useFrame: drive bone.rotation toward targets each frame ──────────────
  useFrame(() => {
    const s = stateRef.current;
    if (!s.active) return;

    const now = performance.now();

    // Waiting between keyframes
    if (s.holdUntil >= 0) {
      if (now < s.holdUntil) return;
      s.holdUntil = -1;

      s.frameIdx += 1;
      if (s.frameIdx >= s.frames.length) {
        s.active = false;
        const done = s.resolve;
        s.resolve = null;
        done?.(true);
        return;
      }
      s.targets = s.frames[s.frameIdx];
      return;
    }

    // Interpolate each bone's DELTA toward target (delta-space, then compose)
    let allSettled = true;
    for (const [name, target] of Object.entries(s.targets)) {
      const bone = bonesRef.current[name];
      if (!bone) continue;

      const cur = _getDelta(name);
      const dx = target[0] - cur[0];
      const dy = target[1] - cur[1];
      const dz = target[2] - cur[2];

      let nx = cur[0], ny = cur[1], nz = cur[2];
      let moved = false;

      if (Math.abs(dx) > EPSILON) { nx += Math.sign(dx) * Math.min(SPEED, Math.abs(dx)); moved = true; allSettled = false; }
      if (Math.abs(dy) > EPSILON) { ny += Math.sign(dy) * Math.min(SPEED, Math.abs(dy)); moved = true; allSettled = false; }
      if (Math.abs(dz) > EPSILON) { nz += Math.sign(dz) * Math.min(SPEED, Math.abs(dz)); moved = true; allSettled = false; }

      if (moved) _setBoneRotation(name, nx, ny, nz);
    }

    if (allSettled) {
      s.holdUntil = now + HOLD_MS;
    }
  });

  return useMemo(() => ({ sign, stop }), [sign, stop]);
}
