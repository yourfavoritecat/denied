import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorite } from "@/hooks/useFavorite";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Star, MapPin, Instagram, Play, X, ChevronLeft, ChevronRight,
  BadgeCheck, Pencil, BookOpen, Building2, Stethoscope, Heart, Clock,
} from "lucide-react";
import RequestQuoteModal from "@/components/providers/RequestQuoteModal";
import ReviewCard, { type ReviewData } from "@/components/reviews/ReviewCard";
import UserBadge from "@/components/profile/UserBadge";
import Navbar from "@/components/layout/Navbar";
import logo from "@/assets/logo-new.png";

/* ── Types ── */

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
  profile_theme: "mint" | "peach" | "pearl";
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

/* ── Theme helpers ── */

type Theme = "mint" | "peach" | "pearl";

interface ThemeTokens {
  accentColor: string;
  coverGradient: string;
  avatarBorder: string;
  tagBg: string;
  tagBorder: string;
  tagColor: string;
  socialIconBg: string;
  tabActive: string;
  cardBg: string;
  cardBorder: string;
  divider: string;
  buttonBg: string;
  buttonColor: string;
  pageBg: string;
  statsAccent: string;
}

const THEMES: Record<Theme, ThemeTokens> = {
  mint: {
    accentColor: '#50FF90',
    coverGradient: 'linear-gradient(to top, rgba(80,255,144,0.15) 0%, rgba(10,10,10,0.5) 60%, transparent 100%)',
    avatarBorder: '3px solid #50FF90',
    tagBg: 'rgba(80,255,144,0.1)',
    tagBorder: 'rgba(80,255,144,0.25)',
    tagColor: '#50FF90',
    socialIconBg: 'rgba(80,255,144,0.12)',
    tabActive: '#50FF90',
    cardBg: 'rgba(80,255,144,0.06)',
    cardBorder: '1px solid rgba(80,255,144,0.12)',
    divider: 'rgba(80,255,144,0.15)',
    buttonBg: '#50FF90',
    buttonColor: '#0a0a0a',
    pageBg: '#1a1714',
    statsAccent: '#50FF90',
  },
  peach: {
    accentColor: '#E0A693',
    coverGradient: 'linear-gradient(to top, rgba(224,166,147,0.18) 0%, rgba(10,10,10,0.5) 60%, transparent 100%)',
    avatarBorder: '3px solid #E0A693',
    tagBg: 'rgba(224,166,147,0.15)',
    tagBorder: 'rgba(224,166,147,0.3)',
    tagColor: '#E0A693',
    socialIconBg: 'rgba(224,166,147,0.15)',
    tabActive: '#E0A693',
    cardBg: 'rgba(224,166,147,0.08)',
    cardBorder: '1px solid rgba(224,166,147,0.12)',
    divider: 'rgba(224,166,147,0.15)',
    buttonBg: '#E0A693',
    buttonColor: '#1a1a1a',
    pageBg: '#0a0a0a',
    statsAccent: '#E0A693',
  },
  pearl: {
    accentColor: '#D4C5A9',
    coverGradient: 'linear-gradient(to top, rgba(212,197,169,0.12) 0%, rgba(18,18,18,0.5) 60%, transparent 100%)',
    avatarBorder: '3px solid #D4C5A9',
    tagBg: 'rgba(212,197,169,0.12)',
    tagBorder: 'rgba(212,197,169,0.25)',
    tagColor: '#D4C5A9',
    socialIconBg: 'rgba(212,197,169,0.12)',
    tabActive: '#D4C5A9',
    cardBg: 'rgba(255,255,255,0.05)',
    cardBorder: '1px solid rgba(255,255,255,0.10)',
    divider: 'rgba(212,197,169,0.12)',
    buttonBg: '#D4C5A9',
    buttonColor: '#1a1a1a',
    pageBg: '#121212',
    statsAccent: '#D4C5A9',
  },
};

/* ── Social icons ── */

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

/* ── Helpers ── */

/**
 * Ensures a social link value is a navigable https:// URL.
 * Handles all common input formats:
 *   "https://instagram.com/user"  → used as-is
 *   "www.instagram.com/user"      → prepend https://
 *   "instagram.com/user"          → prepend https:// (has a slash → domain/path)
 *   "catrific" / "@catrific"      → strip @, prepend platform baseUrl
 *   "denied.care" (handle w/ dot) → treated as username, prepend platform baseUrl
 */
