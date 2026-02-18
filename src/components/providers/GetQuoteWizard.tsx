import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft, ChevronRight, X, Plus, Minus, Check,
  MapPin, Calendar, FileText, Users, Stethoscope,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { STANDARD_PROCEDURES } from "@/data/standardProcedures";

interface TripBrief {
  id: string;
  trip_name: string;
  destination: string | null;
  travel_window_start: string | null;
  travel_window_end: string | null;
  is_flexible: boolean;
  procedures: { name: string; quantity: number }[];
  is_group: boolean;
  group_members: { name: string; procedures: string[]; notes: string }[];
}

interface GroupMember {
  name: string;
  procedures: string[];
  notes: string;
}

interface GetQuoteWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName: string;
  providerSlug: string;
  providerProcedures?: string[];
  initialProcedure?: string;
}

const STEPS = ["Procedures", "Who's going?", "Dates & Details", "Review & Send"];

const StepDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-1.5 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all ${
          i === current ? "w-6 bg-primary" : i < current ? "w-1.5 bg-primary/40" : "w-1.5 bg-white/20"
        }`}
      />
    ))}
  </div>
);

const GetQuoteWizard = ({
  open,
  onOpenChange,
  providerName,
  providerSlug,
  providerProcedures = [],
  initialProcedure = "",
}: GetQuoteWizardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingBriefs, setLoadingBriefs] = useState(true);
  const [tripBriefs, setTripBriefs] = useState<TripBrief[]>([]);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [showBriefSelector, setShowBriefSelector] = useState(false);

  // Step 1: Procedures
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>(
    initialProcedure ? [initialProcedure] : []
  );
  const [customProcedure, setCustomProcedure] = useState("");

  // Step 2: Who
  const [isGroup, setIsGroup] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    { name: "", procedures: [], notes: "" },
  ]);

  // Step 3: Dates & details
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [isFlexible, setIsFlexible] = useState(false);
  const [notes, setNotes] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [comparingProviders, setComparingProviders] = useState(false);

  /* ─── Procedure list: provider's own + STANDARD as fallback ─── */
  const procedureOptions = providerProcedures.length > 0
    ? providerProcedures
    : STANDARD_PROCEDURES.slice(0, 30);

  /* ─── Load trip briefs ─── */
  useEffect(() => {
    if (!open || !user) return;
    setContactEmail(user.email || "");
    setLoadingBriefs(true);
    supabase
      .from("trip_briefs" as any)
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["planning", "quotes_requested"])
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const briefs = (data as unknown as TripBrief[]) || [];
        setTripBriefs(briefs);
        setShowBriefSelector(briefs.length > 0 && !initialProcedure);
        setLoadingBriefs(false);
      });
  }, [open, user]);

  /* ─── Apply trip brief ─── */
  const applyBrief = (brief: TripBrief) => {
    setSelectedBriefId(brief.id);
    if (brief.procedures?.length > 0) {
      setSelectedProcedures(brief.procedures.map((p) => p.name));
    }
    if (brief.travel_window_start) setWindowStart(brief.travel_window_start);
    if (brief.travel_window_end) setWindowEnd(brief.travel_window_end);
    if (brief.is_flexible) setIsFlexible(true);
    if (brief.is_group) {
      setIsGroup(true);
      setGroupSize(brief.group_members?.length || 2);
      setGroupMembers(
        brief.group_members?.length
          ? brief.group_members.map((m) => ({ name: m.name, procedures: m.procedures, notes: m.notes || "" }))
          : [{ name: "", procedures: [], notes: "" }]
      );
    }
    setShowBriefSelector(false);
  };

  /* ─── Helpers ─── */
  const toggleProcedure = (p: string) => {
    setSelectedProcedures((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const addCustom = () => {
    if (!customProcedure.trim()) return;
    setSelectedProcedures((prev) => [...prev, customProcedure.trim()]);
    setCustomProcedure("");
  };

  const updateGroupSize = (size: number) => {
    setGroupSize(size);
    if (size > groupMembers.length) {
      setGroupMembers((prev) => [
        ...prev,
        ...Array.from({ length: size - prev.length }, () => ({ name: "", procedures: [], notes: "" })),
      ]);
    } else {
      setGroupMembers((prev) => prev.slice(0, size));
    }
  };

  const updateMember = (idx: number, field: keyof GroupMember, val: any) => {
    setGroupMembers((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const copyMyProcedures = (idx: number) => {
    updateMember(idx, "procedures", [...selectedProcedures]);
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const payload: any = {
      user_id: user.id,
      trip_brief_id: selectedBriefId || null,
      provider_slug: providerSlug,
      procedures: selectedProcedures.map((name) => ({ name, quantity: 1 })),
      is_group: isGroup,
      group_members: isGroup ? groupMembers : [],
      travel_window_start: (!isFlexible && windowStart) ? windowStart : null,
      travel_window_end: (!isFlexible && windowEnd) ? windowEnd : null,
      is_flexible: isFlexible,
      notes,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
      comparing_providers: comparingProviders,
      request_type: "quote",
      status: "pending",
    };

    const { data: qr, error: qrError } = await supabase
      .from("quote_requests" as any)
      .insert(payload as any)
      .select("id")
      .single();

    if (qrError) {
      setSubmitting(false);
      toast({ title: "Error", description: qrError.message, variant: "destructive" });
      return;
    }

    // Also create a booking record (existing flow) for backwards compat
    const bookingPayload = {
      user_id: user.id,
      provider_slug: providerSlug,
      procedures: payload.procedures,
      preferred_dates: {
        text: isFlexible ? "Flexible" : [windowStart, windowEnd].filter(Boolean).join(" to "),
        start: payload.travel_window_start,
        end: payload.travel_window_end,
      },
      inquiry_message: notes,
      medical_notes: null,
      trip_brief_id: selectedBriefId || null,
      status: "inquiry",
    };

    const { data: booking, error: bookingError } = await supabase
      .from("bookings" as any)
      .insert(bookingPayload as any)
      .select("id")
      .single();

    // Update trip brief status if attached
    if (selectedBriefId) {
      await supabase
        .from("trip_briefs" as any)
        .update({ status: "quotes_requested" } as any)
        .eq("id", selectedBriefId);
    }

    // Non-blocking notification
    if (booking && !bookingError) {
      supabase.functions.invoke("send-notification", {
        body: { type: "inquiry_received", booking_id: (booking as any).id },
      }).catch(() => {});
      // TODO: Send email notification to provider and confirmation to traveler
    }

    setSubmitting(false);
    toast({
      title: "Quote request sent!",
      description: `${providerName} typically responds within 24–48 hours. We'll notify you when they reply.`,
    });
    onOpenChange(false);
    resetAll();
    if (booking && !bookingError) {
      navigate(`/booking/${(booking as any).id}`);
    }
  };

  const resetAll = () => {
    setStep(0);
    setSelectedProcedures(initialProcedure ? [initialProcedure] : []);
    setCustomProcedure("");
    setIsGroup(false); setGroupSize(2);
    setGroupMembers([{ name: "", procedures: [], notes: "" }]);
    setWindowStart(""); setWindowEnd(""); setIsFlexible(false);
    setNotes(""); setContactPhone(""); setComparingProviders(false);
    setSelectedBriefId(null);
    setShowBriefSelector(false);
  };

  /* ─── Auth gate ─── */
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sign in required</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">Please sign in to request a quote from {providerName}.</p>
          <Button asChild className="mt-2"><a href="/auth">Sign In</a></Button>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─── Brief selector screen ─── */
  if (!loadingBriefs && showBriefSelector) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Quote — {providerName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Add this to an existing trip brief, or start a new request.</p>
          <div className="space-y-2 mt-2">
            {tripBriefs.map((brief) => (
              <Card
                key={brief.id}
                className="cursor-pointer hover:bg-white/5 transition-colors border-white/10"
                onClick={() => applyBrief(brief)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{brief.trip_name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {brief.destination && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{brief.destination}</span>}
                        {brief.is_flexible && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Flexible</span>}
                        {brief.travel_window_start && !brief.is_flexible && (
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{brief.travel_window_start}</span>
                        )}
                      </div>
                      {brief.procedures?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {brief.procedures.slice(0, 3).map((p, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">{p.name}</Badge>
                          ))}
                          {brief.procedures.length > 3 && <Badge variant="outline" className="text-[10px]">+{brief.procedures.length - 3}</Badge>}
                        </div>
                      )}
                    </div>
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0 ml-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-2" onClick={() => setShowBriefSelector(false)}>
            Start a new request
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─── Step renders ─── */
  const renderStep0 = () => (
    <div className="space-y-4">
      {selectedBriefId && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
          <FileText className="w-3.5 h-3.5" />
          Pre-filled from your trip brief
          <button onClick={() => setSelectedBriefId(null)} className="ml-auto text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {procedureOptions.map((p) => (
          <button
            key={p}
            onClick={() => toggleProcedure(p)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              selectedProcedures.includes(p)
                ? "border-primary bg-primary/10 text-primary"
                : "border-white/20 text-white/60 hover:border-white/40"
            }`}
          >
            {selectedProcedures.includes(p) && <Check className="w-2.5 h-2.5 inline mr-1" />}
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={customProcedure}
          onChange={(e) => setCustomProcedure(e.target.value)}
          placeholder="Add a procedure not listed..."
          className="text-sm h-9"
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
        />
        <Button variant="outline" size="sm" onClick={addCustom}>Add</Button>
      </div>
      {selectedProcedures.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedProcedures.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1 text-xs">
              {p}
              <button onClick={() => toggleProcedure(p)}><X className="w-2.5 h-2.5" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { val: false, label: "Just me", icon: "🧍" },
          { val: true, label: "Group trip", icon: "👥" },
        ].map((opt) => (
          <button
            key={String(opt.val)}
            onClick={() => setIsGroup(opt.val)}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              isGroup === opt.val ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:border-white/30"
            }`}
          >
            <div className="text-2xl mb-1">{opt.icon}</div>
            <div className="font-semibold text-sm">{opt.label}</div>
          </button>
        ))}
      </div>
      {isGroup && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Label>Number of people</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateGroupSize(Math.max(2, groupSize - 1))}>
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-6 text-center font-bold">{groupSize}</span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateGroupSize(Math.min(10, groupSize + 1))}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {groupMembers.map((member, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Person {idx + 1}</span>
                  <Input
                    value={member.name}
                    onChange={(e) => updateMember(idx, "name", e.target.value)}
                    placeholder="Name (optional)"
                    className="h-8 text-sm flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProcedures.slice(0, 6).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        const cur = member.procedures;
                        updateMember(idx, "procedures", cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]);
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                        member.procedures.includes(p) ? "border-primary bg-primary/10 text-primary" : "border-white/20 text-white/50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {selectedProcedures.length > 0 && (
                    <button
                      onClick={() => copyMyProcedures(idx)}
                      className="text-xs px-2 py-0.5 rounded-full border border-dashed border-white/20 text-white/40 hover:text-white"
                    >
                      Same as me
                    </button>
                  )}
                </div>
                <Input
                  value={member.notes}
                  onChange={(e) => updateMember(idx, "notes", e.target.value)}
                  placeholder="Special needs or notes..."
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Travel Window</Label>
        {!isFlexible && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Earliest date</Label>
              <Input type="date" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Latest date</Label>
              <Input type="date" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={isFlexible} onCheckedChange={(v) => setIsFlexible(!!v)} />
          <span className="text-sm text-muted-foreground">I'm flexible on dates</span>
        </label>
      </div>
      <div className="space-y-2">
        <Label>Your email</Label>
        <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="your@email.com" type="email" />
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-1">Phone <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
        <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 (555) 000-0000" type="tel" />
      </div>
      <div className="space-y-2">
        <Label>Special requests or questions</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything specific you want the provider to know..."
          className="min-h-[80px]"
        />
      </div>
      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-white/10 bg-white/5">
        <Checkbox checked={comparingProviders} onCheckedChange={(v) => setComparingProviders(!!v)} className="mt-0.5" />
        <div>
          <p className="text-sm font-medium">I'm comparing quotes from multiple providers</p>
          <p className="text-xs text-muted-foreground mt-0.5">Helps providers understand your timeline</p>
        </div>
      </label>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2.5 text-sm">
        <p className="font-semibold text-base">Sending to: <span className="text-primary">{providerName}</span></p>
        <div className="border-t border-white/10 pt-2.5 space-y-2">
          <div className="flex items-start gap-2 text-muted-foreground">
            <Stethoscope className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{selectedProcedures.join(", ") || "No procedures selected"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4 shrink-0" />
            <span>{isGroup ? `Group of ${groupSize}` : "Just me"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>
              {isFlexible ? "Flexible on dates" : [windowStart, windowEnd].filter(Boolean).join(" → ") || "Dates not specified"}
            </span>
          </div>
          {contactEmail && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">✉️</span>
              <span>{contactEmail}</span>
            </div>
          )}
          {notes && (
            <div className="text-muted-foreground text-xs mt-2 italic">"{notes}"</div>
          )}
          {comparingProviders && (
            <p className="text-xs text-muted-foreground">⚡ Comparing quotes from multiple providers</p>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        They typically respond within 24–48 hours. We'll notify you when they reply.
      </p>
    </div>
  );

  const STEP_RENDERERS = [renderStep0, renderStep1, renderStep2, renderStep3];
  const STEP_ICONS = [Stethoscope, Users, Calendar, FileText];

  const canNext = () => {
    if (step === 0) return selectedProcedures.length > 0;
    if (step === 2) return !!contactEmail;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetAll(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {(() => { const Icon = STEP_ICONS[step]; return <Icon className="w-4 h-4 text-primary" />; })()}
            <DialogTitle className="text-lg">{STEPS[step]}</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">Getting a quote from <span className="text-foreground font-medium">{providerName}</span></p>
          <StepDots current={step} total={STEPS.length} />
        </DialogHeader>

        <div className="py-2">{STEP_RENDERERS[step]()}</div>

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button className="flex-1" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Sending..." : "Send Quote Request"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GetQuoteWizard;
