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
  return (
    <button className={`admin-ui-btn admin-ui-btn-${variant} admin-ui-btn-${size} ${className}`} {...props}>
      {leftIcon ? <span className="admin-ui-btn-icon">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="admin-ui-btn-icon">{rightIcon}</span> : null}
    </button>
  );
}
