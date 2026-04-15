import { ReactNode } from 'react';

interface AuthLayoutProps {
  title:    string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-navy-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Brand */}
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-navy">ECS</span>
            <span className="text-2xl font-light text-navy-300">Cornerstone</span>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        {/* Card */}
        <div className="auth-card">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Everton Consulting Services · ECS Cornerstone
        </p>
      </div>
    </div>
  );
}
