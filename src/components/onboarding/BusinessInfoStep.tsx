import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Props {
  userId: string;
  providerSlug: string;
  onComplete: () => void;
}

const BusinessInfoStep = ({ userId, providerSlug, onComplete }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    legal_name: "",
    dba_name: "",
    street_address: "",
    city: "",
    state_country: "",
    phone: "",
    whatsapp: "",
    email: "",
    tax_id: "",
    years_in_operation: "",
  });

  useEffect(() => {
    supabase
      .from("provider_business_info" as any)
      .select("*")
      .eq("provider_slug", providerSlug)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setForm({
            legal_name: d.legal_name || "",
            dba_name: d.dba_name || "",
            street_address: d.street_address || "",
            city: d.city || "",
            state_country: d.state_country || "",
            phone: d.phone || "",
            whatsapp: d.whatsapp || "",
            email: d.email || "",
            tax_id: d.tax_id || "",
            years_in_operation: d.years_in_operation?.toString() || "",
          });
        }
      });
  }, [providerSlug]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.legal_name || !form.street_address || !form.city || !form.state_country) {
      toast({ title: "Fill in all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      provider_slug: providerSlug,
      legal_name: form.legal_name.trim(),
      dba_name: form.dba_name.trim() || null,
      street_address: form.street_address.trim(),
      city: form.city.trim(),
      state_country: form.state_country.trim(),
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      tax_id: form.tax_id.trim() || null,
      years_in_operation: form.years_in_operation ? parseInt(form.years_in_operation) : null,
    };

    const { error } = await supabase
      .from("provider_business_info" as any)
      .upsert(payload as any, { onConflict: "provider_slug" });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Business info saved!" });
      onComplete();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Legal Business Name *</Label>
            <Input value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>DBA / Trade Name</Label>
            <Input value={form.dba_name} onChange={(e) => update("dba_name", e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Street Address *</Label>
          <Input value={form.street_address} onChange={(e) => update("street_address", e.target.value)} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>City *</Label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>State / Country *</Label>
            <Input value={form.state_country} onChange={(e) => update("state_country", e.target.value)} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tax ID / RFC</Label>
            <Input value={form.tax_id} onChange={(e) => update("tax_id", e.target.value)} placeholder="For Mexico: RFC number" />
          </div>
        </div>
        <div className="space-y-2 max-w-xs">
          <Label>Years in Operation</Label>
          <Input type="number" value={form.years_in_operation} onChange={(e) => update("years_in_operation", e.target.value)} min="0" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="mt-4">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save & Continue
        </Button>
      </CardContent>
    </Card>
  );
};

export default BusinessInfoStep;
