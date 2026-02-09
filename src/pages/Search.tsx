import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, Star, Filter } from "lucide-react";

const mockProviders = [
  {
    id: 1,
    name: "Dental Excellence Tijuana",
    location: "Tijuana, Mexico",
    specialties: ["Implants", "Crowns", "Veneers"],
    rating: 4.9,
    reviews: 342,
    startingPrice: 350,
    image: "/placeholder.svg",
  },
  {
    id: 2,
    name: "Cancun Smile Center",
    location: "Cancun, Mexico",
    specialties: ["All-on-4", "Root Canal", "Cosmetic"],
    rating: 4.8,
    reviews: 218,
    startingPrice: 400,
    image: "/placeholder.svg",
  },
  {
    id: 3,
    name: "Mexico City Dental Institute",
    location: "Mexico City, Mexico",
    specialties: ["Oral Surgery", "Implants", "Crowns"],
    rating: 4.7,
    reviews: 156,
    startingPrice: 300,
    image: "/placeholder.svg",
  },
  {
    id: 4,
    name: "Los Algodones Dental Group",
    location: "Los Algodones, Mexico",
    specialties: ["Dentures", "Crowns", "Bridges"],
    rating: 4.9,
    reviews: 489,
    startingPrice: 250,
    image: "/placeholder.svg",
  },
];

const locations = ["Tijuana", "Cancun", "Mexico City", "Los Algodones", "Guadalajara"];
const procedures = ["Dental Implant", "Crown", "Veneer", "All-on-4", "Root Canal", "Dentures"];

const SearchPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Find Your Provider
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search procedures, clinics..."
                  className="pl-10 h-12"
                />
              </div>
              <Button className="h-12 px-6 bg-primary hover:bg-primary/90">
                Search
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-72 shrink-0">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Filter className="w-5 h-5" />
                    Filters
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Location Filter */}
                  <div>
                    <h4 className="font-medium mb-3">Location</h4>
                    <div className="space-y-2">
                      {locations.map((location) => (
                        <label key={location} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox />
                          <span className="text-sm">{location}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Procedure Filter */}
                  <div>
                    <h4 className="font-medium mb-3">Procedure Type</h4>
                    <div className="space-y-2">
                      {procedures.map((procedure) => (
                        <label key={procedure} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox />
                          <span className="text-sm">{procedure}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="font-medium mb-3">Price Range</h4>
                    <Slider defaultValue={[500]} max={5000} step={100} className="mb-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>$0</span>
                      <span>$5,000+</span>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <h4 className="font-medium mb-3">Minimum Rating</h4>
                    <div className="flex gap-2">
                      {[3, 4, 4.5].map((rating) => (
                        <Button
                          key={rating}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-secondary text-secondary" />
                          {rating}+
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Results Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{mockProviders.length}</span> providers found
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {mockProviders.map((provider) => (
                  <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-1">{provider.name}</h3>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                        <MapPin className="w-4 h-4" />
                        {provider.location}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {provider.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-secondary text-secondary" />
                          <span className="font-semibold">{provider.rating}</span>
                          <span className="text-muted-foreground text-sm">
                            ({provider.reviews} reviews)
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Starting at</div>
                          <div className="font-bold text-primary">${provider.startingPrice}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
