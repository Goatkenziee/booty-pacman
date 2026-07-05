import * as React from "react";
import { cn } from "@/lib/utils";

export const ShimmerButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 inline-flex items-center">{children}</span>
    </button>
  ),
);
ShimmerButton.displayName = "ShimmerButton";
