import type { ReactNode } from "react";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-[#e2d4c1] bg-[#fdf8f1] p-4 shadow-[0_2px_8px_rgb(15_23_42_/0.04)] transition-colors duration-150 hover:bg-white">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#cfe1d4] bg-[#ecf5ef] text-[#2f6b3f]">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[#5d5142]">{description}</p>
    </article>
  );
}
