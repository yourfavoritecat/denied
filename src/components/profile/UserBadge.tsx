export type BadgeType = "trusted_creator" | "trusted_traveler" | "founder" | "trusted_provider" | null;

const BADGE_IMAGES: Record<string, string> = {
  founder: "/badges/founder.png",
  trusted_creator: "/badges/creator.png",
  trusted_traveler: "/badges/creator.png",
  trusted_provider: "/badges/provider.png",
};

interface UserBadgeProps {
  badgeType: BadgeType;
  size?: "default" | "sm";
}

const UserBadge = ({ badgeType, size = "default" }: UserBadgeProps) => {
  if (!badgeType) return null;
  const src = BADGE_IMAGES[badgeType];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={badgeType}
      className={size === "sm" ? "h-6 w-auto" : "h-9 w-auto"}
      draggable={false}
    />
  );
};

export default UserBadge;
