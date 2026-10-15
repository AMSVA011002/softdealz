import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Label + wrapper                                                     */
/* ------------------------------------------------------------------ */

export function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("block text-[0.8rem] font-semibold text-ink-700 mb-1.5", className)}
      {...props}
    >
      {children}
      {required && <span className="text-rose-brand ml-0.5">*</span>}
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-[0.75rem] text-ink-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-[0.75rem] font-medium text-rose-brand">
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inputs                                                             */
/* ------------------------------------------------------------------ */

const controlBase =
  "w-full rounded-xl border bg-white px-3.5 text-ink-900 placeholder:text-ink-400 transition-colors duration-150 " +
  "border-ink-300 hover:border-ink-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12 " +
  "disabled:bg-ink-100 disabled:text-ink-500 disabled:cursor-not-allowed";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; sizeVariant?: "sm" | "md" | "lg" }
>(function Input({ className, invalid, sizeVariant = "md", ...props }, ref) {
  const heights = { sm: "h-9 text-[0.82rem]", md: "h-11 text-[0.89rem]", lg: "h-12 text-[0.95rem]" };
  return (
    <input
      ref={ref}
      className={cn(controlBase, heights[sizeVariant], invalid && "border-rose-brand", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlBase, "py-2.5 text-[0.89rem] leading-relaxed resize-y", invalid && "border-rose-brand", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; sizeVariant?: "sm" | "md" | "lg" }
>(function Select({ className, invalid, sizeVariant = "md", children, ...props }, ref) {
  const heights = { sm: "h-9 text-[0.82rem]", md: "h-11 text-[0.89rem]", lg: "h-12 text-[0.95rem]" };
  return (
    <select
      ref={ref}
      className={cn(
        controlBase,
        heights[sizeVariant],
        "appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')]",
        invalid && "border-rose-brand",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
});

export function Checkbox({
  className,
  label,
  description,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode; description?: string }) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-2.5 select-none", className)}>
      <span className="relative flex size-[1.15rem] shrink-0 items-center justify-center pt-0">
        <input
          type="checkbox"
          className="peer size-[1.15rem] shrink-0 cursor-pointer appearance-none rounded-[0.35rem] border-2 border-ink-300 bg-white transition-all checked:border-brand-600 checked:bg-brand-600 hover:border-brand-500 focus-ring"
          {...props}
        />
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute size-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m5 13 4 4L19 7" />
        </svg>
      </span>
      {(label || description) && (
        <span className="text-[0.85rem] leading-tight">
          <span className="text-ink-800 group-hover:text-ink-900">{label}</span>
          {description && <span className="block text-[0.75rem] text-ink-500">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Radio({
  className,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode }) {
  return (
    <label className={cn("group flex cursor-pointer items-center gap-2.5 select-none", className)}>
      <span className="relative flex size-[1.15rem] items-center justify-center">
        <input
          type="radio"
          className="peer size-[1.15rem] cursor-pointer appearance-none rounded-full border-2 border-ink-300 bg-white transition-all checked:border-brand-600 focus-ring"
          {...props}
        />
        <span className="pointer-events-none absolute size-2 rounded-full bg-brand-600 opacity-0 transition-opacity peer-checked:opacity-100" />
      </span>
      <span className="text-[0.85rem] text-ink-800">{label}</span>
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  name,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <label className={cn("flex items-center gap-3", disabled && "opacity-60")}>
      <button
        type="button"
        role="switch"
        name={name}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-ring",
          checked ? "bg-brand-600" : "bg-ink-300",
        )}
      >
        <span
          className={cn(
            "inline-block size-4.5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-[1.4rem]" : "translate-x-[0.15rem]",
          )}
        />
      </button>
      {(label || description) && (
        <span className="text-[0.85rem] leading-tight">
          <span className="font-medium text-ink-800">{label}</span>
          {description && <span className="block text-[0.75rem] text-ink-500">{description}</span>}
        </span>
      )}
    </label>
  );
}

/** Search-style input with a leading icon and optional trailing action. */
export function InputWithIcon({
  icon,
  trailing,
  className,
  inputClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  inputClassName?: string;
}) {
  return (
    <div className={cn("relative flex items-center", className)}>
      {icon && (
        <span className="pointer-events-none absolute left-3 flex text-ink-400" aria-hidden>
          {icon}
        </span>
      )}
      <input
        className={cn(controlBase, "h-11 text-[0.89rem]", icon && "pl-10", trailing && "pr-11", inputClassName)}
        {...props}
      />
      {trailing && <span className="absolute right-2 flex items-center">{trailing}</span>}
    </div>
  );
}

/** Two-step quantity stepper used on the PDP, cart and cart drawer. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  disabled,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}) {
  const buttonSize = size === "sm" ? "size-8 text-base" : "size-10 text-lg";
  const inputWidth = size === "sm" ? "w-10 h-8" : "w-12 h-10";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-ink-300 bg-white",
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(
          "grid place-items-center rounded-l-xl text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:opacity-40 disabled:hover:bg-transparent",
          buttonSize,
        )}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantity"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isNaN(parsed) ? min : Math.min(max, Math.max(min, parsed)));
        }}
        className={cn(
          "border-x border-ink-200 bg-transparent text-center text-[0.85rem] font-semibold text-ink-900 focus:outline-none",
          inputWidth,
        )}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          "grid place-items-center rounded-r-xl text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:opacity-40 disabled:hover:bg-transparent",
          buttonSize,
        )}
      >
        +
      </button>
    </div>
  );
}
