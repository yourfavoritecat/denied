import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Star, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import clinicDental from "@/assets/clinic-dental.jpg";
import clinicMedspa from "@/assets/clinic-medspa.jpg";
import clinicSurgery from "@/assets/clinic-surgery.jpg";

const dentalKeywords = ["dental", "crown", "implant", "all-on-4", "veneer", "root canal", "cleaning", "whitening", "denture"];
const aestheticKeywords = ["botox", "syringe", "chemical peel", "microneedling", "prp", "liposuction", "rhinoplasty", "tummy tuck", "facelift", "medspa", "aesthetics", "cosmetic surgery", "breast"];

interface DBProvider {
  slug: string;
  name: string;
  city: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  verification_tier: string | null;
  cover_photo_url: string | null;
  description: string | null;
  startingPrice: number;
  rating: number;
  reviews: number;
}

const getClinicCategory = (provider: DBProvider): "dental" | "aesthetic" | "surgery" => {
  const allText = [...(provider.specialties || []), provider.name].join(" ").toLowerCase();
  const isDental = dentalKeywords.some((k) => allText.includes(k));
  const isSurgery = ["rhinoplasty", "liposuction", "tummy tuck", "facelift", "breast", "plastic surgery"].some((k) => allText.includes(k));
  const isAesthetic = aestheticKeywords.some((k) => allText.includes(k));
  if (isSurgery) return "surgery";
  if (isDental && !isAesthetic) return "dental";
  return isAesthetic ? "aesthetic" : "dental";
};

const CATEGORY_IMAGES: Record<string, string> = {
  dental: clinicDental,
  aesthetic: clinicMedspa,
  surgery: clinicSurgery,
};

