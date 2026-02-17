import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Star } from "lucide-react";

import logo from "@/assets/logo-clean.png";

interface CreatorCard {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  specialties: string[];
  user_id: string;
  badge_type?: string | null;
  review_count?: number;
  procedure_count?: number;
}

const Creators = () => {
  const [creators, setCreators] = useState<CreatorCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    const { data: profiles } = await supabase
      .from("creator_profiles")
      .select("id, handle, display_name, bio, avatar_url, cover_photo_url, specialties, user_id")
      .eq("is_published", true)
      .order("created_at", { ascending: true });

    if (!profiles || profiles.length === 0) {
      setLoading(false);
      return;
    }

    const userIds = profiles.map((p: any) => p.user_id);

    const [badgeRes, reviewRes] = await Promise.all([
      supabase.from("profiles").select("user_id, badge_type").in("user_id", userIds),
      supabase.from("reviews").select("user_id, procedure_name").in("user_id", userIds),
    ]);

    const badgeMap: Record<string, string | null> = {};
    ((badgeRes.data as any[]) || []).forEach((p) => {
      badgeMap[p.user_id] = p.badge_type;
    });

    const reviewCountMap: Record<string, number> = {};
    const procedureCountMap: Record<string, number> = {};
    ((reviewRes.data as any[]) || []).forEach((r) => {
      reviewCountMap[r.user_id] = (reviewCountMap[r.user_id] || 0) + 1;
      if (!procedureCountMap[r.user_id]) procedureCountMap[r.user_id] = 0;
    });

    setCreators(
      (profiles as any[]).map((p) => ({
        ...p,
        specialties: p.specialties || [],
        badge_type: badgeMap[p.user_id] || null,
        review_count: reviewCountMap[p.user_id] || 0,
      }))
    );

    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-8">
        <h1 className="text-3xl font-bold mb-2">creators</h1>
        <p className="text-muted-foreground text-sm">
          People sharing real medical tourism experiences
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-4xl mx-auto px-4 pb-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No creators yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {creators.map((creator) => (
              <CreatorCardItem key={creator.id} creator={creator} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <img src={logo} alt="denied.care" className="h-5 w-auto" />
            <span>denied.care</span>
          </Link>
        </div>
      </footer>
    </div>
  );
};

const CreatorCardItem = ({ creator }: { creator: CreatorCard }) => (
  <Link to={`/c/${creator.handle}`} className="group block">
    <div className="rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/30 hover:shadow-elevated transition-all duration-200">
      {/* Cover */}
      <div className="relative h-24 overflow-hidden">
        <img
          src={creator.cover_photo_url || '/images/hero-creator.jpg'}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        {/* Avatar overlapping */}
        <div className="absolute -bottom-7 left-4">
          <Avatar className="w-16 h-16 border-[3px] border-card shadow-md">
            {creator.avatar_url && <AvatarImage src={creator.avatar_url} alt={creator.display_name} className="object-cover" />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {creator.display_name?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 pb-4 px-4">
        {/* Name + Badge row */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h3 className="font-semibold text-xl leading-tight">{creator.display_name}</h3>
          {creator.badge_type ? (
            <img
              src={(() => {
                const map: Record<string, string> = { founder: "/badges/founder.png", trusted_creator: "/badges/creator.png", trusted_traveler: "/badges/creator.png", trusted_provider: "/badges/provider.png" };
                return map[creator.badge_type!] || "";
              })()}
              alt={creator.badge_type}
              className="h-7 w-auto"
              draggable={false}
            />
          ) : (
            <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs">
              <BadgeCheck className="w-3 h-3" /> creator
            </Badge>
          )}
        </div>

        {/* Bio — 1-line preview */}
        {creator.bio && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{creator.bio}</p>
        )}

        {/* Specialties */}
        {creator.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {creator.specialties.slice(0, 3).map((s) => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                {s}
              </span>
            ))}
            {creator.specialties.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{creator.specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Review count */}
        {(creator.review_count || 0) > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 fill-secondary text-secondary" />
            <span>{creator.review_count} review{creator.review_count !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  </Link>
);

export default Creators;

