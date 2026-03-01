import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar, MapPin, FileText, MessageSquare, Clock, CheckCircle,
  PlusCircle, Trash2, ArrowRight, Users, Stethoscope,
  ChevronRight, Building2, Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TripBriefBuilder from "@/components/trips/TripBriefBuilder";
import CandyEmptyState from "@/components/ui/candy-empty-state";

/* ─── Normalize procedures helper ─── */
const normalizeProcedures = (procs: any[] | null): { name: string; quantity: number }[] => {
  if (!procs || procs.length === 0) return [];
  if (typeof procs[0] === "string") {
    return procs.map((p: string) => ({ name: p, quantity: 1 }));
  }
  return procs.map((p: any) => ({ name: p.name, quantity: p.quantity || 1 }));
};

/* ─── Types ─── */
interface TripBrief {
  id: string;
  trip_name: string;
  destination: string | null;
  travel_window_start: string | null;
  travel_window_end: string | null;
  is_flexible: boolean;
  procedures: any[] | null;
  is_group: boolean;
  group_members: { name: string; procedures: string[] }[] | null;
  budget_range: string | null;
  status: string;
  created_at: string;
  procedure_categories?: string[] | null;
  procedures_unsure?: boolean;
  considered_providers?: string[] | null;
}

interface QuoteRequest {
  id: string;
  trip_brief_id: string | null;
  provider_slug: string;
  procedures: { name: string }[] | null;
  status: string;
  quoted_price: number | null;
  travel_window_start: string | null;
  travel_window_end: string | null;
  is_flexible: boolean;
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

/* ─── Status config ─── */
const BOOKING_STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-secondary/10 text-secondary border-secondary/20",
  provider_responded: "bg-accent/10 text-accent border-accent/20",
  quoted: "bg-primary/10 text-primary border-primary/20",
  deposit_paid: "bg-primary/10 text-primary border-primary/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};
const BOOKING_STATUS_LABELS: Record<string, string> = {
  inquiry: "active",
  provider_responded: "active",
  quoted: "active",
  deposit_paid: "upcoming",
  confirmed: "upcoming",
  completed: "completed",
  cancelled: "cancelled",
};
const BRIEF_STATUS_LABELS: Record<string, string> = {
  planning: "trip brief",
  quotes_requested: "active",
};
const QUOTE_STATUS_LABELS: Record<string, string> = {
  pending: "awaiting quote",
  responded: "response received",
  accepted: "accepted",
  declined: "declined",
  expired: "expired",
};

/* ─── Helpers ─── */
const formatDate = (d: string | null) => {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDateShort = (d: string | null) => {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(y, m - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const providerLabel = (slug: string) => {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const buildCardTitle = (brief: TripBrief) => {
  if (!brief.is_flexible && brief.travel_window_start) {
    const dest = brief.destination?.toLowerCase() || "";
    const start = formatDateShort(brief.travel_window_start);
    const [y] = (brief.travel_window_start || "").split("-").map(Number);
    if (brief.travel_window_end) {
      const endDay = formatDateShort(brief.travel_window_end);
      return `${dest} ${start}–${endDay}, ${y}`.trim();
    }
    return `${dest} ${start}, ${y}`.trim();
  }
  return brief.trip_name?.toLowerCase() || brief.trip_name;
};

/* ─── Estimated Cost Range ─── */
const EstimatedCostRange = ({ procedures }: { procedures: any[] | null }) => {
  const [result, setResult] = useState<{ totalLow: number; totalHigh: number; matched: number; unmatched: number } | null>(null);
  const normalized = normalizeProcedures(procedures);

  useEffect(() => {
    if (normalized.length === 0) {
      setResult({ totalLow: 0, totalHigh: 0, matched: 0, unmatched: 0 });
      return;
    }
    const lowerNames = normalized.map((p) => p.name.toLowerCase());
    supabase
      .from("procedure_pricing_reference" as any)
      .select("procedure_name, est_low, est_high")
      .in("procedure_name", lowerNames)
      .then(({ data }) => {
        const matched = new Set<string>();
        let totalLow = 0;
        let totalHigh = 0;
        if (data) {
          for (const row of data as any[]) {
            matched.add(row.procedure_name);
            const proc = normalized.find((p) => p.name.toLowerCase() === row.procedure_name);
            const qty = proc?.quantity || 1;
            totalLow += Number(row.est_low) * qty;
            totalHigh += Number(row.est_high) * qty;
          }
        }
        setResult({
          totalLow,
          totalHigh,
          matched: matched.size,
          unmatched: lowerNames.length - matched.size,
        });
      });
  }, [procedures]);

  if (!result || normalized.length === 0) return null;

  let text: string;
  if (result.matched === 0) {
    text = "est. varies · prices vary";
  } else if (result.unmatched > 0) {
    text = `est. $${result.totalLow.toLocaleString()}+ · prices vary`;
  } else {
    text = `est. $${result.totalLow.toLocaleString()}–$${result.totalHigh.toLocaleString()} · prices vary`;
  }

  return <span>{text}</span>;
};

/* ─── Provider Status Line ─── */
const ProviderStatusLine = ({ briefId, consideredProviders }: { briefId: string; consideredProviders?: string[] | null }) => {
  const [sentCount, setSentCount] = useState(0);
  const providerCount = consideredProviders?.length || 0;

  useEffect(() => {
    if (providerCount === 0) return;
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("trip_brief_id", briefId)
      .eq("status", "inquiry")
      .then(({ count }) => {
        if (count) setSentCount(count);
      });
  }, [briefId, providerCount]);

  const hasProviders = providerCount > 0 || sentCount > 0;
  const statusText = hasProviders
    ? `${providerCount} provider${providerCount !== 1 ? "s" : ""} · ${sentCount} brief${sentCount !== 1 ? "s" : ""} sent`
    : "no providers yet";

  return (
    <span className="flex items-center gap-1.5" style={{ color: hasProviders ? "#3BF07A" : "#555", fontSize: "11px" }}>
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: hasProviders ? "#3BF07A" : "#ccc",
          boxShadow: hasProviders ? "0 0 6px rgba(59,240,122,0.5)" : "none",
          animation: hasProviders ? "tripStatusPulse 2s ease-in-out infinite" : "none",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {statusText}
    </span>
  );
};

const DeleteConfirmDialog = ({
  open, onOpenChange, onConfirm,
}: { open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-lg">delete this trip brief?</DialogTitle>
      </DialogHeader>
      <DialogFooter className="flex gap-2 sm:gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>cancel</Button>
        <Button variant="destructive" onClick={onConfirm}>delete</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

/* ─── Trip Brief Card (Mega Glow) ─── */
const TripBriefCard = ({
  brief,
  onDelete,
  onEdit,
  quoteRequests,
  navigate,
}: {
  brief: TripBrief;
  onDelete: (id: string) => void;
  onEdit: (brief: TripBrief) => void;
  quoteRequests: QuoteRequest[];
  navigate: (to: string) => void;
}) => {
  const briefQuotes = quoteRequests.filter((q) => q.trip_brief_id === brief.id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <div
        className="trip-card-mega"
        onClick={() => onEdit(brief)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: "200px",
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: "22px 24px",
          cursor: "pointer",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: hovered
            ? "0 4px 20px rgba(59,240,122,0.1)"
            : "0 2px 12px rgba(0,0,0,0.04)",
          transform: hovered ? "translateY(-2px)" : "none",
          transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        {/* Gradient border pseudo via wrapper */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: "16px",
            padding: "1px",
            background: hovered
              ? "linear-gradient(135deg, rgba(255,107,74,0.2), rgba(59,240,122,0.2))"
              : "linear-gradient(135deg, rgba(255,107,74,0.08), rgba(59,240,122,0.08))",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
            transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        />

        {/* Radial glow bloom */}
        <div
          style={{
            position: "absolute",
            top: "-50%", left: "-50%",
            width: "200%", height: "200%",
            background: "radial-gradient(circle at center, rgba(59,240,122,0.08) 0%, transparent 50%)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: hovered ? "4px" : "3px",
            background: "linear-gradient(90deg, #FF6B4A, #3BF07A)",
            opacity: hovered ? 0.9 : 0.4,
            boxShadow: hovered ? "0 0 20px rgba(59,240,122,0.3), 0 0 40px rgba(255,107,74,0.2)" : "none",
            transition: "all 0.3s ease",
            pointerEvents: "none",
          }}
        />

        {/* Content wrapper (above pseudo-elements) */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, textTransform: "lowercase", color: "#111111", margin: 0 }}>
                {buildCardTitle(brief)}
              </h3>
              <div style={{ fontSize: "11px", color: "#888888", marginTop: "6px", lineHeight: 1.6 }}>
                {brief.destination && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    📍 {brief.destination?.toLowerCase()}, mexico
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {brief.is_flexible ? (
                    <span>📅 flexible dates</span>
                  ) : brief.travel_window_start ? (
                    <span>
                      📅 {formatDateShort(brief.travel_window_start)} → {brief.travel_window_end ? formatDateShort(brief.travel_window_end) : ""}{brief.travel_window_start ? `, ${brief.travel_window_start.split("-")[0]}` : ""}
                    </span>
                  ) : null}
                  <span style={{ margin: "0 2px" }}>·</span>
                  <span>👤 {brief.is_group && brief.group_members?.length ? `group of ${brief.group_members.length}` : "just me"}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flexShrink: 0 }}>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "9999px",
                  fontSize: "10px",
                  color: "#3BF07A",
                  background: "linear-gradient(135deg, rgba(59,240,122,0.15), rgba(59,240,122,0.06))",
                  border: "1px solid rgba(59,240,122,0.15)",
                  boxShadow: "0 0 8px rgba(59,240,122,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {BRIEF_STATUS_LABELS[brief.status] || brief.status}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(brief); }}
                style={{
                  width: "28px", height: "28px",
                  borderRadius: "8px",
                   border: "1px solid rgba(0,0,0,0.08)",
                  background: "transparent",
                   color: "#888",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#111";
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)";
                  e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#888";
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
                style={{
                  width: "28px", height: "28px",
                  borderRadius: "8px",
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "transparent",
                  color: "#888",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#111";
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)";
                  e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#888";
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Procedure pills */}
          {brief.procedures && brief.procedures.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "14px" }}>
              {normalizeProcedures(brief.procedures).map((p, i) => (
                <span
                  key={i}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    fontSize: "10px",
                    color: "#3BF07A",
                    border: "1px solid rgba(59,240,122,0.2)",
                    background: "rgba(59,240,122,0.05)",
                    display: "flex", alignItems: "center", gap: "3px",
                  }}
                >
                  <Stethoscope className="w-2.5 h-2.5" />
                  {p.name}{p.quantity > 1 ? ` ×${p.quantity}` : ""}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#888888" }}>
              <EstimatedCostRange procedures={brief.procedures} />
            </span>
            <ProviderStatusLine briefId={brief.id} consideredProviders={brief.considered_providers} />
          </div>

          {/* Quote requests */}
          {briefQuotes.length > 0 && (
            <div className="space-y-2 mt-3">
              <p style={{ fontSize: "10px", color: "#888888", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>quote requests</p>
              {briefQuotes.map((q) => (
                <div key={q.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Building2 className="w-3.5 h-3.5" style={{ color: "#888888" }} />
                    <span style={{ fontSize: "13px" }}>{providerLabel(q.provider_slug)}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${q.status === "responded" ? "border-primary/40 text-primary" : "border-muted-foreground/20 text-muted-foreground"}`}
                  >
                    {QUOTE_STATUS_LABELS[q.status] || q.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => { setDeleteOpen(false); onDelete(brief.id); }}
      />
    </>
  );
};

/* ─── Booking Card ─── */
const BookingCard = ({ booking }: { booking: Booking }) => {
  const procedures = Array.isArray(booking.procedures)
    ? booking.procedures.map((p: any) => `${p.name}${p.quantity > 1 ? ` ×${p.quantity}` : ""}`).join(", ")
    : "";

  return (
    <Link to={`/booking/${booking.id}`}>
      <div className="glossy-card rounded-xl p-5 hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0 pr-3">
            <h3 className="font-bold" style={{ color: '#111111' }}>{providerLabel(booking.provider_slug)}</h3>
            {procedures && <p className="text-sm line-clamp-1" style={{ color: '#888888' }}>{procedures}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={`text-[10px] border ${BOOKING_STATUS_COLORS[booking.status] || "bg-muted border-muted"}`}>
              {BOOKING_STATUS_LABELS[booking.status] || booking.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-sm" style={{ color: '#888888' }}>
            {booking.preferred_dates?.text && (
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{booking.preferred_dates.text}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {booking.quoted_price && (
              <span className="font-bold text-primary text-sm">${Number(booking.quoted_price).toLocaleString()}</span>
            )}
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ─── Empty state (legacy wrapper) ─── */
const EmptyState = ({
  icon: _Icon,
  title,
  desc,
  action,
  candy = "pill",
}: { icon: any; title: string; desc: string; action?: React.ReactNode; candy?: "pill" | "tooth" | "star" }) => (
  <div className="text-center py-16">
    <CandyEmptyState candy={candy} message={title} />
    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto -mt-12">{desc}</p>
    {action}
  </div>
);

/* ─── Main page ─── */
const MyTripsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingBrief, setEditingBrief] = useState<TripBrief | null>(null);
  const [tripBriefs, setTripBriefs] = useState<TripBrief[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    const [briefsRes, quotesRes, bookingsRes] = await Promise.all([
      supabase.from("trip_briefs" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("quote_requests" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookings" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setTripBriefs((briefsRes.data as unknown as TripBrief[]) || []);
    setQuoteRequests((quotesRes.data as unknown as QuoteRequest[]) || []);
    setBookings((bookingsRes.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (searchParams.get("plan") === "new") {
      setBuilderOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const deleteBrief = async (id: string) => {
    await supabase.from("trip_briefs").delete().eq("id", id);
    setTripBriefs((prev) => prev.filter((b) => b.id !== id));
  };

  const handleEdit = (brief: TripBrief) => {
    setEditingBrief(brief);
    setBuilderOpen(true);
  };

  const handleBuilderClose = (open: boolean) => {
    setBuilderOpen(open);
    if (!open) setEditingBrief(null);
  };

  /* ─── Partitions ─── */
  const planningBriefs = tripBriefs.filter((b) => b.status === "planning");
  const quotedBriefs = tripBriefs.filter((b) => b.status === "quotes_requested");
  const activeBookings = bookings.filter((b) => ["inquiry", "provider_responded", "quoted"].includes(b.status));
  const confirmedBookings = bookings.filter((b) => ["deposit_paid", "confirmed"].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

  const activeCount = activeBookings.length + quotedBriefs.length;
  const planningCount = planningBriefs.length;

  /* ─── Stats for hero band ─── */
  const totalBriefs = tripBriefs.length;
  const totalProviders = useMemo(() => {
    const slugs = new Set<string>();
    tripBriefs.forEach((b) => {
      if (Array.isArray(b.considered_providers)) {
        b.considered_providers.forEach((s) => slugs.add(s));
      }
    });
    return slugs.size;
  }, [tripBriefs]);

  return (
    <div className="min-h-screen theme-public" style={{ background: "#FFFFFF", textTransform: "lowercase" }}>
      <Navbar light />

      {/* Ambient page glows - hidden in light theme */}

      <main style={{ position: "relative", zIndex: 1 }}>
        {/* ─── Hero Band ─── */}
        <div style={{ position: "relative", padding: "40px 48px 36px 48px", marginTop: "64px" }}>
          {/* Top gradient line */}
          <div style={{ position: "absolute", top: 0, left: "5%", right: "5%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(59,240,122,0.2) 20%, rgba(255,107,74,0.2) 80%, transparent)" }} />
          {/* Bottom gradient line */}
          <div style={{ position: "absolute", bottom: 0, left: "5%", right: "5%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(59,240,122,0.15) 20%, rgba(255,107,74,0.15) 80%, transparent)" }} />

          <div className="hero-band-content" style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
            <div>
              <h1 style={{
                fontSize: "30px", fontWeight: 800, textTransform: "lowercase",
                color: "#111111",
                margin: 0,
              }}>
                my trips — travel hub
              </h1>
              <p style={{ fontSize: "14px", color: "#555555", marginTop: "8px", maxWidth: "460px", lineHeight: 1.5 }}>
                whether you're type a or type b, plan as much (or as little) as you want before your next trip.
              </p>
            </div>
            <div className="hero-band-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
              <Button
                onClick={() => { setEditingBrief(null); setBuilderOpen(true); }}
                className="flex items-center gap-2 font-semibold border-none"
                style={{
                  padding: "12px 28px",
                  background: "linear-gradient(180deg, #4CF88A, #2DD866)",
                  color: "#0A0A0A",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: 600,
                  boxShadow: "0 4px 24px rgba(59,240,122,0.35), 0 0 60px rgba(59,240,122,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 6px 28px rgba(59,240,122,0.45), 0 0 80px rgba(59,240,122,0.15), inset 0 1px 0 rgba(255,255,255,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 24px rgba(59,240,122,0.35), 0 0 60px rgba(59,240,122,0.1), inset 0 1px 0 rgba(255,255,255,0.2)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.98)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,240,122,0.2)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 6px 28px rgba(59,240,122,0.45), 0 0 80px rgba(59,240,122,0.15), inset 0 1px 0 rgba(255,255,255,0.25)";
                }}
              >
                <PlusCircle className="w-4 h-4" />
                plan a trip
              </Button>
              <span style={{ fontSize: "12px", color: "#888888" }}>
                <span style={{ color: "#3BF07A" }}>{totalBriefs}</span> briefs · <span style={{ color: "#3BF07A" }}>{totalProviders}</span> providers contacted
              </span>
            </div>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 64px" }}>
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">loading your trips…</div>
          ) : (
            <Tabs defaultValue="planning" className="space-y-7">
              <TabsList
                className="flex flex-wrap h-auto"
                style={{
                  gap: "6px",
                  background: "rgba(0,0,0,0.03)",
                  borderRadius: "9999px",
                  padding: "4px",
                  border: "1px solid rgba(0,0,0,0.06)",
                  width: "fit-content",
                  marginBottom: "28px",
                }}
              >
                {[
                  { value: "planning", label: "trip briefs", count: planningCount },
                  { value: "active", label: "active", count: activeCount },
                  { value: "confirmed", label: "upcoming", count: confirmedBookings.length },
                  { value: "completed", label: "completed", count: completedBookings.length },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:shadow-none"
                    style={{
                      padding: "8px 20px",
                      borderRadius: "9999px",
                      fontSize: "13px",
                      border: "1px solid transparent",
                      transition: "all 0.2s ease",
                    }}
                    data-mint-tab
                  >
                    {tab.label}{tab.count > 0 && <span className="ml-1">({tab.count})</span>}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ─── Planning (2-col grid) ─── */}
              <TabsContent value="planning">
                {planningBriefs.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                    }}
                    className="trips-card-grid"
                  >
                    {planningBriefs.map((brief) => (
                      <TripBriefCard
                        key={brief.id}
                        brief={brief}
                        onDelete={deleteBrief}
                        onEdit={handleEdit}
                        quoteRequests={quoteRequests}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="no trip plans yet"
                    desc="start planning your medical trip and save it as a brief. you can attach it to quote requests later."
                    action={
                      <Button
                        onClick={() => { setEditingBrief(null); setBuilderOpen(true); }}
                        className="font-semibold border-none"
                        style={{
                          background: "linear-gradient(180deg, #4CF88A, #2DD866)",
                          color: "#0A0A0A",
                          borderRadius: "9999px",
                          boxShadow: "0 4px 16px rgba(59,240,122,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
                        }}
                      >
                        <PlusCircle className="w-4 h-4 mr-2" /> plan a trip
                      </Button>
                    }
                  />
                )}
              </TabsContent>

              {/* ─── Active ─── */}
              <TabsContent value="active" className="space-y-4">
                {activeCount > 0 ? (
                  <>
                    {quotedBriefs.length > 0 && (
                      <div className="space-y-3">
                        <p style={{ fontSize: "10px", color: "#888888", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>quotes requested</p>
                        <div className="trips-card-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                          {quotedBriefs.map((brief) => (
                            <TripBriefCard
                              key={brief.id}
                              brief={brief}
                              onDelete={deleteBrief}
                              onEdit={handleEdit}
                              quoteRequests={quoteRequests}
                              navigate={navigate}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {activeBookings.length > 0 && (
                      <div className="space-y-3">
                        <p style={{ fontSize: "10px", color: "#888888", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>inquiries</p>
                        {activeBookings.map((b) => <BookingCard key={b.id} booking={b} />)}
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    icon={MessageSquare}
                    title="no active inquiries"
                    desc="request a quote from a provider to get started."
                    action={<Button onClick={() => navigate("/search")}>browse providers</Button>}
                  />
                )}
              </TabsContent>

              {/* ─── Upcoming ─── */}
              <TabsContent value="confirmed" className="space-y-4">
                {confirmedBookings.length > 0 ? (
                  confirmedBookings.map((b) => <BookingCard key={b.id} booking={b} />)
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="no upcoming trips"
                    desc="once you pay a deposit and confirm with a provider, your trip will show up here."
                  />
                )}
              </TabsContent>

              {/* ─── Completed ─── */}
              <TabsContent value="completed" className="space-y-4">
                {completedBookings.length > 0 ? (
                  completedBookings.map((b) => <BookingCard key={b.id} booking={b} />)
                ) : (
                  <EmptyState
                    icon={CheckCircle}
                    title="no completed trips yet"
                    desc="your completed trips will appear here."
                  />
                )}
                {cancelledBookings.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">cancelled</p>
                    {cancelledBookings.map((b) => <BookingCard key={b.id} booking={b} />)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
      <TripBriefBuilder
        open={builderOpen}
        onOpenChange={handleBuilderClose}
        onSaved={fetchData}
        editBrief={editingBrief}
      />
    </div>
  );
};

export default MyTripsPage;
