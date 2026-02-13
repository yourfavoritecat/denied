import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Stethoscope, ClipboardPaste, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const DENTAL_ISSUES = ["Cavities", "Missing teeth", "Crowns", "Implants", "Root canals", "Gum disease", "TMJ", "Braces/Orthodontics"];

const MedicalHistoryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [surgeries, setSurgeries] = useState("");
  const [pastedHistory, setPastedHistory] = useState("");
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);

  const [lastCleaning, setLastCleaning] = useState("");
  const [currentDentist, setCurrentDentist] = useState("");
  const [selectedDentalIssues, setSelectedDentalIssues] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_history" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setAllergies(d.allergies || "");
          setMedications(d.medications || "");
          setConditions(d.conditions || "");
          setBloodType(d.blood_type || "");
          setSurgeries(d.surgeries || "");
          setPastedHistory(d.pasted_history || "");
          setLastCleaning(d.last_dental_cleaning || "");
          setCurrentDentist(d.current_dentist || "");
          setSelectedDentalIssues(d.dental_issues || []);
        }
        setLoaded(true);
      });
  }, [user]);

  const toggleDentalIssue = (issue: string) => {
    setSelectedDentalIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      allergies,
      blood_type: bloodType,
      medications,
      conditions,
      surgeries,
      pasted_history: pastedHistory,
      last_dental_cleaning: lastCleaning,
      current_dentist: currentDentist,
      dental_issues: selectedDentalIssues,
    };

    const { data: existing } = await supabase
      .from("patient_history" as any)
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("patient_history" as any)
        .update(payload as any)
        .eq("user_id", user.id));
    } else {
      ({ error } = await supabase
        .from("patient_history" as any)
        .insert(payload as any));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Patient history saved! 🩺" });
    }
  };

  if (!loaded) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Medical */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Medical Information
          </CardTitle>
          <CardDescription>General medical history and conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Allergies</Label>
              <Input placeholder="e.g. Penicillin, Latex" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Blood Type</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
              >
                <option value="">Select...</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Current Medications</Label>
            <Input placeholder="e.g. Metformin, Lisinopril" value={medications} onChange={(e) => setMedications(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Chronic Conditions</Label>
            <Input placeholder="e.g. Diabetes, Hypertension" value={conditions} onChange={(e) => setConditions(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Previous Surgeries</Label>
            <Input placeholder="e.g. Appendectomy (2019)" value={surgeries} onChange={(e) => setSurgeries(e.target.value)} />
          </div>

          <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4" />
                Paste Medical History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Paste Your Medical History</DialogTitle>
              </DialogHeader>
              <Textarea
                placeholder="Paste your full medical history here — medications, conditions, surgeries, doctor notes, anything relevant..."
                className="min-h-[300px]"
                value={pastedHistory}
                onChange={(e) => setPastedHistory(e.target.value)}
              />
              <Button onClick={() => setPasteDialogOpen(false)}>Save</Button>
            </DialogContent>
          </Dialog>

          {pastedHistory && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Pasted medical history:</p>
              <p className="text-sm line-clamp-3">{pastedHistory}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dental */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dental History</CardTitle>
          <CardDescription>Your dental health background</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Last Cleaning Date</Label>
              <Input type="date" value={lastCleaning} onChange={(e) => setLastCleaning(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Current Dentist</Label>
              <Input placeholder="Name of your current dentist" value={currentDentist} onChange={(e) => setCurrentDentist(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Known Dental Issues</Label>
            <div className="flex flex-wrap gap-2">
              {DENTAL_ISSUES.map((issue) => (
                <label key={issue} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedDentalIssues.includes(issue)}
                    onCheckedChange={() => toggleDentalIssue(issue)}
                  />
                  <span className="text-sm">{issue}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dental X-Ray</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Upload dental X-ray (coming soon)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Patient History 🩺"}
      </Button>
    </div>
  );
};

export default MedicalHistoryTab;
