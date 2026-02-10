import { BadgeCheck, Shield, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerificationBadgeProps {
  tier: string;
  size?: "sm" | "md";
}

const tierConfig: Record<string, { label: string; icon: any; className: string }> = {
  listed: {
    label: "Listed",
    icon: Shield,
    className: "bg-muted text-muted-foreground",
  },
  verified: {
    label: "Verified",
    icon: BadgeCheck,
    className: "bg-secondary/15 text-secondary border border-secondary/30",
  },
  premium: {
    label: "Premium",
    icon: Award,
    className: "bg-amber-500/15 text-amber-600 border border-amber-500/30",
  },
};

const VerificationBadge = ({ tier, size = "sm" }: VerificationBadgeProps) => {
  const config = tierConfig[tier] || tierConfig.listed;
  const Icon = config.icon;
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <Badge className={`${config.className} gap-1 ${size === "md" ? "text-sm px-3 py-1" : "text-xs"}`}>
      <Icon className={iconSize} />
      {config.label}
    </Badge>
  );
};

export default VerificationBadge;