const normalizeSocialUrl = (value: string, baseUrl: string): string => {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (/^www\./i.test(v)) return `https://${v}`;
  const handle = v.replace(/^@/, "");
  if (handle.includes("/")) return `https://${handle}`;
  return `${baseUrl}${handle}`;
};

/* ── Main component ── */

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
  const [favProviders, setFavProviders] = useState<ProviderInfo[]>([]);
  const [favProvidersTotal, setFavProvidersTotal] = useState(0);

  const { isFavorited: isStarred, toggle: toggleStar } = useFavorite(handle || "", "creator");

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

    const [provRes, arRes, contentRes, reviewRes, profileRes, favsRes] = await Promise.all([
      slugs.length > 0
        ? supabase.from("providers").select("slug, name, city, cover_photo_url, country").in("slug", slugs)
        : Promise.resolve({ data: [] }),
      slugs.length > 0
        ? supabase.from("provider_admin_reviews").select("provider_slug, rating, personally_visited").in("provider_slug", slugs)
        : Promise.resolve({ data: [] }),
      supabase.from("creator_content").select("*").eq("creator_id", p.id).order("sort_order", { ascending: true }),
      supabase.from("reviews").select("*").eq("user_id", p.user_id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("badge_type").eq("user_id", p.user_id).maybeSingle(),
      supabase.from("favorites" as any).select("target_id").eq("user_id", p.user_id).eq("target_type", "provider"),
    ]);

    const pMap: Record<string, ProviderInfo> = {};
    ((provRes.data as ProviderInfo[]) || []).forEach((prov) => (pMap[prov.slug] = prov));
    setProviders(pMap);

    const arMap: Record<string, AdminReview> = {};
    ((arRes.data as unknown as AdminReview[]) || []).forEach((ar) => (arMap[ar.provider_slug] = ar));
    setAdminReviews(arMap);

    setContent((contentRes.data as unknown as ContentItem[]) || []);
    setUserBadge((profileRes.data as any)?.badge_type || null);

    const favSlugs = ((favsRes.data as any[]) || []).map((f: any) => f.target_id);
    setFavProvidersTotal(favSlugs.length);
    if (favSlugs.length > 0) {
      const { data: favProvData } = await supabase
        .from("providers")
        .select("slug, name, city, cover_photo_url, country")
        .in("slug", favSlugs)
        .limit(5);
      setFavProviders((favProvData as ProviderInfo[]) || []);
    }

    if (reviewRes.data && (reviewRes.data as any[]).length > 0) {
      const typedReviews = reviewRes.data as any[];
      // Fetch profile data for review authors (so ReviewCard shows real names)
      const reviewUserIds = [...new Set(typedReviews.map((r: any) => r.user_id))];
      const [profilesResult, badgesResult] = await Promise.all([
        supabase
          .from("profiles_public" as any)
          .select("user_id, first_name, city, username, public_profile, social_verifications, avatar_url")
          .in("user_id", reviewUserIds),
        supabase
          .from("profiles")
          .select("user_id, badge_type")
          .in("user_id", reviewUserIds),
      ]);
      const badgeMap = new Map(
        ((badgesResult.data as any[]) || []).map((pr: any) => [pr.user_id, pr.badge_type ?? null])
      );
      const profileMap = new Map(
        ((profilesResult.data as any[]) || []).map((pr: any) => [pr.user_id, { ...pr, badge_type: badgeMap.get(pr.user_id) ?? null }])
      );
      setReviews(
        typedReviews.map((r) => ({
          ...r,
          photos: r.photos || [],
          videos: r.videos || [],
          upvote_count: 0,
          user_has_upvoted: false,
          vibe_tags: r.vibe_tags || [],
          profile: profileMap.get(r.user_id) || null,
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
        <Button asChild variant="outline"><Link to="/">go home</Link></Button>
      </div>
    );
  }

  const theme = THEMES[profile.profile_theme || "mint"];
  const orderedProviderSlugs = (profile.featured_providers || []).filter((s) => providers[s]);
  const socialLinks = profile.social_links || {};
  const hasSocials = socialLinks.instagram || socialLinks.tiktok || socialLinks.youtube;
  const isOwner = user && profile.user_id === user.id;
  const specialties = (profile as any).specialties || [];

  const reviewCount = reviews.length;
  const uniqueProviders = new Set(reviews.map((r) => r.provider_slug)).size;
  const uniqueProcedures = new Set(reviews.map((r) => r.procedure_name).filter(Boolean)).size;

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

  return (
    <div className="min-h-screen" style={{ background: theme.pageBg }}>
      <Navbar />

      {/* Owner Edit Banner */}
      {isOwner && (
        <div className="sticky top-0 z-40 border-b" style={{ background: `${theme.accentColor}18`, borderColor: theme.divider }}>
          <div className="max-w-[960px] mx-auto px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm" style={{ color: theme.accentColor }}>
              <Pencil className="w-4 h-4" />
              <span>This is your creator page</span>
            </div>
            <Button size="sm" asChild
              style={{ background: theme.buttonBg, color: theme.buttonColor, border: 'none' }}>
              <Link to="/creator/edit">Edit Profile</Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── Hero Cover ── */}
      <div className="relative w-full overflow-hidden" style={{ height: '220px', paddingTop: '64px' }}>
        <img
          src={profile.cover_photo_url || '/images/hero-creator.jpg'}
          alt=""
          className="w-full h-full object-cover object-center"
          style={{ position: 'absolute', inset: 0, height: '100%' }}
        />
        {/* Theme-tinted gradient overlay */}
        <div className="absolute inset-0" style={{ background: theme.coverGradient }} />
        {user && !isOwner && (
          <button
            onClick={toggleStar}
            className="absolute top-4 right-4 p-2.5 rounded-full transition-all hover:scale-110 active:scale-95 z-10"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
            title={isStarred ? "Remove from favorites" : "Favorite this creator"}
          >
            <Star
              className="w-5 h-5 transition-colors"
              style={isStarred ? { fill: theme.accentColor, color: theme.accentColor } : { color: 'rgba(255,255,255,0.75)' }}
            />
          </button>
        )}
      </div>

      {/* ── All content below cover ── */}
      <div className="max-w-[960px] mx-auto px-6">

        {/* ── Identity Row ── */}
        <div className="flex items-center gap-6 -mt-16 relative z-10 mb-3">
          <Avatar
            className="w-32 h-32 shrink-0 shadow-lg"
            style={{ border: theme.avatarBorder, boxShadow: `0 0 0 3px ${theme.pageBg}, 0 4px 20px rgba(0,0,0,0.5)` }}
          >
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} className="object-cover" />}
            <AvatarFallback style={{ background: theme.tagBg, color: theme.accentColor }} className="text-4xl font-bold">
              {profile.display_name?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-2 flex-wrap pt-16">
            <h1 className="text-6xl font-bold leading-none tracking-tight">{profile.display_name}</h1>
            {userBadge ? (
              <img
                src={userBadge === 'founder' ? '/badges/founder.png?v=3'
                  : userBadge === 'trusted_creator' || userBadge === 'trusted_traveler' ? '/badges/creator.png?v=3'
                  : '/badges/provider.png?v=3'}
                alt={userBadge}
                className="h-10 w-auto"
                draggable={false}
              />
            ) : (
              <Badge style={{ background: `${theme.accentColor}18`, color: theme.accentColor, border: `1px solid ${theme.accentColor}30` }} className="gap-1 text-xs">
                <BadgeCheck className="w-3 h-3" /> denied.care creator
              </Badge>
            )}
          </div>
        </div>

        {/* ── Stats line ── */}
        <div className="ml-0 mb-2">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="font-semibold" style={{ color: theme.statsAccent }}>{uniqueProviders}</span>
            {' '}provider{uniqueProviders !== 1 ? 's' : ''} visited
            {' · '}
            <span className="font-semibold" style={{ color: theme.statsAccent }}>{reviewCount}</span>
            {' '}review{reviewCount !== 1 ? 's' : ''}
            {' · '}
            <span className="font-semibold" style={{ color: theme.statsAccent }}>{uniqueProcedures}</span>
            {' '}procedure{uniqueProcedures !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Bio ── */}
        {profile.bio && (
          <p className="text-base mb-3 leading-relaxed line-clamp-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {profile.bio}
          </p>
        )}

        {/* ── Divider ── */}
        {(specialties.length > 0 || hasSocials) && (
          <div className="h-px mb-4" style={{ background: theme.divider }} />
        )}

        {/* ── Tags + Social on one row ── */}
        <div className="flex items-center justify-between gap-4 mb-0">
          <div className="flex flex-wrap gap-2">
            {specialties.map((s: string) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: theme.tagBg,
                  border: `1px solid ${theme.tagBorder}`,
                  color: theme.tagColor,
                }}>
                {s}
              </span>
            ))}
          </div>

          {hasSocials && (
            <div className="flex items-center gap-2 shrink-0">
              {socialLinks.instagram && (
                <a href={normalizeSocialUrl(socialLinks.instagram, "https://www.instagram.com/")} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-full transition-colors hover:opacity-80"
                  style={{ background: theme.socialIconBg, color: theme.accentColor }}>
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a href={normalizeSocialUrl(socialLinks.tiktok, "https://www.tiktok.com/@")} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-full transition-colors hover:opacity-80"
                  style={{ background: theme.socialIconBg, color: theme.accentColor }}>
                  <TikTokIcon className="w-4 h-4" />
                </a>
              )}
              {socialLinks.youtube && (
                <a href={normalizeSocialUrl(socialLinks.youtube, "https://www.youtube.com/@")} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-full transition-colors hover:opacity-80"
                  style={{ background: theme.socialIconBg, color: theme.accentColor }}>
                  <YouTubeIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="mt-6 pb-16">
          <CreatorTabs
            profile={profile}
            theme={theme}
            reviews={reviews}
            providers={providers}
            adminReviews={adminReviews}
            orderedProviderSlugs={orderedProviderSlugs}
            content={content}
            contentByProvider={contentByProvider}
            ungroupedContent={ungroupedContent}
            openLightbox={openLightbox}
            setQuoteProvider={setQuoteProvider}
            favProviders={favProviders}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: theme.divider, background: theme.pageBg }}>
        <div className="max-w-[960px] mx-auto px-6 py-10 text-center">
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
                <button onClick={() => setLightboxIndex((i) => (i > 0 ? i - 1 : lightboxPhotos.length - 1))} className="absolute left-3 z-10 text-white/70 hover:text-white">
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button onClick={() => setLightboxIndex((i) => (i < lightboxPhotos.length - 1 ? i + 1 : 0))} className="absolute right-3 z-10 text-white/70 hover:text-white">
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
          className="fixed bottom-24 right-6 z-40 text-white rounded-full p-3 shadow-elevated hover:-translate-y-0.5 transition-all"
          style={{ background: theme.buttonBg, color: theme.buttonColor }}
        >
          <Pencil className="w-5 h-5" />
        </Link>
      )}
    </div>
  );
};

