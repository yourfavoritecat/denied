import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Plane, Star, MapPin, Pencil, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import ReviewCard from "@/components/reviews/ReviewCard";
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

        const favs = (favsResult.data as any[]) || [];
        const provSlugs = favs.filter(f => f.target_type === "provider").map(f => f.target_id);
        const creatorHandles = favs.filter(f => f.target_type === "creator").map(f => f.target_id);

        const [provData, creatorData] = await Promise.all([
          provSlugs.length > 0 ? supabase.from("providers").select("slug, name, city, cover_photo_url, country").in("slug", provSlugs) : Promise.resolve({ data: [] }),
          creatorHandles.length > 0 ? supabase.from("creator_profiles").select("handle, display_name, avatar_url, specialties, cover_photo_url").in("handle", creatorHandles).eq("is_published", true) : Promise.resolve({ data: [] }),
        ]);
        setFavProviders((provData.data as any[]) || []);
        setFavCreators((creatorData.data as any[]) || []);
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const { reviews, loading: reviewsLoading } = useReviews(undefined, profile?.user_id || "__none__");
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
  const trustTier = computeUserTrustTier(profile.social_verifications, tripsCount > 0);
  const memberYear = new Date(profile.created_at).getFullYear();

  // Travel style tags
  const travelStyleTags = extras?.travel_style
    ? extras.travel_style.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const hasAboutContent = !!(
    extras?.bio ||
    extras?.hobbies?.length ||
    extras?.fun_facts?.length ||
    extras?.favorite_emoji ||
    extras?.beauty_goals ||
    extras?.favorite_treatments?.length ||
    extras?.travel_style ||
    extras?.favorite_destinations?.length ||
    extras?.bucket_list_procedures?.length
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Owner edit banner */}
      {isOwner && (
        <div className="sticky top-0 z-40 border-b" style={{ background: 'rgba(94,178,152,0.08)', borderColor: 'rgba(94,178,152,0.2)' }}>
          <div className="max-w-[960px] mx-auto px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#5EB298' }}>
              <Pencil className="w-4 h-4" />
              <span>This is your public profile</span>
            </div>
            <Button size="sm" variant="outline" asChild style={{ borderColor: 'rgba(94,178,152,0.4)', color: '#5EB298' }}>
              <Link to="/profile">Edit Profile</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Cover — gradient, no photo for travelers */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: '180px',
          paddingTop: '64px',
          background: 'linear-gradient(135deg, rgba(94,178,152,0.15) 0%, rgba(224,166,147,0.1) 100%)',
        }}
      >
        {/* subtle grid texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,1) 40px,rgba(255,255,255,1) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,1) 40px,rgba(255,255,255,1) 41px)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {/* All content below cover */}
      <div className="max-w-[960px] mx-auto px-6">

        {/* Identity row — avatar overlaps cover */}
        <div className="flex items-center gap-6 -mt-14 relative z-10 mb-3">
          <Avatar className="w-32 h-32 shrink-0 border-[3px] border-[#0a0a0a] shadow-lg">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.first_name || "User"} className="object-cover" />}
            <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">{initials}</AvatarFallback>
          </Avatar>

          {/* Name + badge */}
          <div className="flex items-center gap-3 flex-wrap pt-14">
            <h1 className="text-5xl font-bold leading-none tracking-tight">{profile.first_name || "User"}</h1>
            {profile.badge_type ? (
              <img
                src={
                  profile.badge_type === 'founder' ? '/badges/founder.png?v=3'
                  : profile.badge_type === 'trusted_creator' ? '/badges/creator.png?v=3'
                  : '/badges/creator.png?v=3'
                }
                alt={profile.badge_type}
                className="h-10 w-auto"
                draggable={false}
              />
            ) : (
              <UserTrustBadge tier={trustTier} size="lg" />
            )}
          </div>
        </div>

        {/* Stats line */}
        <div className="mb-2">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="font-semibold text-white">{reviews.length}</span>
            {' '}review{reviews.length !== 1 ? 's' : ''}
            {' · '}
            <span className="font-semibold text-white">{tripsCount}</span>
            {' '}trip{tripsCount !== 1 ? 's' : ''} completed
            {profile.city && (
              <>
                {' · '}
                <span className="font-semibold text-white">{profile.city}</span>
              </>
            )}
            {' · '}
            member since <span className="font-semibold text-white">{memberYear}</span>
          </p>
        </div>

        {/* Bio */}
        {extras?.bio && (
          <p className="text-base mb-3 leading-relaxed line-clamp-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {extras.bio}
          </p>
        )}

        {/* Tags row */}
        {(procedureTags.length > 0 || travelStyleTags.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-0">
            {procedureTags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(94,178,152,0.12)', border: '1px solid rgba(94,178,152,0.25)', color: '#5EB298' }}>
                {tag}
              </span>
            ))}
            {travelStyleTags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(224,166,147,0.12)', border: '1px solid rgba(224,166,147,0.25)', color: '#E0A693' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 pb-16">
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-transparent border-b border-border rounded-none h-auto p-0">
              <TabsTrigger value="reviews" className="rounded-none h-11 text-sm font-medium text-muted-foreground bg-transparent border-b-2 border-transparent data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors">
                Reviews {reviews.length > 0 && <span className="ml-1.5 text-xs opacity-60">({reviews.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="favorites" className="rounded-none h-11 text-sm font-medium text-muted-foreground bg-transparent border-b-2 border-transparent data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors">
                Favorites
              </TabsTrigger>
              <TabsTrigger value="about" className="rounded-none h-11 text-sm font-medium text-muted-foreground bg-transparent border-b-2 border-transparent data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors">
                About Me
              </TabsTrigger>
            </TabsList>

            <style>{`
              .traveler-tabs [data-state="active"] { border-bottom-color: #5EB298 !important; }
            `}</style>

            <div className="traveler-tabs pt-4">

              {/* Reviews tab */}
              <TabsContent value="reviews">
                {reviewsLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-8" />
                ) : reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-muted-foreground text-sm">no reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="relative">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5 px-1">
                          <Building2 className="w-3 h-3" />
                          <Link to={`/provider/${review.provider_slug}`} className="hover:text-primary transition-colors font-medium" style={{ color: '#5EB298' }}>
                            {review.provider_slug}
                          </Link>
                        </div>
                        <ReviewCard review={review} showProviderName providerName={review.provider_slug} />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Favorites tab */}
              <TabsContent value="favorites">
                {favProviders.length === 0 && favCreators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-muted-foreground text-sm">no favorites yet</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Favorite Providers */}
                    {favProviders.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <Heart className="w-3 h-3 inline mr-1.5" style={{ color: '#5EB298' }} />
                          favorite providers
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {favProviders.map((p: any) => (
                            <Link key={p.slug} to={`/provider/${p.slug}`}
                              className="rounded-xl overflow-hidden border hover:border-primary/30 transition-all duration-200 group"
                              style={{ background: 'rgba(94,178,152,0.06)', borderColor: 'rgba(94,178,152,0.12)' }}>
                              <div className="h-24 overflow-hidden bg-muted">
                                {p.cover_photo_url
                                  ? <img src={p.cover_photo_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(94,178,152,0.1)' }}>
                                      <span className="text-2xl font-bold opacity-20">{p.name?.[0]}</span>
                                    </div>
                                }
                              </div>
                              <div className="p-2.5">
                                <p className="text-sm font-semibold truncate">{p.name}</p>
                                {p.city && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="w-3 h-3 shrink-0" />{p.city}
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Favorite Creators */}
                    {favCreators.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <Star className="w-3 h-3 inline mr-1.5" style={{ color: '#E0A693' }} />
                          favorite creators
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {favCreators.map((c: any) => (
                            <Link key={c.handle} to={`/c/${c.handle}`}
                              className="rounded-xl overflow-hidden border hover:border-secondary/30 transition-all duration-200 group"
                              style={{ background: 'rgba(224,166,147,0.06)', borderColor: 'rgba(224,166,147,0.12)' }}>
                              <div className="h-24 overflow-hidden bg-muted">
                                {c.cover_photo_url
                                  ? <img src={c.cover_photo_url} alt={c.display_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(224,166,147,0.1)' }}>
                                      <Avatar className="w-12 h-12">
                                        {c.avatar_url && <img src={c.avatar_url} className="w-full h-full object-cover rounded-full" />}
                                        <AvatarFallback className="bg-secondary text-secondary-foreground">{c.display_name?.[0]}</AvatarFallback>
                                      </Avatar>
                                    </div>
                                }
                              </div>
                              <div className="p-2.5">
                                <p className="text-sm font-semibold truncate">{c.display_name}</p>
                                {c.specialties?.[0] && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.specialties[0]}</p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* About Me tab */}
              <TabsContent value="about">
                {!hasAboutContent ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-muted-foreground text-sm">nothing shared yet</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* About section */}
                    {(extras?.bio || extras?.hobbies?.length || extras?.fun_facts?.length || extras?.favorite_emoji) && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>about</h3>
                        <div className="space-y-3">
                          {extras?.bio && <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{extras.bio}</p>}
                          {extras?.hobbies && extras.hobbies.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">hobbies</p>
                              <div className="flex flex-wrap gap-1.5">
                                {extras.hobbies.map(h => (
                                  <span key={h} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{h}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {extras?.fun_facts && extras.fun_facts.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">fun facts</p>
                              <div className="flex flex-wrap gap-1.5">
                                {extras.fun_facts.map(f => (
                                  <span key={f} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {extras?.favorite_emoji && (
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>favorite emoji: {extras.favorite_emoji}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* MedSpa / treatments section */}
                    {(extras?.beauty_goals || extras?.favorite_treatments?.length) && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <Sparkles className="w-3 h-3" style={{ color: '#E0A693' }} /> medspa regulars
                        </h3>
                        <div className="space-y-3">
                          {extras?.favorite_treatments && extras.favorite_treatments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {extras.favorite_treatments.map(t => (
                                <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium"
                                  style={{ background: 'rgba(224,166,147,0.12)', border: '1px solid rgba(224,166,147,0.25)', color: '#E0A693' }}>{t}</span>
                              ))}
                            </div>
                          )}
                          {extras?.beauty_goals && (
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                              <span className="text-muted-foreground">goals: </span>{extras.beauty_goals}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Travel personality section */}
                    {(extras?.travel_style || extras?.favorite_destinations?.length || extras?.bucket_list_procedures?.length) && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <Plane className="w-3 h-3" style={{ color: '#5EB298' }} /> tourism personality
                        </h3>
                        <div className="space-y-3">
                          {extras?.travel_style && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">travel style</p>
                              <div className="flex flex-wrap gap-1.5">
                                {extras.travel_style.split(",").filter(Boolean).map(s => (
                                  <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium"
                                    style={{ background: 'rgba(94,178,152,0.12)', border: '1px solid rgba(94,178,152,0.25)', color: '#5EB298' }}>{s.trim()}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {extras?.favorite_destinations && extras.favorite_destinations.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">favorite destinations</p>
                              <div className="flex flex-wrap gap-1.5">
                                {extras.favorite_destinations.map(d => (
                                  <span key={d} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{d}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {extras?.bucket_list_procedures && extras.bucket_list_procedures.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">bucket list procedures</p>
                              <div className="flex flex-wrap gap-1.5">
                                {extras.bucket_list_procedures.map(p => (
                                  <span key={p} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{p}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserProfile;
