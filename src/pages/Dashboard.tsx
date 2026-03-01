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
import VerifiedBadge, { isUserVerified } from "@/components/profile/VerifiedBadge";
import { GlassCard } from "@/components/ui/glass-card";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const statusColors: Record<string, string> = {
  inquiry: "bg-blue-100 text-blue-700 border-blue-200",
  quoted: "bg-amber-100 text-amber-700 border-amber-200",
  deposit_paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-gray-100 text-gray-500 border-gray-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [tripBriefs, setTripBriefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const socialVerifications = (profile as any)?.social_verifications || {};
  const verified = isUserVerified(socialVerifications);

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
    <div className="min-h-screen theme-public" style={{ background: '#FFFFFF' }}>
      <Navbar light />
      <main>
        <div className="max-w-[960px] mx-auto px-4 pt-24 pb-16">
          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-xl overflow-hidden mb-8"
            style={{ height: 220 }}
          >
            <img
              src="/images/hero-profile.jpg"
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(255,255,255,0.95) 85%, #FFFFFF 100%)' }}
            />
            <div className="absolute bottom-0 left-0 p-6 flex items-end gap-4" style={{ zIndex: 1 }}>
              <Avatar className="w-14 h-14 bg-primary text-primary-foreground border-2" style={{ borderColor: '#FFFFFF' }}>
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#111111' }}>
                  {greeting()}, {firstName} 👋
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm" style={{ color: '#888888' }}>welcome back to denied</p>
                  <VerifiedBadge verified={verified} size="sm" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions — Glass Card Treatment */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
          >
            {[
              { icon: Search, label: "find providers", to: "/search" },
              { icon: PlusCircle, label: "plan a trip", to: "/my-trips?plan=new" },
              { icon: Plane, label: "my trips", to: "/my-trips" },
              { icon: Heart, label: "my profile", to: "/profile" },
            ].map((action) => (
              <motion.div key={action.label} variants={item}>
                <GlassCard
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => navigate(action.to)}
                >
                  <div className="flex flex-col items-center gap-2 py-1 px-1">
                    <action.icon className="w-6 h-6" style={{ color: '#111111' }} />
                    <span className="text-sm font-semibold text-center" style={{ color: '#333333' }}>{action.label}</span>
                  </div>
                </GlassCard>
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
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 16,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  padding: 24,
                }}
              >
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#111111' }}>
                    <Stethoscope className="w-5 h-5" style={{ color: '#111111' }} />
                    active bookings
                  </h3>
                  {activeBookings.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeBookings.length}
                    </Badge>
                  )}
                </div>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: '#F5F5F5' }} />
                    ))}
                  </div>
                ) : activeBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Plane className="w-10 h-10 mx-auto mb-3" style={{ color: '#CCCCCC' }} />
                    <p className="text-sm mb-4" style={{ color: '#888888' }}>no active bookings yet</p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/search")}
                      style={{ background: '#3BF07A', color: '#111111', borderRadius: 9999 }}
                    >
                      <Search className="w-4 h-4 mr-2" /> browse providers
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200"
                        style={{ border: '1px solid rgba(0,0,0,0.06)' }}
                        onClick={() => navigate(`/booking/${booking.id}`)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(59,240,122,0.06)', border: '1px solid rgba(59,240,122,0.12)' }}
                          >
                            <MapPin className="w-4 h-4" style={{ color: '#111111' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>
                              {booking.provider_slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </p>
                            <p className="text-xs flex items-center gap-1" style={{ color: '#888888' }}>
                              <Clock className="w-3 h-3" />
                              {new Date(booking.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${statusColors[booking.status] || ""}`}
                          >
                            {booking.status.replace(/_/g, " ")}
                          </Badge>
                          <ArrowRight className="w-4 h-4" style={{ color: '#CCCCCC' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              {/* Trip Briefs */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 16,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  padding: 24,
                }}
              >
                <h3 className="text-lg font-bold flex items-center gap-2 pb-3" style={{ color: '#111111' }}>
                  <CalendarDays className="w-5 h-5" style={{ color: '#111111' }} />
                  trip briefs
                </h3>
                {loading ? (
                  <div className="h-16 rounded-lg animate-pulse" style={{ background: '#F5F5F5' }} />
                ) : tripBriefs.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm mb-3" style={{ color: '#888888' }}>no trip briefs yet</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/my-trips?plan=new")}
                      style={{ border: '2px solid #3BF07A', color: '#111111', borderRadius: 9999 }}
                    >
                      <PlusCircle className="w-4 h-4 mr-1" /> create one
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tripBriefs.map((tb) => (
                      <div
                        key={tb.id}
                        className="p-2.5 rounded-lg cursor-pointer transition-all duration-200"
                        style={{ border: '1px solid rgba(0,0,0,0.06)' }}
                        onClick={() => navigate("/my-trips")}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{tb.trip_name}</p>
                        <p className="text-xs" style={{ color: '#888888' }}>
                          {tb.destination || "no destination set"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 16,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  padding: 24,
                }}
              >
                <h3 className="text-lg font-bold flex items-center gap-2 pb-3" style={{ color: '#111111' }}>
                  <Star className="w-5 h-5" style={{ color: '#FFD700' }} />
                  your stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="text-center p-3 rounded-lg cursor-pointer transition-all duration-200"
                    style={{ background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.04)' }}
                    onClick={() => navigate("/my-trips")}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                  >
                    <p className="text-2xl font-bold" style={{ color: '#111111' }}>{bookings.length}</p>
                    <p className="text-[11px]" style={{ color: '#888888' }}>bookings</p>
                  </div>
                  <div
                    className="text-center p-3 rounded-lg cursor-pointer transition-all duration-200"
                    style={{ background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.04)' }}
                    onClick={() => navigate("/my-trips")}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                  >
                    <p className="text-2xl font-bold" style={{ color: '#111111' }}>{tripBriefs.length}</p>
                    <p className="text-[11px]" style={{ color: '#888888' }}>trip briefs</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
