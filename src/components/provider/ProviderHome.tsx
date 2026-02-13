import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, DollarSign, Plane, TrendingUp, Clock, Star, ExternalLink, CheckCircle, AlertCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Booking {
  id: string;
  patient_name?: string;
  procedures: any;
  status: string;
  quoted_price: number | null;
  deposit_amount: number | null;
  created_at: string;
  preferred_dates?: any;
  inquiry_message?: string | null;
}

interface Props {
  providerName: string;
  providerSlug: string;
  bookings: Booking[];
  onNavigate: (section: string) => void;
}

const ProviderHome = ({ providerName, providerSlug, bookings, onNavigate }: Props) => {
  const navigate = useNavigate();

  const inquiries = bookings.filter((b) => b.status === "inquiry");
  const quoted = bookings.filter((b) => b.status === "quoted");
  const active = bookings.filter((b) => ["deposit_paid", "confirmed"].includes(b.status));
  const completed = bookings.filter((b) => b.status === "completed");
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const totalRevenue = completed.reduce((sum, b) => sum + (Number(b.quoted_price) || 0), 0);
  const totalQuoted = [...quoted, ...active, ...completed].reduce((sum, b) => sum + (Number(b.quoted_price) || 0), 0);
  const conversionRate = bookings.length > 0 
    ? Math.round(((active.length + completed.length) / bookings.length) * 100) 
    : 0;

  const getProcedureText = (procedures: any) => {
    if (!procedures || !Array.isArray(procedures)) return "—";
    return procedures.map((p: any) => `${p.name}${p.quantity > 1 ? ` ×${p.quantity}` : ""}`).join(", ");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const statusColor: Record<string, string> = {
    inquiry: "bg-secondary/10 text-secondary",
    quoted: "bg-primary/10 text-primary",
    deposit_paid: "bg-primary/20 text-primary",
    confirmed: "bg-primary/30 text-primary",
  };

  const statusLabel: Record<string, string> = {
    inquiry: "New Inquiry",
    quoted: "Quote Sent",
    deposit_paid: "Deposit Paid",
    confirmed: "Confirmed",
  };

  const recentActive = bookings
    .filter((b) => !["completed", "cancelled"].includes(b.status))
    .slice(0, 5);

  const metrics = [
    { label: "New Inquiries", value: inquiries.length, icon: MessageSquare, color: "text-secondary", action: () => onNavigate("inquiries") },
    { label: "Quotes Pending", value: quoted.length, icon: DollarSign, color: "text-primary", action: () => onNavigate("quoted") },
    { label: "Active Trips", value: active.length, icon: Plane, color: "text-foreground", action: () => onNavigate("active") },
    { label: "Total Completed", value: completed.length, icon: CheckCircle, color: "text-primary", action: () => onNavigate("past") },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-secondary" },
    { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-primary", action: () => onNavigate("past") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">welcome back</h2>
          <p className="text-muted-foreground text-sm">{providerName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/provider/${providerSlug}`)} className="gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> View Profile
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/provider/onboarding")} className="gap-1.5">
            Edit Listing
          </Button>
        </div>
      </div>

      {/* Alert for pending inquiries */}
      {inquiries.length > 0 && (
        <div 
          className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/10 transition-colors"
          onClick={() => onNavigate("inquiries")}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-secondary" />
            <div>
              <p className="font-medium text-sm">
                {inquiries.length} new {inquiries.length === 1 ? "inquiry" : "inquiries"} waiting
              </p>
              <p className="text-xs text-muted-foreground">Respond quickly to improve your conversion rate</p>
            </div>
          </div>
          <Button size="sm" className="gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Review
          </Button>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card 
            key={m.label} 
            className={`hover:shadow-md transition-shadow ${m.action ? "cursor-pointer" : ""}`}
            onClick={m.action}
          >
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

      {/* Two-column: Pipeline + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Booking Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              booking pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: "Inquiries", count: inquiries.length, total: bookings.length, color: "bg-secondary", section: "inquiries" },
                { label: "Quoted", count: quoted.length, total: bookings.length, color: "bg-primary/60", section: "quoted" },
                { label: "Active", count: active.length, total: bookings.length, color: "bg-primary", section: "active" },
                { label: "Completed", count: completed.length, total: bookings.length, color: "bg-primary/80", section: "past" },
                { label: "Cancelled", count: cancelled.length, total: bookings.length, color: "bg-destructive/60", section: "past" },
              ].map((stage) => (
                <div 
                  key={stage.label} 
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-1 -mx-1 transition-colors"
                  onClick={() => onNavigate(stage.section)}
                >
                  <span className="text-xs text-muted-foreground w-20">{stage.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className={`${stage.color} rounded-full h-2 transition-all`}
                      style={{ width: stage.total > 0 ? `${(stage.count / stage.total) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-medium w-6 text-right">{stage.count}</span>
                </div>
              ))}
            </div>

            {totalQuoted > 0 && (
              <div className="bg-muted/30 rounded-lg p-3 mt-3">
                <p className="text-xs text-muted-foreground">Total quoted value</p>
                <p className="text-xl font-bold text-primary">${totalQuoted.toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActive.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No active bookings yet</p>
              ) : (
                recentActive.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Badge className={`text-[10px] shrink-0 ${statusColor[b.status] || "bg-muted"}`}>
                      {statusLabel[b.status] || b.status}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.patient_name || "Patient"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{getProcedureText(b.procedures)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {b.quoted_price && (
                        <p className="text-xs font-medium text-primary">${Number(b.quoted_price).toLocaleString()}</p>
                      )}
                      <span className="text-[11px] text-muted-foreground">{formatDate(b.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderHome;
