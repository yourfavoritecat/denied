import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import candyPill from "@/assets/candy-pill.png";
import candyTooth from "@/assets/candy-tooth.png";
import candyStar from "@/assets/candy-star.png";

type CandyType = "pill" | "tooth" | "star";

const candyImages: Record<CandyType, string> = {
  pill: candyPill,
  tooth: candyTooth,
  star: candyStar,
};

const CandyEmptyState = ({
  candy = "star",
  message = "nothing here yet",
  ctaLabel,
  ctaTo,
  onCtaClick,
}: {
  candy?: CandyType;
  message?: string;
  ctaLabel?: string;
  ctaTo?: string;
  onCtaClick?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <img
      src={candyImages[candy]}
      alt=""
      className="candy-float"
      style={{
        width: candy === "tooth" ? 80 : 100,
        height: "auto",
        opacity: 0.6,
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.05))",
        pointerEvents: "none",
        marginBottom: 16,
      }}
    />
    <p style={{ color: "#888888", fontSize: 14, fontWeight: 500 }}>{message}</p>
    {ctaLabel && ctaTo && (
      <Button asChild className="mt-4">
        <Link to={ctaTo}>{ctaLabel}</Link>
      </Button>
    )}
    {ctaLabel && onCtaClick && !ctaTo && (
      <Button className="mt-4" onClick={onCtaClick}>
        {ctaLabel}
      </Button>
    )}
  </div>
);

export default CandyEmptyState;
