/**
 * AvatarLoadingPlaceholder - Shown while the 3D scene is lazy loading.
 * Matches the visual style of the existing avatar display area.
 */
import { Hand } from 'lucide-react';

const AvatarLoadingPlaceholder = () => (
  <div className="bg-[#EAECEF] rounded-xl flex-1 flex flex-col items-center justify-center relative min-h-112.5 overflow-hidden">
    <div className="animate-pulse">
      <div className="bg-white/60 w-24 h-24 rounded-full flex items-center justify-center shadow-md mb-4 text-[#2a7e75]/40 mx-auto">
        <Hand size={40} strokeWidth={2.5} />
      </div>
      <h3 className="font-medium text-slate-400 text-center">
        Loading 3D Avatar...
      </h3>
      <div className="flex justify-center mt-3">
        <div className="w-6 h-6 border-2 border-[#2a7e75]/30 border-t-[#2a7e75] rounded-full animate-spin" />
      </div>
    </div>
  </div>
);

export default AvatarLoadingPlaceholder;
