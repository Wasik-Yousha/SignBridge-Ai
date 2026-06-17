import { useEffect, useCallback, useRef } from 'react';
import { Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';

/**
 * FullscreenAvatar - Full-viewport modal overlay for the 3D avatar.
 * Playback is driven by the global playbackStore — no playback props needed.
 */
const FullscreenAvatar = ({ onClose }) => {
  const avatarRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <div className="absolute top-6 right-6 flex items-center gap-2 z-50">
        <button
          onClick={() => avatarRef.current?.zoomIn()}
          className="bg-white/10 backdrop-blur-sm p-3 rounded-xl text-white hover:bg-white/20 transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={() => avatarRef.current?.zoomOut()}
          className="bg-white/10 backdrop-blur-sm p-3 rounded-xl text-white hover:bg-white/20 transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={() => avatarRef.current?.resetView()}
          className="bg-white/10 backdrop-blur-sm p-3 rounded-xl text-white hover:bg-white/20 transition-colors"
          title="Reset view"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={onClose}
          className="bg-white/10 backdrop-blur-sm p-3 rounded-xl text-white hover:bg-white/20 transition-colors"
          title="Exit fullscreen (Esc)"
        >
          <Minimize2 size={20} />
        </button>
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-sm">
        Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-xs font-mono">Esc</kbd> to exit
      </p>

      <div
        className="w-[80%] h-[80%] mx-auto my-auto rounded-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <AvatarDisplay ref={avatarRef} />
      </div>
    </div>
  );
};

export default FullscreenAvatar;
