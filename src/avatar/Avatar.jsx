import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { useAvatarPlaybackStore } from './playbackStore';
import { useSignAnimator } from './useSignAnimator';
import { useAvatarModelStore } from './avatarModelStore';

const LOCAL_MODEL = '/model.glb';

const ANGLE_LIMITS = {
  minPolarAngle: Math.PI / 2.35,
  maxPolarAngle: Math.PI / 1.8,
  minAzimuthAngle: -Math.PI / 8,
  maxAzimuthAngle: Math.PI / 8,
};

const computeFraming = (scene) => {
  const box = new Box3().setFromObject(scene);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);

  const height = size.y || 1.8;
  return {
    offsetY:        -box.min.y,
    cameraPosition: [0, height * 0.78, height * 1.1],
    orbitTarget:    [0, height * 0.72, 0],
    minDistance:    height * 0.55,
    maxDistance:    height * 1.5,
  };
};

/* ─── AvatarRig ──────────────────────────────────────────────────────────── */

const AvatarRig = ({ modelUrl, onAnimatorReady, onFraming }) => {
  const { scene } = useGLTF(modelUrl);

  const framing = useMemo(() => computeFraming(scene), [scene]);

  useEffect(() => {
    onFraming?.(framing);
  }, [framing, onFraming]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh) child.frustumCulled = false;
    });
  }, [scene]);

  const runtimeNodes = useMemo(() => {
    const map = {};
    scene.traverse((child) => {
      if (child?.isBone && child.name) map[child.name] = child;
    });
    return map;
  }, [scene]);

  const animator = useSignAnimator(runtimeNodes);

  useEffect(() => {
    onAnimatorReady?.(animator);
  }, [animator, onAnimatorReady]);

  return <primitive object={scene} position={[0, framing.offsetY, 0]} />;
};

/* ─── Avatar ────────────────────────────────────────────────────────────── */

const Avatar = forwardRef((_, ref) => {
  const [webglReady] = useState(() => {
    if (typeof document === 'undefined') return true;
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  });

  const cameraRef  = useRef(null);
  const orbitRef   = useRef(null);
  const [framing, setFraming] = useState(null);

  const setApi     = useAvatarPlaybackStore((state) => state.setApi);
  const storedUrl  = useAvatarModelStore((s) => s.modelUrl);
  const modelUrl   = storedUrl ?? LOCAL_MODEL;

  // Preload whenever the model URL changes
  useEffect(() => {
    useGLTF.preload(modelUrl);
  }, [modelUrl]);

  const handleAnimatorReady = useCallback(
    (api) => setApi(api),
    [setApi],
  );

  useEffect(() => {
    if (!framing || !cameraRef.current) return;
    const [cx, cy, cz] = framing.cameraPosition;
    cameraRef.current.position.set(cx, cy, cz);
    cameraRef.current.updateProjectionMatrix();
    if (orbitRef.current) {
      orbitRef.current.target.set(...framing.orbitTarget);
      orbitRef.current.update();
    }
  }, [framing]);

  const zoomIn = useCallback(() => {
    if (!cameraRef.current || !framing) return;
    cameraRef.current.position.z = Math.max(
      framing.minDistance,
      cameraRef.current.position.z - 0.2,
    );
    cameraRef.current.updateProjectionMatrix();
    orbitRef.current?.update();
  }, [framing]);

  const zoomOut = useCallback(() => {
    if (!cameraRef.current || !framing) return;
    cameraRef.current.position.z = Math.min(
      framing.maxDistance,
      cameraRef.current.position.z + 0.2,
    );
    cameraRef.current.updateProjectionMatrix();
    orbitRef.current?.update();
  }, [framing]);

  const resetView = useCallback(() => {
    if (!cameraRef.current || !framing) return;
    cameraRef.current.position.set(...framing.cameraPosition);
    cameraRef.current.updateProjectionMatrix();
    if (orbitRef.current) {
      orbitRef.current.target.set(...framing.orbitTarget);
      orbitRef.current.update();
    }
  }, [framing]);

  useImperativeHandle(ref, () => ({ zoomIn, zoomOut, resetView }), [
    zoomIn,
    zoomOut,
    resetView,
  ]);

  if (!webglReady) {
    return (
      <div className="w-full h-full min-h-112.5 rounded-xl bg-slate-100 flex items-center justify-center p-6 text-center text-slate-600">
        WebGL is not supported in this browser. Please update your browser or
        use a device with WebGL enabled.
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-112.5 rounded-xl overflow-hidden bg-[#f2f4f0] absolute inset-0">
      <Canvas
        camera={{ position: [0, 1.4, 2], fov: 32, near: 0.1, far: 100 }}
        onCreated={({ camera, gl }) => {
          cameraRef.current = camera;
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[2.5, 4, 2]}  intensity={1.05} />
        <directionalLight position={[-2,  2.2, 1]} intensity={0.45} />

        {/* key forces full re-mount when model URL changes */}
        <AvatarRig
          key={modelUrl}
          modelUrl={modelUrl}
          onAnimatorReady={handleAnimatorReady}
          onFraming={setFraming}
        />

        <OrbitControls
          ref={orbitRef}
          enablePan={false}
          enableZoom
          minDistance={framing?.minDistance ?? 1.2}
          maxDistance={framing?.maxDistance ?? 2.6}
          minPolarAngle={ANGLE_LIMITS.minPolarAngle}
          maxPolarAngle={ANGLE_LIMITS.maxPolarAngle}
          minAzimuthAngle={ANGLE_LIMITS.minAzimuthAngle}
          maxAzimuthAngle={ANGLE_LIMITS.maxAzimuthAngle}
          target={framing?.orbitTarget ?? [0, 1.4, 0]}
        />
      </Canvas>
    </div>
  );
});

Avatar.displayName = 'Avatar';
useGLTF.preload(LOCAL_MODEL);

export default Avatar;
