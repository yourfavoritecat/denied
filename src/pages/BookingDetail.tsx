import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, CheckCircle, Clock, CreditCard, Plane, MessageSquare, Map } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { providers } from "@/data/providers";
import TripPlannerTab from "@/components/trips/TripPlannerTab";

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
  trip_brief_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TripBrief {
  id: string;
  destination: string | null;
  travel_start: string | null;
  travel_end: string | null;
  procedures: any;
}

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const STATUS_STEPS = [
  { key: "inquiry", label: "Inquiry Sent", icon: MessageSquare },
  { key: "provider_responded", label: "Provider Responded", icon: Clock },
  { key: "quoted", label: "Quote Received", icon: CreditCard },
  { key: "deposit_paid", label: "Deposit Paid", icon: CheckCircle },
  { key: "confirmed", label: "Trip Confirmed", icon: Plane },
  { key: "completed", label: "Completed", icon: CheckCircle },
];

const getStatusIndex = (status: string) => {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
};

const BookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [tripBrief, setTripBrief] = useState<TripBrief | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchBooking = async () => {
    const { data } = await supabase.from("bookings" as any).select("*").eq("id", id).single();
    const bookingData = data as any;
    setBooking(bookingData);
    if (bookingData?.trip_brief_id) {
      const { data: brief } = await supabase
        .from("trip_briefs")
        .select("id, destination, travel_start, travel_end, procedures")
        .eq("id", bookingData.trip_brief_id)
        .single();
      setTripBrief(brief as any);
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("booking_messages" as any)
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: true });
    setMessages((data as any[]) || []);
  };

  useEffect(() => {
    fetchBooking();
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`booking-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_messages", filter: `booking_id=eq.${id}` },
        () => fetchMessages()
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${id}` },
        () => fetchBooking()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    await supabase.from("booking_messages" as any).insert({
      booking_id: id,
      sender_id: user.id,
      message: newMessage.trim(),
    } as any);
    setNewMessage("");
    setSending(false);
    fetchMessages();
  };

  const handlePayDeposit = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { booking_id: booking.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message, variant: "destructive" });
    }
    setPaying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
          <Link to="/my-trips"><Button variant="outline">Back to My Trips</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const provider = providers.find((p) => p.slug === booking.provider_slug);
  const currentStep = getStatusIndex(booking.status);
  const procedures = Array.isArray(booking.procedures)
    ? booking.procedures.map((p: any) => `${p.name}${p.quantity > 1 ? ` ×${p.quantity}` : ""}`).join(", ")
    : JSON.stringify(booking.procedures);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/my-trips" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to My Trips
          </Link>

          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">{provider?.name || booking.provider_slug}</h1>
              <p className="text-muted-foreground text-sm">{procedures}</p>
            </div>
            <Badge className={`text-sm ${booking.status === "completed" ? "bg-primary/10 text-primary" : booking.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary"}`}>
              {STATUS_STEPS.find((s) => s.key === booking.status)?.label || booking.status}
            </Badge>
          </div>

          {/* Status Tracker */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between relative">
                {/* Progress line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                <div className="absolute top-5 left-0 h-0.5 bg-primary transition-all" style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }} />

                {STATUS_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i <= currentStep;
                  return (
                    <div key={step.key} className="relative flex flex-col items-center z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isActive ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs mt-2 text-center max-w-[80px] ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="details" className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" /> Booking Details
              </TabsTrigger>
              {(tripBrief || booking.trip_brief_id) && (
                <TabsTrigger value="planner" className="flex items-center gap-1.5">
                  <Map className="w-4 h-4" /> Trip Planner
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Booking Details */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Inquiry Details</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Procedures:</span>
                        <p className="text-muted-foreground">{procedures}</p>
                      </div>
                      {booking.preferred_dates?.text && (
                        <div>
                          <span className="font-medium">Preferred Dates:</span>
                          <p className="text-muted-foreground">{booking.preferred_dates.text}</p>
                        </div>
                      )}
                      {booking.inquiry_message && (
                        <div>
                          <span className="font-medium">Message:</span>
                          <p className="text-muted-foreground">{booking.inquiry_message}</p>
                        </div>
                      )}
                      {booking.medical_notes && (
                        <div>
                          <span className="font-medium">Medical Notes:</span>
                          <p className="text-muted-foreground">{booking.medical_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {booking.quoted_price && (
                    <Card className="border-primary/30">
                      <CardHeader><CardTitle className="text-lg">Quote</CardTitle></CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Total Price:</span>
                          <span className="text-xl font-bold text-primary">${Number(booking.quoted_price).toLocaleString()}</span>
                        </div>
                        {booking.deposit_amount && (
                          <div className="flex justify-between">
                            <span>Deposit (25%):</span>
                            <span className="font-bold">${Number(booking.deposit_amount).toLocaleString()}</span>
                          </div>
                        )}
                        {booking.provider_estimated_dates && (
                          <div>
                            <span className="font-medium">Estimated Dates:</span>
                            <p className="text-muted-foreground">{booking.provider_estimated_dates}</p>
                          </div>
                        )}
                        {booking.provider_message && (
                          <div>
                            <span className="font-medium">Provider Message:</span>
                            <p className="text-muted-foreground">{booking.provider_message}</p>
                          </div>
                        )}
                        {booking.status === "quoted" && (
                          <Button className="w-full mt-2 bg-secondary hover:bg-secondary/90" onClick={handlePayDeposit} disabled={paying}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            {paying ? "Processing..." : `Accept & Pay $${Number(booking.deposit_amount).toLocaleString()} Deposit`}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Messages Thread */}
                <Card className="flex flex-col h-[500px]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Messages</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto space-y-3 pb-0">
                    {messages.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Start the conversation!</p>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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
                  </CardContent>
                  <div className="p-4 border-t flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    />
                    <Button size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {(tripBrief || booking.trip_brief_id) && (
              <TabsContent value="planner">
                <TripPlannerTab
                  bookingId={booking.id}
                  procedures={
                    Array.isArray(tripBrief?.procedures)
                      ? tripBrief!.procedures
                      : Array.isArray(booking.procedures)
                        ? booking.procedures
                        : []
                  }
                  destination={tripBrief?.destination || provider?.city || "Mexico"}
                  travelStart={tripBrief?.travel_start || null}
                  travelEnd={tripBrief?.travel_end || null}
                  providerEstimatedDates={booking.provider_estimated_dates}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingDetail;
