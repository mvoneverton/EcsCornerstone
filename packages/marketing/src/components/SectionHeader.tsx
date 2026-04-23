import { Link } from 'react-router-dom';

interface Cta {
  label: string;
  to: string;
}

interface Props {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  cta?: Cta;
  dark?: boolean;
  center?: boolean;
}

export default function SectionHeader({ eyebrow, heading, subheading, cta, dark = false, center = false }: Props) {
  const alignClass = center ? 'text-center items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col gap-4 ${alignClass}`}>
      {eyebrow && (
        <p className={`text-xs font-semibold uppercase tracking-widest ${dark ? 'text-gold-400' : 'text-gold-500'}`}>
          {eyebrow}
        </p>
      )}

      <h2 className={`font-serif text-3xl sm:text-4xl leading-tight ${dark ? 'text-white' : 'text-navy-900'}`}>
        {heading}
      </h2>

      {subheading && (
        <p className={`text-base sm:text-lg leading-relaxed max-w-2xl ${dark ? 'text-navy-100' : 'text-navy-700'}`}>
          {subheading}
        </p>
      )}

      {cta && (
        <Link
          to={cta.to}
          className={`inline-flex items-center px-6 py-3 rounded text-sm font-semibold transition-colors
            ${dark
              ? 'bg-gold-500 text-navy-950 hover:bg-gold-400'
              : 'bg-navy-900 text-white hover:bg-navy-800'}`}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
