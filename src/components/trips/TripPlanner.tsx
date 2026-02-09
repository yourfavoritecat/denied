import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, X, Plus, Minus } from "lucide-react";
import { procedureTypes, locations } from "@/data/providers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProcedureItem {
  name: string;
  quantity: number;
}

interface TripPlannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const TripPlanner = ({ open, onOpenChange, onSaved }: TripPlannerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [travelStart, setTravelStart] = useState("");
  const [travelEnd, setTravelEnd] = useState("");
  const [selectedProcedures, setSelectedProcedures] = useState<ProcedureItem[]>([]);
  const [budgetRange, setBudgetRange] = useState([0, 25000]);
  const [inquiry, setInquiry] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const autoName = () => {
    const dest = destination || "Mexico";
    const proc = selectedProcedures[0]?.name || "Medical";
    return `${dest} ${proc} Trip`;
  };

  const addProcedure = (name: string) => {
    if (selectedProcedures.find((p) => p.name === name)) return;
    setSelectedProcedures([...selectedProcedures, { name, quantity: 1 }]);
  };

  const removeProcedure = (name: string) => {
    setSelectedProcedures(selectedProcedures.filter((p) => p.name !== name));
  };

  const updateQuantity = (name: string, delta: number) => {
    setSelectedProcedures(
      selectedProcedures.map((p) =>
        p.name === name ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p
      )
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("trip_briefs").insert({
      user_id: user.id,
      trip_name: tripName || autoName(),
      destination,
      travel_start: travelStart || null,
      travel_end: travelEnd || null,
      procedures: selectedProcedures as any,
      budget_min: budgetRange[0],
      budget_max: budgetRange[1],
      inquiry_description: inquiry,
      medical_notes: medicalNotes,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error saving trip", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trip brief saved!" });
      // Reset
      setTripName("");
      setDestination("");
      setTravelStart("");
      setTravelEnd("");
      setSelectedProcedures([]);
      setBudgetRange([0, 25000]);
      setInquiry("");
      setMedicalNotes("");
      onOpenChange(false);
      onSaved?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Plan a Trip</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Trip Name */}
          <div className="space-y-2">
            <Label>Trip Name</Label>
            <Input
              placeholder={autoName()}
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
            />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label>Destination</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="">Select destination...</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}, Mexico</option>
              ))}
            </select>
          </div>

          {/* Travel Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={travelStart} onChange={(e) => setTravelStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={travelEnd} onChange={(e) => setTravelEnd(e.target.value)} />
            </div>
          </div>

          {/* Procedures */}
          <div className="space-y-2">
            <Label>Procedures</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value=""
              onChange={(e) => {
                if (e.target.value) addProcedure(e.target.value);
              }}
            >
              <option value="">Add a procedure...</option>
              {procedureTypes
                .filter((p) => !selectedProcedures.find((s) => s.name === p))
                .map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
            </select>
            {selectedProcedures.length > 0 && (
              <div className="space-y-2 mt-3">
                {selectedProcedures.map((proc) => (
                  <div key={proc.name} className="flex items-center gap-3 p-3 border rounded-lg">
                    <span className="flex-1 text-sm font-medium">{proc.name}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(proc.name, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold">{proc.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(proc.name, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeProcedure(proc.name)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget Range */}
          <div className="space-y-3">
            <Label>Budget Range (optional)</Label>
            <Slider
              min={0}
              max={50000}
              step={100}
              value={budgetRange}
              onValueChange={setBudgetRange}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${budgetRange[0].toLocaleString()}</span>
              <span>${budgetRange[1].toLocaleString()}</span>
            </div>
          </div>

          {/* Inquiry Description */}
          <div className="space-y-2">
            <Label>Inquiry Description</Label>
            <Textarea
              placeholder="I need 5 crowns and maybe whitening. Looking for a package deal. Flexible on dates in March..."
              className="min-h-[100px]"
              value={inquiry}
              onChange={(e) => setInquiry(e.target.value)}
            />
          </div>

          {/* Medical Notes */}
          <div className="space-y-2">
            <Label>Medical Notes</Label>
            <Textarea
              placeholder="Allergies, medications, medical history, or anything the provider should know..."
              className="min-h-[80px]"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Trip Brief"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripPlanner;
