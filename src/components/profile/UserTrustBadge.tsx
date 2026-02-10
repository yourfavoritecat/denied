import { BadgeCheck, Shield, Award, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type UserTrustTier = "unverified" | "verified" | "trusted" | "trusted_traveler";

interface UserTrustBadgeProps {
  tier: UserTrustTier;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const tierConfig: Record<UserTrustTier, { label: string; icon: any; className: string }> = {
  unverified: {
    label: "(unverified)",
    icon: Shield,
    className: "bg-muted text-muted-foreground",
  },
  verified: {
    label: "Verified",
    icon: BadgeCheck,
    className: "bg-[hsl(160,50%,65%)]/15 text-[hsl(160,50%,45%)] border border-[hsl(160,50%,65%)]/30",
  },
  trusted: {
    label: "Trusted",
    icon: ShieldCheck,
    className: "bg-amber-500/15 text-amber-600 border border-amber-500/30",
  },
  trusted_traveler: {
    label: "Trusted Traveler",
    icon: Award,
    className: "bg-amber-500/15 text-amber-600 border border-amber-500/30",
  },
};

export const computeUserTrustTier = (
  socialVerifications: Record<string, any> | null | undefined,
  hasCompletedBooking: boolean
): UserTrustTier => {
  const connected = Object.values(socialVerifications || {}).filter(
    (v: any) => v?.connected
  ).length;

  if (connected >= 2 && hasCompletedBooking) return "trusted_traveler";
  if (connected >= 2) return "trusted";
  if (connected >= 1) return "verified";
  return "unverified";
};

const UserTrustBadge = ({ tier, size = "sm", showLabel = true }: UserTrustBadgeProps) => {
  if (tier === "unverified" && !showLabel) return null;

  const config = tierConfig[tier];
  const Icon = config.icon;
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  if (tier === "unverified") {
    return <span className="text-xs text-muted-foreground italic">{config.label}</span>;
  }

  return (
    <Badge className={`${config.className} gap-1 ${size === "md" ? "text-sm px-3 py-1" : "text-xs"}`}>
      <Icon className={iconSize} />
      {showLabel && config.label}
    </Badge>
  );
};

export default UserTrustBadge;
