// src/components/ui-kit/Button.tsx
// Branded buttons. Press animation, focus ring, disabled state.
import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "mint";
type Size    = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-mauve-600 hover:-translate-y-0.5 hover:shadow-elev2",
  secondary:
    "bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground",
  outline:
    "bg-transparent border-[1.5px] border-border text-foreground hover:border-primary hover:text-primary",
  ghost:
    "bg-transparent text-foreground hover:bg-secondary",
  mint:
    "bg-mint-400 text-white hover:bg-mint-500 hover:-translate-y-0.5 hover:shadow-mint",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs font-semibold gap-1.5",
  md: "h-10 px-5 text-sm font-semibold gap-2",
  lg: "h-12 px-6 text-base font-bold gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className, children, fullWidth, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-full press",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {children}
    </button>
  );
});
