import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, X } from "lucide-react";
import { STANDARD_PROCEDURES } from "@/data/standardProcedures";

interface Props {
  userId: string;
  providerSlug: string;
  onComplete: () => void;
}

interface Service {
  id?: string;
  procedure_name: string;
  description: string;
  base_price_usd: string;
  estimated_duration: string;
  recovery_time: string;
  package_deals: string;
  isCustom?: boolean;
}

const emptyService = (): Service => ({
  procedure_name: "", description: "", base_price_usd: "", estimated_duration: "", recovery_time: "", package_deals: "",
});

const ServicesStep = ({ userId, providerSlug, onComplete }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([emptyService()]);

  useEffect(() => {
    supabase
      .from("provider_services" as any)
      .select("*")
      .eq("provider_slug", providerSlug)
      .then(({ data }) => {
        if (data && (data as any[]).length > 0) {
          setServices((data as any[]).map((d: any) => ({
            id: d.id,
            procedure_name: d.procedure_name,
            description: d.description || "",
            base_price_usd: d.base_price_usd?.toString() || "",
            estimated_duration: d.estimated_duration || "",
            recovery_time: d.recovery_time || "",
            package_deals: d.package_deals || "",
            isCustom: !STANDARD_PROCEDURES.includes(d.procedure_name),
          })));
        }
      });
  }, [providerSlug]);

  const updateService = (idx: number, field: string, value: string) => {
    setServices((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const addService = () => setServices((prev) => [...prev, emptyService()]);
  const removeService = (idx: number) => setServices((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const valid = services.filter((s) => s.procedure_name && s.base_price_usd);
    if (valid.length === 0) {
      toast({ title: "Add at least one service with name and price", variant: "destructive" });
      return;
    }

    setSaving(true);
    await supabase.from("provider_services" as any).delete().eq("provider_slug", providerSlug);

    const inserts = valid.map((s) => ({
      user_id: userId,
      provider_slug: providerSlug,
      procedure_name: s.procedure_name.trim(),
      description: s.description.trim() || null,
      base_price_usd: parseFloat(s.base_price_usd),
      estimated_duration: s.estimated_duration.trim() || null,
      recovery_time: s.recovery_time.trim() || null,
      package_deals: s.package_deals.trim() || null,
    }));

    const { error } = await supabase.from("provider_services" as any).insert(inserts as any);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Services saved!" });
      onComplete();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services & Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {services.map((svc, idx) => (
          <div key={idx} className="border border-border/50 rounded-lg p-4 space-y-4 relative">
            {services.length > 1 && (
              <button onClick={() => removeService(idx)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Procedure *</Label>
                {svc.isCustom ? (
                  <Input value={svc.procedure_name} onChange={(e) => updateService(idx, "procedure_name", e.target.value)} placeholder="Custom procedure name" />
                ) : (
                  <Select value={svc.procedure_name} onValueChange={(v) => {
                    if (v === "__custom__") {
                      updateService(idx, "isCustom" as any, "true" as any);
                      updateService(idx, "procedure_name", "");
                    } else {
                      updateService(idx, "procedure_name", v);
                    }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select procedure" /></SelectTrigger>
                    <SelectContent>
                      {STANDARD_PROCEDURES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      <SelectItem value="__custom__">+ Custom Procedure</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Base Price (USD) *</Label>
                <Input type="number" min="0" value={svc.base_price_usd} onChange={(e) => updateService(idx, "base_price_usd", e.target.value)} placeholder="e.g., 350" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={svc.description} onChange={(e) => updateService(idx, "description", e.target.value)} rows={2} />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input value={svc.estimated_duration} onChange={(e) => updateService(idx, "estimated_duration", e.target.value)} placeholder="e.g., 2 hours" />
              </div>
              <div className="space-y-2">
                <Label>Recovery Time</Label>
                <Input value={svc.recovery_time} onChange={(e) => updateService(idx, "recovery_time", e.target.value)} placeholder="e.g., 3-5 days" />
              </div>
              <div className="space-y-2">
                <Label>Package Deals</Label>
                <Input value={svc.package_deals} onChange={(e) => updateService(idx, "package_deals", e.target.value)} placeholder="e.g., 5+ crowns: 10% off" />
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addService} className="gap-2">
          <Plus className="w-4 h-4" /> Add Service
        </Button>

        <div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServicesStep;
