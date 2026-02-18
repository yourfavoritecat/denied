import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  MapPin, Calendar, Stethoscope, Users, DollarSign, FileText,
  ChevronRight, ChevronLeft, X, Plus, Minus, Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

/* ─── Data ─── */
const DESTINATIONS = [
  "Tijuana", "Mexico City", "Guadalajara", "Cancun", "Monterrey",
  "Los Algodones", "Puerto Vallarta", "Merida", "San Jose del Cabo",
];

const CATEGORIES = [
  { id: "dental", label: "Dental", procedures: [
    "Zirconia Crown", "Dental Implant", "All-on-4", "All-on-6", "Veneer", "Root Canal",
    "Tooth Extraction", "Teeth Whitening", "Deep Cleaning", "Dental Bridge", "Dentures", "Dental Filling",
  ]},
  { id: "aesthetics", label: "Aesthetics / Med Spa", procedures: [
    "Botox", "Dermal Fillers", "Chemical Peel", "Microneedling", "Laser Hair Removal",
    "HydraFacial", "Thread Lift", "Lip Augmentation", "PRP Therapy", "Skin Tightening",
  ]},
  { id: "surgery", label: "Cosmetic Surgery", procedures: [
    "Rhinoplasty", "Breast Augmentation", "Breast Lift", "Liposuction", "Tummy Tuck",
    "Facelift", "BBL (Brazilian Butt Lift)", "Mommy Makeover", "Blepharoplasty",
  ]},
  { id: "medical", label: "Medical", procedures: [
    "Bariatric Surgery (Gastric Sleeve)", "LASIK", "Gastric Bypass", "Knee Replacement",
    "Hip Replacement", "Stem Cell Therapy",
  ]},
];

const BUDGET_PRESETS = [
  { label: "Under $1,000", value: "under_1k" },
  { label: "$1,000 – $3,000", value: "1k_3k" },
  { label: "$3,000 – $5,000", value: "3k_5k" },
  { label: "$5,000+", value: "5k_plus" },
  { label: "No budget in mind", value: "no_budget" },
];

const STEPS = ["Where & When", "What do you need?", "Who's going?", "Budget", "Save Trip"];

/* ─── Types ─── */
interface GroupMember {
  name: string;
  procedures: string[];
  notes: string;
}

interface TripBriefBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (briefId?: string) => void;
}

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

/* ─── Main component ─── */
const TripBriefBuilder = ({ open, onOpenChange, onSaved }: TripBriefBuilderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Where & When
  const [destination, setDestination] = useState("");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [isFlexible, setIsFlexible] = useState(false);

  // Step 2: What
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [customProcedure, setCustomProcedure] = useState("");
  const [proceduresUnsure, setProceduresUnsure] = useState(false);

  // Step 3: Who
  const [isGroup, setIsGroup] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    { name: "", procedures: [], notes: "" },
  ]);

  // Step 4: Budget
  const [budgetRange, setBudgetRange] = useState("no_budget");

  // Step 5: Name
  const [tripName, setTripName] = useState("");

  /* ─── Helpers ─── */
  const autoName = () => {
    const dest = destination || "Mexico";
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "short" });
    const year = String(now.getFullYear()).slice(-2);
    return `${dest} ${month} '${year}`;
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const toggleProcedure = (p: string) => {
    setSelectedProcedures((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
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

  /* ─── Save ─── */
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const procedures = selectedProcedures.map((name) => ({ name, quantity: 1 }));

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
      budget_range: budgetRange,
      status: "planning",
    };

    const { data, error } = await supabase
      .from("trip_briefs" as any)
      .insert(payload as any)
      .select("id")
      .single();

    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Trip Brief Saved!",
        description: "Browse providers to start getting quotes, or come back anytime.",
      });
      onOpenChange(false);
      onSaved?.((data as any)?.id);
      resetAll();
    }
  };

  const resetAll = () => {
    setStep(0);
    setDestination(""); setWindowStart(""); setWindowEnd(""); setIsFlexible(false);
    setSelectedCategories([]); setSelectedProcedures([]); setCustomProcedure(""); setProceduresUnsure(false);
    setIsGroup(false); setGroupSize(2); setGroupMembers([{ name: "", procedures: [], notes: "" }]);
    setBudgetRange("no_budget"); setTripName("");
  };

  /* ─── Step renders ─── */
  const renderStep0 = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Destination</Label>
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
        <Label>Travel Window</Label>
        {!isFlexible && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Earliest</Label>
              <Input type="date" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Latest</Label>
              <Input type="date" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={isFlexible} onCheckedChange={(v) => setIsFlexible(!!v)} />
          <span className="text-sm text-muted-foreground">I'm flexible on dates</span>
        </label>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-white/10 bg-white/5">
        <Checkbox checked={proceduresUnsure} onCheckedChange={(v) => setProceduresUnsure(!!v)} />
        <span className="text-sm">I'm not sure yet — I want to explore options</span>
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
            <Label className="text-sm text-muted-foreground">Add something not listed</Label>
            <div className="flex gap-2">
              <Input
                value={customProcedure}
                onChange={(e) => setCustomProcedure(e.target.value)}
                placeholder="e.g. Hair transplant"
                onKeyDown={(e) => e.key === "Enter" && addCustomProcedure()}
              />
              <Button variant="outline" size="sm" onClick={addCustomProcedure}>Add</Button>
            </div>
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
        </>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: false, label: "Just me", icon: "🧍" },
          { id: true, label: "Group trip", icon: "👥" },
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
              <div key={idx} className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium w-16">Person {idx + 1}</span>
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
                      Same as me
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
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">This is optional but helps match you with providers who fit your budget.</p>
      {BUDGET_PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => setBudgetRange(preset.value)}
          className={`w-full p-3.5 rounded-lg border text-left text-sm font-medium transition-all ${
            budgetRange === preset.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
          }`}
        >
          {budgetRange === preset.value && <Check className="w-4 h-4 inline mr-2" />}
          {preset.label}
        </button>
      ))}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{destination || "No destination selected"}</span>
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
            <span>Flexible on dates</span>
          </div>
        )}
        {(selectedProcedures.length > 0 || proceduresUnsure) && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Stethoscope className="w-4 h-4" />
            <span>{proceduresUnsure ? "Exploring options" : selectedProcedures.slice(0, 3).join(", ") + (selectedProcedures.length > 3 ? ` +${selectedProcedures.length - 3} more` : "")}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{isGroup ? `Group of ${groupSize}` : "Just me"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="w-4 h-4" />
          <span>{BUDGET_PRESETS.find((b) => b.value === budgetRange)?.label || "No budget set"}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Trip Name</Label>
        <Input
          placeholder={autoName()}
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Leave blank to use the suggested name</p>
      </div>
    </div>
  );

  const STEP_RENDERERS = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];
  const STEP_ICONS = [MapPin, Stethoscope, Users, DollarSign, FileText];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetAll(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {(() => { const Icon = STEP_ICONS[step]; return <Icon className="w-4 h-4 text-primary" />; })()}
            <DialogTitle className="text-lg">{STEPS[step]}</DialogTitle>
          </div>
          <StepDots current={step} total={STEPS.length} />
        </DialogHeader>

        <div className="py-2">
          {STEP_RENDERERS[step]()}
        </div>

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="flex-1"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleSave} disabled={saving || !user}>
              {saving ? "Saving..." : "Save Trip Brief"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripBriefBuilder;
