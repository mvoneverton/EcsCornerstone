interface Props {
  number: number;
  heading: string;
  body: string;
  price?: string;
  isLast?: boolean;
}

export default function PhaseCard({ number, heading, body, price, isLast = false }: Props) {
  return (
    <div className="relative flex gap-6">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-px bg-navy-800" />
      )}

      {/* Number badge */}
      <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full border border-gold-500 text-gold-500 text-sm font-semibold z-10 bg-navy-950">
        {number}
      </div>

      {/* Content */}
      <div className="pb-12">
        <h3 className="font-serif text-xl text-white mb-2">{heading}</h3>
        <p className="text-sm text-navy-100 leading-relaxed">{body}</p>
        {price && (
          <span className="inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full border border-gold-500/40 text-gold-400">
            {price}
          </span>
        )}
      </div>
    </div>
  );
}
