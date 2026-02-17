import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl text-card-foreground glossy-border transition-all duration-200 ease hover:-translate-y-0.5",
      className
    )}
    style={{
      background: 'rgba(94,178,152,0.08)',
      border: '1px solid rgba(94,178,152,0.12)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 0 20px rgba(94,178,152,0.05)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      ...style,
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget;
      el.style.borderColor = 'rgba(94,178,152,0.2)';
      el.style.boxShadow = '0 0 20px rgba(94,178,152,0.25), 0 0 40px rgba(94,178,152,0.15), 0 0 60px rgba(94,178,152,0.05)';
      el.style.background = 'rgba(94,178,152,0.12)';
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget;
      el.style.borderColor = 'rgba(94,178,152,0.12)';
      el.style.boxShadow = '0 0 20px rgba(94,178,152,0.05)';
      el.style.background = 'rgba(94,178,152,0.08)';
    }}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-bold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
