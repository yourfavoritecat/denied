import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles } from "lucide-react";

const treatments = [
  "Tretinoin", "Chemical Peels", "Microneedling", "Botox", "Filler", "Laser", "PRP",
];

const concerns = [
  "Acne", "Aging", "Hyperpigmentation", "Scarring", "Rosacea", "Melasma",
];

const SkincareTab = () => {
  const [routine, setRoutine] = useState("");
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [sensitivities, setSensitivities] = useState("");

  const toggleList = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Skincare History
        </CardTitle>
        <CardDescription>Help providers understand your skin for better recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Current Skincare Routine</Label>
          <Textarea
            placeholder="Describe your daily routine (cleanser, serums, moisturizer, SPF, etc.)"
            value={routine}
            onChange={(e) => setRoutine(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Previous Treatments</Label>
          <div className="flex flex-wrap gap-3">
            {treatments.map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedTreatments.includes(t)}
                  onCheckedChange={() => toggleList(selectedTreatments, setSelectedTreatments, t)}
                />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Skin Concerns</Label>
          <div className="flex flex-wrap gap-3">
            {concerns.map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedConcerns.includes(c)}
                  onCheckedChange={() => toggleList(selectedConcerns, setSelectedConcerns, c)}
                />
                <span className="text-sm">{c}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Product Sensitivities</Label>
          <Input
            placeholder="e.g. Fragrance, Retinol, Niacinamide"
            value={sensitivities}
            onChange={(e) => setSensitivities(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SkincareTab;
