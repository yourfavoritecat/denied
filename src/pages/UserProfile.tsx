import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Calendar, MapPin, Heart, Sparkles, Plane, Pencil, Star, Building2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import ReviewCard from "@/components/reviews/ReviewCard";
import { providers } from "@/data/providers";
import UserTrustBadge, { computeUserTrustTier } from "@/components/profile/UserTrustBadge";
import UserBadge, { BadgeType } from "@/components/profile/UserBadge";

interface PublicProfile {
  user_id: string;
  first_name: string | null;
  avatar_url: string | null;
  city: string | null;
  username: string;
  created_at: string;
  social_verifications?: Record<string, any>;
  badge_type?: BadgeType;
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
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [extras, setExtras] = useState<ProfileExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripsCount, setTripsCount] = useState(0);
  const [favProviders, setFavProviders] = useState<any[]>([]);
  const [favCreators, setFavCreators] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      let { data } = await supabase
        .from("profiles_public" as any)
        .select("user_id, first_name, avatar_url, city, username, created_at, social_verifications")
        .eq("username", userId)
        .maybeSingle();
      
      let badgeType: BadgeType = null;
      if (data) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("badge_type")
          .eq("user_id", (data as any).user_id)
          .maybeSingle();
        badgeType = (profileData as any)?.badge_type ?? null;
      }

      setProfile(data ? { ...(data as any), badge_type: badgeType } : null);

      if (data) {
        const uid = (data as any).user_id;
        const [tripsResult, extrasResult, favsResult] = await Promise.all([
          supabase.from("trip_briefs").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "completed"),
          supabase.from("user_profile_extras").select("bio, hobbies, fun_facts, favorite_emoji, skin_type, hair_type, favorite_treatments, beauty_goals, travel_style, favorite_destinations, bucket_list_procedures, public_fields").eq("user_id", uid).maybeSingle(),
          supabase.from("favorites" as any).select("target_id, target_type").eq("user_id", uid),
        ]);
        setTripsCount(tripsResult.count || 0);
        if (extrasResult.data) setExtras(extrasResult.data as any);

        // Resolve favorites
        const favs = (favsResult.data as any[]) || [];
        const provSlugs = favs.filter(f => f.target_type === "provider").map(f => f.target_id);
        const creatorHandles = favs.filter(f => f.target_type === "creator").map(f => f.target_id);

        const [provData, creatorData] = await Promise.all([
          provSlugs.length > 0 ? supabase.from("providers").select("slug, name, city, cover_photo_url, country").in("slug", provSlugs) : Promise.resolve({ data: [] }),
          creatorHandles.length > 0 ? supabase.from("creator_profiles").select("handle, display_name, avatar_url, specialties").in("handle", creatorHandles).eq("is_published", true) : Promise.resolve({ data: [] }),
        ]);
        setFavProviders((provData.data as any[]) || []);
        setFavCreators((creatorData.data as any[]) || []);
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const { reviews, loading: reviewsLoading } = useReviews(undefined, profile?.user_id || "__none__");

  const totalHelpfulness = reviews.reduce((sum, r) => sum + r.upvote_count, 0);
  const procedureTags = [...new Set(reviews.map((r) => r.procedure_name))];

  const isOwner = user?.id === profile?.user_id;

  if (loading) {
    return (
      <div className="min-h-screen">
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
    !!(e.beauty_goals || (e.favorite_treatments?.length));
  const hasTravelContent = (e: ProfileExtras) =>
    !!(e.travel_style || (e.favorite_destinations?.length) || (e.bucket_list_procedures?.length));

  if (!profile) {
    return (
      <div className="min-h-screen">
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
    <div className="min-h-screen">
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
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 flex-wrap">
                        {profile.first_name || "User"}
                        <UserTrustBadge
                          tier={computeUserTrustTier(profile.social_verifications, tripsCount > 0)}
                          size="lg"
                        />
                      </h1>
                      {profile.badge_type && (
                        <div className="mb-2">
                          <UserBadge badgeType={profile.badge_type} size="md" />
                        </div>
                      )}
                    </div>
                    {isOwner && (
                      <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs" style={{ borderColor: 'rgba(224,166,147,0.4)', color: '#E0A693' }}>
                        <Link to="/profile/edit">
                          <Pencil className="w-3 h-3" /> edit profile
                        </Link>
                      </Button>
                    )}
                  </div>
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

          {/* Favorite Creators */}
          {favCreators.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="w-4 h-4" style={{ fill: '#E0A693', color: '#E0A693' }} /> favorite creators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  {favCreators.slice(0, 3).map((c: any) => (
                    <Link key={c.handle} to={`/c/${c.handle}`} className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                      <Avatar className="w-8 h-8 shrink-0">
                        {c.avatar_url && <AvatarImage src={c.avatar_url} />}
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">{c.display_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{c.display_name}</span>
                    </Link>
                  ))}
                  {favCreators.length > 3 && <Link to="/creators" className="text-xs text-primary self-center">view all {favCreators.length}</Link>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Favorite Providers */}
          {favProviders.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="w-4 h-4" style={{ fill: '#5EB298', color: '#5EB298' }} /> favorite providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  {favProviders.slice(0, 3).map((p: any) => (
                    <Link key={p.slug} to={`/provider/${p.slug}`} className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-card">
                        {p.cover_photo_url ? <img src={p.cover_photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">{p.name?.[0]}</div>}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{p.name}</p>
                        {p.city && <p className="text-xs text-muted-foreground">{p.city}</p>}
                      </div>
                    </Link>
                  ))}
                  {favProviders.length > 3 && <span className="text-xs text-muted-foreground self-center">+{favProviders.length - 3} more</span>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Public About Me Sections */}
          {extras && (
            <>
              {hasAboutContent(extras) && (
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

              {hasBeautyContent(extras) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5 text-secondary" /> medspa regulars
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {extras.favorite_treatments && extras.favorite_treatments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">{extras.favorite_treatments.map(t => <Badge key={t} variant="outline">{t}</Badge>)}</div>
                    )}
                    {extras.beauty_goals && <p className="text-sm"><span className="text-muted-foreground">goals:</span> {extras.beauty_goals}</p>}
                  </CardContent>
                </Card>
              )}

              {hasTravelContent(extras) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Plane className="w-5 h-5 text-secondary" /> medical & dental tourism personality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {extras.travel_style && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">travel style</p>
                        <div className="flex flex-wrap gap-1.5">
                          {extras.travel_style.split(",").filter(Boolean).map(s => (
                            <Badge key={s} variant="outline">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {extras.favorite_destinations && extras.favorite_destinations.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">favorite destinations for budget friendly procedures & care</p>
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
