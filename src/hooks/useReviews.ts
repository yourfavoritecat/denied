import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ReviewData } from "@/components/reviews/ReviewCard";

export const useReviews = (providerSlug?: string, userId?: string) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    
    let query = supabase
      .from("reviews" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (providerSlug) {
      query = query.eq("provider_slug", providerSlug);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: reviewsData } = await query;
    if (!reviewsData || (reviewsData as any[]).length === 0) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const typedReviews = reviewsData as any[];

    // Fetch profiles for all review users
    const userIds = [...new Set(typedReviews.map((r: any) => r.user_id))];
    const { data: profiles } = await supabase
      .from("review_author_profiles" as any)
      .select("user_id, first_name, city, username, public_profile, social_verifications, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    // Fetch upvote counts
    const reviewIds = typedReviews.map((r: any) => r.id);
    const { data: upvotes } = await supabase
      .from("review_upvotes" as any)
      .select("review_id, user_id")
      .in("review_id", reviewIds);

    const upvoteMap = new Map<string, number>();
    const userUpvoteSet = new Set<string>();
    ((upvotes as any[]) || []).forEach((u: any) => {
      upvoteMap.set(u.review_id, (upvoteMap.get(u.review_id) || 0) + 1);
      if (user && u.user_id === user.id) userUpvoteSet.add(u.review_id);
    });

    const enriched: ReviewData[] = typedReviews.map((r: any) => ({
      ...r,
      photos: r.photos || [],
      videos: r.videos || [],
      is_edited: r.is_edited || false,
      vibe_tags: r.vibe_tags || [],
      profile: profileMap.get(r.user_id) || null,
      upvote_count: upvoteMap.get(r.id) || 0,
      user_has_upvoted: userUpvoteSet.has(r.id),
      rating_cleanliness: r.rating_cleanliness,
      rating_communication: r.rating_communication,
      rating_wait_time: r.rating_wait_time,
      rating_outcome: r.rating_outcome,
      rating_safety: r.rating_safety,
      rating_value: r.rating_value,
    }));

    setReviews(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [providerSlug, userId, user?.id]);

  return { reviews, loading, refetch: fetchReviews };
};
