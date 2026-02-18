import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, Star, MapPin, Pencil, Building2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import ReviewCard from "@/components/reviews/ReviewCard";
import UserTrustBadge, { computeUserTrustTier } from "@/components/profile/UserTrustBadge";
import UserBadge, { BadgeType } from "@/components/profile/UserBadge";
import { useToast } from "@/hooks/use-toast";

interface PublicProfile {
  user_id: string;
  first_name: string | null;
  avatar_url: string | null;
  city: string | null;
  username: string;
  created_at: string;
  social_verifications?: Record<string, any>;
  badge_type?: BadgeType;
  status?: string | null;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripsCount, setTripsCount] = useState(0);
  const [favProviders, setFavProviders] = useState<any[]>([]);
  const [favCreators, setFavCreators] = useState<any[]>([]);

  // Status editing
  const [statusText, setStatusText] = useState("");
  const [editingStatus, setEditingStatus] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const statusInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      let { data } = await supabase
        .from("profiles_public" as any)
        .select("user_id, first_name, avatar_url, city, username, created_at, social_verifications")
        .eq("username", userId)
        .maybeSingle();

      let badgeType: BadgeType = null;
      let statusVal: string | null = null;
      if (data) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("badge_type, status")
          .eq("user_id", (data as any).user_id)
          .maybeSingle();
        badgeType = (profileData as any)?.badge_type ?? null;
        statusVal = (profileData as any)?.status ?? null;
      }

      const fullProfile = data ? { ...(data as any), badge_type: badgeType, status: statusVal } : null;
      setProfile(fullProfile);
      if (statusVal) setStatusText(statusVal);

      if (data) {
        const uid = (data as any).user_id;
        const [tripsResult, favsResult] = await Promise.all([
          supabase.from("trip_briefs").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "completed"),
          supabase.from("favorites" as any).select("target_id, target_type").eq("user_id", uid),
        ]);
        setTripsCount(tripsResult.count || 0);

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

  useEffect(() => {
    if (editingStatus && statusInputRef.current) {
      statusInputRef.current.focus();
      statusInputRef.current.setSelectionRange(statusText.length, statusText.length);
    }
  }, [editingStatus]);

  const handleSaveStatus = async () => {
    if (!user || !profile) return;
    setSavingStatus(true);
    const { error } = await supabase
      .from("profiles")
      .update({ status: statusText.trim() || null } as any)
      .eq("user_id", user.id);
    setSavingStatus(false);
    if (!error) {
      setEditingStatus(false);
      setProfile(prev => prev ? { ...prev, status: statusText.trim() || null } : prev);
      toast({ title: "Status updated" });
    }
  };

  const { reviews, loading: reviewsLoading } = useReviews(undefined, profile?.user_id || "__none__");
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
        <div className="mb-1">
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

        {/* Status — inline editable for owner */}
        {isOwner ? (
          <div className="mb-4 mt-1">
            {editingStatus ? (
              <div className="flex items-center gap-2">
                <input
                  ref={statusInputRef}
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value.slice(0, 150))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveStatus();
                    if (e.key === "Escape") setEditingStatus(false);
                  }}
                  placeholder="share what you're up to..."
                  maxLength={150}
                  className="bg-transparent border-none outline-none text-base italic w-full max-w-[500px]"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                />
                <button
                  onClick={handleSaveStatus}
                  disabled={savingStatus}
                  className="shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                  style={{ color: '#5EB298' }}
                >
                  <Check className="w-4 h-4" />
                </button>
                <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{statusText.length}/150</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 group cursor-pointer w-fit"
                onClick={() => setEditingStatus(true)}
              >
                {statusText ? (
                  <p className="text-base italic" style={{ color: 'rgba(255,255,255,0.6)' }}>{statusText}</p>
                ) : (
                  <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.25)' }}>+ add a status</p>
                )}
                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />
              </div>
            )}
          </div>
        ) : (
          profile.status && (
            <p className="text-base italic mb-4 mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {profile.status}
            </p>
          )
        )}

        {/* Tabs — just Reviews and Favorites */}
        <div className="mt-4 pb-16">
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-transparent border-b border-border rounded-none h-auto p-0">
              <TabsTrigger value="reviews" className="rounded-none h-11 text-sm font-medium text-muted-foreground bg-transparent border-b-2 border-transparent data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors" style={{ '--tw-border-opacity': 1 } as any}>
                Reviews {reviews.length > 0 && <span className="ml-1.5 text-xs opacity-60">({reviews.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="favorites" className="rounded-none h-11 text-sm font-medium text-muted-foreground bg-transparent border-b-2 border-transparent data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors">
                Favorites
              </TabsTrigger>
            </TabsList>

            <style>{`
              [data-radix-collection-item][data-state="active"] { border-bottom-color: #5EB298 !important; }
            `}</style>

            <div className="pt-4">

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

            </div>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserProfile;
