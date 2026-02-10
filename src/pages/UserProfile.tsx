import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useReviews } from "@/hooks/useReviews";
import ReviewCard from "@/components/reviews/ReviewCard";
import { providers } from "@/data/providers";
import UserTrustBadge, { computeUserTrustTier } from "@/components/profile/UserTrustBadge";

interface PublicProfile {
  user_id: string;
  first_name: string | null;
  city: string | null;
  username: string;
  created_at: string;
  social_verifications?: Record<string, any>;
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripsCount, setTripsCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, first_name, city, username, created_at, social_verifications")
        .eq("username", username)
        .eq("public_profile", true)
        .single();
      setProfile(data as any);

      if (data) {
        const { count } = await supabase
          .from("trip_briefs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", (data as any).user_id)
          .eq("status", "completed");
        setTripsCount(count || 0);
      }
      setLoading(false);
    };
    fetch();
  }, [username]);

  const { reviews, loading: reviewsLoading } = useReviews(undefined, profile?.user_id);

  const totalHelpfulness = reviews.reduce((sum, r) => sum + r.upvote_count, 0);
  const procedureTags = [...new Set(reviews.map((r) => r.procedure_name))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground">This user doesn't have a public profile.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = (profile.first_name || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="w-20 h-20 text-xl bg-primary text-primary-foreground">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                    {profile.first_name || "User"}
                    <UserTrustBadge
                      tier={computeUserTrustTier(profile.social_verifications, tripsCount > 0)}
                      size="lg"
                    />
                  </h1>
                  {profile.city && (
                    <p className="text-muted-foreground flex items-center gap-1 justify-center sm:justify-start mb-3">
                      <MapPin className="w-4 h-4" /> {profile.city}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Member since {new Date(profile.created_at).getFullYear()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {totalHelpfulness} Helpfulness
                    </span>
                    <span>{tripsCount} trips completed</span>
                    <span>{reviews.length} reviews</span>
                  </div>
                </div>
              </div>
              {procedureTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {procedureTags.map((p) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <h2 className="text-xl font-bold mb-4">Reviews ({reviews.length})</h2>
          {reviewsLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const provider = providers.find((p) => p.slug === review.provider_slug);
                return (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showProviderName
                    providerName={provider?.name}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
