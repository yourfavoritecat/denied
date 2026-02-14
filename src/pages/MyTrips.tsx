import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, FileText, MessageSquare, Clock, CheckCircle, PlusCircle, Trash2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TripPlanner from "@/components/trips/TripPlanner";
import { providers } from "@/data/providers";

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

interface Booking {
  id: string;
  provider_slug: string;
  procedures: any;
  preferred_dates: any;
  status: string;
  quoted_price: number | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-secondary/10 text-secondary",
  quoted: "bg-accent/10 text-accent",
  deposit_paid: "bg-primary/10 text-primary",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  inquiry: "Inquiry Sent",
  provider_responded: "Provider Responded",
  quoted: "Quote Received",
  deposit_paid: "Deposit Paid",
  confirmed: "Trip Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const MyTripsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [tripBriefs, setTripBriefs] = useState<TripBrief[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    const [briefsRes, bookingsRes] = await Promise.all([
      supabase.from("trip_briefs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookings" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setTripBriefs((briefsRes.data as unknown as TripBrief[]) || []);
    setBookings((bookingsRes.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);
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
    const [year, month, day] = d.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const activeBookings = bookings.filter((b) => ["inquiry", "provider_responded", "quoted"].includes(b.status));
  const confirmedBookings = bookings.filter((b) => ["deposit_paid", "confirmed"].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const provider = providers.find((p) => p.slug === booking.provider_slug);
    const procedures = Array.isArray(booking.procedures)
      ? booking.procedures.map((p: any) => `${p.name}${p.quantity > 1 ? ` ×${p.quantity}` : ""}`).join(", ")
      : "";

    return (
      <Link to={`/booking/${booking.id}`}>
        <Card className="tactile-lift cursor-pointer shadow-elevated border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{provider?.name || booking.provider_slug}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{procedures}</p>
              </div>
              <Badge className={STATUS_COLORS[booking.status] || "bg-muted"}>
                {STATUS_LABELS[booking.status] || booking.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {booking.preferred_dates?.text && (
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{booking.preferred_dates.text}</span>
                )}
                {provider && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{provider.city}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {booking.quoted_price && (
                  <span className="text-lg font-bold text-primary">${Number(booking.quoted_price).toLocaleString()}</span>
                )}
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const BookingList = ({ items, emptyIcon: Icon, emptyTitle, emptyDesc }: { items: Booking[]; emptyIcon: any; emptyTitle: string; emptyDesc: string }) => (
    items.length > 0 ? (
      <div className="space-y-4">
        {items.map((b) => <BookingCard key={b.id} booking={b} />)}
      </div>
    ) : (
      <Card className="shadow-elevated border-border/50"><CardContent className="py-12 text-center">
        <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground mb-4">{emptyDesc}</p>
      </CardContent></Card>
    )
  );

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">My Trips</h1>
              <p className="text-muted-foreground">Plan, manage, and track your medical trips</p>
            </div>
            <Button onClick={() => setPlannerOpen(true)} className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Plan a Trip
            </Button>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="active">Active ({activeBookings.length})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({confirmedBookings.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
              <TabsTrigger value="briefs">Trip Briefs ({tripBriefs.length})</TabsTrigger>
              {cancelledBookings.length > 0 && <TabsTrigger value="cancelled">Cancelled ({cancelledBookings.length})</TabsTrigger>}
            </TabsList>

            <TabsContent value="active">
              <BookingList items={activeBookings} emptyIcon={MessageSquare} emptyTitle="No active inquiries" emptyDesc="Request a quote from a provider to get started" />
            </TabsContent>

            <TabsContent value="confirmed">
              <BookingList items={confirmedBookings} emptyIcon={Calendar} emptyTitle="No confirmed trips" emptyDesc="Pay a deposit to confirm your trip" />
            </TabsContent>

            <TabsContent value="completed">
              <BookingList items={completedBookings} emptyIcon={CheckCircle} emptyTitle="No completed trips yet" emptyDesc="Your completed trips will appear here" />
            </TabsContent>

            {cancelledBookings.length > 0 && (
              <TabsContent value="cancelled">
                <BookingList items={cancelledBookings} emptyIcon={Clock} emptyTitle="" emptyDesc="" />
              </TabsContent>
            )}

            <TabsContent value="briefs" className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : tripBriefs.length > 0 ? (
                tripBriefs.map((brief) => (
                  <Card key={brief.id} className="shadow-elevated border-border/50 tactile-lift cursor-pointer">
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
                      {brief.procedures?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {brief.procedures.map((p, i) => (
                            <Badge key={i} variant="outline">{p.name} {p.quantity > 1 ? `×${p.quantity}` : ""}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="shadow-elevated border-border/50"><CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No trip briefs yet</h3>
                  <p className="text-muted-foreground mb-4">Plan your first trip to get started</p>
                  <Button onClick={() => setPlannerOpen(true)}>Plan a Trip</Button>
                </CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      <TripPlanner open={plannerOpen} onOpenChange={setPlannerOpen} onSaved={fetchData} />
    </div>
  );
};

export default MyTripsPage;
