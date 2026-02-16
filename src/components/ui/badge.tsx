import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[url('/images/btn-mint.png')] bg-[length:100%_100%] text-white shadow-elevated hover:shadow-glow-mint",
        secondary:
          "border-transparent bg-[url('/images/btn-peach.png')] bg-[length:100%_100%] text-white shadow-elevated hover:shadow-glow-peach",
        destructive:
          "border-destructive/20 bg-gradient-to-b from-destructive/90 to-destructive text-destructive-foreground",
        outline:
          "border-border bg-white/5 text-foreground",
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
