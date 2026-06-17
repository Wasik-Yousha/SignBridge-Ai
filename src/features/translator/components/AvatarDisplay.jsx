import { lazy, Suspense, forwardRef } from 'react';
import { Hand } from 'lucide-react';
import { ErrorBoundary } from '@/components/common';
import AvatarLoadingPlaceholder from '@/features/avatar/components/AvatarLoadingPlaceholder';

const AvatarScene = lazy(
  () => import('@/features/avatar/components/AvatarScene'),
);

const AvatarErrorFallback = ({ error }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center absolute inset-0">
    <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center shadow-md mb-4 text-[#2a7e75] mx-auto">
      <Hand size={40} strokeWidth={2.5} />
    </div>
    <h3 className="font-medium text-slate-700 text-center">Avatar failed to load</h3>
    {error?.message && (
      <p className="text-xs text-red-500 text-center mt-2 max-w-xs font-mono break-all">
        {error.message}
      </p>
    )}
    <p className="text-sm text-slate-400 text-center mt-2 max-w-xs">
      Place a Mixamo{' '}
      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">.glb</code>{' '}
      at{' '}
      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">public/Avatar.glb</code>
    </p>
  </div>
);

/**
 * AvatarDisplay - Lazy-loads the 3D scene with error fallback.
 * Playback is driven by useAvatarPlaybackStore, not props.
 */
const AvatarDisplay = forwardRef((_, ref) => (
  <div className="bg-[#EAECEF] rounded-xl relative min-h-112.5 overflow-hidden w-full h-full">
    <ErrorBoundary fallbackComponent={AvatarErrorFallback}>
      <Suspense fallback={<AvatarLoadingPlaceholder />}>
        <AvatarScene ref={ref} />
      </Suspense>
    </ErrorBoundary>
  </div>
));

AvatarDisplay.displayName = 'AvatarDisplay';

export default AvatarDisplay;
