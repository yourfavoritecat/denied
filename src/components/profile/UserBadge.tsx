import badgeTrustedCreator from "@/assets/badge-trusted-creator.png";
import badgeTrustedTraveler from "@/assets/badge-trusted-traveler.png";
import badgeFounder from "@/assets/badge-founder.png";

export type BadgeType = "trusted_creator" | "trusted_traveler" | "founder" | null;

interface UserBadgeProps {
  badgeType: BadgeType;
  size?: "sm" | "md";
}

// Star icon: which badge image provides which star personality
// founder → pearl/cream star (white badge)
// trusted_creator → peach star (peach badge)
// trusted_traveler → green star (green badge)
const badgeConfig: Record<
  NonNullable<BadgeType>,
  {
    starImage: string;
    label: string;
    pillBg: string;
    pillBorder: string;
    textColor: string;
  }
> = {
  founder: {
    starImage: badgeFounder,
    label: "founder",
    pillBg: "rgba(212,197,169,0.15)",
    pillBorder: "rgba(212,197,169,0.3)",
    textColor: "#D4C5A9",
  },
  trusted_creator: {
    starImage: badgeTrustedCreator,
    label: "trusted creator",
    pillBg: "rgba(94,178,152,0.15)",
    pillBorder: "rgba(94,178,152,0.3)",
    textColor: "#5EB298",
  },
  trusted_traveler: {
    starImage: badgeTrustedTraveler,
    label: "trusted traveler",
    pillBg: "rgba(224,166,147,0.15)",
    pillBorder: "rgba(224,166,147,0.3)",
    textColor: "#E0A693",
  },
};

const UserBadge = ({ badgeType, size = "md" }: UserBadgeProps) => {
  if (!badgeType) return null;
  const config = badgeConfig[badgeType];
  if (!config) return null;

  const starSize = size === "sm" ? 18 : 22;
  const fontSize = size === "sm" ? 10 : 11;
  const gap = size === "sm" ? 4 : 5;
  const py = size === "sm" ? 2 : 3;
  const px = size === "sm" ? 8 : 10;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
        flexShrink: 0,
      }}
    >
      {/* 3D star icon — cropped to show just the star from the left portion of the badge PNG */}
      <div
        style={{
          width: starSize,
          height: starSize,
          flexShrink: 0,
          overflow: "hidden",
          borderRadius: "50%",
        }}
      >
        <img
          src={config.starImage}
          alt=""
          draggable={false}
          style={{
            // Show only the left ~40% of the image where the 3D star lives
            width: `${starSize / 0.38}px`,
            height: `${starSize}px`,
            objectFit: "cover",
            objectPosition: "left center",
            display: "block",
          }}
        />
      </div>

      {/* Pure CSS pill for the label */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 9999,
          paddingTop: py,
          paddingBottom: py,
          paddingLeft: px,
          paddingRight: px,
          background: config.pillBg,
          border: `1px solid ${config.pillBorder}`,
          fontSize,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
          color: config.textColor,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {config.label}
      </span>
    </div>
  );
};

export default UserBadge;
