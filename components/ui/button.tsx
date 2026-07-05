import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50",
          variant === "default" && "bg-primary text-primary-foreground hover:opacity-90",
          variant === "ghost" && "hover:bg-white/10 text-muted-foreground hover:text-foreground",
          variant === "outline" && "border border-white/10 bg-transparent hover:bg-white/5",
          size === "sm" && "h-9 px-3 text-xs",
          size === "default" && "h-11 px-6 text-sm",
          size === "lg" && "h-12 px-8 text-base",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";