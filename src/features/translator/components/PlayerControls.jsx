import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RefreshCw, Settings, Repeat } from 'lucide-react';
import { SPEED_OPTIONS } from '../../../constants';

/**
 * PlayerControls - Play/pause, reset, progress bar, speed & settings controls.
 */
const PlayerControls = ({
  isPlaying,
  progress,
  speed,
  loop,
  onTogglePlay,
  onReset,
  onCycleSpeed,
  onSetSpeed,
  onSetLoop,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  return (
    <div className="flex items-center gap-4 py-4 px-2">
      <button
        onClick={onTogglePlay}
        className="bg-[#2a7e75] text-white p-2 rounded-full hover:bg-[#236b63] transition-colors"
      >
        {isPlaying ? (
          <Pause size={18} />
        ) : (
          <Play size={18} className="ml-1" />
        )}
      </button>

      <button
        onClick={onReset}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        title="Reset"
      >
        <RefreshCw size={18} />
      </button>

      <div className="flex-1 flex items-center">
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden relative">
          <div
            className="absolute top-0 left-0 h-full bg-[#2a7e75] transition-all duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Speed button — click to cycle */}
      <button
        onClick={onCycleSpeed}
        className="text-sm font-medium text-slate-600 hover:text-[#2a7e75] transition-colors min-w-[2rem] text-center"
        title="Change playback speed"
      >
        {speed}x
      </button>

      {/* Settings gear — opens dropdown */}
      <div className="relative" ref={settingsRef}>
        <button
          onClick={() => setSettingsOpen((prev) => !prev)}
          className={`transition-colors ${
            settingsOpen
              ? 'text-[#2a7e75]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Settings"
        >
          <Settings size={18} />
        </button>

        {settingsOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-50">
            {/* Speed selector */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Speed
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSetSpeed(s)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      speed === s
                        ? 'bg-[#2a7e75] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Loop toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Repeat size={14} />
                <span>Loop</span>
              </div>
              <button
                onClick={() => onSetLoop(!loop)}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  loop ? 'bg-[#2a7e75]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    loop ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerControls;
