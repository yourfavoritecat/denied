import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, FileText, MessageSquare, Clock, CheckCircle, PlusCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TripPlanner from "@/components/trips/TripPlanner";

interface TripBrief {
  id: string;
  trip_name: string;
  destination: string | null;
  travel_start: string | null;
  travel_end: string | null;
  procedures: { name: string; quantity: number }[];
  budget_min: number | null;
  budget_max: number | null;
  inquiry_description: string | null;
  medical_notes: string | null;
  status: string;
  created_at: string;
}

const mockPastTrips = [
  {
    id: "past-1",
    procedure: "4 Zirconia Crowns",
    clinic: "Cancun Smile Center",
    location: "Cancun, Mexico",
    dates: "November 8-12, 2025",
    status: "completed",
    price: 1400,
    savings: 4600,
  },
  {
    id: "past-2",
    procedure: "Root Canal + Crown",
    clinic: "Mexico City Dental Institute",
    location: "Mexico City, Mexico",
    dates: "August 22-25, 2025",
    status: "completed",
    price: 700,
    savings: 2100,
  },
];

const MyTripsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [tripBriefs, setTripBriefs] = useState<TripBrief[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBriefs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("trip_briefs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTripBriefs((data as unknown as TripBrief[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBriefs();
  }, [user]);

  useEffect(() => {
    if (searchParams.get("plan") === "new") {
      setPlannerOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const deleteBrief = async (id: string) => {
    await supabase.from("trip_briefs").delete().eq("id", id);
    setTripBriefs(tripBriefs.filter((b) => b.id !== id));
  };

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">My Trips</h1>
              <p className="text-muted-foreground">Plan, manage, and track your medical trips</p>
            </div>
            <Button onClick={() => setPlannerOpen(true)} className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Plan a Trip
            </Button>
          </div>

          <Tabs defaultValue="briefs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="briefs" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Trip Briefs ({tripBriefs.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Upcoming (0)
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Past ({mockPastTrips.length})
              </TabsTrigger>
            </TabsList>

            {/* Trip Briefs */}
            <TabsContent value="briefs" className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : tripBriefs.length > 0 ? (
                tripBriefs.map((brief) => (
                  <Card key={brief.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{brief.trip_name}</CardTitle>
                          {brief.destination && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5" /> {brief.destination}, Mexico
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{brief.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBrief(brief.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(brief.travel_start || brief.travel_end) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(brief.travel_start)} {brief.travel_end ? `– ${formatDate(brief.travel_end)}` : ""}
                        </div>
                      )}
                      {brief.procedures && brief.procedures.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {brief.procedures.map((p: any, i: number) => (
                            <Badge key={i} variant="outline">
                              {p.name} {p.quantity > 1 ? `×${p.quantity}` : ""}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {brief.inquiry_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{brief.inquiry_description}</p>
                      )}
                      {(brief.budget_min || brief.budget_max) && (
                        <p className="text-sm text-muted-foreground">
                          Budget: ${(brief.budget_min || 0).toLocaleString()} – ${(brief.budget_max || 0).toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No trip briefs yet</h3>
                    <p className="text-muted-foreground mb-4">Plan your first trip to get started</p>
                    <Button onClick={() => setPlannerOpen(true)}>Plan a Trip</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Upcoming */}
            <TabsContent value="upcoming">
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming trips</h3>
                  <p className="text-muted-foreground mb-4">Request quotes from providers to book your trip</p>
                  <Button asChild><a href="/search">Browse Providers</a></Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Past */}
            <TabsContent value="past" className="space-y-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Saved</div>
                      <div className="text-3xl font-bold text-primary">
                        ${mockPastTrips.reduce((sum, t) => sum + (t.savings || 0), 0).toLocaleString()}
                      </div>
                    </div>
                    <CheckCircle className="w-12 h-12 text-primary/30" />
                  </div>
                </CardContent>
              </Card>
              {mockPastTrips.map((trip) => (
                <Card key={trip.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{trip.procedure}</CardTitle>
                        <p className="text-sm text-muted-foreground">{trip.clinic}</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{trip.location}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{trip.dates}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <div className="text-xl font-bold text-primary">${trip.price.toLocaleString()}</div>
                        <div className="text-sm text-primary">Saved ${trip.savings.toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm"><FileText className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm"><MessageSquare className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      <TripPlanner open={plannerOpen} onOpenChange={setPlannerOpen} onSaved={fetchBriefs} />
    </div>
  );
};

export default MyTripsPage;
