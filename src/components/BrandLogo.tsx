import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  variant?: "light" | "dark";
  showText?: boolean;
  label?: string;
};

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function BrandLogo({
  href,
  className,
  iconClassName,
  textClassName,
  variant = "dark",
  showText = true,
  label = "ìwéOS",
}: BrandLogoProps) {
  const toneClass = variant === "light" ? "text-white" : "text-slate-900";
  const rootClass = joinClasses("inline-flex items-center gap-2", className);
  const iconClass = joinClasses("fas fa-dove leading-none", toneClass, iconClassName);
  const nameClass = joinClasses("font-semibold tracking-tight leading-none", toneClass, textClassName);

  const content = (
    <>
      <i className={iconClass} aria-hidden="true" />
      {showText ? <span className={nameClass}>{label}</span> : <span className="sr-only">{label}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={rootClass}>
        {content}
      </Link>
    );
  }

  return <span className={rootClass}>{content}</span>;
}
