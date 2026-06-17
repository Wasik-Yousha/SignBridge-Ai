/**
 * FeatureCard - Displays a feature with icon, title, and description.
 */
const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
    <div className="bg-[#EBF3F2] w-12 h-12 rounded-lg flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
  </div>
);

export default FeatureCard;
