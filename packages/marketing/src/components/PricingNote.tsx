type Variant = 'deposit' | 'pause';

interface Props {
  variant: Variant;
  className?: string;
}

const COPY: Record<Variant, string> = {
  deposit: 'Your $10 reservation fee is applied directly to your first month.',
  pause:   'Pause anytime — billing stops the moment you put an agent on hold.',
};

export default function PricingNote({ variant, className = '' }: Props) {
  return (
    <p className={`text-xs text-blue-gray leading-relaxed ${className}`}>
      {COPY[variant]}
    </p>
  );
}
