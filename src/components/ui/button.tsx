import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-bold ring-offset-background transition-all duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 lowercase",
  {
    variants: {
      variant: {
        default:
          "bg-[#3BF07A] text-[#111111] border-none hover:shadow-[0_4px_24px_rgba(59,240,122,0.3)] hover:scale-[1.02]",
        destructive:
          "btn-glossy-destructive text-white hover:shadow-[0_4px_24px_rgba(220,38,38,0.3)]",
        outline:
          "bg-transparent text-[#3BF07A] border-2 border-[#3BF07A] hover:bg-[rgba(59,240,122,0.05)] hover:shadow-[0_4px_20px_rgba(59,240,122,0.15)]",
        secondary:
          "bg-[rgba(255,107,74,0.08)] text-[#FF6B4A] border border-[rgba(255,107,74,0.15)] hover:bg-[rgba(255,107,74,0.12)] hover:shadow-[0_4px_24px_rgba(255,107,74,0.25)]",
        ghost: "hover:bg-white/5 hover:text-foreground text-muted-foreground hover:shadow-[0_2px_12px_rgba(59,240,122,0.1)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-8 py-3",
        sm: "h-9 px-6 py-2 text-[13px]",
        lg: "h-12 px-10 py-3.5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
