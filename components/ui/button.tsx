import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "ocean"
  | "outline"
  | "ghost"
  | "subtle"
  | "danger"
  | "dark"
  | "white";
type Size = "sm" | "md" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-[0_6px_18px_-8px_rgba(12,128,15,0.7)]",
  ocean:
    "bg-ocean-600 text-white hover:bg-ocean-700 active:bg-ocean-800 shadow-[0_6px_18px_-8px_rgba(10,87,160,0.7)]",
  outline:
    "border border-ink-300 bg-white text-ink-800 hover:border-brand-500 hover:text-brand-700 hover:bg-brand-50",
  ghost: "text-ink-700 hover:bg-ink-100 hover:text-ink-900",
  subtle: "bg-ink-100 text-ink-800 hover:bg-ink-200",
  danger: "bg-rose-brand text-white hover:brightness-95 active:brightness-90",
  dark: "bg-ink-900 text-white hover:bg-ink-800",
  white: "bg-white text-ink-900 hover:bg-ink-100 shadow-soft",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.8rem] gap-1.5 rounded-lg",
  md: "h-11 px-5 text-[0.89rem] gap-2 rounded-xl",
  lg: "h-12 px-6 text-[0.95rem] gap-2 rounded-xl",
  xl: "h-14 px-8 text-[1rem] gap-2.5 rounded-xl",
  icon: "h-11 w-11 rounded-xl",
  "icon-sm": "h-9 w-9 rounded-lg",
  "icon-lg": "h-12 w-12 rounded-xl",
};

export interface ButtonBaseProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const buttonClasses = ({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: ButtonBaseProps = {}) =>
  cn(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap transition-all duration-200",
    "disabled:opacity-55 disabled:pointer-events-none select-none",
    "active:scale-[0.98] focus-ring",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonBaseProps {}

export function Button({
  variant,
  size,
  loading,
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export interface ButtonLinkProps
  extends React.ComponentPropsWithoutRef<typeof Link>,
    ButtonBaseProps {}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {children}
    </Link>
  );
}
