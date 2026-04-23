interface Props {
  title: string;
}

export default function PlaceholderPage({ title }: Props) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-gray mb-3">
        Coming in a later build step
      </p>
      <h1 className="font-serif text-4xl text-navy-900 text-center">{title}</h1>
    </div>
  );
}