type SortOption = "default" | "price-low" | "price-high" | "rating" | "reviews";

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [dbProviders, setDbProviders] = useState<DBProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const { data: providerRows, error: pErr } = await supabase
          .from("providers")
          .select("slug, name, city, specialties, languages, verification_tier, cover_photo_url, description");

        if (pErr) throw pErr;
        if (!providerRows || providerRows.length === 0) {
          setDbProviders([]);
          setLoading(false);
          return;
        }

        const { data: serviceRows } = await supabase
          .from("provider_services")
          .select("provider_slug, base_price_usd");

        const { data: reviewRows } = await supabase
          .from("reviews")
          .select("provider_slug, rating");

        const priceMap: Record<string, number> = {};
        (serviceRows || []).forEach((s) => {
          const current = priceMap[s.provider_slug];
          if (current === undefined || s.base_price_usd < current) {
            priceMap[s.provider_slug] = s.base_price_usd;
          }
        });

        const reviewMap: Record<string, { sum: number; count: number }> = {};
        (reviewRows || []).forEach((r) => {
          if (!reviewMap[r.provider_slug]) {
            reviewMap[r.provider_slug] = { sum: 0, count: 0 };
          }
          reviewMap[r.provider_slug].sum += r.rating;
          reviewMap[r.provider_slug].count += 1;
        });

        const merged: DBProvider[] = providerRows.map((p) => {
          const rev = reviewMap[p.slug];
          return {
            slug: p.slug,
            name: p.name,
            city: p.city,
            specialties: p.specialties,
            languages: p.languages,
            verification_tier: p.verification_tier,
            cover_photo_url: p.cover_photo_url,
            description: p.description,
            startingPrice: priceMap[p.slug] ?? 0,
            rating: rev ? Math.round((rev.sum / rev.count) * 10) / 10 : 0,
            reviews: rev?.count ?? 0,
          };
        });

        setDbProviders(merged);
      } catch (err) {
        console.error("Error fetching providers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const filtered = useMemo(() => {
    let results = dbProviders.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(q);
        const specMatch = (p.specialties || []).some(s => s.toLowerCase().includes(q));
        if (!nameMatch && !specMatch) return false;
      }
      return true;
    });

    switch (sortBy) {
      case "price-low":
        results = [...results].sort((a, b) => a.startingPrice - b.startingPrice);
        break;
      case "price-high":
        results = [...results].sort((a, b) => b.startingPrice - a.startingPrice);
        break;
      case "rating":
        results = [...results].sort((a, b) => b.rating - a.rating);
        break;
      case "reviews":
        results = [...results].sort((a, b) => b.reviews - a.reviews);
        break;
    }

    return results;
  }, [dbProviders, searchQuery, sortBy]);

  const LoadingSkeleton = () => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden border border-border/50 shadow-elevated bg-card">
          <Skeleton className="aspect-[16/10] w-full" />
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-6 w-24 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <p className="text-2xl font-bold text-foreground mb-2">We're onboarding providers now</p>
        <p className="text-muted-foreground mb-6">
          Check back soon or join the waitlist to be the first to know when new clinics are available.
        </p>
        <Button asChild>
          <Link to="/">Join the Waitlist</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Banner */}
          <div className="relative rounded-2xl overflow-hidden mb-8" style={{ height: 180 }}>
            <img
              src="/images/hero-search.jpg"
              alt=""
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, transparent 20%, #0a0a0a 100%)' }}
            />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                Find Your Provider
              </h1>
              <p className="text-white/70">Browse verified clinics with transparent pricing across Mexico</p>
            </div>
          </div>

          {/* Search Bar */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search clinics, procedures..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>

          {/* Results header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <p className="text-muted-foreground">
              {loading ? (
                <Skeleton className="h-5 w-32 inline-block" />
              ) : (
                <>
                  <span className="font-bold text-foreground">{filtered.length}</span> provider{filtered.length !== 1 ? "s" : ""} found
                </>
              )}
            </p>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-48 bg-background">
                <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results grid */}
          {loading ? (
            <LoadingSkeleton />
          ) : dbProviders.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl font-bold text-foreground mb-2">No providers found</p>
              <p className="text-muted-foreground mb-4">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((provider, index) => {
                const category = getClinicCategory(provider);
                const isVerified = provider.verification_tier === "verified" || provider.verification_tier === "premium";
                return (
                  <motion.div
                    key={provider.slug}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: (index % 6) * 0.08 }}
                  >
                    <Link to={`/provider/${provider.slug}`}>
                      <Card className="overflow-hidden border border-border/50 shadow-elevated hover:shadow-floating tactile-lift cursor-pointer h-full group bg-card">
                        <div className="aspect-[16/10] relative overflow-hidden">
                          <img
                            src={provider.cover_photo_url || CATEGORY_IMAGES[category] || clinicDental}
                            alt={`${provider.name} clinic`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          {isVerified && (
                            <div className="absolute top-3 right-3">
                              <img
                                src="/badges/provider.png?v=3"
                                alt="Verified Provider"
                                className="h-7 w-auto drop-shadow-lg"
                                draggable={false}
                              />
                            </div>
                          )}
                          <div className="absolute bottom-3 left-4">
                            <span className="bg-black/50 backdrop-blur-sm text-white text-xs uppercase tracking-wider font-medium px-2.5 py-1 rounded-full shadow-elevated">
                              {category === "dental" ? "Dental Clinic" : category === "surgery" ? "Surgery Center" : "Aesthetics & MedSpa"}
                            </span>
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-lg leading-tight">{provider.name}</h3>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                            <MapPin className="w-4 h-4 shrink-0" />
                            {provider.city || "Mexico"}, Mexico
                          </div>
                          {provider.reviews > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                              <Star className="w-4 h-4 fill-secondary text-secondary" />
                              <span className="font-bold">{provider.rating}</span>
                              <span className="text-muted-foreground text-sm">({provider.reviews} review{provider.reviews !== 1 ? "s" : ""})</span>
                            </div>
                          )}
                          {(provider.specialties || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {(provider.specialties || []).slice(0, 3).map((specialty) => (
                                <Badge key={specialty} variant="secondary" className="text-xs font-medium">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                            <div>
                              {provider.startingPrice > 0 ? (
                                <>
                                  <span className="text-sm text-muted-foreground">From </span>
                                  <span className="text-xl font-bold text-primary">${provider.startingPrice.toLocaleString()}</span>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">Contact for pricing</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
