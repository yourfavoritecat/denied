import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const BUSINESS_TYPES = [
  "Dental Clinic",
  "Cosmetic Surgery",
  "Med Spa",
  "Pharmacy",
  "Recovery Accommodation",
  "Other",
];

const LANGUAGES = [
  "English", "Spanish", "Portuguese", "French", "German",
  "Arabic", "Turkish", "Thai", "Korean", "Mandarin",
];

const SPECIALTIES = [
  "Dental Implants", "Veneers", "Crowns", "Orthodontics",
  "Rhinoplasty", "Liposuction", "Facelift", "Breast Augmentation",
  "Hair Transplant", "Tummy Tuck", "Botox", "Dermal Fillers",
  "Laser Treatments", "Weight Loss Surgery", "LASIK",
];

const Apply = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    business_type: "",
    city: "",
    country: "",
    website_url: "",
    years_in_practice: "",
    languages: [] as string[],
    specialties: [] as string[],
    certifications: "",
    why_join: "",
  });

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleArrayField = (field: "languages" | "specialties", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.from("provider_applications" as any).insert({
      business_name: form.business_name.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim() || null,
      business_type: form.business_type,
      city: form.city.trim(),
      country: form.country.trim(),
      website_url: form.website_url.trim() || null,
      years_in_practice: form.years_in_practice ? parseInt(form.years_in_practice) : null,
      languages: form.languages,
      specialties: form.specialties,
      certifications: form.certifications.trim() || null,
      why_join: form.why_join.trim() || null,
    } as any);

    setIsLoading(false);

    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center px-4">
        <Card className="max-w-lg w-full text-center shadow-floating border-border/50">
          <CardContent className="pt-10 pb-10 space-y-6">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Thanks for applying.</h2>
            <p className="text-muted-foreground leading-relaxed">
              We review every provider personally. You'll hear from us within 48 hours.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Denied is free to join — we operate on a commission model for bookings made through our platform. Full details will be shared during your onboarding call.
            </p>
            <Link to="/">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={logo} alt="Denied" className="h-10" />
          </Link>
        </div>

        <Card className="shadow-floating border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Provider Application</CardTitle>
            <CardDescription>
              Join Denied's network of vetted international healthcare providers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Business Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name *</Label>
                    <Input id="business_name" value={form.business_name} onChange={(e) => updateField("business_name", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_type">Business Type *</Label>
                    <Select value={form.business_type} onValueChange={(v) => updateField("business_type", v)} required>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" value={form.city} onChange={(e) => updateField("city", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input id="country" value={form.country} onChange={(e) => updateField("country", e.target.value)} required />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input id="website_url" type="url" value={form.website_url} onChange={(e) => updateField("website_url", e.target.value)} placeholder="https://" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="years_in_practice">Years in Practice</Label>
                    <Input id="years_in_practice" type="number" min="0" value={form.years_in_practice} onChange={(e) => updateField("years_in_practice", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name *</Label>
                    <Input id="contact_name" value={form.contact_name} onChange={(e) => updateField("contact_name", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apply_email">Email *</Label>
                    <Input id="apply_email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <Input id="whatsapp" type="tel" value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Languages Spoken</h3>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <label key={lang} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={form.languages.includes(lang)}
                        onCheckedChange={() => toggleArrayField("languages", lang)}
                      />
                      <span className="text-sm">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((spec) => {
                    const selected = form.specialties.includes(spec);
                    return (
                      <Badge
                        key={spec}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => toggleArrayField("specialties", spec)}
                      >
                        {spec}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Additional Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications & Licenses</Label>
                  <Textarea id="certifications" value={form.certifications} onChange={(e) => updateField("certifications", e.target.value)} placeholder="List relevant certifications, accreditations, or licenses..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="why_join">Why do you want to join Denied?</Label>
                  <Textarea id="why_join" value={form.why_join} onChange={(e) => updateField("why_join", e.target.value)} placeholder="Tell us about your practice and why you'd be a great fit..." rows={4} />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading || !form.business_type}>
                {isLoading ? "Submitting..." : "Submit Application"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth" className="text-primary hover:underline">Log in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Apply;
