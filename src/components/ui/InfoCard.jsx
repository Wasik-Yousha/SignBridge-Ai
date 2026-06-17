/**
 * InfoCard - A card component for displaying titled content blocks.
 */
const InfoCard = ({ title, children }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
    <h3 className="text-xl font-serif text-slate-900 mb-4">{title}</h3>
    {children}
  </div>
);

export default InfoCard;
