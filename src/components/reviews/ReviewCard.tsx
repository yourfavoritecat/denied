import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { REVIEW_CATEGORIES } from "@/data/providers";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Star, ThumbsUp, BadgeCheck, CheckCircle, Play, Pause, PenLine, ChevronLeft, ChevronRight, X, Lock, Calendar } from "lucide-react";
import LeaveReviewModal from "@/components/reviews/LeaveReviewModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import UserTrustBadge, { computeUserTrustTier } from "@/components/profile/UserTrustBadge";
import UserBadge, { BadgeType } from "@/components/profile/UserBadge";
import FlagContentButton from "@/components/reviews/FlagContentButton";

interface ReviewProfile {
  first_name: string | null;
  city: string | null;
  username: string | null;
  public_profile: boolean;
  social_verifications?: Record<string, any>;
  avatar_url?: string | null;
  badge_type?: BadgeType;
}

export interface ReviewData {
  id: string;
  user_id: string;
  provider_slug: string;
  rating: number;
  title: string;
  review_text: string;
  procedure_name: string;
  recommend: boolean;
  photos: string[];
  videos: string[];
  verified_trip: boolean;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  profile?: ReviewProfile;
  upvote_count: number;
  user_has_upvoted: boolean;
  rating_cleanliness?: number;
  rating_communication?: number;
  rating_wait_time?: number;
  rating_outcome?: number;
  rating_safety?: number;
  rating_value?: number;
  vibe_tags?: string[];
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-4 h-4 ${s <= rating ? "fill-secondary text-secondary" : "text-border"}`} />
    ))}
  </div>
);

const VerticalVideoPlayer = ({ url }: { url: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setPlaying(!playing);
  };

  return (
    <div className="relative w-[140px] aspect-[9/16] rounded-lg overflow-hidden bg-black cursor-pointer group border border-border/50" onClick={togglePlay}>
      <video ref={videoRef} src={url} className="w-full h-full object-cover" loop playsInline onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
        {playing ? <Pause className="w-10 h-10 text-white drop-shadow-lg" /> : <Play className="w-10 h-10 text-white drop-shadow-lg" />}
      </div>
    </div>
  );
};

const PhotoLightbox = ({ photos, initialIndex, open, onClose }: { photos: string[]; initialIndex: number; open: boolean; onClose: () => void }) => {
  const [index, setIndex] = useState(initialIndex);
  const prev = () => setIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  const next = () => setIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 bg-black/95 border-none">
        <div className="relative flex items-center justify-center min-h-[60vh]">
          <button onClick={onClose} className="absolute top-3 right-3 z-10 text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
          {photos.length > 1 && (<>
            <button onClick={prev} className="absolute left-3 z-10 text-white/70 hover:text-white"><ChevronLeft className="w-8 h-8" /></button>
            <button onClick={next} className="absolute right-3 z-10 text-white/70 hover:text-white"><ChevronRight className="w-8 h-8" /></button>
          </>)}
          <img src={photos[index]} alt={`Review photo ${index + 1}`} className="max-h-[80vh] max-w-full object-contain" />
          {photos.length > 1 && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-sm">{index + 1} / {photos.length}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ReviewCardProps {
  review: ReviewData;
  showProviderName?: boolean;
  providerName?: string;
  onEdit?: (review: ReviewData) => void;
}

const ReviewCard = ({ review, showProviderName, providerName, onEdit }: ReviewCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upvoteCount, setUpvoteCount] = useState(review.upvote_count);
  const [hasUpvoted, setHasUpvoted] = useState(review.user_has_upvoted);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [privateProfileOpen, setPrivateProfileOpen] = useState(false);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [procedures, setProcedures] = useState<string[]>([]);

  // Local state to reflect edits without full reload
  const [localTitle, setLocalTitle] = useState(review.title);
  const [localText, setLocalText] = useState(review.review_text);
  const [localPhotos, setLocalPhotos] = useState(review.photos);
  const [localVideos, setLocalVideos] = useState(review.videos);
  const [localIsEdited, setLocalIsEdited] = useState(review.is_edited ?? false);
  const [localUpdatedAt, setLocalUpdatedAt] = useState(review.updated_at);

  const firstName = review.profile?.first_name || "User";
  const city = review.profile?.city || "";
  const initials = firstName.charAt(0).toUpperCase();
  const avatarUrl = review.profile?.avatar_url;
  const username = review.profile?.username;
  const isPublic = review.profile?.public_profile !== false;
  const isAuthor = user?.id === review.user_id;
  const trustTier = computeUserTrustTier(review.profile?.social_verifications, review.verified_trip);
  const badgeType = review.profile?.badge_type ?? null;

  const handleProfileClick = async () => {
    if (!isPublic) {
      setPrivateProfileOpen(true);
      if (!memberSince) {
        const { data } = await supabase.from("profiles_public" as any).select("created_at").eq("user_id", review.user_id).single();
        if (data) setMemberSince((data as any).created_at);
      }
    }
  };

  const handleUpvote = async () => {
    if (!user) { toast({ title: "Log in to upvote", variant: "destructive" }); return; }
    setIsUpvoting(true);
    if (hasUpvoted) {
      await supabase.from("review_upvotes" as any).delete().eq("review_id", review.id).eq("user_id", user.id);
      setUpvoteCount((c) => c - 1); setHasUpvoted(false);
    } else {
      await supabase.from("review_upvotes" as any).insert({ review_id: review.id, user_id: user.id } as any);
      setUpvoteCount((c) => c + 1); setHasUpvoted(true);
    }
    setIsUpvoting(false);
  };

  const openEdit = async () => {
    // Fetch provider procedures for the edit modal
    const { data } = await supabase.from("provider_services").select("procedure_name").eq("provider_slug", review.provider_slug);
    const fetched = (data || []).map((r: any) => r.procedure_name);
    // Always include the current procedure in case it's not listed
    const allProcs = fetched.includes(review.procedure_name) ? fetched : [review.procedure_name, ...fetched];
    setProcedures(allProcs.length > 0 ? allProcs : [review.procedure_name]);
    setEditModalOpen(true);
  };

  const handleReviewUpdated = () => {
    // Trigger a page reload to reflect all changes (photos, videos, text)
    window.location.reload();
  };

  const profileLink = isPublic && username ? `/user/${username}` : null;

  const nameElement = profileLink ? (
    <Link to={profileLink} className="font-bold hover:text-primary transition-colors">{firstName}</Link>
  ) : (
    <button onClick={handleProfileClick} className="font-bold hover:text-primary transition-colors text-left">{firstName}</button>
  );

  const editedDate = localIsEdited && localUpdatedAt
    ? new Date(localUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <>
      <Card className="border border-border/50 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {profileLink ? (
              <Link to={profileLink}>
                <Avatar className="bg-secondary/20 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={firstName} />}
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-sm">{initials}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <button onClick={handleProfileClick}>
                <Avatar className="bg-secondary/20 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={firstName} />}
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-sm">{initials}</AvatarFallback>
                </Avatar>
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {nameElement}
                  {city && <span className="text-muted-foreground text-sm">{city}</span>}
                  <UserTrustBadge tier={computeUserTrustTier(review.profile?.social_verifications, review.verified_trip)} />
                  {badgeType && <UserBadge badgeType={badgeType} size="sm" />}
                  {review.verified_trip && (
                    <Badge className="bg-primary/10 text-primary text-xs gap-1">
                      <BadgeCheck className="w-3 h-3" /> Verified Trip
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAuthor && (
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={openEdit}
                    >
                      <PenLine className="w-3 h-3" /> edit
                    </button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {showProviderName && providerName && (
                <p className="text-xs text-muted-foreground mb-1">at {providerName}</p>
              )}

              <div className="flex items-center gap-2 mb-2">
                <StarRating rating={review.rating} />
                <Badge variant="outline" className="text-xs">{review.procedure_name}</Badge>
                {review.recommend && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Recommends
                  </span>
                )}
              </div>

              <h4 className="font-semibold mb-1">{localTitle}</h4>
              <p className="text-muted-foreground leading-relaxed text-sm">{localText}</p>

              {editedDate && (
                <p className="text-xs text-muted-foreground mt-1 italic">edited {editedDate}</p>
              )}

              {/* Category breakdown */}
              {review.rating_cleanliness != null && (
                <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(224,166,147,0.08)', border: '1px solid rgba(224,166,147,0.12)' }}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                    {REVIEW_CATEGORIES.map(({ key, label }) => {
                      const val = review[key as keyof ReviewData] as number | undefined;
                      if (val == null) return null;
                      return (
                        <div key={key} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate font-bold" style={{ color: '#E0A693' }}>{label}</span>
                          <span className="font-bold shrink-0" style={{ color: '#E0A693' }}>{val}/5</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vibe tags */}
              {review.vibe_tags && review.vibe_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {review.vibe_tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#50FF90]/10 text-[#50FF90] border border-[#50FF90]/20">{tag}</span>
                  ))}
                </div>
              )}

              {/* Photos */}
              {review.photos.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <div className="flex gap-2 pb-1">
                    {review.photos.map((url, i) => (
                      <button key={i} onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }} className="shrink-0 w-20 h-20 rounded-md overflow-hidden border border-border/50 hover:ring-2 hover:ring-primary transition-all">
                        <img src={url} alt={`Review photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {review.videos.length > 0 && (
                <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
                  {review.videos.map((url, i) => <VerticalVideoPlayer key={i} url={url} />)}
                </div>
              )}

