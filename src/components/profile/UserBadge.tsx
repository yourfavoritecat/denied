import badgeTrustedCreator from "@/assets/badge-trusted-creator.jpg";
import badgeTrustedTraveler from "@/assets/badge-trusted-traveler.jpg";
import badgeFounder from "@/assets/badge-founder.jpg";

export type BadgeType = "trusted_creator" | "trusted_traveler" | "founder" | null;

interface UserBadgeProps {
  badgeType: BadgeType;
  size?: "sm" | "md";
}

const badgeConfig: Record<NonNullable<BadgeType>, { image: string; label: string; textColor: string }> = {
  trusted_creator: {
    image: badgeTrustedCreator,
    label: "trusted creator",
    textColor: "rgba(255,255,255,0.95)",
  },
  trusted_traveler: {
    image: badgeTrustedTraveler,
    label: "trusted traveler",
    textColor: "rgba(255,255,255,0.95)",
  },
  founder: {
    image: badgeFounder,
    label: "founder",
    textColor: "rgba(50,40,35,0.9)",
  },
};

const UserBadge = ({ badgeType, size = "md" }: UserBadgeProps) => {
  if (!badgeType) return null;
  const config = badgeConfig[badgeType];
  if (!config) return null;

  const width = size === "sm" ? 100 : 120;
  const height = size === "sm" ? 28 : 36;
  const fontSize = size === "sm" ? 10 : 11;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <img
        src={config.image}
        alt={config.label}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: height / 2,
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          // offset right of star (star occupies ~30% of width)
          paddingLeft: width * 0.32,
          paddingRight: 8,
          fontSize,
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          color: config.textColor,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          lineHeight: 1,
          textShadow: badgeType === "founder" ? "none" : "0 0 4px rgba(0,0,0,0.25)",
        }}
      >
        {config.label}
      </span>
    </div>
  );
};

export default UserBadge;
