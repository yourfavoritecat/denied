import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, ArrowLeft, Globe, MessageSquareQuote, PenLine, ExternalLink, Users } from "lucide-react";
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-4 h-4 ${s <= rating ? "fill-secondary text-secondary" : "text-border"}`} />
    ))}
  </div>
);

interface ProviderData {
  business: any | null;
  team: any[];
  services: any[];
  facility: any | null;
  links: any | null;
  policies: any | null;
  providerRecord: any | null;
}

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

  // Derived values from DB
  const pRec = data?.providerRecord;
  const providerName = data?.business?.dba_name || data?.business?.legal_name || pRec?.name || slug || "Provider";
  const providerCity = data?.business?.city || pRec?.city || "";
  const providerDescription = data?.facility?.description || pRec?.description || "";
  const tier = pRec?.verification_tier || "listed";
  const languages = data?.policies?.languages_spoken || pRec?.languages || [];
  const specialties = pRec?.specialties || [];
  const externalLinks = data?.links;

  // Compute rating from DB reviews
  const { avgRating, reviewCount, ratingBreakdown } = useMemo(() => {
    if (reviews.length === 0) return { avgRating: 0, reviewCount: 0, ratingBreakdown: [0, 0, 0, 0, 0] };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const breakdown = [0, 0, 0, 0, 0]; // 5-star to 1-star
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) breakdown[5 - r.rating]++;
    });
    return {
      avgRating: Math.round((sum / reviews.length) * 10) / 10,
      reviewCount: reviews.length,
      ratingBreakdown: breakdown,
    };
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    let filtered = [...reviews];
    if (filterRating !== "all") {
      const min = parseInt(filterRating);
      filtered = filtered.filter((r) => r.rating >= min);
    }
    if (filterProcedure !== "all") {
      filtered = filtered.filter((r) => r.procedure_name === filterProcedure);
    }
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-16 pb-24">
          <div className="bg-gradient-to-br from-denied-black to-denied-black/90">
            <div className="container mx-auto px-4 py-12 md:py-20">
              <Skeleton className="h-4 w-32 mb-6 bg-white/10" />
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-64 bg-white/10" />
                  <Skeleton className="h-4 w-48 bg-white/10" />
                </div>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 mt-8 space-y-8">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  // 404 state — provider not found in DB
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

  const facilityPhotos = (data?.facility?.photos as string[] || []);

  // Build procedures list from DB services
  const procedures = data?.services.map((s: any) => ({
    name: s.procedure_name,
    price: `$${Number(s.base_price_usd).toLocaleString()}`,
    usPrice: US_PRICE_MAP[s.procedure_name] || null,
    savings: US_PRICE_MAP[s.procedure_name]
      ? Math.round((1 - Number(s.base_price_usd) / US_PRICE_MAP[s.procedure_name]) * 100)
      : null,
    duration: s.estimated_duration || "—",
    description: s.description,
    recovery: s.recovery_time,
    packageDeals: s.package_deals,
  })) || [];

  const startingPrice = data?.services.length
    ? Math.min(...data.services.map((s: any) => Number(s.base_price_usd)))
    : null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16 pb-24">
        {/* Hero */}
        <motion.div
          className="bg-gradient-to-br from-denied-black to-denied-black/90 relative"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        >
          <div className="container mx-auto px-4 py-12 md:py-20">
            <Link to="/search" className="inline-flex items-center gap-1 text-white/60 hover:text-white transition-colors text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </Link>
            <motion.div className="flex flex-col md:flex-row md:items-end gap-6"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-4xl md:text-5xl font-bold text-white/30">{providerName.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">{providerName}</h1>
                  <VerificationBadge tier={tier as any} size="md" />
                </div>
                <div className="flex items-center gap-4 text-white/70 flex-wrap">
                  {providerCity && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {providerCity}{data?.business?.state_country ? `, ${data.business.state_country}` : pRec?.country ? `, ${pRec.country}` : ""}</span>}
                  {reviewCount > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-secondary text-secondary" /> {avgRating} ({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>}
                  {languages.length > 0 && <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {languages.join(", ")}</span>}
                </div>
              </div>
            </motion.div>

            {/* Vibe Tags below header */}
            <VibeTagsDisplay reviews={reviews} />
          </div>
        </motion.div>

        {/* Facility Photos */}
        <motion.div className="container mx-auto px-4 -mt-4 mb-10" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
          {facilityPhotos.length === 1 ? (
            <div className="max-w-2xl mx-auto">
              <motion.div variants={fadeUp} custom={0} className="rounded-xl overflow-hidden border border-border/50 aspect-video">
                <img src={facilityPhotos[0]} alt="Facility photo" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          ) : facilityPhotos.length === 2 ? (
            <div className="grid grid-cols-2 gap-3 max-w-3xl mx-auto">
              {facilityPhotos.map((url, i) => (
                <motion.div key={i} variants={fadeUp} custom={i * 0.5} className="rounded-xl overflow-hidden border border-border/50 aspect-[4/3]">
                  <img src={url} alt={`Facility photo ${i + 1}`} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          ) : facilityPhotos.length === 3 ? (
            <div className="grid grid-cols-3 gap-3">
              {facilityPhotos.map((url, i) => (
                <motion.div key={i} variants={fadeUp} custom={i * 0.5} className="rounded-xl overflow-hidden border border-border/50 aspect-[4/3]">
                  <img src={url} alt={`Facility photo ${i + 1}`} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          ) : facilityPhotos.length >= 4 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {facilityPhotos.slice(0, 5).map((url, i) => (
                <motion.div key={i} variants={fadeUp} custom={i * 0.5}
                  className={`rounded-xl overflow-hidden border border-border/50 ${i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto md:h-64" : "aspect-square md:h-[7.5rem]"}`}>
                  <img src={url} alt={`Facility photo ${i + 1}`} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          ) : null}
        </motion.div>

        <div className="container mx-auto px-4 space-y-12">
          {/* Savings Calculator */}
          {procedures.length > 0 && (
            <SavingsCalculator
              procedures={procedures}
              onRequestQuote={(procName) => {
                setQuoteProcedure(procName);
                setQuoteOpen(true);
              }}
            />
          )}

          {/* About / Description */}
          {providerDescription && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
              <Card className="shadow-lifted bg-card">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold mb-4">About</h2>
                  <p className="text-muted-foreground leading-relaxed max-w-3xl">
                    {providerDescription}
                  </p>
                  {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {specialties.map((s: string) => (
                        <span
                          key={s}
                          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_12px_rgba(94,178,152,0.2)] cursor-default"
                          style={{
                            background: 'rgba(94,178,152,0.15)',
                            border: '1px solid rgba(94,178,152,0.3)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(94,178,152,0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(94,178,152,0.15)';
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.section>
          )}

          {/* Team Members */}
          {data && data.team.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
              <h2 className="text-2xl font-bold mt-12 mb-6 flex items-center gap-2"><Users className="w-6 h-6" /> our team</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.team.map((member: any, i: number) => (
                  <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Card className="border border-border/50 shadow-elevated hover:shadow-floating tactile-lift bg-card min-h-[180px]">
                    <CardContent className="p-6 flex gap-4">
                      <Avatar className="w-16 h-16 shrink-0 ring-2 ring-white/20">
                        <AvatarImage src={member.headshot_url} alt={member.name} />
                        <AvatarFallback className="bg-muted">
                          <Users className="w-7 h-7 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold">{member.name}</p>
                        <p className="text-sm text-primary">{member.role}</p>
                        {member.license_number && <p className="text-xs text-muted-foreground">license: {member.license_number}</p>}
                        {member.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{member.bio}</p>}
                        {member.is_lead && <Badge variant="secondary" className="mt-2 btn-glossy-peach text-xs !py-0.5 !px-2">lead</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Procedures & Pricing */}
          {procedures.length > 0 && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
              <h2 className="text-2xl font-bold mb-4">Procedures & Pricing</h2>
              <Card className="border border-border/50 shadow-floating overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-denied-black hover:bg-denied-black">
                      <TableHead className="text-white font-bold">Procedure</TableHead>
                      <TableHead className="text-white font-bold text-right">Price</TableHead>
                      <TableHead className="text-white font-bold text-right hidden md:table-cell">U.S. Price</TableHead>
                      <TableHead className="text-white font-bold text-right">Savings</TableHead>
                      <TableHead className="text-white font-bold text-right hidden sm:table-cell">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedures.map((proc: any) => (
                      <TableRow key={proc.name}>
                        <TableCell className="font-medium">
                          {proc.name}
                          {proc.packageDeals && <p className="text-xs text-secondary mt-0.5">{proc.packageDeals}</p>}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">{proc.price}</TableCell>
                        <TableCell className="text-right text-muted-foreground line-through hidden md:table-cell">
                          {proc.usPrice ? `$${proc.usPrice.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {proc.savings && proc.savings > 0 ? (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 font-bold">{proc.savings}% OFF</Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground hidden sm:table-cell">{proc.duration}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </motion.section>
          )}

          {/* Reviews Section */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-2xl font-bold">Reviews</h2>
              {user && (
                <Button onClick={() => setReviewOpen(true)} variant="outline" className="gap-2">
                  <PenLine className="w-4 h-4" /> Leave a Review
                </Button>
              )}
            </div>

            {/* Video Testimonials */}
            <VideoTestimonialGallery reviews={reviews} />

            <div className="grid md:grid-cols-3 gap-8">
              {/* Rating Breakdown + Category Chart */}
              {(reviewCount > 0 || categoryAggregates) && (
                <Card className="border border-border/50 shadow-lifted bg-card">
                  <CardContent className="pt-6">
                    {reviewCount > 0 && (
                      <>
                        <div className="text-center mb-6">
                          <div className="text-5xl font-bold text-foreground">{avgRating}</div>
                          <div className="flex justify-center mt-2 mb-1">
                            <StarRating rating={Math.round(avgRating)} />
                          </div>
                          <p className="text-sm text-muted-foreground">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="space-y-2 mb-6">
                          {[5, 4, 3, 2, 1].map((star, idx) => {
                            const count = ratingBreakdown[idx];
                            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center gap-2 text-sm">
                                <span className="w-3 text-right">{star}</span>
                                <Star className="w-3 h-3 fill-secondary text-secondary" />
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-8 text-right text-muted-foreground">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Category Aggregate Bar Chart */}
                    {categoryAggregates && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Category Breakdown</h4>
                        {categoryAggregates.map(({ key, label, avg }) => (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-semibold text-foreground">{avg}/5</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${(avg / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Reviews list */}
              <div className={reviewCount > 0 || categoryAggregates ? "md:col-span-2 space-y-4" : "md:col-span-3 space-y-4"}>
                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} onEdit={(r) => { setEditingReview(r); setReviewOpen(true); }} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No reviews yet. Be the first to leave a review!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* External Reviews */}
          {(externalLinks?.google_business_url || externalLinks?.yelp_url) && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
              <h2 className="text-2xl font-bold mb-4">External Reviews</h2>
              <div className="flex flex-wrap gap-3">
                {externalLinks?.google_business_url && (
                  <a href={externalLinks.google_business_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2"><ExternalLink className="w-4 h-4" /> Google Reviews</Button>
                  </a>
                )}
                {externalLinks?.yelp_url && (
                  <a href={externalLinks.yelp_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2"><ExternalLink className="w-4 h-4" /> Yelp</Button>
                  </a>
                )}
              </div>
            </motion.section>
          )}

          {/* Policies */}
          {data?.policies && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
              <h2 className="text-2xl font-bold mb-4">Policies & Info</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {data.policies.hours_of_operation && (
                  <Card className="border border-border/50"><CardContent className="pt-5"><p className="text-sm font-semibold mb-1">Hours</p><p className="text-sm text-muted-foreground whitespace-pre-line">{data.policies.hours_of_operation}</p></CardContent></Card>
                )}
                {data.policies.cancellation_policy && (
                  <Card className="border border-border/50"><CardContent className="pt-5"><p className="text-sm font-semibold mb-1">Cancellation Policy</p><p className="text-sm text-muted-foreground">{data.policies.cancellation_policy}</p></CardContent></Card>
                )}
                {data.policies.deposit_requirements && (
                  <Card className="border border-border/50"><CardContent className="pt-5"><p className="text-sm font-semibold mb-1">Deposit Requirements</p><p className="text-sm text-muted-foreground">{data.policies.deposit_requirements}</p></CardContent></Card>
                )}
                {data.policies.accepted_payments?.length > 0 && (
                  <Card className="border border-border/50"><CardContent className="pt-5"><p className="text-sm font-semibold mb-1">Accepted Payments</p><div className="flex flex-wrap gap-1">{data.policies.accepted_payments.map((p: string) => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}</div></CardContent></Card>
                )}
              </div>
            </motion.section>
          )}

          {/* Travel Info */}
          {pRec?.travel_info && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
              <h2 className="text-2xl font-bold mb-4">Getting There</h2>
              <Card className="border border-border/50 shadow-lifted bg-card">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground leading-relaxed">{pRec.travel_info}</p>
                </CardContent>
              </Card>
            </motion.section>
          )}

          {/* Location */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
            <h2 className="text-2xl font-bold mb-4">Location</h2>
            <div className="rounded-xl bg-muted border border-border/50 h-48 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground font-medium">
                  {providerCity}{data?.business?.state_country ? `, ${data.business.state_country}` : pRec?.country ? `, ${pRec.country}` : ""}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Exact address provided after booking</p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-floating z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">Starting at </span>
            <span className="text-2xl font-bold text-primary">
              {startingPrice != null ? `$${startingPrice.toLocaleString()}` : "Contact us"}
            </span>
          </div>
          <Button
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold h-12 px-8 text-base shadow-lg"
            onClick={() => setQuoteOpen(true)}
          >
            <MessageSquareQuote className="w-5 h-5 mr-2" />
            Request Quote
          </Button>
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
