import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Users, Building2, Plane, DollarSign } from "lucide-react";

interface Stats {
  waitlistCount: number;
  userCount: number;
  applications: { pending: number; approved: number; rejected: number };
  bookings: Record<string, number>;
  totalRevenue: number;
}

const OverviewSection = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      const [waitlist, profiles, applications, bookings] = await Promise.all([
        supabase.from("waitlist").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("provider_applications").select("status"),
        supabase.from("bookings").select("status, commission_amount"),
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
        applications: {
          pending: appData.filter((a: any) => a.status === "pending").length,
          approved: appData.filter((a: any) => a.status === "approved").length,
          rejected: appData.filter((a: any) => a.status === "rejected").length,
        },
        bookings: bookingsByStatus,
        totalRevenue: revenue,
      });
    };
    load();
  }, []);

  if (!stats) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const metricCards = [
    { label: "Waitlist Signups", value: stats.waitlistCount, icon: Mail, color: "text-secondary" },
    { label: "Registered Users", value: stats.userCount, icon: Users, color: "text-primary" },
    { label: "Total Bookings", value: Object.values(stats.bookings).reduce((a, b) => a + b, 0), icon: Plane, color: "text-foreground" },
    { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-secondary" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <Card key={m.label}>
            <CardContent className="py-5 px-4">
              <div className="flex items-center gap-3 mb-2">
                <m.icon className={`w-5 h-5 ${m.color}`} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Provider Applications breakdown */}
      <Card>
        <CardContent className="py-5 px-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Provider Applications</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-secondary">{stats.applications.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.applications.approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{stats.applications.rejected}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings by status */}
      <Card>
        <CardContent className="py-5 px-4">
          <div className="flex items-center gap-2 mb-4">
            <Plane className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Bookings by Status</h3>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
            {["inquiry", "quoted", "deposit_paid", "confirmed", "completed", "cancelled"].map((s) => (
              <div key={s}>
                <p className="text-xl font-bold">{stats.bookings[s] || 0}</p>
                <p className="text-xs text-muted-foreground capitalize">{s.replace("_", " ")}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewSection;
