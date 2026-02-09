import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, BadgeCheck, ArrowLeft, Globe, MessageSquareQuote, PenLine, ExternalLink } from "lucide-react";
import { providers } from "@/data/providers";
import RequestQuoteModal from "@/components/providers/RequestQuoteModal";
import LeaveReviewModal from "@/components/reviews/LeaveReviewModal";
import ReviewCard from "@/components/reviews/ReviewCard";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";

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

const ProviderProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const provider = providers.find((p) => p.slug === slug);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest" | "helpful">("newest");
  const [filterRating, setFilterRating] = useState("all");
  const [filterProcedure, setFilterProcedure] = useState("all");
  const { user } = useAuth();
  const { reviews, loading: reviewsLoading, refetch } = useReviews(slug);

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

  const filteredSeedReviews = useMemo(() => {
    if (!provider) return [];
    let filtered = [...provider.reviewsList];
    if (filterRating !== "all") {
      const min = parseInt(filterRating);
      filtered = filtered.filter((r) => r.rating >= min);
    }
    if (filterProcedure !== "all") {
      filtered = filtered.filter((r) => r.procedure === filterProcedure);
    }
    if (sortBy === "oldest") filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    else if (sortBy === "highest") filtered.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "lowest") filtered.sort((a, b) => a.rating - b.rating);
    else filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return filtered;
  }, [provider, sortBy, filterRating, filterProcedure]);

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Provider Not Found</h1>
          <p className="text-muted-foreground mb-6">This provider doesn't exist or has been removed.</p>
          <Link to="/search"><Button>Back to Search</Button></Link>
        </main>
      </div>
    );
  }

  const totalReviews = provider.ratingBreakdown.reduce((a, b) => a + b, 0);

  // Placeholder external review URLs
  const externalReviews = {
    google: `https://www.google.com/maps/search/${encodeURIComponent(provider.name)}`,
    yelp: `https://www.yelp.com/search?find_desc=${encodeURIComponent(provider.name)}`,
  };

  return (
    <div className="min-h-screen bg-background">
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
                <span className="text-4xl md:text-5xl font-bold text-white/30">{provider.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">{provider.name}</h1>
                  {provider.verified && (
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-white/70 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {provider.city}, Mexico</span>
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-secondary text-secondary" /> {provider.rating} ({provider.reviews} reviews)</span>
                  <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {provider.languages.join(", ")}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Photo Gallery Placeholder */}
        <motion.div className="container mx-auto px-4 -mt-4 mb-10" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <motion.div key={i} variants={fadeUp} custom={i * 0.5}
                className={`rounded-xl bg-gradient-to-br from-denied-mint/10 to-denied-peach/10 border border-border/50 flex items-center justify-center ${i === 1 ? "col-span-2 row-span-2 aspect-square md:aspect-auto md:h-64" : "aspect-square md:h-[7.5rem]"}`}>
                <p className="text-sm text-muted-foreground">Photo {i}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="container mx-auto px-4 space-y-12">
          {/* About */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">{provider.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {provider.specialties.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          </motion.section>

          {/* Procedures Table */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
            <h2 className="text-2xl font-bold mb-4">Procedures & Pricing</h2>
            <Card className="border border-border/50 shadow-lg overflow-hidden">
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
                  {provider.procedures.map((proc) => (
                    <TableRow key={proc.name}>
                      <TableCell className="font-medium">{proc.name}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{proc.priceRange}</TableCell>
                      <TableCell className="text-right text-muted-foreground line-through hidden md:table-cell">${proc.usPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 font-bold">{proc.savings}% OFF</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden sm:table-cell">{proc.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.section>

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
            <div className="grid md:grid-cols-3 gap-8">
              {/* Rating Breakdown */}
              <Card className="border border-border/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-foreground">{provider.rating}</div>
                    <div className="flex justify-center mt-2 mb-1">
                      <StarRating rating={Math.round(provider.rating)} />
                    </div>
                    <p className="text-sm text-muted-foreground">{provider.reviews} reviews</p>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star, idx) => {
                      const count = provider.ratingBreakdown[idx];
                      const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
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
                </CardContent>
              </Card>

              {/* User Reviews from DB */}
              <div className="md:col-span-2 space-y-4">
                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => <ReviewCard key={review.id} review={review} />)
                ) : null}

                {/* Static seed reviews */}
                {provider.reviewsList.map((review) => (
                  <Card key={review.name + review.date} className="border border-border/50 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="bg-secondary/20 shrink-0">
                          <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-sm">{review.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                            <div>
                              <span className="font-bold">{review.name}</span>
                              <span className="text-muted-foreground text-sm ml-2">{review.location}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{new Date(review.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <StarRating rating={review.rating} />
                            <Badge variant="outline" className="text-xs">{review.procedure}</Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{review.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.section>

          {/* External Reviews */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
            <h2 className="text-2xl font-bold mb-4">External Reviews</h2>
            <div className="flex flex-wrap gap-3">
              <a href={externalReviews.google} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" /> View on Google Reviews
                </Button>
              </a>
              <a href={externalReviews.yelp} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" /> View on Yelp
                </Button>
              </a>
            </div>
          </motion.section>

          {/* Map Placeholder */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
            <h2 className="text-2xl font-bold mb-4">Location</h2>
            <div className="rounded-xl bg-muted border border-border/50 h-64 md:h-80 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground font-medium">{provider.city}, Mexico</p>
                <p className="text-sm text-muted-foreground">Google Maps embed coming soon</p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border shadow-2xl z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">Starting at </span>
            <span className="text-2xl font-bold text-primary">${provider.startingPrice}</span>
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

      <RequestQuoteModal open={quoteOpen} onOpenChange={setQuoteOpen} providerName={provider.name} providerSlug={provider.slug} />
      <LeaveReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        providerSlug={provider.slug}
        providerName={provider.name}
        procedures={provider.procedures.map((p) => p.name)}
        onReviewSubmitted={refetch}
      />

      <Footer />
    </div>
  );
};

export default ProviderProfile;
