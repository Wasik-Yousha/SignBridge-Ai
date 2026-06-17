import { useEffect, useRef, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useAvatarModelStore } from '@/avatar/avatarModelStore';

const RPM_FRAME_URL =
  'https://demo.readyplayer.me/avatar?frameApi&bodyType=fullbody';

const RPMAvatarPicker = ({ onClose }) => {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const setModelUrl = useAvatarModelStore((s) => s.setModelUrl);
  const clearModelUrl = useAvatarModelStore((s) => s.clearModelUrl);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.origin.includes('readyplayer.me')) return;
      try {
        const json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const { source, eventName, data } = json;
        if (source !== 'readyplayerme') return;

        if (eventName === 'v1.frame.ready') {
          // Tell the iframe we're listening
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ type: 'subscribe', eventName: 'v1.avatar.exported' }),
            '*',
          );
        }

        if (eventName === 'v1.avatar.exported' && data?.url) {
          setModelUrl(data.url);
          onClose();
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setModelUrl, onClose]);

  const handleReset = () => {
    clearModelUrl();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
           style={{ width: '100%', maxWidth: 640, height: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <div>
            <p className="font-semibold text-slate-800 text-sm">Choose Your Avatar</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Create a human-like avatar — pick a style, customize, then click&nbsp;
              <strong>Next</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-50"
              title="Reset to default model"
            >
              <RotateCcw size={13} />
              Reset
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* iframe area */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8f9fa] gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-[#2a7e75] border-t-transparent animate-spin" />
              <p className="text-sm text-slate-400">Loading avatar creator…</p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={RPM_FRAME_URL}
            className="w-full h-full border-none"
            allow="camera *; microphone *"
            title="Ready Player Me Avatar Creator"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default RPMAvatarPicker;
