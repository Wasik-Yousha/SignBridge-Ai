import { Link, useLocation } from 'react-router-dom';

/**
 * Navbar - Floating transparent navigation bar.
 */
const Navbar = () => {
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';

  return (
    <div className="flex justify-center pt-5 px-6">
      <nav
        className="flex items-center justify-between w-full max-w-6xl rounded-xl px-5 py-2"
        style={{
          background: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow:
            '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
        }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/SignBridge logo.png"
            alt="Sign Bridge AI Logo"
            className="h-8 w-auto"
          />
          <span className="text-lg font-serif text-[#2a7e75]">
            <span className="font-bold">Sign Bridge</span>{' '}
            <span className="font-normal">AI</span>
          </span>
        </Link>

        <Link
          to="/about"
          className={`text-sm font-medium transition-colors ${
            isAboutPage
              ? 'text-[#2a7e75]'
              : 'text-slate-600 hover:text-[#2a7e75]'
          }`}
        >
          About
        </Link>
      </nav>
    </div>
  );
};

export default Navbar;
