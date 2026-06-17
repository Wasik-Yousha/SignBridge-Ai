import { Type, Link as LinkIcon } from 'lucide-react';

/**
 * TabSwitch - A toggle switch between Text and Video Link input modes.
 */
const TabSwitch = ({ activeTab, onTabChange }) => (
  <div className="flex bg-slate-50 p-1 rounded-lg mb-6 w-fit mx-auto border border-gray-200">
    <button
      onClick={() => onTabChange('text')}
      className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${
        activeTab === 'text'
          ? 'bg-[#2a7e75] text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Type size={16} /> Text
    </button>
    <button
      onClick={() => onTabChange('video')}
      className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${
        activeTab === 'video'
          ? 'bg-[#2a7e75] text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <LinkIcon size={16} /> Video Link
    </button>
  </div>
);

export default TabSwitch;
