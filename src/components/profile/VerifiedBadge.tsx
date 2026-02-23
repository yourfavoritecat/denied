import { CheckCircle } from "lucide-react";

/**
 * Simple verified badge. A user is "verified" if they have at least 1 connected social account.
 */
export const isUserVerified = (
  socialVerifications: Record<string, any> | null | undefined
): boolean => {
  const connected = Object.values(socialVerifications || {}).filter(
    (v: any) => v?.connected
  ).length;
  return connected >= 1;
};

interface VerifiedBadgeProps {
  verified: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: { fontSize: 11, padding: "3px 10px", iconSize: 12, gap: 4 },
  md: { fontSize: 13, padding: "6px 16px", iconSize: 14, gap: 5 },
  lg: { fontSize: 14, padding: "7px 18px", iconSize: 16, gap: 6 },
};

const VerifiedBadge = ({ verified, size = "sm" }: VerifiedBadgeProps) => {
  if (!verified) return null;

  const s = sizeStyles[size];

  return (
    <span
      className="inline-flex items-center shrink-0"
      style={{
        background: "rgba(59,240,122,0.15)",
        border: "1px solid rgba(59,240,122,0.3)",
        borderRadius: 999,
        padding: s.padding,
        fontSize: s.fontSize,
        color: "#3BF07A",
        fontWeight: 600,
        letterSpacing: 0.5,
        gap: s.gap,
        lineHeight: 1,
      }}
    >
      <CheckCircle style={{ width: s.iconSize, height: s.iconSize }} />
      verified
    </span>
  );
};

export default VerifiedBadge;
