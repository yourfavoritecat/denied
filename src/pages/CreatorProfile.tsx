import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Star, MapPin, Instagram, Play, X, ChevronLeft, ChevronRight,
  BadgeCheck, ArrowUp, Pencil, BookOpen, Building2, Stethoscope,
  ExternalLink, Clock
} from "lucide-react";
import RequestQuoteModal from "@/components/providers/RequestQuoteModal";
import ReviewCard, { type ReviewData } from "@/components/reviews/ReviewCard";
import UserBadge from "@/components/profile/UserBadge";
import logo from "@/assets/logo-clean.png";

interface CreatorProfileData {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  social_links: Record<string, string>;
  featured_providers: string[];
  is_published: boolean;
  specialties: string[];
}

interface ProviderInfo {
  slug: string;
  name: string;
  city: string | null;
  cover_photo_url: string | null;
  country: string | null;
}

interface AdminReview {
  provider_slug: string;
  rating: number;
  personally_visited: boolean;
}

interface ContentItem {
  id: string;
  creator_id: string;
  provider_slug: string | null;
  media_url: string;
  media_type: string;
  caption: string | null;
  procedure_tags: string[];
  sort_order: number;
}

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-1-.08 6.27 6.27 0 0 0-6.27 6.27 6.27 6.27 0 0 0 6.27 6.27 6.27 6.27 0 0 0 6.27-6.27V8.97a8.16 8.16 0 0 0 4.04 1.05V6.69h-.01z" />
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.68 31.68 0 0 0 0 12a31.68 31.68 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.84.56 9.38.56 9.38.56s7.54 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.68 31.68 0 0 0 24 12a31.68 31.68 0 0 0-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
  </svg>
);

const CreatorProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [providers, setProviders] = useState<Record<string, ProviderInfo>>({});
  const [adminReviews, setAdminReviews] = useState<Record<string, AdminReview>>({});
  const [content, setContent] = useState<ContentItem[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [userBadge, setUserBadge] = useState<string | null>(null);
  const [quoteProvider, setQuoteProvider] = useState<{ name: string; slug: string } | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!handle) return;
    loadProfile();
  }, [handle]);

  const loadProfile = async () => {
    const { data: cp } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("handle", handle!)
      .eq("is_published", true)
      .maybeSingle();

    if (!cp) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const p = cp as unknown as CreatorProfileData;
    setProfile(p);

    const slugs = p.featured_providers || [];

    const [provRes, arRes, contentRes, reviewRes, profileRes] = await Promise.all([
      slugs.length > 0
        ? supabase.from("providers").select("slug, name, city, cover_photo_url, country").in("slug", slugs)
        : Promise.resolve({ data: [] }),
      slugs.length > 0
        ? supabase.from("provider_admin_reviews").select("provider_slug, rating, personally_visited").in("provider_slug", slugs)
        : Promise.resolve({ data: [] }),
      supabase.from("creator_content").select("*").eq("creator_id", p.id).order("sort_order", { ascending: true }),
      supabase.from("reviews").select("*").eq("user_id", p.user_id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("badge_type").eq("user_id", p.user_id).maybeSingle(),
    ]);

    const pMap: Record<string, ProviderInfo> = {};
    ((provRes.data as ProviderInfo[]) || []).forEach((prov) => (pMap[prov.slug] = prov));
    setProviders(pMap);

    const arMap: Record<string, AdminReview> = {};
    ((arRes.data as unknown as AdminReview[]) || []).forEach((ar) => (arMap[ar.provider_slug] = ar));
    setAdminReviews(arMap);

    setContent((contentRes.data as unknown as ContentItem[]) || []);
    setUserBadge((profileRes.data as any)?.badge_type || null);

    if (reviewRes.data) {
      setReviews(
        (reviewRes.data as any[]).map((r) => ({
          ...r,
          photos: r.photos || [],
          videos: r.videos || [],
          upvote_count: 0,
          user_has_upvoted: false,
          vibe_tags: r.vibe_tags || [],
        }))
      );
    }

    setLoading(false);
  };

  const openLightbox = (photos: string[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold">creator not found</h1>
        <p className="text-muted-foreground text-center">This creator profile doesn't exist or isn't published yet.</p>
        <Button asChild variant="outline">
          <Link to="/">go home</Link>
        </Button>
      </div>
    );
  }

  const orderedProviderSlugs = (profile.featured_providers || []).filter((s) => providers[s]);
  const socialLinks = profile.social_links || {};
  const hasSocials = socialLinks.instagram || socialLinks.tiktok || socialLinks.youtube;
  const isOwner = user && profile.user_id === user.id;

  // Stats
  const reviewCount = reviews.length;
  const uniqueProviders = new Set(reviews.map((r) => r.provider_slug)).size;
  const uniqueProcedures = new Set(reviews.map((r) => r.procedure_name).filter(Boolean)).size;

  // Content grouping for gallery
  const contentByProvider: Record<string, ContentItem[]> = {};
  const ungroupedContent: ContentItem[] = [];
  content.forEach((item) => {
    if (item.provider_slug && providers[item.provider_slug]) {
      if (!contentByProvider[item.provider_slug]) contentByProvider[item.provider_slug] = [];
      contentByProvider[item.provider_slug].push(item);
    } else {
      ungroupedContent.push(item);
    }
  });

  const specialties = (profile as any).specialties || [];

  return (
    <div className="min-h-screen">
      {/* Owner Edit Banner */}
      {isOwner && (
        <div className="sticky top-0 z-40 bg-primary/10 border-b border-primary/20">
          <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Pencil className="w-4 h-4" />
              <span>This is your creator page</span>
            </div>
            <Button size="sm" variant="outline" asChild className="border-primary/30 text-primary hover:bg-primary/10">
              <Link to="/creator/edit">Edit Profile</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Hero / Cover */}
      <div className="relative w-full h-[220px] overflow-hidden">
        <img
          src={profile.cover_photo_url || '/images/hero-creator.jpg'}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Profile Header — overlapping cover */}
      <div className="relative max-w-2xl mx-auto px-4 -mt-14 z-10">
        <div className="flex items-end gap-4 mb-4">
          <Avatar className="w-24 h-24 border-4 border-background shadow-elevated shrink-0">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} className="object-cover" />}
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
              {profile.display_name?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="pb-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold leading-tight">{profile.display_name}</h1>
            </div>
            {userBadge ? (
              <div className="mt-1">
                <UserBadge badgeType={userBadge as any} />
              </div>
            ) : (
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs mt-1">
                <BadgeCheck className="w-3 h-3" /> denied.care creator
              </Badge>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-muted-foreground leading-relaxed mb-3">{profile.bio}</p>
        )}

        {/* Specialty tags */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {specialties.map((s: string) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-medium">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Social Links */}
        {hasSocials && (
          <div className="flex items-center gap-3 mb-6">
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {socialLinks.tiktok && (
              <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors">
                <TikTokIcon className="w-4 h-4" />
              </a>
            )}
            {socialLinks.youtube && (
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors">
                <YouTubeIcon className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <StatBox icon={<Building2 className="w-4 h-4" />} value={uniqueProviders} label="providers visited" />
          <StatBox icon={<Star className="w-4 h-4" />} value={reviewCount} label="reviews written" />
          <StatBox icon={<Stethoscope className="w-4 h-4" />} value={uniqueProcedures} label="procedures documented" />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <Tabs defaultValue="reviews">
          <TabsList className="w-full mb-6 bg-card border border-border">
            <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
            <TabsTrigger value="providers" className="flex-1">Saved Providers</TabsTrigger>
            <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
            <TabsTrigger value="trips" className="flex-1">Trip Reports</TabsTrigger>
          </TabsList>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            {reviews.length === 0 ? (
              <EmptyState
                icon={<Star className="w-6 h-6 text-muted-foreground" />}
                title="No reviews yet"
                description={`${profile.display_name} hasn't left any reviews yet.`}
              />
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="relative">
                    {/* Provider name header */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5 px-1">
                      <Building2 className="w-3 h-3" />
                      <Link to={`/provider/${review.provider_slug}`} className="hover:text-primary transition-colors font-medium">
                        {providers[review.provider_slug]?.name || review.provider_slug}
                      </Link>
                    </div>
                    <ReviewCard
                      review={review}
                      showProviderName
                      providerName={providers[review.provider_slug]?.name || review.provider_slug}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved Providers Tab */}
          <TabsContent value="providers">
            {orderedProviderSlugs.length === 0 ? (
              <EmptyState
                icon={<Building2 className="w-6 h-6 text-muted-foreground" />}
                title="No saved providers"
                description={`${profile.display_name} hasn't curated their provider list yet.`}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                {orderedProviderSlugs.map((slug) => {
                  const prov = providers[slug];
                  if (!prov) return null;
                  const ar = adminReviews[slug];
                  return (
                    <Card key={slug} className="overflow-hidden tactile-press">
                      <Link to={`/provider/${slug}`}>
                        <div className="h-28 bg-muted overflow-hidden">
                          {prov.cover_photo_url ? (
                            <img src={prov.cover_photo_url} alt={prov.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <span className="text-3xl font-bold text-muted-foreground/30">{prov.name[0]}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <CardContent className="p-3">
                        <Link to={`/provider/${slug}`} className="hover:text-primary transition-colors">
                          <h3 className="font-semibold text-sm truncate">{prov.name}</h3>
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{prov.city}{prov.country ? `, ${prov.country}` : ""}</span>
                        </div>
                        {ar && (
                          <div className="flex items-center gap-0.5 mt-1.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= ar.rating ? "fill-secondary text-secondary" : "text-border"}`} />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">editorial</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2 h-7 text-xs"
                          onClick={() => setQuoteProvider({ name: prov.name, slug: prov.slug })}
                        >
                          Get a Quote
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Content Gallery Tab */}
          <TabsContent value="content">
            {content.length === 0 ? (
              <EmptyState
                icon={<Play className="w-6 h-6 text-muted-foreground" />}
                title="No content yet"
                description={`${profile.display_name} hasn't uploaded any content yet.`}
              />
            ) : (
              <div>
                {Object.entries(contentByProvider).map(([slug, items]) => (
                  <div key={slug} className="mb-8">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" />
                      <Link to={`/provider/${slug}`} className="hover:text-primary transition-colors">
                        {providers[slug]?.name || slug}
                      </Link>
                    </h3>
                    <ContentGrid items={items} onOpen={openLightbox} />
                  </div>
                ))}
                {ungroupedContent.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      more from {profile.display_name}
                    </h3>
                    <ContentGrid items={ungroupedContent} onOpen={openLightbox} />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Trip Reports Tab */}
          <TabsContent value="trips">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Trip reports coming soon</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Long-form writeups documenting full medical tourism trips — procedures, recovery, logistics, costs — will live here.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Check back soon</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer CTA */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <img src={logo} alt="denied.care" className="h-5 w-auto" />
            <span>denied.care</span>
          </Link>
        </div>
      </footer>

      {/* Lightbox */}
      <Dialog open={lightboxPhotos.length > 0} onOpenChange={() => setLightboxPhotos([])}>
        <DialogContent className="max-w-3xl p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            <button onClick={() => setLightboxPhotos([])} className="absolute top-3 right-3 z-10 text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            {lightboxPhotos.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((i) => (i > 0 ? i - 1 : lightboxPhotos.length - 1))}
                  className="absolute left-3 z-10 text-white/70 hover:text-white"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={() => setLightboxIndex((i) => (i < lightboxPhotos.length - 1 ? i + 1 : 0))}
                  className="absolute right-3 z-10 text-white/70 hover:text-white"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
            {lightboxPhotos[lightboxIndex]?.endsWith(".mp4") || lightboxPhotos[lightboxIndex]?.includes("video") ? (
              <video src={lightboxPhotos[lightboxIndex]} controls autoPlay className="max-h-[80vh] max-w-full object-contain" />
            ) : (
              <img src={lightboxPhotos[lightboxIndex]} alt="" className="max-h-[80vh] max-w-full object-contain" />
            )}
            {lightboxPhotos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                {lightboxIndex + 1} / {lightboxPhotos.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quote Modal */}
      {quoteProvider && (
        <RequestQuoteModal
          open
          onOpenChange={() => setQuoteProvider(null)}
          providerName={quoteProvider.name}
          providerSlug={quoteProvider.slug}
        />
      )}

      {/* Floating Edit Button for owner */}
      {isOwner && (
        <Link
          to="/creator/edit"
          className="fixed bottom-24 right-6 z-40 bg-primary text-primary-foreground rounded-full p-3 shadow-elevated hover:shadow-lifted hover:-translate-y-0.5 transition-all"
        >
          <Pencil className="w-5 h-5" />
        </Link>
      )}
    </div>
  );
};

// Stat Box sub-component
const StatBox = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
  <div className="rounded-xl p-4 bg-card border border-border text-center">
    <div className="flex justify-center mb-1 text-primary opacity-70">{icon}</div>
    <div className="text-2xl font-bold tabular-nums">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</div>
  </div>
);

// Empty State sub-component
const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm max-w-xs">{description}</p>
  </div>
);

// Content Grid sub-component
const ContentGrid = ({
  items,
  onOpen,
}: {
  items: ContentItem[];
  onOpen: (urls: string[], index: number) => void;
}) => {
  const urls = items.map((i) => i.media_url);
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {items.map((item, i) => (
        <button
          key={item.id}
          onClick={() => onOpen(urls, i)}
          className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
        >
          {item.media_type === "video" ? (
            <>
              <video src={item.media_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
            </>
          ) : (
            <img src={item.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
      ))}
    </div>
  );
};

export default CreatorProfile;
