import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className = '', children, ...props }, ref) => (
    <select
      ref={ref}
      className={`
        block w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white
        focus:outline-none focus:ring-2 focus:ring-offset-0
        disabled:bg-gray-50 disabled:text-gray-500
        ${error
          ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
          : 'border-gray-300 focus:border-accent focus:ring-accent/20'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';
