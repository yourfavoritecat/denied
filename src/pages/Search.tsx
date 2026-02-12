import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Filter, BadgeCheck, X, Syringe, ArrowUpDown } from "lucide-react";
import { providers, procedureTypes, locations, type Provider } from "@/data/providers";
import clinicDental from "@/assets/clinic-dental.jpg";
import clinicMedspa from "@/assets/clinic-medspa.jpg";
import clinicSurgery from "@/assets/clinic-surgery.jpg";

const dentalKeywords = ["dental", "crown", "implant", "all-on-4", "veneer", "root canal", "cleaning", "whitening", "denture"];
const aestheticKeywords = ["botox", "syringe", "chemical peel", "microneedling", "prp", "liposuction", "rhinoplasty", "tummy tuck", "facelift", "medspa", "aesthetics", "cosmetic surgery", "breast"];

const getClinicCategory = (provider: Provider): "dental" | "aesthetic" | "surgery" => {
  const allText = [...provider.specialties, provider.name].join(" ").toLowerCase();
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
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedProcedure, setSelectedProcedure] = useState<string>("");
  const [priceRange, setPriceRange] = useState([25000]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const filtered = useMemo(() => {
    let results = providers.filter((p) => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      if (selectedLocation && selectedLocation !== "all" && p.city !== selectedLocation) return false;
      if (selectedProcedure && !p.specialties.some(s => s.toLowerCase().includes(selectedProcedure.toLowerCase()))) return false;
      if (p.startingPrice > priceRange[0]) return false;
      if (selectedLanguages.length > 0 && !selectedLanguages.every(l => p.languages.includes(l))) return false;
      if (minRating > 0 && p.rating < minRating) return false;
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
  }, [searchQuery, selectedLocation, selectedProcedure, priceRange, selectedLanguages, minRating, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLocation("");
    setSelectedProcedure("");
    setPriceRange([25000]);
    setSelectedLanguages([]);
    setMinRating(0);
  };

  const hasActiveFilters = selectedLocation || selectedProcedure || priceRange[0] < 25000 || selectedLanguages.length > 0 || minRating > 0;

  const filtersContent = (
    <div className="space-y-6">
      {/* Procedure Type */}
      <div>
        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Procedure Type</h4>
        <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="All procedures" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Procedures</SelectItem>
            {procedureTypes.map((proc) => (
              <SelectItem key={proc} value={proc}>{proc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div>
        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Location</h4>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">Show All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Max Price</h4>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={25000}
          min={0}
          step={1}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>$0</span>
          <span className="font-medium text-foreground">${priceRange[0].toLocaleString()}</span>
          <span>$25,000</span>
        </div>
      </div>

      {/* Languages */}
      <div>
        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Language</h4>
        <div className="space-y-2">
          {["English", "Spanish"].map((lang) => (
            <label key={lang} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedLanguages.includes(lang)}
                onCheckedChange={() => toggleLanguage(lang)}
              />
              <span className="text-sm">{lang}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Minimum Rating</h4>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <Button
              key={r}
              variant={minRating === r ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setMinRating(minRating === r ? 0 : r)}
            >
              <Star className={`w-3 h-3 ${minRating === r ? "fill-current" : "fill-secondary text-secondary"}`} />
              {r}+
            </Button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={clearFilters}>
          <X className="w-4 h-4 mr-1" /> Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Search Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Find Your Provider
            </h1>
            <p className="text-muted-foreground mb-6">Browse verified clinics with transparent pricing across Mexico</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search clinics, procedures..."
                  className="pl-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="lg:hidden h-12"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters {hasActiveFilters && `(active)`}
              </Button>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters */}
            <aside className="hidden lg:block lg:w-72 shrink-0">
              <Card className="sticky top-24 border border-border/50 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 font-bold text-lg">
                    <Filter className="w-5 h-5" />
                    Filters
                  </div>
                </CardHeader>
                <CardContent>
                  {filtersContent}
                </CardContent>
              </Card>
            </aside>

            {/* Mobile Filters */}
            {showMobileFilters && (
              <div className="lg:hidden">
                <Card className="border border-border/50 shadow-lg">
                  <CardContent className="pt-6">
                    {filtersContent}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Results */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <p className="text-muted-foreground">
                  <span className="font-bold text-foreground">{filtered.length}</span> provider{filtered.length !== 1 ? "s" : ""} found
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

              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-2xl font-bold text-foreground mb-2">No providers found</p>
                  <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
                  <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {filtered.map((provider, index) => {
                    const category = getClinicCategory(provider);
                    return (
                      <motion.div
                        key={provider.slug}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.06 }}
                      >
                        <Link to={`/provider/${provider.slug}`}>
                          <Card className="overflow-hidden border border-border/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group">
                            <div className="aspect-[16/10] relative overflow-hidden">
                              <img
                                src={CATEGORY_IMAGES[category] || clinicDental}
                                alt={`${provider.name} clinic`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                              {provider.verified ? (
                                <div className="absolute top-3 right-3">
                                  <Badge className="bg-primary text-primary-foreground gap-1 shadow-md">
                                    <BadgeCheck className="w-3 h-3" /> Verified
                                  </Badge>
                                </div>
                              ) : provider.verificationTier === "listed" ? (
                                <div className="absolute top-3 right-3">
                                  <Badge variant="outline" className="bg-muted/80 text-muted-foreground gap-1 shadow-sm border-border">
                                    <BadgeCheck className="w-3 h-3" /> Listed
                                  </Badge>
                                </div>
                              ) : null}
                              <div className="absolute bottom-3 left-4">
                                <span className="text-white/90 text-xs uppercase tracking-wider font-medium drop-shadow-md">
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
                                {provider.city}, Mexico
                              </div>
                              <div className="flex items-center gap-2 mb-3">
                                <Star className="w-4 h-4 fill-secondary text-secondary" />
                                <span className="font-bold">{provider.rating}</span>
                                <span className="text-muted-foreground text-sm">({provider.reviews} reviews)</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {provider.specialties.slice(0, 3).map((specialty) => (
                                  <Badge key={specialty} variant="secondary" className="text-xs font-medium">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                              <div className="border-t pt-3">
                                <span className="text-sm text-muted-foreground">From </span>
                                <span className="text-xl font-bold text-primary">${provider.startingPrice}</span>
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
