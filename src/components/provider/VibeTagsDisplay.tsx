import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { ReviewData } from "@/components/reviews/ReviewCard";

interface VibeTagsDisplayProps {
  reviews: ReviewData[];
}

const VibeTagsDisplay = ({ reviews }: VibeTagsDisplayProps) => {
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    reviews.forEach((r) => {
      const tags = (r as any).vibe_tags;
      if (Array.isArray(tags)) {
        tags.forEach((tag: string) => {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        });
      }
    });
    return Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]);
  }, [reviews]);

  if (tagCounts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tagCounts.map(([tag, count]) => (
        <Badge
          key={tag}
          className="bg-[#5EB298]/15 text-[#5EB298] border border-[#5EB298]/30 hover:bg-[#5EB298]/25 text-xs font-medium"
        >
          {tag} ({count})
        </Badge>
      ))}
    </div>
  );
};

export default VibeTagsDisplay;
