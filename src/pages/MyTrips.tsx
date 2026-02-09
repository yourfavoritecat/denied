import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, FileText, MessageSquare, Download, Clock, CheckCircle } from "lucide-react";

const mockUpcomingTrips = [
  {
    id: 1,
    procedure: "All-on-4 Dental Implants",
    clinic: "Dental Excellence Tijuana",
    location: "Tijuana, Mexico",
    dates: "March 15-20, 2026",
    status: "confirmed",
    price: 8500,
  },
];

const mockPastTrips = [
  {
    id: 2,
    procedure: "4 Zirconia Crowns",
    clinic: "Cancun Smile Center",
    location: "Cancun, Mexico",
    dates: "November 8-12, 2025",
    status: "completed",
    price: 1400,
    savings: 4600,
  },
  {
    id: 3,
    procedure: "Root Canal + Crown",
    clinic: "Mexico City Dental Institute",
    location: "Mexico City, Mexico",
    dates: "August 22-25, 2025",
    status: "completed",
    price: 700,
    savings: 2100,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-primary/10 text-primary">Confirmed</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "completed":
      return <Badge className="bg-primary/10 text-primary">Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const TripCard = ({ trip, isPast = false }: { trip: typeof mockUpcomingTrips[0] & { savings?: number }; isPast?: boolean }) => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className="text-xl mb-1">{trip.procedure}</CardTitle>
          <p className="text-muted-foreground">{trip.clinic}</p>
        </div>
        {getStatusBadge(trip.status)}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          {trip.location}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {trip.dates}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div>
          <div className="text-sm text-muted-foreground">Total Cost</div>
          <div className="text-xl font-bold text-primary">${trip.price.toLocaleString()}</div>
          {isPast && trip.savings && (
            <div className="text-sm text-primary">You saved ${trip.savings.toLocaleString()}</div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Details</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Contact</span>
          </Button>
          {isPast && (
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Docs</span>
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const MyTripsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">My Trips</h1>
            <p className="text-muted-foreground">Manage your upcoming and past medical trips</p>
          </div>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Upcoming ({mockUpcomingTrips.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Past ({mockPastTrips.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {mockUpcomingTrips.length > 0 ? (
                mockUpcomingTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No upcoming trips</h3>
                    <p className="text-muted-foreground mb-4">
                      Ready to save on your next procedure?
                    </p>
                    <Button asChild>
                      <a href="/search">Browse Providers</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {mockPastTrips.length > 0 ? (
                <>
                  {/* Savings Summary */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="py-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Saved</div>
                          <div className="text-3xl font-bold text-primary">
                            ${mockPastTrips.reduce((sum, trip) => sum + (trip.savings || 0), 0).toLocaleString()}
                          </div>
                        </div>
                        <CheckCircle className="w-12 h-12 text-primary/30" />
                      </div>
                    </CardContent>
                  </Card>

                  {mockPastTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} isPast />
                  ))}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No past trips yet</h3>
                    <p className="text-muted-foreground">
                      Your completed trips will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyTripsPage;
