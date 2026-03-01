import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 lowercase",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(59,240,122,0.08)] border-[rgba(59,240,122,0.15)] text-[#333333]",
        secondary:
          "bg-[rgba(255,107,74,0.06)] border-[rgba(255,107,74,0.12)] text-[#333333]",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive",
        outline:
          "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
