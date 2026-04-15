interface BadgeProps {
  variant?: 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'teal';
  children: React.ReactNode;
}

const styles: Record<NonNullable<BadgeProps['variant']>, string> = {
  gray:  'bg-gray-100 text-gray-600',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red:   'bg-red-50 text-red-700',
  blue:  'bg-accent-50 text-accent-700',
  teal:  'bg-cultivator-bg text-cultivator-text',
};

export function Badge({ variant = 'gray', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
