import { useState, useEffect } from "react";
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

/* ─── Types ─── */
interface TripBrief {
  id: string;
  trip_name: string;
  destination: string | null;
  travel_window_start: string | null;
  travel_window_end: string | null;
  is_flexible: boolean;
  procedures: { name: string; quantity: number }[] | null;
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
  completed: "bg-white/10 text-white/60 border-white/10",
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
  return brief.trip_name;
};

/* ─── Estimated Cost Range ─── */
const EstimatedCostRange = ({ procedures }: { procedures: { name: string; quantity: number }[] | null }) => {
  const [range, setRange] = useState<{ min: number; max: number } | null>(null);

  useEffect(() => {
    if (!procedures || procedures.length === 0) return;
    const names = procedures.map((p) => p.name);
    supabase
      .from("provider_services")
      .select("procedure_name, base_price_usd")
      .in("procedure_name", names)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const prices = data.map((d: any) => Number(d.base_price_usd));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min > 0) setRange({ min, max: max > min ? max : min * 1.5 });
      });
  }, [procedures]);

  if (!range) return null;
  return (
    <p className="text-xs flex items-center gap-1" style={{ color: "#B0B0B0" }}>
      estimated range: ${range.min.toLocaleString()}–${range.max.toLocaleString()} · prices vary by provider
    </p>
  );
};

/* ─── Provider Count Line ─── */
const ProviderCountLine = ({ briefId, consideredProviders }: { briefId: string; consideredProviders?: string[] | null }) => {
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

  if (providerCount === 0 && sentCount === 0) return null;

  return (
    <p className="text-xs flex items-center gap-1" style={{ color: "#B0B0B0" }}>
      {providerCount} provider(s) added{sentCount > 0 ? ` · ${sentCount} brief(s) sent` : ""}
    </p>
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

/* ─── Trip Brief Card ─── */
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

  return (
    <>
      <div className="glossy-card rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-lg">{buildCardTitle(brief)}</h3>
            <div className="flex items-center gap-3 text-sm text-white/50 flex-wrap">
              {brief.destination && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{brief.destination}, Mexico</span>
              )}
              {brief.is_flexible ? (
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Flexible dates</span>
              ) : brief.travel_window_start ? (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(brief.travel_window_start)}{brief.travel_window_end ? ` → ${formatDate(brief.travel_window_end)}` : ""}
                </span>
              ) : null}
              {brief.is_group && brief.group_members?.length ? (
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Group of {brief.group_members.length}</span>
              ) : (
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Just me</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {BRIEF_STATUS_LABELS[brief.status] || brief.status}
            </Badge>
            <button
              onClick={() => onEdit(brief)}
              className="text-white/30 hover:text-white transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="text-white/30 hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Procedures */}
        {brief.procedures && brief.procedures.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {brief.procedures.map((p, i) => (
              <Badge key={i} variant="outline" className="text-xs border-white/20">
                <Stethoscope className="w-2.5 h-2.5 mr-1" />
                {p.name} {p.quantity > 1 ? `×${p.quantity}` : ""}
              </Badge>
            ))}
          </div>
        )}


        {/* Estimated cost range */}
        <EstimatedCostRange procedures={brief.procedures} />

        {/* Provider counts */}
        <ProviderCountLine briefId={brief.id} consideredProviders={brief.considered_providers} />

        {/* Quote requests on this brief */}
        {briefQuotes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wide font-medium">Quote Requests</p>
            {briefQuotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between py-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-sm">{providerLabel(q.provider_slug)}</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${q.status === "responded" ? "border-primary/40 text-primary" : "border-white/20 text-white/50"}`}
                >
                  {QUOTE_STATUS_LABELS[q.status] || q.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

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
      <div className="glossy-card rounded-xl p-5 hover:bg-white/5 transition-colors cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0 pr-3">
            <h3 className="font-bold">{providerLabel(booking.provider_slug)}</h3>
            {procedures && <p className="text-sm text-white/50 line-clamp-1">{procedures}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={`text-[10px] border ${BOOKING_STATUS_COLORS[booking.status] || "bg-muted border-white/10"}`}>
              {BOOKING_STATUS_LABELS[booking.status] || booking.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-sm text-white/40">
            {booking.preferred_dates?.text && (
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{booking.preferred_dates.text}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {booking.quoted_price && (
              <span className="font-bold text-primary text-sm">${Number(booking.quoted_price).toLocaleString()}</span>
            )}
            <ArrowRight className="w-4 h-4 text-white/30" />
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ─── Empty state ─── */
const EmptyState = ({
  icon: Icon,
  title,
  desc,
  action,
}: { icon: any; title: string; desc: string; action?: React.ReactNode }) => (
  <div className="text-center py-16">
    <Icon className="w-12 h-12 text-white/20 mx-auto mb-4" />
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">{desc}</p>
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

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      <Navbar />
      <main>
        <div className="max-w-[960px] mx-auto px-4 pt-24 pb-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">my trips — travel hub</h1>
              <p className="text-white/40 text-sm">whether you're type a or type b, plan as much (or as little) as you want before your next trip.</p>
            </div>
            <Button
              onClick={() => { setEditingBrief(null); setBuilderOpen(true); }}
              className="flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              plan a trip
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-white/40">Loading your trips…</div>
          ) : (
            <Tabs defaultValue="planning" className="space-y-6">
              <TabsList className="flex flex-wrap h-auto gap-1 bg-card p-1 rounded-xl border border-white/8">
                <TabsTrigger value="planning" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-lg text-sm">
                  trip briefs {planningCount > 0 && <span className="ml-1 text-white/40">({planningCount})</span>}
                </TabsTrigger>
                <TabsTrigger value="active" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-lg text-sm">
                  active {activeCount > 0 && <span className="ml-1 text-white/40">({activeCount})</span>}
                </TabsTrigger>
                <TabsTrigger value="confirmed" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-lg text-sm">
                  upcoming {confirmedBookings.length > 0 && <span className="ml-1 text-white/40">({confirmedBookings.length})</span>}
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-lg text-sm">
                  completed {completedBookings.length > 0 && <span className="ml-1 text-white/40">({completedBookings.length})</span>}
                </TabsTrigger>
              </TabsList>

              {/* ─── Planning ─── */}
              <TabsContent value="planning" className="space-y-4">
                {planningBriefs.length > 0 ? (
                  planningBriefs.map((brief) => (
                    <TripBriefCard
                      key={brief.id}
                      brief={brief}
                      onDelete={deleteBrief}
                      onEdit={handleEdit}
                      quoteRequests={quoteRequests}
                      navigate={navigate}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="no trip plans yet"
                    desc="start planning your medical trip and save it as a brief. you can attach it to quote requests later."
                    action={
                      <Button onClick={() => { setEditingBrief(null); setBuilderOpen(true); }}>
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
                        <p className="text-xs text-white/40 uppercase tracking-wide font-medium">quotes requested</p>
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
                    )}
                    {activeBookings.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs text-white/40 uppercase tracking-wide font-medium">inquiries</p>
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

              {/* ─── Upcoming (was Confirmed) ─── */}
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
                    <p className="text-xs text-white/30 uppercase tracking-wide font-medium">cancelled</p>
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
