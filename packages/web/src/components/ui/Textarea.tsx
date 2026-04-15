import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`
        block w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 resize-y
        placeholder:text-gray-400
        focus:outline-none focus:ring-2 focus:ring-offset-0
        disabled:bg-gray-50 disabled:text-gray-500
        ${error
          ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
          : 'border-gray-300 focus:border-accent focus:ring-accent/20'
        }
        ${className}
      `}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
