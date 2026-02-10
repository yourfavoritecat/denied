import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { PAYMENT_METHODS } from "@/data/standardProcedures";

interface Props {
  userId: string;
  providerSlug: string;
  onComplete: () => void;
}

const PoliciesStep = ({ userId, providerSlug, onComplete }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [depositRequirements, setDepositRequirements] = useState("");
  const [acceptedPayments, setAcceptedPayments] = useState<string[]>([]);
  const [languages, setLanguages] = useState("");
  const [hours, setHours] = useState("");

  useEffect(() => {
    supabase
      .from("provider_policies" as any)
      .select("*")
      .eq("provider_slug", providerSlug)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setCancellationPolicy(d.cancellation_policy || "");
          setDepositRequirements(d.deposit_requirements || "");
          setAcceptedPayments(d.accepted_payments || []);
          setLanguages((d.languages_spoken || []).join(", "));
          setHours(d.hours_of_operation || "");
        }
      });
  }, [providerSlug]);

  const togglePayment = (method: string) => {
    setAcceptedPayments((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleSave = async () => {
    if (acceptedPayments.length === 0) {
      toast({ title: "Select at least one payment method", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      user_id: userId,
      provider_slug: providerSlug,
      cancellation_policy: cancellationPolicy.trim() || null,
      deposit_requirements: depositRequirements.trim() || null,
      accepted_payments: acceptedPayments,
      languages_spoken: languages.split(",").map((l) => l.trim()).filter(Boolean),
      hours_of_operation: hours.trim() || null,
    };

    const { error } = await supabase
      .from("provider_policies" as any)
      .upsert(payload as any, { onConflict: "provider_slug" });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Policies saved!" });
      onComplete();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Cancellation Policy</Label>
          <Textarea value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} rows={3} placeholder="Describe your cancellation and refund policy..." />
        </div>
        <div className="space-y-2">
          <Label>Deposit Requirements</Label>
          <Textarea value={depositRequirements} onChange={(e) => setDepositRequirements(e.target.value)} rows={2} placeholder="e.g., 25% deposit required to confirm booking..." />
        </div>

        <div className="space-y-3">
          <Label>Accepted Payment Methods *</Label>
          <div className="flex flex-wrap gap-3">
            {PAYMENT_METHODS.map((method) => (
              <label key={method} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={acceptedPayments.includes(method)}
                  onCheckedChange={() => togglePayment(method)}
                />
                <span className="text-sm">{method}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Languages Spoken</Label>
            <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Spanish, Portuguese" />
          </div>
          <div className="space-y-2">
            <Label>Hours of Operation</Label>
            <Input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Mon-Fri 8am-6pm, Sat 9am-2pm" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save & Continue
        </Button>
      </CardContent>
    </Card>
  );
};

export default PoliciesStep;
