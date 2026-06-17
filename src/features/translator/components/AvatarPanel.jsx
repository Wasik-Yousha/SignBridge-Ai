import { useRef, useState, useCallback } from 'react';
import { Expand, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import AvatarDisplay from './AvatarDisplay';
import FullscreenAvatar from './FullscreenAvatar';
import PlayerControls from './PlayerControls';
import Transcript from './Transcript';

/**
 * AvatarPanel - Right column with avatar, player controls, and transcript.
 * Playback is driven by useAvatarPlaybackStore — no playback props needed here.
 */
const AvatarPanel = ({
  isPlaying,
  progress,
  speed,
  loop,
  words,
  currentWordIndex,
  onTogglePlay,
  onReset,
  onCycleSpeed,
  onSetSpeed,
  onSetLoop,
}) => {
  const avatarRef = useRef();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen  = useCallback(() => setIsFullscreen(true),  []);
  const closeFullscreen = useCallback(() => setIsFullscreen(false), []);

  return (
    <div className="lg:col-span-7 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
      <div className="relative flex-1 min-h-112.5">
        {/* Camera controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          <button
            onClick={() => avatarRef.current?.zoomIn()}
            className="bg-white p-2 rounded-lg shadow-sm text-slate-500 hover:text-slate-800 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => avatarRef.current?.zoomOut()}
            className="bg-white p-2 rounded-lg shadow-sm text-slate-500 hover:text-slate-800 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => avatarRef.current?.resetView()}
            className="bg-white p-2 rounded-lg shadow-sm text-slate-500 hover:text-slate-800 transition-colors"
            title="Reset view"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={openFullscreen}
            className="bg-white p-2 rounded-lg shadow-sm text-slate-500 hover:text-slate-800 transition-colors"
            title="Fullscreen"
          >
            <Expand size={16} />
          </button>
        </div>

        <AvatarDisplay ref={avatarRef} />
      </div>

      <PlayerControls
        isPlaying={isPlaying}
        progress={progress}
        speed={speed}
        loop={loop}
        onTogglePlay={onTogglePlay}
        onReset={onReset}
        onCycleSpeed={onCycleSpeed}
        onSetSpeed={onSetSpeed}
        onSetLoop={onSetLoop}
      />

      <Transcript words={words} currentWordIndex={currentWordIndex} />

      {isFullscreen && (
        <FullscreenAvatar onClose={closeFullscreen} />
      )}
    </div>
  );
};

export default AvatarPanel;
