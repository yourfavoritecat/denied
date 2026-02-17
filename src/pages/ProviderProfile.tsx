import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star, MapPin, Globe, MessageSquareQuote, PenLine, ExternalLink,
  Users, Clock, CreditCard, ShieldCheck, Plane, ChevronDown, ChevronUp,
} from "lucide-react";
import VerificationBadge from "@/components/providers/VerificationBadge";
import { REVIEW_CATEGORIES, US_PRICE_MAP } from "@/data/providers";
import RequestQuoteModal from "@/components/providers/RequestQuoteModal";
import LeaveReviewModal from "@/components/reviews/LeaveReviewModal";
import ReviewCard from "@/components/reviews/ReviewCard";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SavingsCalculator from "@/components/provider/SavingsCalculator";
import VideoTestimonialGallery from "@/components/provider/VideoTestimonialGallery";
import VibeTagsDisplay from "@/components/provider/VibeTagsDisplay";

/* ── Shared helpers ── */

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-4 h-4 ${s <= rating ? "fill-secondary text-secondary" : "text-border"}`} />
    ))}
  </div>
);

const glassCard = {
  background: 'rgba(94,178,152,0.08)',
  border: '1px solid rgba(94,178,152,0.12)',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 0 20px rgba(94,178,152,0.05)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
} as const;

/** Consistent "view more / show less" toggle button */
const ExpandToggle = ({
  expanded,
  onToggle,
  labelExpand,
  labelCollapse = "show less",
}: {
  expanded: boolean;
  onToggle: () => void;
  labelExpand: string;
  labelCollapse?: string;
}) => (
  <div className="flex justify-center mt-3">
    <button
      onClick={onToggle}
      className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
      style={{ color: '#5EB298' }}
    >
      {expanded ? labelCollapse : labelExpand}
      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  </div>
);

/* ── Types ── */

interface ProviderData {
  business: any | null;
  team: any[];
  services: any[];
  facility: any | null;
  links: any | null;
  policies: any | null;
  providerRecord: any | null;
}

/* ── Team card ── */

const TeamMemberCard = ({ member, index }: { member: any; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const hasBio = member.bio && member.bio.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="rounded-xl p-4 flex gap-3 items-start" style={glassCard}>
        <Avatar className="w-12 h-12 shrink-0 ring-2 ring-white/20">
          <AvatarImage src={member.headshot_url} alt={member.name} />
          <AvatarFallback className="bg-muted">
            <Users className="w-5 h-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm">{member.name}</p>
            {member.is_lead && (
              <Badge variant="secondary" className="btn-glossy-peach text-[10px] !py-0 !px-1.5">lead</Badge>
            )}
          </div>
          <p className="text-xs text-primary">{member.role}</p>
          {member.license_number && (
            <p className="text-[11px] text-muted-foreground">lic: {member.license_number}</p>
          )}
          {hasBio && (
            <>
              <p className={`text-xs text-muted-foreground mt-1 ${expanded ? "" : "line-clamp-2"}`}>
                {member.bio}
              </p>
              {member.bio.length > 100 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-[11px] text-primary hover:underline mt-0.5 flex items-center gap-0.5"
                >
                  {expanded ? <>less <ChevronUp className="w-3 h-3" /></> : <>more <ChevronDown className="w-3 h-3" /></>}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── Main component ── */

const ProviderProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteProcedure, setQuoteProcedure] = useState<string>("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest" | "helpful">("newest");
  const [filterRating, setFilterRating] = useState("all");
  const [filterProcedure, setFilterProcedure] = useState("all");
  const { user } = useAuth();
  const { reviews, loading: reviewsLoading, refetch } = useReviews(slug);
  const [data, setData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);

  // Collapsible state
  const [pricingExpanded, setPricingExpanded] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      setLoading(true);
      const [bizRes, teamRes, servRes, facRes, linksRes, polRes, providerRes] = await Promise.all([
        supabase.from("provider_business_info").select("*").eq("provider_slug", slug).maybeSingle(),
        supabase.from("provider_team_members").select("*").eq("provider_slug", slug).order("sort_order"),
        supabase.from("provider_services").select("*").eq("provider_slug", slug),
        supabase.from("provider_facility").select("*").eq("provider_slug", slug).maybeSingle(),
        supabase.from("provider_external_links").select("*").eq("provider_slug", slug).maybeSingle(),
        supabase.from("provider_policies").select("*").eq("provider_slug", slug).maybeSingle(),
        supabase.from("providers").select("*").eq("slug", slug).maybeSingle(),
      ]);
      setData({
        business: bizRes.data,
        team: teamRes.data || [],
        services: servRes.data || [],
        facility: facRes.data,
        links: linksRes.data,
        policies: polRes.data,
        providerRecord: providerRes.data,
      });
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  const pRec = data?.providerRecord;
  const providerName = data?.business?.dba_name || data?.business?.legal_name || pRec?.name || slug || "Provider";
  const providerCity = data?.business?.city || pRec?.city || "";
  const providerDescription = data?.facility?.description || pRec?.description || "";
  const tier = pRec?.verification_tier || "listed";
  const languages = data?.policies?.languages_spoken || pRec?.languages || [];
  const specialties = pRec?.specialties || [];
  const externalLinks = data?.links;
  const coverPhoto = pRec?.cover_photo_url || null;
  const facilityPhotos = (data?.facility?.photos as string[]) || [];

  const { avgRating, reviewCount, ratingBreakdown } = useMemo(() => {
    if (reviews.length === 0) return { avgRating: 0, reviewCount: 0, ratingBreakdown: [0, 0, 0, 0, 0] };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const breakdown = [0, 0, 0, 0, 0];
    reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) breakdown[5 - r.rating]++; });
    return { avgRating: Math.round((sum / reviews.length) * 10) / 10, reviewCount: reviews.length, ratingBreakdown: breakdown };
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    let filtered = [...reviews];
    if (filterRating !== "all") filtered = filtered.filter((r) => r.rating >= parseInt(filterRating));
    if (filterProcedure !== "all") filtered = filtered.filter((r) => r.procedure_name === filterProcedure);
    switch (sortBy) {
      case "oldest": filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case "highest": filtered.sort((a, b) => b.rating - a.rating); break;
      case "lowest": filtered.sort((a, b) => a.rating - b.rating); break;
      case "helpful": filtered.sort((a, b) => b.upvote_count - a.upvote_count); break;
      default: filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return filtered;
  }, [reviews, sortBy, filterRating, filterProcedure]);

  const categoryAggregates = useMemo(() => {
    const reviewsWithCategories = reviews.filter((r) => r.rating_cleanliness != null);
    if (reviewsWithCategories.length === 0) return null;
    return REVIEW_CATEGORIES.map(({ key, label }) => {
      const sum = reviewsWithCategories.reduce((acc, r) => acc + ((r as any)[key] || 0), 0);
      return { key, label, avg: Math.round((sum / reviewsWithCategories.length) * 10) / 10 };
    });
  }, [reviews]);

  const procedures = data?.services.map((s: any) => ({
    name: s.procedure_name,
    price: `$${Number(s.base_price_usd).toLocaleString()}`,
    usPrice: US_PRICE_MAP[s.procedure_name] || null,
    savings: US_PRICE_MAP[s.procedure_name] ? Math.round((1 - Number(s.base_price_usd) / US_PRICE_MAP[s.procedure_name]) * 100) : null,
    duration: s.estimated_duration || "—",
    description: s.description,
    recovery: s.recovery_time,
    packageDeals: s.package_deals,
  })) || [];

  const startingPrice = data?.services.length ? Math.min(...data.services.map((s: any) => Number(s.base_price_usd))) : null;

  // Collapsible limits
  const PRICING_LIMIT = 6;
  const TEAM_LIMIT = 4;
  const REVIEWS_LIMIT = 3;

  const visibleProcedures = pricingExpanded ? procedures : procedures.slice(0, PRICING_LIMIT);
  const visibleTeam = teamExpanded ? (data?.team || []) : (data?.team || []).slice(0, TEAM_LIMIT);
  const visibleReviews = reviewsExpanded ? sortedReviews : sortedReviews.slice(0, REVIEWS_LIMIT);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-16 pb-24">
          <div className="max-w-[960px] mx-auto px-4 py-12 space-y-4">
            <Skeleton className="h-[200px] w-full rounded-xl bg-white/10" />
            <Skeleton className="h-8 w-64 bg-white/10" />
            <Skeleton className="h-4 w-48 bg-white/10" />
            <Skeleton className="h-64 w-full rounded-xl bg-white/5 mt-6" />
          </div>
        </main>
      </div>
    );
  }

  /* ── 404 ── */
  if (!pRec) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Provider Not Found</h1>
          <p className="text-muted-foreground mb-6">This provider doesn't exist or has been removed.</p>
          <Link to="/search"><Button>Back to Search</Button></Link>
        </main>
      </div>
    );
  }

  const locationString = `${providerCity}${data?.business?.state_country ? `, ${data.business.state_country}` : pRec?.country ? `, ${pRec.country}` : ""}`;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16 pb-28">
        {/* ═══════ 1. HERO ═══════ */}
        <div className="relative max-w-[960px] mx-auto px-4 mt-6">
          <div className="relative rounded-2xl overflow-hidden h-[200px]">
            {coverPhoto ? (
              <img src={coverPhoto} alt={providerName} className="w-full h-full object-cover" />
            ) : facilityPhotos.length > 0 ? (
              <img src={facilityPhotos[0]} alt={providerName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--primary))]/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-4">
              <div className="w-16 h-16 rounded-xl bg-[hsl(var(--primary))]/20 border border-[hsl(var(--primary))]/30 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <span className="text-2xl font-bold text-[hsl(var(--primary))]">{providerName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-white truncate">{providerName}</h1>
                  <VerificationBadge tier={tier} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-white/70 text-sm flex-wrap">
                  {locationString && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {locationString}</span>}
                  {reviewCount > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-secondary text-secondary" /> {avgRating} ({reviewCount})</span>}
                  {languages.length > 0 && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {languages.join(", ")}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <VibeTagsDisplay reviews={reviews} />
          </div>
        </div>

        {/* ═══════ CONTENT ═══════ */}
        <div className="max-w-[960px] mx-auto px-4 mt-6 space-y-6">

          {/* ═══════ 2. ABOUT ═══════ */}
          {providerDescription && (
            <section>
              <div className="rounded-xl p-5" style={glassCard}>
                <h2 className="text-lg font-bold mb-2">About</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{providerDescription}</p>
                {specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {specialties.map((s: string) => (
                      <span
                        key={s}
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
                        style={{ background: 'rgba(94,178,152,0.15)', border: '1px solid rgba(94,178,152,0.3)' }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Facility Photos */}
          {facilityPhotos.length > 1 && (
            <section>
              <div className={`grid gap-2 ${facilityPhotos.length === 2 ? "grid-cols-2" : facilityPhotos.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
                {facilityPhotos.slice(0, 5).map((url, i) => (
                  <div
                    key={i}
                    className={`rounded-xl overflow-hidden border border-white/10 ${
                      facilityPhotos.length >= 4 && i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto md:h-52" : "aspect-[4/3]"
                    }`}
                  >
                    <img src={url} alt={`Facility ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ═══════ 3. REVIEWS (moved up) ═══════ */}
          <section>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-bold">Reviews</h2>
              {user && (
                <Button onClick={() => setReviewOpen(true)} variant="outline" size="sm" className="gap-1.5">
                  <PenLine className="w-3.5 h-3.5" /> Leave a Review
                </Button>
              )}
            </div>

            {/* Videos + overall rating side by side */}
            <div className="flex flex-col md:flex-row gap-4 mb-5">
              {/* Video testimonials */}
              <div className="flex-1 min-w-0">
                <VideoTestimonialGallery reviews={reviews} />
              </div>

              {/* Overall rating card */}
              {(reviewCount > 0 || categoryAggregates) && (
                <div className="rounded-xl p-5 md:w-[260px] shrink-0" style={glassCard}>
                  {reviewCount > 0 && (
                    <>
                      <div className="text-center mb-4">
                        <div className="text-4xl font-bold">{avgRating}</div>
                        <div className="flex justify-center mt-1 mb-0.5">
                          <StarRating rating={Math.round(avgRating)} />
                        </div>
                        <p className="text-xs text-muted-foreground">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="space-y-1.5 mb-4">
                        {[5, 4, 3, 2, 1].map((star, idx) => {
                          const count = ratingBreakdown[idx];
                          const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-1.5 text-xs">
                              <span className="w-3 text-right">{star}</span>
                              <Star className="w-3 h-3 fill-secondary text-secondary" />
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-6 text-right text-muted-foreground">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {categoryAggregates && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold">Category Breakdown</h4>
                      {categoryAggregates.map(({ key, label, avg }) => (
                        <div key={key} className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold">{avg}/5</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(avg / 5) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Written reviews — collapsible */}
            <div className="space-y-3">
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : sortedReviews.length > 0 ? (
                <>
                  <div className="relative">
                    <div className="space-y-3">
                      {visibleReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} onEdit={(r) => { setEditingReview(r); setReviewOpen(true); }} />
                      ))}
                    </div>
                    {/* Gradient fade hint when collapsed */}
                    {!reviewsExpanded && sortedReviews.length > REVIEWS_LIMIT && (
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
                    )}
                  </div>
                  {sortedReviews.length > REVIEWS_LIMIT && (
                    <ExpandToggle
                      expanded={reviewsExpanded}
                      onToggle={() => setReviewsExpanded(!reviewsExpanded)}
                      labelExpand={`view all ${sortedReviews.length} reviews`}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No reviews yet. Be the first to leave a review!</p>
                </div>
              )}
            </div>
          </section>

          {/* ═══════ 4. PROCEDURES & PRICING ═══════ */}
          {procedures.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Procedures & Pricing</h2>

              {/* Savings Calculator — compact inline above table */}
              <div className="mb-3">
                <SavingsCalculator
                  procedures={procedures}
                  onRequestQuote={(procName) => { setQuoteProcedure(procName); setQuoteOpen(true); }}
                />
              </div>

              {/* Pricing table — collapsible */}
              <div className="relative">
                <div className="rounded-xl overflow-hidden border border-white/10" style={{ ...glassCard, border: undefined }}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#0a0a0a] hover:bg-[#0a0a0a]">
                        <TableHead className="text-white font-bold">Procedure</TableHead>
                        <TableHead className="text-white font-bold text-right">Price</TableHead>
                        <TableHead className="text-white font-bold text-right hidden md:table-cell">U.S. Price</TableHead>
                        <TableHead className="text-white font-bold text-right">Savings</TableHead>
                        <TableHead className="text-white font-bold text-right hidden sm:table-cell">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleProcedures.map((proc: any) => (
                        <TableRow key={proc.name}>
                          <TableCell className="font-medium text-sm">
                            {proc.name}
                            {proc.packageDeals && <p className="text-xs text-secondary mt-0.5">{proc.packageDeals}</p>}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">{proc.price}</TableCell>
                          <TableCell className="text-right text-muted-foreground line-through hidden md:table-cell">
                            {proc.usPrice ? `$${proc.usPrice.toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {proc.savings && proc.savings > 0 ? (
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 font-bold text-xs">{proc.savings}% OFF</Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground hidden sm:table-cell text-sm">{proc.duration}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Gradient fade hint */}
                {!pricingExpanded && procedures.length > PRICING_LIMIT && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none rounded-b-xl" />
                )}
              </div>
              {procedures.length > PRICING_LIMIT && (
                <ExpandToggle
                  expanded={pricingExpanded}
                  onToggle={() => setPricingExpanded(!pricingExpanded)}
                  labelExpand={`view all ${procedures.length} procedures`}
                />
              )}
            </section>
          )}

          {/* ═══════ 5. TEAM — collapsible ═══════ */}
          {data && data.team.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" /> Our Team
              </h2>
              <div className="relative">
                <div className="grid sm:grid-cols-2 gap-3">
                  {visibleTeam.map((member: any, i: number) => (
                    <TeamMemberCard key={member.id} member={member} index={i} />
                  ))}
                </div>
                {!teamExpanded && data.team.length > TEAM_LIMIT && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
                )}
              </div>
              {data.team.length > TEAM_LIMIT && (
                <ExpandToggle
                  expanded={teamExpanded}
                  onToggle={() => setTeamExpanded(!teamExpanded)}
                  labelExpand={`view all ${data.team.length} team members`}
                />
              )}
            </section>
          )}

          {/* ═══════ 6. POLICIES & INFO ═══════ */}
          {data?.policies && (
            <section>
              <h2 className="text-lg font-bold mb-3">Policies & Info</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {data.policies.hours_of_operation && (
                  <div className="rounded-xl p-4" style={glassCard}>
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> Hours</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{data.policies.hours_of_operation}</p>
                  </div>
                )}
                {data.policies.cancellation_policy && (
                  <div className="rounded-xl p-4" style={glassCard}>
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Cancellation</p>
                    <p className="text-xs text-muted-foreground">{data.policies.cancellation_policy}</p>
                  </div>
                )}
                {data.policies.deposit_requirements && (
                  <div className="rounded-xl p-4" style={glassCard}>
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-primary" /> Deposit</p>
                    <p className="text-xs text-muted-foreground">{data.policies.deposit_requirements}</p>
                  </div>
                )}
                {data.policies.accepted_payments?.length > 0 && (
                  <div className="rounded-xl p-4" style={glassCard}>
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-primary" /> Payments</p>
                    <div className="flex flex-wrap gap-1">
                      {data.policies.accepted_payments.map((p: string) => (
                        <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ═══════ 7. GETTING THERE ═══════ */}
          {pRec?.travel_info && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Plane className="w-5 h-5" /> Getting There
              </h2>
              <div className="rounded-xl p-5" style={glassCard}>
                <p className="text-sm text-muted-foreground leading-relaxed">{pRec.travel_info}</p>
              </div>
            </section>
          )}

          {/* Location */}
          <section>
            <div className="rounded-xl h-36 flex items-center justify-center" style={glassCard}>
              <div className="text-center">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm text-muted-foreground font-medium">{locationString}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Exact address provided after booking</p>
              </div>
            </div>
          </section>

          {/* ═══════ 8. EXTERNAL REVIEWS ═══════ */}
          {(externalLinks?.google_business_url || externalLinks?.yelp_url) && (
            <section>
              <h2 className="text-lg font-bold mb-3">External Reviews</h2>
              <div className="flex flex-wrap gap-2">
                {externalLinks?.google_business_url && (
                  <a href={externalLinks.google_business_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Google Reviews</Button>
                  </a>
                )}
                {externalLinks?.yelp_url && (
                  <a href={externalLinks.yelp_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Yelp</Button>
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-floating z-40">
        <div className="max-w-[960px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="shrink-0">
            <span className="text-xs text-muted-foreground">Starting at </span>
            <span className="text-xl font-bold text-primary">
              {startingPrice != null ? `$${startingPrice.toLocaleString()}` : "Contact us"}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="font-bold" onClick={() => setQuoteOpen(true)}>
              <MessageSquareQuote className="w-4 h-4 mr-1.5" />
              Request Quote
            </Button>
            <Button size="sm" className="font-bold" onClick={() => setQuoteOpen(true)}>
              Book Now
            </Button>
          </div>
        </div>
      </div>

      <RequestQuoteModal open={quoteOpen} onOpenChange={setQuoteOpen} providerName={providerName} providerSlug={slug || ""} />
      <LeaveReviewModal
        open={reviewOpen}
        onOpenChange={(open) => { setReviewOpen(open); if (!open) setEditingReview(null); }}
        providerSlug={slug || ""}
        providerName={providerName}
        procedures={procedures.map((p: any) => p.name)}
        onReviewSubmitted={refetch}
        editReview={editingReview}
      />

      <Footer />
    </div>
  );
};

export default ProviderProfile;
