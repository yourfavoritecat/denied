import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Check, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface MatchedProvider {
  slug: string;
  name: string;
  city: string | null;
  cover_photo_url: string | null;
  matchingProcedures: string[];
  startingPrice: number | null;
  rating: number | null;
}

interface MatchedProvidersStepProps {
  destination: string;
  selectedProcedures: string[];
  procedureQuantities?: Record<string, number>;
  consideredProviders: string[];
  onConsideredChange: (providers: string[]) => void;
  sentBriefs: Set<string>;
  onSendBrief: (providerSlug: string) => Promise<void>;
  onSkip: () => void;
}

const MatchedProvidersStep = ({
  destination,
  selectedProcedures,
  procedureQuantities = {},
  consideredProviders,
  onConsideredChange,
  sentBriefs,
  onSendBrief,
  onSkip,
}: MatchedProvidersStepProps) => {
  const [providers, setProviders] = useState<MatchedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMatches();
  }, [destination, selectedProcedures]);

  const fetchMatches = async () => {
    setLoading(true);
    
    // Get providers in the same city
    const { data: cityProviders } = await supabase
      .from("providers")
      .select("slug, name, city, cover_photo_url")
      .ilike("city", destination);

    if (!cityProviders || cityProviders.length === 0) {
      setProviders([]);
      setLoading(false);
      return;
    }

    const slugs = cityProviders.map((p) => p.slug);

    // Get services for those providers that match selected procedures
    const { data: services } = await supabase
      .from("provider_services")
      .select("provider_slug, procedure_name, base_price_usd")
      .in("provider_slug", slugs);

    // Get ratings
    const { data: reviews } = await supabase
      .from("reviews")
      .select("provider_slug, rating")
      .in("provider_slug", slugs);

    // Build matched list
    const matched: MatchedProvider[] = [];
    
    for (const provider of cityProviders) {
      const providerServices = (services || []).filter(
        (s) => s.provider_slug === provider.slug
      );
      
      const matchingProcedures = selectedProcedures.filter((proc) =>
        providerServices.some(
          (s) => s.procedure_name.toLowerCase() === proc.toLowerCase()
        )
      );

      if (matchingProcedures.length === 0 && selectedProcedures.length > 0) continue;

      const prices = providerServices
        .filter((s) => matchingProcedures.some(
          (mp) => mp.toLowerCase() === s.procedure_name.toLowerCase()
        ))
        .map((s) => Number(s.base_price_usd))
        .filter((p) => p > 0);

      const providerReviews = (reviews || []).filter(
        (r) => r.provider_slug === provider.slug
      );
      const avgRating = providerReviews.length > 0
        ? providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length
        : null;

      matched.push({
        slug: provider.slug,
        name: provider.name,
        city: provider.city,
        cover_photo_url: provider.cover_photo_url,
        matchingProcedures,
        startingPrice: prices.length > 0 ? Math.min(...prices) : null,
        rating: avgRating,
      });
    }

    setProviders(matched);
    setLoading(false);
  };

  const toggleProvider = (slug: string) => {
    if (sentBriefs.has(slug)) return; // can't remove sent ones
    
    if (consideredProviders.includes(slug)) {
      onConsideredChange(consideredProviders.filter((s) => s !== slug));
      setDismissedPrompts((prev) => { const next = new Set(prev); next.delete(slug); return next; });
    } else {
      onConsideredChange([...consideredProviders, slug]);
      setDismissedPrompts((prev) => { const next = new Set(prev); next.delete(slug); return next; });
    }
  };

  const handleSendBrief = async (slug: string) => {
    setSendingTo(slug);
    await onSendBrief(slug);
    setSendingTo(null);
  };

  const dismissPrompt = (slug: string) => {
    setDismissedPrompts((prev) => new Set([...prev, slug]));
  };

  if (loading) {
    return (
      <div className="text-center py-12" style={{ color: '#888888' }}>
        searching for providers…
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-10 space-y-3">
        <Search className="w-10 h-10 mx-auto" style={{ color: '#cccccc' }} />
        <h3 className="font-semibold text-base">
          we don't have any partners in {destination.toLowerCase()} for these procedures yet.
        </h3>
        <p className="text-sm" style={{ color: "#888888" }}>
          we're growing fast — check back soon or browse all providers.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => window.open("/search", "_blank")}
        >
          browse all providers
        </Button>
        <div className="pt-4">
          <button
            onClick={onSkip}
            className="text-sm"
            style={{ color: "#888888", transition: "all 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#111111"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#888888"; }}
          >
            skip this step
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "#888888" }}>
        we found partners who offer what you're looking for. add any you're interested in, or skip for now.
      </p>

      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
        {providers.map((provider) => {
          const isAdded = consideredProviders.includes(provider.slug);
          const isSent = sentBriefs.has(provider.slug);
          const showPrompt = isAdded && !isSent && !dismissedPrompts.has(provider.slug);

          return (
            <div key={provider.slug} className="space-y-0">
              <div
                className="flex items-center gap-3 p-3 transition-all"
                style={{
                  background: "#FFFFFF",
                  border: isAdded ? "1px solid rgba(59,240,122,0.3)" : "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "12px",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,240,122,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Avatar */}
                <a
                  href={`/provider/${provider.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ borderRadius: "10px", background: "rgba(0,0,0,0.04)" }}
                >
                  {provider.cover_photo_url ? (
                    <img
                      src={provider.cover_photo_url}
                      alt={provider.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-5 h-5" style={{ color: "rgba(0,0,0,0.2)" }} />
                  )}
                </a>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <a
                    href={`/provider/${provider.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sm truncate lowercase block hover:underline"
                  >
                    {provider.name.toLowerCase()}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    {provider.rating && (
                      <span className="text-xs" style={{ color: "#888888" }}>
                        ★ {provider.rating.toFixed(1)}
                      </span>
                    )}
                    {provider.startingPrice && (
                      <span className="text-xs" style={{ color: "#888888" }}>
                        from ${provider.startingPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {provider.matchingProcedures.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {provider.matchingProcedures.slice(0, 3).map((proc) => (
                        <span
                          key={proc}
                          className="text-[10px] px-1.5 py-0.5"
                          style={{
                            background: "rgba(59, 240, 122, 0.1)",
                            color: "#333333",
                            border: "1px solid rgba(59, 240, 122, 0.2)",
                            borderRadius: "9999px",
                          }}
                        >
                          {proc.toLowerCase()}
                        </span>
                      ))}
                      {provider.matchingProcedures.length > 3 && (
                        <span className="text-[10px]" style={{ color: "#888888" }}>
                          +{provider.matchingProcedures.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Add button */}
                {isSent ? (
                  <span className="text-[10px] font-medium shrink-0" style={{ color: "#888888" }}>brief sent</span>
                ) : (
                  <button
                    onClick={() => toggleProvider(provider.slug)}
                    className="w-8 h-8 flex items-center justify-center shrink-0"
                    style={{
                      borderRadius: "9999px",
                      background: isAdded ? "#3BF07A" : "transparent",
                      border: isAdded ? "none" : "1px solid rgba(59,240,122,0.3)",
                      color: isAdded ? "#111111" : "#3BF07A",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Send brief prompt */}
              {showPrompt && (
                <div
                  className="flex items-center justify-between px-3 py-2 -mt-1 pt-3"
                  style={{ background: "rgba(59, 240, 122, 0.05)", borderRadius: "0 0 12px 12px", borderTop: "none" }}
                >
                  <span className="text-xs" style={{ color: "#888888" }}>
                    send them your trip brief now?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendBrief(provider.slug)}
                      disabled={sendingTo === provider.slug}
                      className="text-xs font-semibold px-3 py-1"
                      style={{
                        background: "#3BF07A",
                        color: "#111111",
                        borderRadius: "9999px",
                        border: "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {sendingTo === provider.slug ? "sending…" : "send brief"}
                    </button>
                    <button
                      onClick={() => dismissPrompt(provider.slug)}
                      className="text-xs"
                      style={{ color: "#888888", transition: "all 0.15s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#111111"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#888888"; }}
                    >
                      not yet
                    </button>
                  </div>
                </div>
              )}

              {/* Sent label */}
              {isSent && (
                <div className="px-3 py-1.5 -mt-1" style={{ background: "rgba(59, 240, 122, 0.05)", borderRadius: "0 0 12px 12px" }}>
                  <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#111111" }}>
                    brief sent
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <button
          onClick={onSkip}
          className="text-sm"
          style={{ color: "#888888", transition: "all 0.15s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#111111"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#888888"; }}
        >
          skip this step
        </button>
      </div>
    </div>
  );
};

export default MatchedProvidersStep;
