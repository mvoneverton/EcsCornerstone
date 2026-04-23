import { Link } from 'react-router-dom';

const FOOTER_COLS = [
  {
    heading: 'Offerings',
    links: [
      { label: 'ECS AI Scan',        to: '/scan' },
      { label: 'ECS AI Assessment',  to: '/assessment' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'ECS Cornerstone',  to: '/cornerstone' },
      { label: 'Cornerstone SaaS', to: '/cornerstone-saas' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',         to: '/about' },
      { label: 'How It Works',  to: '/process' },
      { label: 'Contact',       to: '/assessment#book' },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-navy-100">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <img src="/ecs-logo.svg" alt="ECS" className="h-10 w-auto" />
            </div>
            <p className="text-sm text-blue-gray leading-relaxed">
              Your next great hire isn't human.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-blue-gray mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-navy-100 hover:text-gold-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-navy-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-blue-gray">
            © {new Date().getFullYear()} Everton Consulting Services. All rights reserved.
          </p>
          <p className="text-xs text-blue-gray">
            Built on{' '}
            <Link to="/cornerstone" className="hover:text-gold-400 transition-colors underline underline-offset-2">
              ECS Cornerstone
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
