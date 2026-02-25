import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Calendar, Stethoscope, Users, FileText,
  ChevronRight, ChevronLeft, X, Plus, Minus, Check, Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import MatchedProvidersStep from "./MatchedProvidersStep";

const DRAFT_KEY = "denied_trip_brief_draft";

/* ─── Data ─── */
const DESTINATIONS = [
  "tijuana", "mexico city", "guadalajara", "cancun", "monterrey",
  "los algodones", "puerto vallarta", "merida", "san jose del cabo",
];

const CATEGORIES = [
  { id: "dental", label: "dental", procedures: [
    "zirconia crown", "dental implant", "all-on-4", "all-on-6", "veneer", "root canal",
    "tooth extraction", "teeth whitening", "deep cleaning", "dental bridge", "dentures", "dental filling",
  ]},
  { id: "aesthetics", label: "aesthetics / med spa", procedures: [
    "botox", "dermal fillers", "chemical peel", "microneedling", "laser hair removal",
    "hydrafacial", "thread lift", "lip augmentation", "prp therapy", "skin tightening",
  ]},
  { id: "surgery", label: "cosmetic surgery", procedures: [
    "rhinoplasty", "breast augmentation", "breast lift", "liposuction", "tummy tuck",
    "facelift", "bbl (brazilian butt lift)", "mommy makeover", "blepharoplasty",
  ]},
  { id: "medical", label: "medical", procedures: [
    "bariatric surgery (gastric sleeve)", "lasik", "gastric bypass", "knee replacement",
    "hip replacement", "stem cell therapy",
  ]},
];

const STEPS = ["where & when", "what do you need?", "who's going?", "matched providers", "save trip brief"];

/* ─── Types ─── */
interface GroupMember {
  name: string;
  procedures: string[];
  notes: string;
}

interface ProcedureWithQty {
  name: string;
  quantity: number;
}

interface EditBrief {
  id: string;
  trip_name: string;
  destination: string | null;
  travel_window_start: string | null;
  travel_window_end: string | null;
  is_flexible: boolean;
  procedures: ProcedureWithQty[] | string[] | null;
  is_group: boolean;
  group_members: { name: string; procedures: string[] }[] | null;
  budget_range: string | null;
  procedure_categories?: string[] | null;
  procedures_unsure?: boolean;
  considered_providers?: string[] | null;
}

interface TripBriefBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (briefId?: string) => void;
  editBrief?: EditBrief | null;
}

interface ProcedurePriceRange {
  min: number;
  max: number;
}

/* ─── Normalize procedures helper ─── */
const normalizeProcedures = (procs: any[] | null): ProcedureWithQty[] => {
  if (!procs || procs.length === 0) return [];
  if (typeof procs[0] === "string") {
    return procs.map((p: string) => ({ name: p, quantity: 1 }));
  }
  return procs.map((p: any) => ({ name: p.name, quantity: p.quantity || 1 }));
};

/* ─── Step indicator ─── */
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

/* ─── Draft helpers ─── */
interface DraftState {
  destination: string;
  windowStart: string;
  windowEnd: string;
  isFlexible: boolean;
  selectedCategories: string[];
  selectedProcedures: string[];
  procedureQuantities: Record<string, number>;
  proceduresUnsure: boolean;
  isGroup: boolean;
  groupSize: number;
  groupMembers: GroupMember[];
  consideredProviders: string[];
  tripName: string;
  step: number;
}

const saveDraft = (state: DraftState) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch {}
};

const loadDraft = (): DraftState | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
};

