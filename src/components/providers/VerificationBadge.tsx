import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  tier: string;
  size?: "sm" | "md";
}

const VerificationBadge = ({ tier, size = "sm" }: VerificationBadgeProps) => {
  // Only show badge for verified or premium providers
  if (tier !== "verified" && tier !== "premium") return null;

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/30 gap-1 cursor-help ${
              size === "md" ? "text-sm px-3 py-1" : "text-xs"
            }`}
          >
            <BadgeCheck className={iconSize} />
            verified visit
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
          someone from the denied.care community has visited this clinic and
          confirmed it's a legitimate, operating facility. this is not a
          guarantee of service quality — check reviews and ratings below.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerificationBadge;
