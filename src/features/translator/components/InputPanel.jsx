import { RefreshCw, Link as LinkIcon, Loader2 } from 'lucide-react';
import { TabSwitch } from '../../../components/ui';

/**
 * InputPanel - Left column with text/video-link input and convert button.
 */
const InputPanel = ({
  activeTab,
  onTabChange,
  inputText,
  onTextChange,
  onConvert,
  videoUrl,
  onVideoUrlChange,
  onTranscribe,
  isTranscribing,
}) => (
  <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
    <TabSwitch activeTab={activeTab} onTabChange={onTabChange} />

    {activeTab === 'text' ? (
      /* ---- Text mode ---- */
      <>
        <div className="mb-4">
          <textarea
            className="w-full h-32 bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 text-slate-700 focus:ring-2 focus:ring-[#2a7e75] focus:border-transparent outline-none resize-none break-words overflow-wrap-anywhere"
            placeholder="Enter any text you want to convert to sign language"
            value={inputText}
            onChange={(e) => onTextChange(e.target.value)}
          />
        </div>

        <button
          onClick={onConvert}
          disabled={!inputText?.trim()}
          className="w-full bg-[#2a7e75] hover:bg-[#236b63] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <span className="bg-white/20 rounded-full p-1 flex items-center justify-center">
            <RefreshCw size={15} />
          </span>
          Convert to Sign Language
        </button>
      </>
    ) : (
      /* ---- Video Link mode ---- */
      <>
        {/* URL input */}
        <div className="mb-4">
          <div className="flex items-center gap-2 bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#2a7e75] focus-within:border-transparent">
            <LinkIcon size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="url"
              className="w-full bg-transparent text-slate-700 outline-none text-sm placeholder:text-slate-400"
              placeholder="Paste YouTube or video URL here..."
              value={videoUrl || ''}
              onChange={(e) => onVideoUrlChange(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Supports YouTube links and direct video file URLs (.mp4, .webm, etc.)
          </p>
        </div>

        {/* Transcription output */}
        <div className="mb-4">
          <div className="w-full h-28 bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 text-sm text-slate-600 overflow-y-auto break-words">
            {isTranscribing ? (
              <div className="flex items-center justify-center h-full gap-2 text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                <span>Transcribing video...</span>
              </div>
            ) : inputText ? (
              inputText
            ) : (
              <span className="text-slate-400 italic">
                Transcribed text will appear here...
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onTranscribe}
            disabled={!videoUrl?.trim() || isTranscribing}
            className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {isTranscribing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            Transcribe
          </button>
          <button
            onClick={onConvert}
            disabled={!inputText?.trim()}
            className="flex-1 bg-[#2a7e75] hover:bg-[#236b63] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
          >
            Convert to Signs
          </button>
        </div>
      </>
    )}
  </div>
);

export default InputPanel;
