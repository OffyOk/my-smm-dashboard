import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-slate-700/60 bg-slate-900/60 text-slate-100 light:border-slate-200 light:bg-slate-100 light:text-slate-700",
        success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200 light:border-emerald-300 light:bg-emerald-50 light:text-emerald-700",
        warning: "border-amber-500/30 bg-amber-500/15 text-amber-200 light:border-amber-300 light:bg-amber-50 light:text-amber-700",
        danger: "border-rose-500/30 bg-rose-500/15 text-rose-200 light:border-rose-300 light:bg-rose-50 light:text-rose-700",
        info: "border-sky-500/30 bg-sky-500/15 text-sky-200 light:border-sky-300 light:bg-sky-50 light:text-sky-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
