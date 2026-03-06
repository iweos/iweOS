import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "brown";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export default function Button({
  variant = "secondary",
  size = "md",
  leftIcon,
  rightIcon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "secondary"
        ? "btn-secondary"
        : variant === "outline"
          ? "btn-outline-secondary"
          : variant === "danger"
            ? "btn-danger"
            : variant === "ghost"
              ? "btn-light"
              : "btn-brown";
  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";

  return (
    <button className={`btn ${variantClass} ${sizeClass} ${className}`.trim()} {...props}>
      {leftIcon ? <span className="me-1">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="ms-1">{rightIcon}</span> : null}
    </button>
  );
}
