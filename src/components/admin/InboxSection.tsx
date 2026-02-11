import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Inbox, Calendar, MapPin, MessageSquare, User, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InboxBooking {
  id: string;
  user_id: string;
  provider_slug: string;
  procedures: any;
  status: string;
  quoted_price: number | null;
  inquiry_message: string | null;
  medical_notes: string | null;
  preferred_dates: any;
  provider_message: string | null;
  provider_estimated_dates: string | null;
  deposit_amount: number | null;
  created_at: string;
  updated_at: string;
  patient_name: string;
  patient_email: string;
  provider_name: string;
  messages: { id: string; message: string; sender_id: string; created_at: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-secondary/10 text-secondary",
  provider_responded: "bg-accent/10 text-accent-foreground",
  quoted: "bg-primary/10 text-primary",
  deposit_paid: "bg-primary/20 text-primary",
  confirmed: "bg-primary/30 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  inquiry: "New Inquiry",
  provider_responded: "Responded",
  quoted: "Quoted",
  deposit_paid: "Deposit Paid",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const InboxSection = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<InboxBooking[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InboxBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [quotePrice, setQuotePrice] = useState("");
  const [estimatedDates, setEstimatedDates] = useState("");

  const load = async () => {
    // Get admin-managed providers
    const { data: adminProviders } = await supabase
      .from("providers")
      .select("slug, name")
      .eq("admin_managed", true);

    if (!adminProviders || adminProviders.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const slugs = adminProviders.map((p) => p.slug);
    const providerMap = new Map(adminProviders.map((p) => [p.slug, p.name]));

    // Get bookings for these providers
    const { data: rawBookings } = await supabase
      .from("bookings")
      .select("*")
      .in("provider_slug", slugs)
      .order("created_at", { ascending: false });

    const raw = (rawBookings as any[]) || [];
    if (raw.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    // Get patient profiles
    const userIds = [...new Set(raw.map((b) => b.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds);
    const pMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Get user emails via admin function
    const { data: userList } = await supabase.rpc("get_admin_user_list");
    const emailMap = new Map((userList || []).map((u: any) => [u.user_id, u.email]));

    // Get messages for all bookings
    const bookingIds = raw.map((b) => b.id);
    const { data: messages } = await supabase
      .from("booking_messages")
      .select("*")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: true });
    const msgMap = new Map<string, any[]>();
    (messages || []).forEach((m: any) => {
      if (!msgMap.has(m.booking_id)) msgMap.set(m.booking_id, []);
      msgMap.get(m.booking_id)!.push(m);
    });

    setBookings(
      raw.map((b) => {
        const p = pMap.get(b.user_id);
        return {
          ...b,
          patient_name: p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : "Unknown",
          patient_email: emailMap.get(b.user_id) || "—",
          provider_name: providerMap.get(b.provider_slug) || b.provider_slug,
          messages: msgMap.get(b.id) || [],
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getProcedures = (p: any) => {
    if (!p || !Array.isArray(p)) return "—";
    return p.map((x: any) => `${x.name}${x.quantity > 1 ? ` ×${x.quantity}` : ""}`).join(", ");
  };

  const filtered = bookings.filter((b) =>
    [b.patient_name, b.patient_email, b.provider_name, getProcedures(b.procedures), b.status]
      .some((f) => (f || "").toLowerCase().includes(search.toLowerCase()))
  );

  const inquiryCount = bookings.filter((b) => b.status === "inquiry").length;

  const handleSendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);

    // Send message as admin (using current auth user)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }

    const { error: msgError } = await supabase.from("booking_messages").insert({
      booking_id: selected.id,
      sender_id: user.id,
      message: replyText.trim(),
    });

    // Update booking status and optional fields
    const updates: any = {};
    if (selected.status === "inquiry") updates.status = "provider_responded";
    if (quotePrice) {
      updates.quoted_price = parseFloat(quotePrice);
      updates.status = "quoted";
    }
    if (estimatedDates) updates.provider_estimated_dates = estimatedDates;
    if (replyText.trim()) updates.provider_message = replyText.trim();

    if (Object.keys(updates).length > 0) {
      await supabase.from("bookings").update(updates).eq("id", selected.id);
    }

    if (msgError) {
      toast({ title: "Error", description: msgError.message, variant: "destructive" });
    } else {
      toast({ title: "Reply sent" });
      setReplyText("");
      setQuotePrice("");
      setEstimatedDates("");
      setSelected(null);
      load();
    }
    setSending(false);
  };

  const openBooking = (b: InboxBooking) => {
    setSelected(b);
    setQuotePrice(b.quoted_price?.toString() || "");
    setEstimatedDates(b.provider_estimated_dates || "");
    setReplyText("");
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Inbox</h2>
          {inquiryCount > 0 && (
            <Badge className="bg-secondary text-secondary-foreground">{inquiryCount} new</Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} total inquiries</span>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by patient, provider, procedure..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No inquiries yet</h3>
            <p className="text-muted-foreground">Inquiries for admin-managed providers will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card
              key={b.id}
              className={`cursor-pointer transition-all hover:shadow-md ${b.status === "inquiry" ? "border-secondary/50 bg-secondary/5" : ""}`}
              onClick={() => openBooking(b)}
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{b.patient_name}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm text-muted-foreground truncate">{b.provider_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{getProcedures(b.procedures)}</p>
                    {b.inquiry_message && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{b.inquiry_message}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className={`text-xs ${STATUS_COLORS[b.status] || "bg-muted"}`}>
                      {STATUS_LABELS[b.status] || b.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(b.created_at)}</span>
                    {b.messages.length > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {b.messages.length}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail / Reply Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Inbox className="w-5 h-5" />
              Inquiry Detail
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Badge className={`${STATUS_COLORS[selected.status] || ""}`}>
                {STATUS_LABELS[selected.status] || selected.status}
              </Badge>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selected.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{selected.patient_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{selected.provider_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p>{selected.preferred_dates?.text || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p>{new Date(selected.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground font-medium mb-1">Procedures</p>
                <p>{getProcedures(selected.procedures)}</p>
              </div>

              {selected.inquiry_message && (
                <div className="text-sm">
                  <p className="text-muted-foreground font-medium mb-1">Patient Message</p>
                  <p className="bg-muted/50 p-3 rounded-lg">{selected.inquiry_message}</p>
                </div>
              )}

              {selected.medical_notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground font-medium mb-1">Medical Notes</p>
                  <p className="bg-muted/50 p-3 rounded-lg">{selected.medical_notes}</p>
                </div>
              )}

              {/* Message thread */}
              {selected.messages.length > 0 && (
                <div className="text-sm space-y-2">
                  <p className="text-muted-foreground font-medium">Messages ({selected.messages.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selected.messages.map((m) => (
                      <div key={m.id} className={`p-2 rounded text-sm ${m.sender_id === selected.user_id ? "bg-muted/50" : "bg-primary/10"}`}>
                        <p className="text-xs text-muted-foreground mb-1">
                          {m.sender_id === selected.user_id ? "Patient" : "Admin"} · {timeAgo(m.created_at)}
                        </p>
                        <p>{m.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply form */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Reply / Quote</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Quote Price ($)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 2500"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Estimated Dates</label>
                    <Input
                      placeholder="e.g. Mar 18-20"
                      value={estimatedDates}
                      onChange={(e) => setEstimatedDates(e.target.value)}
                    />
                  </div>
                </div>
                <Textarea
                  placeholder="Write a reply to the patient..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button onClick={handleSendReply} disabled={sending || !replyText.trim()} className="w-full">
                  {sending ? "Sending..." : quotePrice ? "Send Quote & Reply" : "Send Reply"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InboxSection;
