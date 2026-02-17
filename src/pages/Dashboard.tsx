import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  PlusCircle,
  Plane,
  Clock,
  MapPin,
  ArrowRight,
  Stethoscope,
  CalendarDays,
  MessageSquare,
  Heart,
  Star,
} from "lucide-react";
import UserTrustBadge, { computeUserTrustTier } from "@/components/profile/UserTrustBadge";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const statusColors: Record<string, string> = {
  inquiry: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  quoted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  deposit_paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [tripBriefs, setTripBriefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const socialVerifications = (profile as any)?.social_verifications || {};
  const trustTier = computeUserTrustTier(socialVerifications, false);

  const firstName = profile?.first_name || "there";
  const initials = profile
    ? `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase() || "U"
    : "U";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: bk }, { data: tb }] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("trip_briefs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      setBookings(bk || []);
      setTripBriefs(tb || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const activeBookings = bookings.filter(
    (b) => !["completed", "cancelled"].includes(b.status)
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden mb-8"
            style={{ height: 220 }}
          >
            <img
              src="/images/hero-dashboard.jpg"
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 40%' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, transparent 20%, #0a0a0a 100%)' }}
            />
            <div className="absolute bottom-0 left-0 p-6 flex items-end gap-4">
              <Avatar className="w-14 h-14 bg-primary text-primary-foreground border-2 border-background">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {greeting()}, {firstName} 👋
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-white/70 text-sm">Welcome back to Denied</p>
                  <UserTrustBadge tier={trustTier} size="sm" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
          >
            {[
              { icon: Search, label: "Find Providers", to: "/search", color: "text-blue-400" },
              { icon: PlusCircle, label: "Plan a Trip", to: "/my-trips?plan=new", color: "text-secondary" },
              { icon: Plane, label: "My Trips", to: "/my-trips", color: "text-emerald-400" },
              { icon: Heart, label: "My Profile", to: "/profile", color: "text-pink-400" },
            ].map((action) => (
              <motion.div key={action.label} variants={item}>
                <Card
                  className="cursor-pointer tactile-press border-border/50 bg-card shadow-elevated"
                  onClick={() => navigate(action.to)}
                >
                  <CardContent className="flex flex-col items-center gap-2 py-5 px-3">
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                    <span className="text-sm font-medium text-center">{action.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Active Bookings */}
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="shadow-lifted bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    Active Bookings
                  </CardTitle>
                  {activeBookings.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeBookings.length}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : activeBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Plane className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground text-sm mb-4">No active bookings yet</p>
                      <Button size="sm" onClick={() => navigate("/search")}>
                        <Search className="w-4 h-4 mr-2" /> Browse Providers
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/booking/${booking.id}`)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {booking.provider_slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(booking.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize shadow-elevated ${statusColors[booking.status] || ""}`}
                            >
                              {booking.status.replace(/_/g, " ")}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              {/* Trip Briefs */}
              <Card className="shadow-elevated bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-secondary" />
                    Trip Briefs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-16 rounded-lg bg-muted animate-pulse" />
                  ) : tripBriefs.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm mb-3">No trip briefs yet</p>
                      <Button size="sm" variant="outline" onClick={() => navigate("/my-trips?plan=new")}>
                        <PlusCircle className="w-4 h-4 mr-1" /> Create One
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tripBriefs.map((tb) => (
                        <div
                          key={tb.id}
                          className="p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate("/my-trips")}
                        >
                          <p className="text-sm font-medium truncate">{tb.trip_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tb.destination || "No destination set"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="shadow-elevated bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className="text-center p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => navigate("/my-trips")}
                    >
                      <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
                      <p className="text-[11px] text-muted-foreground">Bookings</p>
                    </div>
                    <div 
                      className="text-center p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => navigate("/my-trips")}
                    >
                      <p className="text-2xl font-bold text-foreground">{tripBriefs.length}</p>
                      <p className="text-[11px] text-muted-foreground">Trip Briefs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
