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
    <div className="min-h-screen theme-public">
      <Navbar light />
      <main>
        <div className="max-w-[960px] mx-auto px-4 pt-24 pb-16">
          {/* Hero banner */}
          <div className="relative rounded-xl overflow-hidden mb-8" style={{ height: 180 }}>
            <img src="/images/hero-creator.jpg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.7) 100%)' }} />
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
            <div className="text-center py-20" style={{ color: '#888888' }}>
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
      className="rounded-[20px] overflow-hidden transition-all duration-200 cursor-pointer h-full hover:-translate-y-0.5"
      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
    >
      {/* Cover photo */}
      <div className="aspect-[16/10] relative overflow-hidden bg-muted">
        <img
          src={creator.cover_photo_url || '/images/hero-creator.jpg'}
          alt={creator.display_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4">
          <Avatar className="w-14 h-14 border-[2px] border-white shadow-md">
            {creator.avatar_url && <AvatarImage src={creator.avatar_url} alt={creator.display_name} className="object-cover" />}
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
              {creator.display_name?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <h3 className="font-bold text-lg leading-tight" style={{ color: '#111111' }}>{creator.display_name}</h3>
        </div>

        {creator.bio && (
          <p className="text-sm line-clamp-1 mb-3" style={{ color: '#888888' }}>{creator.bio}</p>
        )}

        {creator.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {creator.specialties.slice(0, 3).map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(59,240,122,0.08)', border: '1px solid rgba(59,240,122,0.15)', color: '#333333' }}>
                {s}
              </span>
            ))}
            {creator.specialties.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.04)', color: '#888888' }}>
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