/* ─── Main component ─── */
const TripBriefBuilder = ({ open, onOpenChange, onSaved, editBrief }: TripBriefBuilderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftState | null>(null);

  // Step 1: Where & When
  const [destination, setDestination] = useState("");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [isFlexible, setIsFlexible] = useState(false);

  // Step 2: What
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [procedureQuantities, setProcedureQuantities] = useState<Record<string, number>>({});
  const [customProcedure, setCustomProcedure] = useState("");
  const [proceduresUnsure, setProceduresUnsure] = useState(false);
  const [procedurePrices, setProcedurePrices] = useState<Record<string, ProcedurePriceRange>>({});

  // Step 3: Who
  const [isGroup, setIsGroup] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    { name: "", procedures: [], notes: "" },
  ]);

  // Step 4: Matched Providers
  const [consideredProviders, setConsideredProviders] = useState<string[]>([]);
  const [sentBriefs, setSentBriefs] = useState<Set<string>>(new Set());

  // Step 5: Name
  const [tripName, setTripName] = useState("");

  // Track editing ID
  const [editId, setEditId] = useState<string | null>(null);

  const getQty = (proc: string) => procedureQuantities[proc] || 1;
  const setQty = (proc: string, qty: number) => {
    setProcedureQuantities((prev) => ({ ...prev, [proc]: Math.max(1, Math.min(10, qty)) }));
  };

  /* ─── Check for draft on open ─── */
  useEffect(() => {
    if (open && !editBrief) {
      const draft = loadDraft();
      if (draft) {
        setPendingDraft(draft);
        setShowDraftPrompt(true);
      }
    }
  }, [open, editBrief]);

  const restoreDraft = (draft: DraftState) => {
    setDestination(draft.destination);
    setWindowStart(draft.windowStart);
    setWindowEnd(draft.windowEnd);
    setIsFlexible(draft.isFlexible);
    setSelectedCategories(draft.selectedCategories);
    setSelectedProcedures(draft.selectedProcedures);
    setProcedureQuantities(draft.procedureQuantities || {});
    setProceduresUnsure(draft.proceduresUnsure);
    setIsGroup(draft.isGroup);
    setGroupSize(draft.groupSize);
    setGroupMembers(draft.groupMembers);
    setConsideredProviders(draft.consideredProviders);
    setTripName(draft.tripName);
    setStep(draft.step);
    setShowDraftPrompt(false);
    setPendingDraft(null);
  };

  const dismissDraft = () => {
    clearDraft();
    setShowDraftPrompt(false);
    setPendingDraft(null);
  };

  /* ─── Save draft on step change ─── */
  const persistDraft = useCallback(() => {
    if (editId) return;
    saveDraft({
      destination, windowStart, windowEnd, isFlexible,
      selectedCategories, selectedProcedures, procedureQuantities, proceduresUnsure,
      isGroup, groupSize, groupMembers,
      consideredProviders, tripName, step,
    });
  }, [destination, windowStart, windowEnd, isFlexible, selectedCategories, selectedProcedures, procedureQuantities, proceduresUnsure, isGroup, groupSize, groupMembers, consideredProviders, tripName, step, editId]);

  /* ─── Fetch procedure prices from reference table ─── */
  useEffect(() => {
    if (selectedProcedures.length === 0) {
      setProcedurePrices({});
      return;
    }
    const lowerNames = selectedProcedures.map((p) => p.toLowerCase());
    supabase
      .from("procedure_pricing_reference" as any)
      .select("procedure_name, est_low, est_high")
      .in("procedure_name", lowerNames)
      .then(({ data }) => {
        if (!data) return;
        const prices: Record<string, ProcedurePriceRange> = {};
        for (const row of data as any[]) {
          const match = selectedProcedures.find((p) => p.toLowerCase() === row.procedure_name);
          if (match) {
            prices[match] = { min: Number(row.est_low), max: Number(row.est_high) };
          }
        }
        setProcedurePrices(prices);
      });
  }, [selectedProcedures]);

  /* ─── Populate when editing ─── */
  useEffect(() => {
    if (editBrief && open) {
      setEditId(editBrief.id);
      setDestination(editBrief.destination || "");
      setWindowStart(editBrief.travel_window_start || "");
      setWindowEnd(editBrief.travel_window_end || "");
      setIsFlexible(editBrief.is_flexible);
      setSelectedCategories(editBrief.procedure_categories || []);
      const normalized = normalizeProcedures(editBrief.procedures as any);
      setSelectedProcedures(normalized.map((p) => p.name));
      const qtys: Record<string, number> = {};
      normalized.forEach((p) => { qtys[p.name] = p.quantity; });
      setProcedureQuantities(qtys);
      setProceduresUnsure(editBrief.procedures_unsure || false);
      setIsGroup(editBrief.is_group);
      const gm = editBrief.group_members || [];
      setGroupSize(Math.max(2, gm.length));
      setGroupMembers(
        gm.length > 0
          ? gm.map((m: any) => ({ name: m.name || "", procedures: m.procedures || [], notes: m.notes || "" }))
          : [{ name: "", procedures: [], notes: "" }]
      );
      setTripName(editBrief.trip_name || "");
      setConsideredProviders(
        Array.isArray(editBrief.considered_providers) ? editBrief.considered_providers : []
      );
      if (editBrief.id) {
        loadSentBriefs(editBrief.id);
      }
      setStep(0);
    } else if (!open) {
      setEditId(null);
    }
  }, [editBrief, open]);

  const loadSentBriefs = async (briefId: string) => {
    const { data } = await supabase
      .from("bookings")
      .select("provider_slug")
      .eq("trip_brief_id", briefId)
      .eq("status", "inquiry");
    if (data) {
      setSentBriefs(new Set(data.map((b: any) => b.provider_slug)));
    }
  };

  /* ─── Helpers ─── */
  const autoName = () => {
    const dest = destination || "mexico";
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "short" }).toLowerCase();
    const year = String(now.getFullYear()).slice(-2);
    return `${dest} ${month} '${year}`;
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const toggleProcedure = (p: string) => {
    setSelectedProcedures((prev) => {
      if (prev.includes(p)) {
        // Remove quantity too
        setProcedureQuantities((q) => { const next = { ...q }; delete next[p]; return next; });
        return prev.filter((x) => x !== p);
      }
      return [...prev, p];
    });
  };

  const addCustomProcedure = () => {
    if (!customProcedure.trim()) return;
    setSelectedProcedures((prev) => [...prev, customProcedure.trim()]);
    setCustomProcedure("");
  };

  const updateGroupSize = (size: number) => {
    setGroupSize(size);
    const current = groupMembers.length;
    if (size > current) {
      setGroupMembers((prev) => [
        ...prev,
        ...Array.from({ length: size - current }, () => ({ name: "", procedures: [], notes: "" })),
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

  const canNext = () => {
    if (step === 0) return !!destination;
    if (step === 1) return selectedProcedures.length > 0 || proceduresUnsure;
    return true;
  };

  const buildProceduresPayload = (): ProcedureWithQty[] => {
    return selectedProcedures.map((name) => ({ name, quantity: getQty(name) }));
  };

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    setTimeout(() => {
      if (!editId) {
        saveDraft({
          destination, windowStart, windowEnd, isFlexible,
          selectedCategories, selectedProcedures, procedureQuantities, proceduresUnsure,
          isGroup, groupSize, groupMembers,
          consideredProviders, tripName, step: newStep,
        });
      }
    }, 0);
  };

  /* ─── Format procedure label with quantity ─── */
  const procLabel = (name: string, qty?: number) => {
    const q = qty ?? getQty(name);
    return q > 1 ? `${name} ×${q}` : name;
  };

  /* ─── Send brief to provider ─── */
  const handleSendBrief = async (providerSlug: string) => {
    if (!user) return;

    let briefId = editId;
    if (!briefId) {
      const procedures = buildProceduresPayload();
      const payload: any = {
        user_id: user.id,
        trip_name: tripName || autoName(),
        destination: destination || null,
        travel_window_start: (!isFlexible && windowStart) ? windowStart : null,
        travel_window_end: (!isFlexible && windowEnd) ? windowEnd : null,
        is_flexible: isFlexible,
        procedure_categories: selectedCategories,
        procedures,
        procedures_unsure: proceduresUnsure,
        is_group: isGroup,
        group_members: isGroup ? groupMembers : [],
        budget_range: "no_budget",
        considered_providers: consideredProviders,
        status: "planning",
      };
      const { data, error } = await supabase
        .from("trip_briefs" as any)
        .insert(payload as any)
        .select("id")
        .single();
      if (error || !data) return;
      briefId = (data as any).id;
      setEditId(briefId);
    }

    const procedures = buildProceduresPayload();

    const { error } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        provider_slug: providerSlug,
        trip_brief_id: briefId,
        procedures,
        preferred_dates: {
          text: isFlexible ? "flexible" : `${windowStart || ""} ${windowEnd ? `→ ${windowEnd}` : ""}`.trim(),
        },
        status: "inquiry",
        booking_type: "direct",
      } as any);

    if (!error) {
      setSentBriefs((prev) => new Set([...prev, providerSlug]));
      toast({ title: "brief sent!", description: `your trip brief was sent to the provider.` });
    }
  };

  /* ─── Save ─── */
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const procedures = buildProceduresPayload();

    const payload: any = {
      user_id: user.id,
      trip_name: tripName || autoName(),
      destination: destination || null,
      travel_window_start: (!isFlexible && windowStart) ? windowStart : null,
      travel_window_end: (!isFlexible && windowEnd) ? windowEnd : null,
      is_flexible: isFlexible,
      procedure_categories: selectedCategories,
      procedures,
      procedures_unsure: proceduresUnsure,
      is_group: isGroup,
      group_members: isGroup ? groupMembers : [],
      budget_range: "no_budget",
      considered_providers: consideredProviders,
      status: "planning",
    };

    let result;
    if (editId) {
      const { user_id, status, ...updatePayload } = payload;
      result = await supabase
        .from("trip_briefs" as any)
        .update(updatePayload as any)
        .eq("id", editId)
        .select("id")
        .single();
    } else {
      result = await supabase
        .from("trip_briefs" as any)
        .insert(payload as any)
        .select("id")
        .single();
    }

    setSaving(false);
    if (result.error) {
      toast({ title: "error saving", description: result.error.message, variant: "destructive" });
    } else {
      toast({
        title: editId ? "trip brief updated!" : "trip brief saved!",
        description: editId ? "your changes have been saved." : "you can add providers or come back anytime.",
      });
      clearDraft();
      onOpenChange(false);
      onSaved?.((result.data as any)?.id);
      resetAll();
    }
  };

  const resetAll = () => {
    setStep(0);
    setEditId(null);
    setDestination(""); setWindowStart(""); setWindowEnd(""); setIsFlexible(false);
    setSelectedCategories([]); setSelectedProcedures([]); setProcedureQuantities({}); setCustomProcedure(""); setProceduresUnsure(false);
    setIsGroup(false); setGroupSize(2); setGroupMembers([{ name: "", procedures: [], notes: "" }]);
    setTripName("");
    setConsideredProviders([]); setSentBriefs(new Set());
    setShowDraftPrompt(false); setPendingDraft(null);
    setProcedurePrices({});
  };

  /* ─── Pricing helpers ─── */
  const getRunningTotal = () => {
    let totalMin = 0;
    let totalMax = 0;
    let hasMissing = false;

    for (const proc of selectedProcedures) {
      const price = procedurePrices[proc];
      const qty = getQty(proc);
      if (price) {
        totalMin += price.min * qty;
        totalMax += price.max * qty;
      } else {
        hasMissing = true;
      }
    }

    return { totalMin, totalMax, hasMissing };
  };

  /* ─── Step renders ─── */
  const renderStep0 = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>destination</Label>
        <div className="grid grid-cols-3 gap-2">
          {DESTINATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDestination(d)}
              className={`p-2.5 rounded-lg text-sm font-medium border transition-all ${
                destination === d
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>travel window</Label>
        {!isFlexible && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">earliest</Label>
              <Input type="date" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">latest</Label>
              <Input type="date" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={isFlexible} onCheckedChange={(v) => setIsFlexible(!!v)} />
          <span className="text-sm text-muted-foreground">i'm flexible on dates</span>
        </label>
      </div>
    </div>
  );

  const renderStep1 = () => {
    const { totalMin, totalMax, hasMissing } = getRunningTotal();
    const hasAnyPrice = totalMin > 0 || totalMax > 0;

    return (
      <div className="space-y-4">
        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-white/10 bg-white/5">
          <Checkbox checked={proceduresUnsure} onCheckedChange={(v) => setProceduresUnsure(!!v)} />
          <span className="text-sm">i'm not sure yet — i want to explore options</span>
        </label>

        {!proceduresUnsure && (
          <>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedCategories.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                    />
                    <span className="font-medium text-sm">{cat.label}</span>
                  </label>
                  {selectedCategories.includes(cat.id) && (
                    <div className="ml-6 flex flex-wrap gap-1.5">
                      {cat.procedures.map((p) => (
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
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">add something not listed</Label>
              <div className="flex gap-2">
                <Input
                  value={customProcedure}
                  onChange={(e) => setCustomProcedure(e.target.value)}
                  placeholder="e.g. hair transplant"
                  onKeyDown={(e) => e.key === "Enter" && addCustomProcedure()}
                />
                <Button variant="outline" size="sm" onClick={addCustomProcedure}>add</Button>
              </div>
            </div>

            {selectedProcedures.length > 0 && (
              <div className="space-y-2 pt-1">
                {selectedProcedures.map((p) => {
                  const price = procedurePrices[p];
                  const qty = getQty(p);
                  return (
                    <div key={p} className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        {p}
                        <button onClick={() => toggleProcedure(p)}><X className="w-2.5 h-2.5" /></button>
                      </Badge>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setQty(p, qty - 1)}
                          disabled={qty <= 1}
                          className="w-5 h-5 rounded border border-white/20 flex items-center justify-center text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/40"
                          style={{ color: "#B0B0B0" }}
                        >
                          —
                        </button>
                        <span className="text-xs w-4 text-center font-medium">{qty}</span>
                        <button
                          onClick={() => setQty(p, qty + 1)}
                          disabled={qty >= 10}
                          className="w-5 h-5 rounded border border-white/20 flex items-center justify-center text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/40"
                          style={{ color: "#B0B0B0" }}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[11px] shrink-0" style={{ color: "#B0B0B0" }}>
                        {price
                          ? `est. $${(price.min * qty).toLocaleString()}–$${(price.max * qty).toLocaleString()}`
                          : "n/a"
                        }
                      </span>
                    </div>
                  );
                })}

                {/* Running total */}
                {selectedProcedures.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <p className="text-sm font-medium text-white">
                      {hasAnyPrice
                        ? hasMissing
                          ? `estimated total: $${totalMin.toLocaleString()}+`
                          : `estimated total: $${totalMin.toLocaleString()}–$${totalMax.toLocaleString()}`
                        : "estimated total: n/a"
                      }
                    </p>
                    {hasMissing && hasAnyPrice && (
                      <p className="text-[10px]" style={{ color: "#B0B0B0" }}>
                        some procedures don't have pricing yet
                      </p>
                    )}
                    <p className="text-[10px] italic" style={{ color: "#B0B0B0" }}>
                      estimates based on average mexico pricing · actual prices vary by provider
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: false, label: "just me", icon: "🧍" },
          { id: true, label: "group trip", icon: "👥" },
        ].map((opt) => (
          <button
            key={String(opt.id)}
            onClick={() => setIsGroup(opt.id)}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              isGroup === opt.id
                ? "border-primary bg-primary/10"
                : "border-white/10 bg-white/5 hover:border-white/30"
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
            <Label>number of people</Label>
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
              <div key={idx} className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium w-16">person {idx + 1}</span>
                  <Input
                    value={member.name}
                    onChange={(e) => updateMember(idx, "name", e.target.value)}
                    placeholder="name (optional)"
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
                        member.procedures.includes(p)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/20 text-white/50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {selectedProcedures.length > 0 && (
                    <button
                      onClick={() => copyMyProcedures(idx)}
                      className="text-xs px-2 py-0.5 rounded-full border border-white/20 text-white/50 hover:text-white"
                    >
                      same as me
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <MatchedProvidersStep
      destination={destination}
      selectedProcedures={selectedProcedures}
      procedureQuantities={procedureQuantities}
      consideredProviders={consideredProviders}
      onConsideredChange={setConsideredProviders}
      sentBriefs={sentBriefs}
      onSendBrief={handleSendBrief}
      onSkip={() => handleStepChange(4)}
    />
  );

  const renderStep4 = () => {
    const { totalMin, totalMax, hasMissing } = getRunningTotal();
    const hasAnyPrice = totalMin > 0 || totalMax > 0;

    return (
      <div className="space-y-5">
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{destination || "no destination selected"}</span>
          </div>
          {!isFlexible && (windowStart || windowEnd) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{windowStart} {windowEnd ? `→ ${windowEnd}` : ""}</span>
            </div>
          )}
          {isFlexible && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>flexible on dates</span>
            </div>
          )}
          {(selectedProcedures.length > 0 || proceduresUnsure) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Stethoscope className="w-4 h-4" />
              <span>
                {proceduresUnsure
                  ? "exploring options"
                  : selectedProcedures.slice(0, 3).map((p) => procLabel(p)).join(", ") + (selectedProcedures.length > 3 ? ` +${selectedProcedures.length - 3} more` : "")
                }
              </span>
            </div>
          )}
          {hasAnyPrice && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="w-4 h-4 text-center text-xs">$</span>
              <span>
                {hasMissing
                  ? `estimated total: $${totalMin.toLocaleString()}+`
                  : `estimated total: $${totalMin.toLocaleString()}–$${totalMax.toLocaleString()}`
                }
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{isGroup ? `group of ${groupSize}` : "just me"}</span>
          </div>
          {consideredProviders.length > 0 || sentBriefs.size > 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>
                {consideredProviders.length} provider(s) added
                {sentBriefs.size > 0 ? ` · ${sentBriefs.size} brief(s) sent` : ""}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>no providers added yet — you can add them later</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>trip name</Label>
          <Input
            placeholder={autoName()}
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">leave blank to use the suggested name</p>
        </div>
      </div>
    );
  };

  const STEP_RENDERERS = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];
  const STEP_ICONS = [MapPin, Stethoscope, Users, Building2, FileText];

  const stepTitle = step === 3
    ? `providers near ${(destination || "you").toLowerCase()}${selectedProcedures.length > 0 ? ` for ${selectedProcedures.map((p) => procLabel(p)).join(", ")}` : ""}`
    : STEPS[step];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetAll(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {(() => { const Icon = STEP_ICONS[step]; return <Icon className="w-4 h-4 text-primary" />; })()}
            <DialogTitle className="text-lg">{stepTitle}</DialogTitle>
          </div>
          <StepDots current={step} total={STEPS.length} />
        </DialogHeader>

        {/* Draft resume prompt */}
        {showDraftPrompt && pendingDraft && (
          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
            <p className="text-sm">you have an unfinished trip brief. pick up where you left off?</p>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => restoreDraft(pendingDraft)}>continue</Button>
              <button
                onClick={dismissDraft}
                className="text-sm hover:underline"
                style={{ color: "#B0B0B0" }}
              >
                start fresh
              </button>
            </div>
          </div>
        )}

        <div className="py-2">
          {STEP_RENDERERS[step]()}
        </div>

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => handleStepChange(step - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="flex-1"
              onClick={() => handleStepChange(step + 1)}
              disabled={!canNext()}
            >
              next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleSave} disabled={saving || !user}>
              {saving ? "saving..." : editId ? "update trip brief" : "save trip brief"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripBriefBuilder;
