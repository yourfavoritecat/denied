import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, BadgeCheck, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ReviewProfile {
  first_name: string | null;
  city: string | null;
  username: string | null;
  public_profile: boolean;
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
  profile?: ReviewProfile;
  upvote_count: number;
  user_has_upvoted: boolean;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-4 h-4 ${s <= rating ? "fill-secondary text-secondary" : "text-border"}`} />
    ))}
  </div>
);

interface ReviewCardProps {
  review: ReviewData;
  showProviderName?: boolean;
  providerName?: string;
}

const ReviewCard = ({ review, showProviderName, providerName }: ReviewCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upvoteCount, setUpvoteCount] = useState(review.upvote_count);
  const [hasUpvoted, setHasUpvoted] = useState(review.user_has_upvoted);
  const [isUpvoting, setIsUpvoting] = useState(false);

  const firstName = review.profile?.first_name || "Anonymous";
  const city = review.profile?.city || "";
  const initials = firstName.charAt(0).toUpperCase();
  const isPublic = review.profile?.public_profile && review.profile?.username;

  const handleUpvote = async () => {
    if (!user) {
      toast({ title: "Log in to upvote", variant: "destructive" });
      return;
    }
    setIsUpvoting(true);
    if (hasUpvoted) {
      await supabase.from("review_upvotes" as any).delete().eq("review_id", review.id).eq("user_id", user.id);
      setUpvoteCount((c) => c - 1);
      setHasUpvoted(false);
    } else {
      await supabase.from("review_upvotes" as any).insert({ review_id: review.id, user_id: user.id } as any);
      setUpvoteCount((c) => c + 1);
      setHasUpvoted(true);
    }
    setIsUpvoting(false);
  };

  const nameElement = isPublic ? (
    <Link to={`/user/${review.profile!.username}`} className="font-bold hover:text-primary transition-colors">
      {firstName}
    </Link>
  ) : (
    <span className="font-bold">{firstName}</span>
  );

  return (
    <Card className="border border-border/50 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="bg-secondary/20 shrink-0">
            <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                {nameElement}
                {city && <span className="text-muted-foreground text-sm">{city}</span>}
                {review.verified_trip && (
                  <Badge className="bg-primary/10 text-primary text-xs gap-1">
                    <BadgeCheck className="w-3 h-3" /> Verified Trip
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
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

            <h4 className="font-semibold mb-1">{review.title}</h4>
            <p className="text-muted-foreground leading-relaxed text-sm">{review.review_text}</p>

            {/* Photos */}
            {review.photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {review.photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Review photo ${i + 1}`} className="w-20 h-20 rounded-md object-cover border border-border/50" />
                  </a>
                ))}
              </div>
            )}

            {/* Videos */}
            {review.videos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {review.videos.map((url, i) => (
                  <video key={i} src={url} controls className="w-48 h-32 rounded-md object-cover border border-border/50" />
                ))}
              </div>
            )}

            {/* Upvote */}
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1.5 text-xs ${hasUpvoted ? "text-primary" : "text-muted-foreground"}`}
                onClick={handleUpvote}
                disabled={isUpvoting}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? "fill-primary" : ""}`} />
                {upvoteCount > 0
                  ? `${upvoteCount} ${upvoteCount === 1 ? "person" : "people"} found this helpful`
                  : "Helpful"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
