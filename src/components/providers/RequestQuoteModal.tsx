import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, FileText, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TripBrief {
  id: string;
  trip_name: string;
  destination: string | null;
  travel_start: string | null;
  travel_end: string | null;
  procedures: { name: string; quantity: number }[];
  budget_min: number | null;
  budget_max: number | null;
  inquiry_description: string | null;
  medical_notes: string | null;
}

interface RequestQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName: string;
  providerSlug: string;
}

const RequestQuoteModal = ({ open, onOpenChange, providerName, providerSlug }: RequestQuoteModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tripBriefs, setTripBriefs] = useState<TripBrief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<string | null>(null);
  const [mode, setMode] = useState<"select" | "brief-form" | "new">("select");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields (editable, pre-filled from trip brief)
  const [procedures, setProcedures] = useState("");
  const [preferredDates, setPreferredDates] = useState("");
  const [message, setMessage] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (open && user) {
      supabase
        .from("trip_briefs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setTripBriefs((data as unknown as TripBrief[]) || []);
          setLoading(false);
          if (!data || data.length === 0) setMode("new");
        });
    }
  }, [open, user]);

  const selectBrief = (briefId: string) => {
    const brief = tripBriefs.find((b) => b.id === briefId);
    if (!brief) return;
    setSelectedBrief(briefId);
    setProcedures(
      brief.procedures?.map((p) => `${p.name}${p.quantity > 1 ? ` ×${p.quantity}` : ""}`).join(", ") || ""
    );
    setPreferredDates(
      [brief.travel_start, brief.travel_end].filter(Boolean).join(" to ")
    );
    setMessage(brief.inquiry_description || "");
    setMedicalNotes(brief.medical_notes || "");
    setBudget(
      brief.budget_min || brief.budget_max
        ? `$${(brief.budget_min || 0).toLocaleString()} – $${(brief.budget_max || 0).toLocaleString()}`
        : ""
    );
    setMode("brief-form");
  };

  const resetForm = () => {
    setSelectedBrief(null);
    setProcedures("");
    setPreferredDates("");
    setMessage("");
    setMedicalNotes("");
    setBudget("");
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const brief = tripBriefs.find((b) => b.id === selectedBrief);
    const bookingData = {
      user_id: user.id,
      provider_slug: providerSlug,
      procedures: brief?.procedures || [{ name: procedures, quantity: 1 }],
      preferred_dates: { text: preferredDates, start: brief?.travel_start, end: brief?.travel_end },
      inquiry_message: message,
      medical_notes: medicalNotes,
      trip_brief_id: selectedBrief || null,
      status: "inquiry",
    };

    const { data, error } = await supabase
      .from("bookings" as any)
      .insert(bookingData as any)
      .select("id")
      .single();

    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Send notification to provider (non-blocking)
      try {
        // We don't know the provider's user_id here, so we'll handle this server-side later
        // For now just notify the patient's booking was created
      } catch (e) { /* non-blocking */ }

      toast({ title: "Inquiry sent!", description: `Your inquiry has been sent to ${providerName}.` });
      onOpenChange(false);
      resetForm();
      setMode("select");
      navigate(`/booking/${(data as any).id}`);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sign in required</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Please sign in to request a quote.</p>
          <Button asChild><a href="/auth">Sign In</a></Button>
        </DialogContent>
      </Dialog>
    );
  }

  const renderForm = () => (
    <div className="space-y-4">
      {mode === "brief-form" && (
        <Button variant="ghost" size="sm" onClick={() => { resetForm(); setMode("select"); }}>
          ← Back to Trip Briefs
        </Button>
      )}
      {mode === "new" && tripBriefs.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => { resetForm(); setMode("select"); }}>
          ← Back to Trip Briefs
        </Button>
      )}
      <div className="space-y-2">
        <Label>Procedures</Label>
        <Input value={procedures} onChange={(e) => setProcedures(e.target.value)} placeholder="e.g., 4 Zirconia Crowns, 1 Root Canal" />
      </div>
      <div className="space-y-2">
        <Label>Preferred Dates</Label>
        <Input value={preferredDates} onChange={(e) => setPreferredDates(e.target.value)} placeholder="e.g., March 15-20, 2026" />
      </div>
      <div className="space-y-2">
        <Label>Budget</Label>
        <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g., $2,000 – $5,000" />
      </div>
      <div className="space-y-2">
        <Label>Message to {providerName}</Label>
        <Textarea className="min-h-[100px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell them about your needs..." />
      </div>
      <div className="space-y-2">
        <Label>Medical Notes (optional)</Label>
        <Textarea value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} placeholder="Allergies, medications, medical history..." />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={submitting || (!message.trim() && !procedures.trim())}>
        {submitting ? "Sending..." : "Send Inquiry"}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Quote from {providerName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : mode === "select" && tripBriefs.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Attach a Trip Brief to auto-fill your inquiry, or write a new message.</p>
            <div className="space-y-2">
              {tripBriefs.map((brief) => (
                <Card key={brief.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => selectBrief(brief.id)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{brief.trip_name}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {brief.destination && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{brief.destination}</span>}
                          {brief.travel_start && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(brief.travel_start)}</span>}
                        </div>
                      </div>
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {brief.procedures?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {brief.procedures.map((p, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {p.name} {p.quantity > 1 ? `×${p.quantity}` : ""}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setMode("new")}>
              <MessageSquare className="w-4 h-4 mr-2" /> Write New Message
            </Button>
          </div>
        ) : (
          renderForm()
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestQuoteModal;