              {/* Upvote & Flag */}
              <div className="mt-3 flex items-center gap-1">
                <Button variant="ghost" size="sm" className={`gap-1.5 text-xs ${hasUpvoted ? "text-primary" : "text-muted-foreground"}`} onClick={handleUpvote} disabled={isUpvoting}>
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? "fill-primary" : ""}`} />
                  {upvoteCount > 0 ? `${upvoteCount} ${upvoteCount === 1 ? "person" : "people"} found this helpful` : "Helpful"}
                </Button>
                {!isAuthor && <FlagContentButton reviewId={review.id} contentType="review" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {localPhotos.length > 0 && (
        <PhotoLightbox photos={localPhotos} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      )}

      {/* Edit modal — full LeaveReviewModal with photo/video support */}
      {isAuthor && editModalOpen && (
        <LeaveReviewModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          providerSlug={review.provider_slug}
          providerName={providerName || review.provider_slug}
          procedures={procedures}
          onReviewSubmitted={handleReviewUpdated}
          editReview={{
            ...review,
            photos: localPhotos,
            videos: localVideos,
            title: localTitle,
            review_text: localText,
            is_edited: localIsEdited,
            updated_at: localUpdatedAt,
          }}
        />
      )}

      <Dialog open={privateProfileOpen} onOpenChange={setPrivateProfileOpen}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <Avatar className="w-16 h-16">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={firstName} />}
              <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold flex items-center justify-center gap-2">
                {firstName}
                <UserTrustBadge tier={trustTier} size="md" />
              </h3>
              {memberSince && (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" /> Member since {new Date(memberSince).getFullYear()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <Lock className="w-3 h-3" /> This profile is private
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReviewCard;
