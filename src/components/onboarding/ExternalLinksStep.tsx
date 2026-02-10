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

const ExternalLinksStep = ({ userId, providerSlug, onComplete }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    website_url: "",
    google_business_url: "",
    yelp_url: "",
    instagram_url: "",
    facebook_url: "",
    tiktok_url: "",
  });

  useEffect(() => {
    supabase
      .from("provider_external_links" as any)
      .select("*")
      .eq("provider_slug", providerSlug)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setForm({
            website_url: d.website_url || "",
            google_business_url: d.google_business_url || "",
            yelp_url: d.yelp_url || "",
            instagram_url: d.instagram_url || "",
            facebook_url: d.facebook_url || "",
            tiktok_url: d.tiktok_url || "",
          });
        }
      });
  }, [providerSlug]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    const hasAtLeastOne = Object.values(form).some((v) => v.trim());
    if (!hasAtLeastOne) {
      toast({ title: "Add at least one external link", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      user_id: userId,
      provider_slug: providerSlug,
      website_url: form.website_url.trim() || null,
      google_business_url: form.google_business_url.trim() || null,
      yelp_url: form.yelp_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      tiktok_url: form.tiktok_url.trim() || null,
    };

    const { error } = await supabase
      .from("provider_external_links" as any)
      .upsert(payload as any, { onConflict: "provider_slug" });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Links saved!" });
      onComplete();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>External Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">At least one link is required.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={form.website_url} onChange={(e) => update("website_url", e.target.value)} placeholder="https://yoursite.com" />
          </div>
          <div className="space-y-2">
            <Label>Google Business</Label>
            <Input value={form.google_business_url} onChange={(e) => update("google_business_url", e.target.value)} placeholder="https://g.page/..." />
          </div>
          <div className="space-y-2">
            <Label>Yelp</Label>
            <Input value={form.yelp_url} onChange={(e) => update("yelp_url", e.target.value)} placeholder="https://yelp.com/biz/..." />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input value={form.instagram_url} onChange={(e) => update("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Facebook</Label>
            <Input value={form.facebook_url} onChange={(e) => update("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-2">
            <Label>TikTok</Label>
            <Input value={form.tiktok_url} onChange={(e) => update("tiktok_url", e.target.value)} placeholder="https://tiktok.com/@..." />
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

export default ExternalLinksStep;
