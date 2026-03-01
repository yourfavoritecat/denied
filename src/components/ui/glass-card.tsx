import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative rounded-[20px] p-[3px] overflow-hidden", className)}
        style={{
          background: 'linear-gradient(135deg, #FF6B4A 0%, #FFDDD2 30%, #C8FFD4 70%, #3BF07A 100%)',
          boxShadow: '0 8px 40px rgba(255,107,74,0.12), 0 8px 40px rgba(59,240,122,0.08)',
        }}
        {...props}
      >
        <div
          className="relative rounded-[17px] h-full"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '32px 36px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {/* Glass sheen overlay */}
          <div
            className="absolute inset-0 rounded-[17px] pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 40%)',
            }}
          />
          <div className="relative z-10">{children}</div>
        </div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