/* ── Sub-components ── */

const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm max-w-xs">{description}</p>
  </div>
);

const ContentGrid = ({
  items, onOpen,
}: {
  items: ContentItem[]; onOpen: (urls: string[], index: number) => void;
}) => {
  const urls = items.map((i) => i.media_url);
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {items.map((item, i) => (
        <button key={item.id} onClick={() => onOpen(urls, i)} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
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

const CreatorTabs = ({
  profile, theme, reviews, providers, adminReviews, orderedProviderSlugs,
  content, contentByProvider, ungroupedContent, openLightbox, setQuoteProvider,
  favProviders,
}: {
  profile: CreatorProfileData;
  theme: ThemeTokens;
  reviews: ReviewData[];
  providers: Record<string, ProviderInfo>;
  adminReviews: Record<string, AdminReview>;
  orderedProviderSlugs: string[];
  content: ContentItem[];
  contentByProvider: Record<string, ContentItem[]>;
  ungroupedContent: ContentItem[];
  openLightbox: (urls: string[], index: number) => void;
  setQuoteProvider: (p: { name: string; slug: string } | null) => void;
  favProviders: ProviderInfo[];
}) => {
  const accentColor = theme.tabActive;

  return (
    <Tabs defaultValue="content" className="w-full">
      {/* Scoped CSS to color active tab underline with theme accent */}
      <style>{`
        .creator-tabs [data-state="active"] {
          border-bottom-color: ${accentColor} !important;
          color: ${accentColor} !important;
        }
      `}</style>

      {/* Tab bar */}
      <TabsList
        className="creator-tabs w-full grid grid-cols-4 bg-transparent rounded-none h-auto p-0 border-b"
        style={{ borderColor: theme.divider }}
      >
        {(['content', 'reviews', 'providers', 'trips'] as const).map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="rounded-none h-11 text-sm font-medium text-muted-foreground bg-transparent border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
          >
            {tab === 'content' ? 'Content'
              : tab === 'reviews' ? 'Reviews'
              : tab === 'providers' ? 'Favorite Providers'
              : 'Trip Reports'}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="creator-tabs pt-4">
        {/* Reviews Tab */}
        <TabsContent value="reviews">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-sm">no reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="relative">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5 px-1">
                    <Building2 className="w-3 h-3" />
                    <Link to={`/provider/${review.provider_slug}`} className="hover:opacity-80 transition-opacity font-medium" style={{ color: accentColor }}>
                      {providers[review.provider_slug]?.name || review.provider_slug}
                    </Link>
                  </div>
                  {/* Themed review card wrapper */}
                  <div className="rounded-2xl overflow-hidden" style={{ background: theme.cardBg, border: theme.cardBorder }}>
                    <ReviewCard review={review} showProviderName providerName={providers[review.provider_slug]?.name || review.provider_slug} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Favorite Providers Tab */}
        <TabsContent value="providers">
          {favProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="w-8 h-8 mb-3" style={{ color: theme.accentColor, opacity: 0.3 }} />
              <p className="text-muted-foreground text-sm">no favorite providers yet</p>
              <p className="text-muted-foreground text-xs mt-1">providers this creator favorites will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {favProviders.map((prov) => {
                const ar = adminReviews[prov.slug];
                return (
                  <div
                    key={prov.slug}
                    className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                    style={{ background: theme.cardBg, border: theme.cardBorder }}
                  >
                    <Link to={`/provider/${prov.slug}`}>
                      <div className="h-28 overflow-hidden relative">
                        {prov.cover_photo_url ? (
                          <img src={prov.cover_photo_url} alt={prov.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: theme.tagBg }}>
                            <span className="text-3xl font-bold" style={{ color: theme.accentColor, opacity: 0.3 }}>{prov.name[0]}</span>
                          </div>
                        )}
                        {/* Theme overlay on image */}
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${theme.cardBg} 0%, transparent 60%)` }} />
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link to={`/provider/${prov.slug}`} className="hover:opacity-80 transition-opacity">
                        <h3 className="font-semibold text-sm truncate">{prov.name}</h3>
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{prov.city}{prov.country ? `, ${prov.country}` : ""}</span>
                      </div>
                      {ar && (
                        <div className="flex items-center gap-0.5 mt-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-3 h-3" style={{ fill: s <= ar.rating ? accentColor : 'transparent', color: s <= ar.rating ? accentColor : 'rgba(255,255,255,0.2)' }} />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">editorial</span>
                        </div>
                      )}
                      {/* Themed divider */}
                      <div className="h-px my-2" style={{ background: theme.divider }} />
                      <button
                        className="w-full mt-1 h-7 text-xs rounded-full font-medium transition-opacity hover:opacity-80"
                        style={{ background: theme.buttonBg, color: theme.buttonColor }}
                        onClick={() => setQuoteProvider({ name: prov.name, slug: prov.slug })}
                      >
                        Get a Quote
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          {content.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-sm">no content yet</p>
            </div>
          ) : (
            <div>
              {Object.entries(contentByProvider).map(([slug, items]) => (
                <div key={slug} className="mb-8">
                  {/* Themed section header with divider */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: accentColor }}>
                      <Building2 className="w-3.5 h-3.5" />
                      <Link to={`/provider/${slug}`} className="hover:opacity-80 transition-opacity">{providers[slug]?.name || slug}</Link>
                    </h3>
                    <div className="flex-1 h-px" style={{ background: theme.divider }} />
                  </div>
                  <ContentGrid items={items} onOpen={openLightbox} />
                </div>
              ))}
              {ungroupedContent.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">more from {profile.display_name}</h3>
                    <div className="flex-1 h-px" style={{ background: theme.divider }} />
                  </div>
                  <ContentGrid items={ungroupedContent} onOpen={openLightbox} />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Trip Reports Tab */}
        <TabsContent value="trips">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground text-sm mb-2">trip reports coming soon</p>
            <p className="text-muted-foreground text-xs max-w-xs">long-form writeups documenting full medical tourism trips will live here.</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>check back soon</span>
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default CreatorProfile;
