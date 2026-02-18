import { useMemo } from "react";

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
        <span
          key={tag}
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_12px_rgba(80,255,144,0.3)] cursor-default"
          style={{
            background: 'rgba(80,255,144,0.1)',
            border: '1px solid rgba(80,255,144,0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(80,255,144,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(80,255,144,0.1)';
          }}
        >
          {tag} ({count})
        </span>
      ))}
    </div>
  );
};

export default VibeTagsDisplay;
