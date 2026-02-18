import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FavProvider {
  slug: string;
  name: string;
  city: string | null;
  country: string | null;
  cover_photo_url: string | null;
  specialties: string[] | null;
}

const SavedProvidersTab = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<FavProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    const { data: favs } = await supabase
      .from("favorites" as any)
      .select("target_id")
      .eq("user_id", user!.id)
      .eq("target_type", "provider");

    const slugs = ((favs as any[]) || []).map((f: any) => f.target_id);
    if (slugs.length === 0) { setProviders([]); setLoading(false); return; }

    const { data: provData } = await supabase
      .from("providers")
      .select("slug, name, city, country, cover_photo_url, specialties")
      .in("slug", slugs);

    setProviders((provData as FavProvider[]) || []);
    setLoading(false);
  };

  const handleRemove = async (slug: string, name: string) => {
    await supabase
      .from("favorites" as any)
      .delete()
      .eq("user_id", user!.id)
      .eq("target_id", slug)
      .eq("target_type", "provider");
    setProviders((prev) => prev.filter((p) => p.slug !== slug));
    toast({ title: "Removed", description: `${name} removed from your favorites.` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Heart className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">No favorite providers yet.</p>
        <p className="text-muted-foreground text-xs mt-1">Browse providers and tap the heart to save your favorites.</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/search">Browse Providers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {providers.map((prov) => (
        <div
          key={prov.slug}
          className="rounded-xl overflow-hidden border"
          style={{ background: 'rgba(80,255,144,0.04)', border: '1px solid rgba(80,255,144,0.1)' }}
        >
          {/* Cover */}
          <div className="h-24 bg-muted overflow-hidden relative">
            {prov.cover_photo_url ? (
              <img src={prov.cover_photo_url} alt={prov.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-3xl font-bold text-muted-foreground/20">{prov.name[0]}</span>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="p-3">
            <h4 className="font-semibold text-sm truncate">{prov.name}</h4>
            {(prov.city || prov.country) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{[prov.city, prov.country].filter(Boolean).join(", ")}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Button asChild size="sm" variant="outline" className="flex-1 h-7 text-xs">
                <Link to={`/provider/${prov.slug}`}>View</Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => handleRemove(prov.slug, prov.name)}
                aria-label={`Remove ${prov.name}`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" style={{ color: '#50FF90' }} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedProvidersTab;
