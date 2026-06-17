/**
 * SocialIcon - A styled social media icon link.
 */
const SocialIcon = ({ href, icon, label }) => {
  const Icon = icon;
  return (
    <a
      href={href}
      aria-label={label}
      className="hover:text-slate-700 transition-colors border border-gray-200 p-2 rounded-full bg-white"
    >
      <Icon size={20} />
    </a>
  );
};

export default SocialIcon;
