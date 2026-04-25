import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'How It Works',          to: '/process' },
  { label: 'The ECS AI Scan',       to: '/scan' },
  { label: 'The ECS AI Full Assessment', to: '/assessment' },
  { label: 'About',                 to: '/about' },
] as const;

export default function Navbar() {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location              = useLocation();

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Add shadow after scrolling 16px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? 'text-gold-500'
        : 'text-navy-100 hover:text-gold-400'
    }`;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-navy-950 transition-shadow ${
        scrolled ? 'shadow-lg shadow-navy-950/40' : ''
      }`}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src="/ecs-logo.svg" alt="ECS" className="h-10 w-auto" />
            <span className="text-sm font-light text-blue-gray hidden sm:inline">
              Everton Consulting Services
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              to="/assessment#book"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded text-sm font-semibold
                         bg-gold-500 text-navy-950 hover:bg-gold-400 transition-colors"
            >
              Book Your Assessment
            </Link>

            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden p-2 text-navy-100 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-navy-800 bg-navy-950">
          <nav className="max-w-8xl mx-auto px-4 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/assessment#book"
              className="mt-2 inline-flex justify-center items-center px-4 py-2.5 rounded
                         text-sm font-semibold bg-gold-500 text-navy-950 hover:bg-gold-400
                         transition-colors"
            >
              Book Your Assessment
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
