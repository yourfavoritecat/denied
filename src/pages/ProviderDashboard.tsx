import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, DollarSign, Calendar, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { providers } from "@/data/providers";
import ProviderSidebar, { type ProviderSection } from "@/components/provider/ProviderSidebar";
import ProviderHome from "@/components/provider/ProviderHome";

interface PatientProfile {
  first_name: string | null;
  last_name: string | null;
}

interface Booking {
  id: string;
  user_id: string;
  provider_slug: string;
  procedures: any;
  preferred_dates: any;
  inquiry_message: string | null;
  medical_notes: string | null;
  status: string;
  quoted_price: number | null;
  deposit_amount: number | null;
  provider_message: string | null;
  provider_estimated_dates: string | null;
  created_at: string;
  updated_at: string;
  trip_brief_id: string | null;
  patient_name?: string;
  patient_email?: string;
}

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  inquiry: "New Inquiry",
  quoted: "Quote Sent",
  deposit_paid: "Deposit Paid",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-secondary/10 text-secondary",
  quoted: "bg-primary/10 text-primary",
  deposit_paid: "bg-primary/20 text-primary",
  confirmed: "bg-primary/30 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const ProviderDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [section, setSection] = useState<ProviderSection>("home");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Quote form
  const [quotePrice, setQuotePrice] = useState("");
  const [depositPercent] = useState(25);
  const [estimatedDates, setEstimatedDates] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const providerSlug = (profile as any)?.provider_slug;
  const providerData = providers.find((p) => p.slug === providerSlug);
  const providerName = providerData?.name || "Your Clinic";

  useEffect(() => {
    if (!providerSlug) {
      setLoading(false);
      return;
    }
    fetchBookings();

    const channel = supabase
      .channel("provider-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchBookings())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [providerSlug]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("provider_slug", providerSlug)
      .order("created_at", { ascending: false });

    const rawBookings = (data as any[]) || [];
    const userIds = [...new Set(rawBookings.map((b) => b.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds)
      : { data: [] };

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const enriched = rawBookings.map((b) => {
      const prof = profileMap.get(b.user_id) as PatientProfile | undefined;
      return {
        ...b,
        patient_name: prof ? [prof.first_name, prof.last_name].filter(Boolean).join(" ") : null,
      };
    });

    setBookings(enriched);
    setLoading(false);
  };

  const fetchMessages = async (bookingId: string) => {
    const { data } = await supabase
      .from("booking_messages")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });
    setMessages((data as any[]) || []);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openQuoteForm = (booking: Booking) => {
    setSelectedBooking(booking);
    setQuotePrice(booking.quoted_price?.toString() || "");
    setEstimatedDates(booking.provider_estimated_dates || "");
    setQuoteMessage(booking.provider_message || "");
    setQuoteOpen(true);
  };

  const openChat = (booking: Booking) => {
    setSelectedBooking(booking);
    setChatOpen(true);
    fetchMessages(booking.id);

    supabase
      .channel(`provider-chat-${booking.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_messages", filter: `booking_id=eq.${booking.id}` },
        () => fetchMessages(booking.id)
      )
      .subscribe();
  };

  const submitQuote = async () => {
    if (!selectedBooking || !quotePrice) return;
    setSubmittingQuote(true);
    const price = parseFloat(quotePrice);
    const deposit = Math.round(price * (depositPercent / 100) * 100) / 100;

    const { error } = await supabase
      .from("bookings")
      .update({
        quoted_price: price,
        deposit_amount: deposit,
        provider_estimated_dates: estimatedDates,
        provider_message: quoteMessage,
        status: "quoted",
      } as any)
      .eq("id", selectedBooking.id);

    setSubmittingQuote(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      try {
        await supabase.functions.invoke("send-notification", {
          body: { type: "quote_received", booking_id: selectedBooking.id, recipient_user_id: selectedBooking.user_id },
        });
      } catch (e) { /* non-blocking */ }
      toast({ title: "Quote sent!", description: "The patient has been notified." });
      setQuoteOpen(false);
      fetchBookings();
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedBooking) return;
    setSendingMsg(true);
    await supabase.from("booking_messages").insert({
      booking_id: selectedBooking.id,
      sender_id: user.id,
      message: newMessage.trim(),
    } as any);
    setNewMessage("");
    setSendingMsg(false);
    fetchMessages(selectedBooking.id);
  };

  const formatDate = (d: string) => {
    if (d.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = d.split("-").map(Number);
      return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const updateBookingStatus = async (booking: Booking, newStatus: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus } as any)
      .eq("id", booking.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `Booking marked as ${STATUS_LABELS[newStatus] || newStatus}.` });
      fetchBookings();
    }
  };

  const getProcedureText = (procedures: any) => {
    if (!procedures || !Array.isArray(procedures)) return "—";
    return procedures.map((p: any) => `${p.name}${p.quantity > 1 ? ` ×${p.quantity}` : ""}`).join(", ");
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!providerSlug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Provider Access Required</h1>
          <p className="text-muted-foreground mb-6">Your account is not linked to a provider profile.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const inquiries = bookings.filter((b) => b.status === "inquiry");
  const quoted = bookings.filter((b) => b.status === "quoted");
  const active = bookings.filter((b) => ["deposit_paid", "confirmed"].includes(b.status));
  const past = bookings.filter((b) => ["completed", "cancelled"].includes(b.status));

  const sectionBookings: Record<string, Booking[]> = {
    inquiries,
    quoted,
    active,
    past,
  };

  const sectionTitles: Record<string, string> = {
    inquiries: "new inquiries",
    quoted: "pending quotes",
    active: "active trips",
    past: "past bookings",
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="hover:shadow-lifted tactile-press bg-card">
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{booking.patient_name || "Unknown Patient"}</p>
            <p className="text-xs text-muted-foreground">{getProcedureText(booking.procedures)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(booking.created_at)}</p>
          </div>
          <Badge className={`text-xs shrink-0 ${STATUS_COLORS[booking.status] || ""}`}>
            {STATUS_LABELS[booking.status] || booking.status}
          </Badge>
        </div>

        {booking.preferred_dates?.text && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            <Calendar className="w-3 h-3" /> {booking.preferred_dates.text}
          </p>
        )}

        {booking.inquiry_message && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{booking.inquiry_message}</p>
        )}

        {booking.medical_notes && (
          <div className="bg-muted/50 rounded p-2 mb-3">
            <p className="text-xs font-medium mb-0.5">Medical Notes:</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{booking.medical_notes}</p>
          </div>
        )}

        {booking.quoted_price && (
          <p className="text-sm font-bold text-primary mb-3">
            Quoted: ${Number(booking.quoted_price).toLocaleString()}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              (${Number(booking.deposit_amount).toLocaleString()} deposit)
            </span>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {booking.status === "inquiry" && (
            <Button size="sm" onClick={() => openQuoteForm(booking)} className="gap-1">
              <DollarSign className="w-3 h-3" /> Submit Quote
            </Button>
          )}
          {booking.status === "quoted" && (
            <Button size="sm" variant="outline" onClick={() => openQuoteForm(booking)} className="gap-1">
              <DollarSign className="w-3 h-3" /> Edit Quote
            </Button>
          )}
          {["inquiry", "quoted"].includes(booking.status) && (
            <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking, "cancelled")} className="gap-1 text-destructive hover:text-destructive">
              <XCircle className="w-3 h-3" /> Cancel
            </Button>
          )}
          {booking.status === "deposit_paid" && (
            <Button size="sm" onClick={() => updateBookingStatus(booking, "confirmed")} className="gap-1">
              <CheckCircle className="w-3 h-3" /> Confirm Trip
            </Button>
          )}
          {booking.status === "confirmed" && (
            <Button size="sm" onClick={() => updateBookingStatus(booking, "completed")} className="gap-1">
              <CheckCircle className="w-3 h-3" /> Mark Completed
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => openChat(booking)} className="gap-1">
            <MessageSquare className="w-3 h-3" /> Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderBookingList = (key: string) => {
    const list = sectionBookings[key] || [];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{sectionTitles[key]}</h2>
          <span className="text-sm text-muted-foreground">{list.length} {list.length === 1 ? "booking" : "bookings"}</span>
        </div>
        {list.length === 0 ? (
          <Card className="shadow-elevated border-border/50"><CardContent className="py-12 text-center text-muted-foreground">No bookings here</CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {list.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted flex">
      <ProviderSidebar
        active={section}
        onChange={setSection}
        counts={{
          inquiries: inquiries.length,
          quoted: quoted.length,
          active: active.length,
          past: past.length,
        }}
        providerName={providerName}
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {section === "home" && (
          <ProviderHome
            providerName={providerName}
            providerSlug={providerSlug}
            bookings={bookings}
            onNavigate={(s) => setSection(s as ProviderSection)}
          />
        )}
        {section !== "home" && renderBookingList(section)}
      </main>

      {/* Quote Dialog */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-w-md shadow-hero">
          <DialogHeader>
            <DialogTitle>Submit Quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBooking && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium">{getProcedureText(selectedBooking.procedures)}</p>
                {selectedBooking.preferred_dates?.text && (
                  <p className="text-muted-foreground text-xs mt-1">Dates: {selectedBooking.preferred_dates.text}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>Total Price ($)</Label>
              <Input type="number" value={quotePrice} onChange={(e) => setQuotePrice(e.target.value)} placeholder="e.g. 5000" />
              {quotePrice && (
                <p className="text-xs text-muted-foreground">
                  Deposit ({depositPercent}%): ${Math.round(parseFloat(quotePrice || "0") * depositPercent / 100).toLocaleString()}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Estimated Procedure Dates</Label>
              <Input value={estimatedDates} onChange={(e) => setEstimatedDates(e.target.value)} placeholder="e.g. March 17–19, 2026" />
            </div>
            <div className="space-y-2">
              <Label>Message to Patient</Label>
              <Textarea value={quoteMessage} onChange={(e) => setQuoteMessage(e.target.value)} placeholder="Additional details about the quote..." />
            </div>
            <Button className="w-full" onClick={submitQuote} disabled={submittingQuote || !quotePrice}>
              {submittingQuote ? "Sending..." : "Send Quote"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={(open) => {
        setChatOpen(open);
        if (!open) setMessages([]);
      }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col shadow-hero">
          <DialogHeader>
            <DialogTitle>Messages</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[400px] py-2">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No messages yet</p>
            ) : (
              messages.map((msg) => {
                const isPatientSide = msg.sender_id === selectedBooking?.user_id;
                // On provider dashboard, viewer is always provider side
                const isMe = !isPatientSide;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {!isMe && (
                        <p className="text-xs font-medium mb-1 opacity-70">Patient</p>
                      )}
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 border-t pt-3">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            />
            <Button size="icon" onClick={sendMessage} disabled={sendingMsg || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderDashboard;
