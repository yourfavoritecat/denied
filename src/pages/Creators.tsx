import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, MapPin } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import UserBadge from "@/components/profile/UserBadge";

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
      supabase.from("reviews").select("user_id").in("user_id", userIds),
    ]);

    const badgeMap: Record<string, string | null> = {};
    ((badgeRes.data as any[]) || []).forEach((p) => {
      badgeMap[p.user_id] = p.badge_type;
    });

    const reviewCountMap: Record<string, number> = {};
    ((reviewRes.data as any[]) || []).forEach((r) => {
      reviewCountMap[r.user_id] = (reviewCountMap[r.user_id] || 0) + 1;
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
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero banner matching Search page style */}
          <div className="relative rounded-2xl overflow-hidden mb-8" style={{ height: 180 }}>
            <img
              src="/images/hero-creator.jpg"
              alt=""
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, transparent 20%, #0a0a0a 100%)' }}
            />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Creators</h1>
              <p className="text-white/70">Real people sharing real medical tourism experiences</p>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No creators yet. Check back soon.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <CreatorCardItem key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const CreatorCardItem = ({ creator }: { creator: CreatorCard }) => (
  <Link to={`/${creator.handle}`} className="group block">
    <div
      className="rounded-2xl overflow-hidden border hover:border-primary/30 transition-all duration-200 cursor-pointer h-full"
      style={{
        background: 'rgba(94,178,152,0.05)',
        border: '1px solid rgba(94,178,152,0.1)',
        boxShadow: '0 0 20px rgba(94,178,152,0.03)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 20px rgba(94,178,152,0.15), 0 0 40px rgba(94,178,152,0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 20px rgba(94,178,152,0.03)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Cover photo — same 16/10 aspect ratio as provider cards */}
      <div className="aspect-[16/10] relative overflow-hidden bg-muted">
        <img
          src={creator.cover_photo_url || '/images/hero-creator.jpg'}
          alt={creator.display_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Avatar overlapping bottom of cover */}
        <div className="absolute bottom-3 left-4">
          <Avatar className="w-14 h-14 border-[2px] border-[#0a0a0a] shadow-md">
            {creator.avatar_url && <AvatarImage src={creator.avatar_url} alt={creator.display_name} className="object-cover" />}
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
              {creator.display_name?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name + Badge row */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <h3 className="font-bold text-lg leading-tight">{creator.display_name}</h3>
          {creator.badge_type ? (
            <UserBadge badgeType={creator.badge_type as any} size="sm" />
          ) : (
            <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs h-5">
              <BadgeCheck className="w-2.5 h-2.5" /> creator
            </Badge>
          )}
        </div>

        {/* Bio — 1-line preview */}
        {creator.bio && (
          <p className="text-sm text-muted-foreground line-clamp-1 mb-3">{creator.bio}</p>
        )}

        {/* Specialties */}
        {creator.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {creator.specialties.slice(0, 3).map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(94,178,152,0.12)', border: '1px solid rgba(94,178,152,0.2)', color: '#5EB298' }}>
                {s}
              </span>
            ))}
            {creator.specialties.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                +{creator.specialties.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  </Link>
);

export default Creators;
