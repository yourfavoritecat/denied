import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Users, Building2, Plane, DollarSign, TrendingUp, Clock, ExternalLink, CheckCircle, XCircle, AlertCircle, Plus, Settings, BadgeCheck, ArrowRight } from "lucide-react";

interface Stats {
  waitlistCount: number;
  userCount: number;
  providerCount: number;
  applications: { pending: number; approved: number; rejected: number };
  bookings: Record<string, number>;
  totalRevenue: number;
  recentApplications: any[];
  recentBookings: any[];
  recentProviders: any[];
}

const OverviewSection = ({ onNavigate }: { onNavigate?: (section: string) => void }) => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      const [waitlist, profiles, applications, bookings, providers, recentApps, recentBookings, recentProviders] = await Promise.all([
        supabase.from("waitlist").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("provider_applications").select("status"),
        supabase.from("bookings").select("status, commission_amount"),
        supabase.from("providers").select("id", { count: "exact", head: true }),
        supabase.from("provider_applications").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("bookings").select("id, status, provider_slug, created_at, quoted_price").order("created_at", { ascending: false }).limit(5),
        supabase.from("providers").select("slug, name, city, country, verification_tier, admin_managed, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const appData = applications.data || [];
      const bookData = bookings.data || [];

      const bookingsByStatus: Record<string, number> = {};
      let revenue = 0;
      bookData.forEach((b: any) => {
        bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
        if (b.status === "completed" && b.commission_amount) {
          revenue += Number(b.commission_amount);
        }
      });

      setStats({
        waitlistCount: waitlist.count || 0,
        userCount: profiles.count || 0,
        providerCount: providers.count || 0,
        applications: {
          pending: appData.filter((a: any) => a.status === "pending").length,
          approved: appData.filter((a: any) => a.status === "approved").length,
          rejected: appData.filter((a: any) => a.status === "rejected").length,
        },
        bookings: bookingsByStatus,
        totalRevenue: revenue,
        recentApplications: recentApps.data || [],
        recentBookings: recentBookings.data || [],
        recentProviders: recentProviders.data || [],
      });
    };
    load();
  }, []);

  if (!stats) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const totalBookings = Object.values(stats.bookings).reduce((a, b) => a + b, 0);
  const activeBookings = (stats.bookings["confirmed"] || 0) + (stats.bookings["deposit_paid"] || 0);
  const pendingApps = stats.applications.pending;

  const metricCards = [
    { label: "Waitlist Signups", value: stats.waitlistCount, icon: Mail, color: "text-secondary", action: () => onNavigate?.("waitlist") },
    { label: "Registered Users", value: stats.userCount, icon: Users, color: "text-primary", action: () => onNavigate?.("users") },
    { label: "Active Providers", value: stats.providerCount, icon: Building2, color: "text-foreground", action: () => onNavigate?.("providers") },
    { label: "Total Bookings", value: totalBookings, icon: Plane, color: "text-primary", action: () => onNavigate?.("bookings") },
    { label: "Active Trips", value: activeBookings, icon: TrendingUp, color: "text-secondary", action: () => onNavigate?.("bookings") },
    { label: "Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-primary", action: () => onNavigate?.("bookings") },
  ];

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="w-3.5 h-3.5 text-primary" />;
    if (status === "rejected") return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    return <Clock className="w-3.5 h-3.5 text-secondary" />;
  };

  const bookingStatusColor = (status: string) => {
    const map: Record<string, string> = {
      inquiry: "bg-secondary/10 text-secondary",
      quoted: "bg-primary/10 text-primary",
      deposit_paid: "bg-primary/20 text-primary",
      confirmed: "bg-primary/10 text-primary",
      completed: "bg-muted text-muted-foreground",
      cancelled: "bg-destructive/10 text-destructive",
    };
    return map[status] || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">overview</h2>
        {pendingApps > 0 && (
          <Badge className="bg-secondary/10 text-secondary gap-1.5 px-3 py-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {pendingApps} pending application{pendingApps > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((m) => (
          <Card key={m.label} className="hover:shadow-md transition-shadow cursor-pointer" onClick={m.action}>
            <CardContent className="py-5 px-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</span>
                <m.icon className={`w-4 h-4 ${m.color} opacity-60`} />
              </div>
              <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column layout: Applications + Bookings pipeline */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Provider Applications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              provider applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary bar */}
            <div className="flex gap-4 text-center">
              <div className="flex-1 bg-secondary/5 rounded-lg p-3 cursor-pointer hover:bg-secondary/10 transition-colors" onClick={() => onNavigate?.("applications")}>
                <p className="text-2xl font-bold text-secondary">{stats.applications.pending}</p>
                <p className="text-[11px] text-muted-foreground">pending</p>
              </div>
              <div className="flex-1 bg-primary/5 rounded-lg p-3 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => onNavigate?.("applications")}>
                <p className="text-2xl font-bold text-primary">{stats.applications.approved}</p>
                <p className="text-[11px] text-muted-foreground">approved</p>
              </div>
              <div className="flex-1 bg-destructive/5 rounded-lg p-3 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => onNavigate?.("applications")}>
                <p className="text-2xl font-bold text-destructive">{stats.applications.rejected}</p>
                <p className="text-[11px] text-muted-foreground">rejected</p>
              </div>
            </div>

            {/* Recent applications */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">recent</p>
              <div className="space-y-2">
                {stats.recentApplications.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">no applications yet</p>
                ) : (
                  stats.recentApplications.map((app: any) => (
                    <div key={app.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      {statusIcon(app.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{app.business_name}</p>
                        <p className="text-[11px] text-muted-foreground">{app.city}, {app.country}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plane className="w-4 h-4 text-primary" />
              booking pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pipeline visualization */}
            <div className="grid grid-cols-3 gap-2">
              {["inquiry", "quoted", "deposit_paid", "confirmed", "completed", "cancelled"].map((s) => (
                <div 
                  key={s} 
                  className={`rounded-lg p-3 text-center cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all ${bookingStatusColor(s)} bg-opacity-50`}
                  onClick={() => onNavigate?.("bookings")}
                >
                  <p className="text-xl font-bold">{stats.bookings[s] || 0}</p>
                  <p className="text-[11px] capitalize">{s.replace("_", " ")}</p>
                </div>
              ))}
            </div>

            {/* Recent bookings */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">recent</p>
              <div className="space-y-2">
                {stats.recentBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">no bookings yet</p>
                ) : (
                  stats.recentBookings.map((b: any) => (
                    <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Badge className={`text-[10px] ${bookingStatusColor(b.status)}`}>{b.status.replace("_", " ")}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.provider_slug}</p>
                        {b.quoted_price && <p className="text-[11px] text-muted-foreground">${b.quoted_price.toLocaleString()}</p>}
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Management Quick Access */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              provider management
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => onNavigate?.("providers")}>
                <Settings className="w-3.5 h-3.5" /> manage all
              </Button>
              <Button size="sm" className="text-xs gap-1.5" onClick={() => onNavigate?.("providers")}>
                <Plus className="w-3.5 h-3.5" /> add provider
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick action cards */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className="rounded-lg border border-border p-4 hover:bg-muted/50 cursor-pointer transition-colors text-center"
              onClick={() => onNavigate?.("applications")}
            >
              <BadgeCheck className="w-5 h-5 mx-auto mb-2 text-secondary" />
              <p className="text-xs font-medium">review applications</p>
              {pendingApps > 0 && <p className="text-lg font-bold text-secondary mt-1">{pendingApps}</p>}
            </div>
            <div
              className="rounded-lg border border-border p-4 hover:bg-muted/50 cursor-pointer transition-colors text-center"
              onClick={() => onNavigate?.("verification")}
            >
              <BadgeCheck className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">verify credentials</p>
            </div>
            <div
              className="rounded-lg border border-border p-4 hover:bg-muted/50 cursor-pointer transition-colors text-center"
              onClick={() => onNavigate?.("inbox")}
            >
              <Mail className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">inbox</p>
            </div>
          </div>

          {/* Recent providers */}
          {stats.recentProviders.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">active providers</p>
              <div className="space-y-2">
                {stats.recentProviders.map((p: any) => (
                  <div key={p.slug} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.city}, {p.country}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.admin_managed && (
                        <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary">admin</Badge>
                      )}
                      <Badge className="text-[10px] bg-primary/10 text-primary capitalize">{p.verification_tier || "listed"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewSection;
