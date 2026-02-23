import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ReviewItem {
  id: string;
  provider_slug: string;
  procedure_name: string;
  rating: number;
  review_text: string;
  title: string;
  photos: string[] | null;
  verified_trip: boolean;
  created_at: string;
}

const ReviewsTab = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerNames, setProviderNames] = useState<Record<string, string>>({});
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, provider_slug, procedure_name, rating, review_text, title, photos, verified_trip, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const items = (data || []) as ReviewItem[];
      setReviews(items);

      // fetch provider names
      const slugs = [...new Set(items.map((r) => r.provider_slug))];
      if (slugs.length > 0) {
        const { data: providers } = await supabase
          .from("providers")
          .select("slug, name")
          .in("slug", slugs);
        const map: Record<string, string> = {};
        (providers || []).forEach((p: any) => { map[p.slug] = p.name; });
        setProviderNames(map);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#555", fontSize: 14 }}>
        no reviews yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div
          key={r.id}
          style={{
            background: "#0A0A0A",
            border: "1px solid rgba(255,107,74,0.08)",
            borderRadius: 16,
            padding: 20,
          }}
          className="md:p-5 p-4"
        >
          {/* top row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }} className="truncate">
                {providerNames[r.provider_slug] || r.provider_slug}
              </span>
              <span style={{ fontSize: 12, color: "#3BF07A" }}>{r.procedure_name}</span>
            </div>
            <div className="flex shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-3.5 h-3.5"
                  style={{
                    fill: s <= r.rating ? "#FFD700" : "transparent",
                    color: s <= r.rating ? "#FFD700" : "#333",
                  }}
                />
              ))}
            </div>
          </div>

          {/* body */}
          <p style={{ fontSize: 13, color: "#B0B0B0", lineHeight: 1.6 }}>{r.review_text}</p>

          {/* photos */}
          {r.photos && r.photos.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {r.photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxImg(url)}
                  className="md:w-16 md:h-16 w-14 h-14 rounded-lg overflow-hidden bg-[#111] shrink-0"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* footer */}
          <div className="flex items-center gap-2 mt-3">
            <span style={{ fontSize: 11, color: "#444" }}>
              {new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </span>
            {r.verified_trip && (
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(59,240,122,0.08)",
                  color: "#3BF07A",
                  padding: "2px 8px",
                  borderRadius: 9999,
                  fontSize: 10,
                }}
              >
                verified visit
              </span>
            )}
          </div>
        </div>
      ))}

      {/* lightbox */}
      <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
        <DialogContent className="max-w-2xl p-0 bg-black/95 border-none">
          {lightboxImg && (
            <img src={lightboxImg} alt="" className="w-full max-h-[85vh] object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsTab;
