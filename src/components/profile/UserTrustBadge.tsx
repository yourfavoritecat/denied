import pinUnverified from "@/assets/pin-unverified.png";
import pinVerified from "@/assets/pin-verified.png";
import pinTrustedTraveler from "@/assets/pin-trusted-traveler.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type UserTrustTier = "unverified" | "verified" | "trusted" | "trusted_traveler";

type BadgeSize = "sm" | "md" | "lg";

interface UserTrustBadgeProps {
  tier: UserTrustTier;
  size?: BadgeSize;
  showUpgradePrompt?: boolean;
}

const tierConfig: Record<UserTrustTier, { label: string; tooltip: string; upgradePrompt: string; icon: string }> = {
  unverified: {
    label: "Unverified",
    tooltip: "Unverified — connect your socials to earn a trust badge",
    upgradePrompt: "Connect your socials to earn Verified status.",
    icon: pinUnverified,
  },
  verified: {
    label: "Verified",
    tooltip: "Verified — social accounts connected",
    upgradePrompt: "Complete a trip through Denied to become a Trusted Traveler.",
    icon: pinVerified,
  },
  trusted: {
    label: "Trusted",
    tooltip: "Verified — social accounts connected",
    upgradePrompt: "Complete a trip through Denied to become a Trusted Traveler.",
    icon: pinVerified,
  },
  trusted_traveler: {
    label: "Trusted Traveler",
    tooltip: "Trusted Traveler — verified member with completed trips",
    upgradePrompt: "",
    icon: pinTrustedTraveler,
  },
};

const sizeMap: Record<BadgeSize, number> = {
  sm: 20,
  md: 32,
  lg: 48,
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

const UserTrustBadge = ({ tier, size = "sm", showUpgradePrompt = false }: UserTrustBadgeProps) => {
  const config = tierConfig[tier];
  const px = sizeMap[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5 shrink-0">
            <img
              src={config.icon}
              alt={config.label}
              width={px}
              height={px}
              className="inline-block"
              style={{ width: px, height: px }}
            />
            {showUpgradePrompt && config.upgradePrompt && (
              <span className="text-xs text-muted-foreground italic">
                {config.upgradePrompt}
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[240px]">
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UserTrustBadge;
