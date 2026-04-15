import { ReactNode, LabelHTMLAttributes } from 'react';

interface FormFieldProps {
  label:    string;
  htmlFor?: string;
  error?:   string;
  hint?:    string;
  required?: boolean;
  children: ReactNode;
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
}

export function FormField({ label, htmlFor, error, hint, required, children, labelProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-gray-700"
        {...labelProps}
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
