import badgeTrustedCreator from "@/assets/badge-trusted-creator.png";
import badgeTrustedTraveler from "@/assets/badge-trusted-traveler.png";
import badgeFounder from "@/assets/badge-founder.png";

export type BadgeType = "trusted_creator" | "trusted_traveler" | "founder" | null;

interface UserBadgeProps {
  badgeType: BadgeType;
  size?: "sm" | "md";
}

const badgeConfig: Record<
  NonNullable<BadgeType>,
  { image: string; label: string; textColor: string }
> = {
  trusted_creator: {
    image: badgeTrustedCreator,
    label: "trusted creator",
    textColor: "rgba(30, 70, 55, 0.95)",
  },
  trusted_traveler: {
    image: badgeTrustedTraveler,
    label: "trusted traveler",
    textColor: "rgba(100, 45, 30, 0.95)",
  },
  founder: {
    image: badgeFounder,
    label: "founder",
    textColor: "rgba(60, 50, 30, 0.95)",
  },
};

const UserBadge = ({ badgeType, size = "md" }: UserBadgeProps) => {
  if (!badgeType) return null;
  const config = badgeConfig[badgeType];
  if (!config) return null;

  // The badge pill image has a 3D star on the LEFT side that protrudes ~38% of the width.
  // Text must live in the RIGHT portion only — no overlap with the star.
  const width = size === "sm" ? 108 : 130;
  const height = size === "sm" ? 30 : 36;
  const fontSize = size === "sm" ? 9.5 : 11;
  // Star occupies roughly 38% from the left edge; add a small gap
  const textPaddingLeft = Math.round(width * 0.40);
  const textPaddingRight = size === "sm" ? 8 : 10;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
        // No background — let PNG render with full transparency intact
        background: "transparent",
      }}
    >
      {/* Badge image — fills container, preserves PNG alpha */}
      <img
        src={config.image}
        alt={config.label}
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill",
          // No border-radius here — the PNG itself has rounded pill shape
          display: "block",
        }}
      />

      {/* Text label — pushed RIGHT of the star */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          paddingLeft: textPaddingLeft,
          paddingRight: textPaddingRight,
          width: "100%",
          fontSize,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          color: config.textColor,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          lineHeight: 1,
          textAlign: "left",
          // Subtle text shadow for legibility on lighter pills
          textShadow: "0 0 3px rgba(255,255,255,0.4)",
        }}
      >
        {config.label}
      </span>
    </div>
  );
};

export default UserBadge;
