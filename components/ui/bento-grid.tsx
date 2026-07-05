import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BentoGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {children}
    </div>
  );
}

export function BentoCard({
  className,
  children,
  colSpan = 1,
  rowSpan = 1,
}: {
  className?: string;
  children: ReactNode;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
}) {
  const cols = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3" }[colSpan];
  const rows = rowSpan === 2 ? "lg:row-span-2" : "";
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-primary/40",
        cols,
        rows,
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(500px circle at 50% 0%, hsl(var(--primary) / 0.14), transparent 45%)" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
