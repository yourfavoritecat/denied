import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Calendar, MapPin, Heart, Sparkles, Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useReviews } from "@/hooks/useReviews";
import ReviewCard from "@/components/reviews/ReviewCard";
import { providers } from "@/data/providers";
import UserTrustBadge, { computeUserTrustTier } from "@/components/profile/UserTrustBadge";

interface PublicProfile {
  user_id: string;
  first_name: string | null;
  avatar_url: string | null;
  city: string | null;
  username: string;
  created_at: string;
  social_verifications?: Record<string, any>;
}

interface ProfileExtras {
  bio?: string;
  hobbies?: string[];
  fun_facts?: string[];
  favorite_emoji?: string;
  skin_type?: string;
  hair_type?: string;
  favorite_treatments?: string[];
  beauty_goals?: string;
  travel_style?: string;
  favorite_destinations?: string[];
  bucket_list_procedures?: string[];
  public_fields?: Record<string, boolean>;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [extras, setExtras] = useState<ProfileExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripsCount, setTripsCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      // Try lookup by username first, then by user_id
      let { data } = await supabase
        .from("profiles_public" as any)
        .select("user_id, first_name, avatar_url, city, username, created_at, social_verifications")
        .eq("username", userId)
        .maybeSingle();
      setProfile(data as any);

      if (data) {
        const [tripsResult, extrasResult] = await Promise.all([
          supabase
            .from("trip_briefs")
            .select("id", { count: "exact", head: true })
            .eq("user_id", (data as any).user_id)
            .eq("status", "completed"),
          supabase
            .from("user_profile_extras")
            .select("bio, hobbies, fun_facts, favorite_emoji, skin_type, hair_type, favorite_treatments, beauty_goals, travel_style, favorite_destinations, bucket_list_procedures, public_fields")
            .eq("user_id", (data as any).user_id)
            .maybeSingle(),
        ]);
        setTripsCount(tripsResult.count || 0);
        if (extrasResult.data) {
          setExtras(extrasResult.data as any);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

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
  const hasAboutContent = (e: ProfileExtras) =>
    !!(e.bio || (e.hobbies?.length) || (e.fun_facts?.length) || e.favorite_emoji);
  const hasBeautyContent = (e: ProfileExtras) =>
    !!(e.skin_type || e.hair_type || e.beauty_goals || (e.favorite_treatments?.length));
  const hasTravelContent = (e: ProfileExtras) =>
    !!(e.travel_style || (e.favorite_destinations?.length) || (e.bucket_list_procedures?.length));

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
                  {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.first_name || "User"} />}
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

          {/* Public About Me Sections */}
          {extras && extras.public_fields && (
            <>
              {extras.public_fields.about && hasAboutContent(extras) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Heart className="w-5 h-5 text-secondary" /> about me
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {extras.bio && <p className="text-foreground">{extras.bio}</p>}
                    {extras.hobbies && extras.hobbies.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">hobbies</p>
                        <div className="flex flex-wrap gap-1.5">{extras.hobbies.map(h => <Badge key={h} variant="outline">{h}</Badge>)}</div>
                      </div>
                    )}
                    {extras.fun_facts && extras.fun_facts.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">fun facts</p>
                        <div className="flex flex-wrap gap-1.5">{extras.fun_facts.map(f => <Badge key={f} variant="outline">{f}</Badge>)}</div>
                      </div>
                    )}
                    {extras.favorite_emoji && <p className="text-sm">favorite emoji: {extras.favorite_emoji}</p>}
                  </CardContent>
                </Card>
              )}

              {extras.public_fields.beauty && hasBeautyContent(extras) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5 text-secondary" /> beauty & wellness
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {extras.skin_type && <p className="text-sm"><span className="text-muted-foreground">skin type:</span> {extras.skin_type}</p>}
                    {extras.hair_type && <p className="text-sm"><span className="text-muted-foreground">hair type:</span> {extras.hair_type}</p>}
                    {extras.beauty_goals && <p className="text-sm"><span className="text-muted-foreground">goals:</span> {extras.beauty_goals}</p>}
                    {extras.favorite_treatments && extras.favorite_treatments.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">favorite treatments</p>
                        <div className="flex flex-wrap gap-1.5">{extras.favorite_treatments.map(t => <Badge key={t} variant="outline">{t}</Badge>)}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {extras.public_fields.travel && hasTravelContent(extras) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Plane className="w-5 h-5 text-secondary" /> travel personality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {extras.travel_style && <p className="text-sm"><span className="text-muted-foreground">travel style:</span> {extras.travel_style}</p>}
                    {extras.favorite_destinations && extras.favorite_destinations.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">favorite destinations</p>
                        <div className="flex flex-wrap gap-1.5">{extras.favorite_destinations.map(d => <Badge key={d} variant="outline">{d}</Badge>)}</div>
                      </div>
                    )}
                    {extras.bucket_list_procedures && extras.bucket_list_procedures.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">bucket list procedures</p>
                        <div className="flex flex-wrap gap-1.5">{extras.bucket_list_procedures.map(p => <Badge key={p} variant="outline">{p}</Badge>)}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

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
