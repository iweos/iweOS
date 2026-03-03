type StepCardProps = {
  index: string;
  title: string;
  description: string;
};

export default function StepCard({ index, title, description }: StepCardProps) {
  return (
    <article className="rounded-xl border border-[#e7d8c6] bg-white p-4 shadow-[var(--panel-shadow)]">
      <p className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#e7f1e9] px-2 text-xs font-semibold text-[#255432]">
        {index}
      </p>
      <h3 className="mt-3 text-base font-semibold text-[#111827]">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[#4b5563]">{description}</p>
    </article>
  );
}
