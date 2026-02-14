import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Plus, X, Upload, UserPlus, Star, Image } from "lucide-react";
import { STANDARD_PROCEDURES, PAYMENT_METHODS } from "@/data/standardProcedures";

interface Props {
  userId: string;
  providerSlug?: string; // if editing
  providerName?: string;
  isNew?: boolean;
  initialData?: any; // pre-filled from scrape or create dialog
  onBack: () => void;
  onSaved: (slug: string) => void;
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

interface TeamMember {
  id?: string;
  name: string;
  role: string;
  headshot_url: string;
  bio: string;
  license_number: string;
  is_lead: boolean;
  headshotFile?: File | null;
}

const emptyService = (): Service => ({
  procedure_name: "", description: "", base_price_usd: "", estimated_duration: "", recovery_time: "", package_deals: "",
});

const emptyMember = (isLead = false): TeamMember => ({
  name: "", role: isLead ? "Lead Doctor" : "", headshot_url: "", bio: "", license_number: "", is_lead: isLead, headshotFile: null,
});

const StarSelector = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState<number | null>(null);
  const stars = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const display = hover ?? value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star;
        const half = !filled && display >= star - 0.5;
        return (
          <button
            key={star}
            type="button"
            className="relative w-8 h-8 group"
            onMouseLeave={() => setHover(null)}
          >
            {/* Left half */}
            <div
              className="absolute inset-y-0 left-0 w-1/2 z-10"
              onMouseEnter={() => setHover(star - 0.5)}
              onClick={() => onChange(star - 0.5)}
            />
            {/* Right half */}
            <div
              className="absolute inset-y-0 right-0 w-1/2 z-10"
              onMouseEnter={() => setHover(star)}
              onClick={() => onChange(star)}
            />
            <Star
              className={`w-7 h-7 transition-colors ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : half
                  ? "text-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
            {half && (
              <div className="absolute inset-0 overflow-hidden w-[50%]">
                <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
              </div>
            )}
          </button>
        );
      })}
      <span className="text-sm font-medium ml-2 text-muted-foreground">{value > 0 ? value.toFixed(1) : "—"}</span>
    </div>
  );
};

const AdminProviderForm = ({ userId, providerSlug: existingSlug, providerName, isNew, initialData, onBack, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // === Basics ===
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [country, setCountry] = useState(initialData?.country || "Mexico");
  const [description, setDescription] = useState(initialData?.description || "");
  const [specialties, setSpecialties] = useState(initialData?.specialties || "");
  const [verificationTier, setVerificationTier] = useState(initialData?.verification_tier || "listed");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initialData?.cover_photo_url || "");
  const [newCoverPhoto, setNewCoverPhoto] = useState<File | null>(null);

  // === My Review ===
  const [catRating, setCatRating] = useState(0);
  const [catReview, setCatReview] = useState("");
  const [personallyVisited, setPersonallyVisited] = useState(false);

  // === Services ===
  const [services, setServices] = useState<Service[]>([]);

  // === Contact & Location ===
  const [address, setAddress] = useState(initialData?.address || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [hours, setHours] = useState(initialData?.hours_of_operation || "");
  const [googleMapsLink, setGoogleMapsLink] = useState(initialData?.google_maps_link || "");
  const [languages, setLanguages] = useState(initialData?.languages || "English, Spanish");

  // === External Links ===
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url || "");
  const [instagramUrl, setInstagramUrl] = useState(initialData?.instagram_url || "");
  const [facebookUrl, setFacebookUrl] = useState(initialData?.facebook_url || "");
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState(initialData?.google_business_url || "");
  const [yelpUrl, setYelpUrl] = useState(initialData?.yelp_url || "");
  const [tiktokUrl, setTiktokUrl] = useState(initialData?.tiktok_url || "");

  // === Team ===
  const [members, setMembers] = useState<TeamMember[]>([]);

  // === Policies ===
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [depositRequirements, setDepositRequirements] = useState("");
  const [acceptedPayments, setAcceptedPayments] = useState<string[]>([]);
  const [policyLanguages, setPolicyLanguages] = useState("");

  // Auto-generate slug from name
  useEffect(() => {
    if (isNew && name && !existingSlug) {
      const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
      setSlug(autoSlug);
    }
  }, [name, isNew, existingSlug]);

  // Load existing data when editing
  useEffect(() => {
    const s = existingSlug;
    if (!s) return;

    // Load provider basics
    supabase.from("providers").select("*").eq("slug", s).single().then(({ data }: any) => {
      if (data) {
        setName(data.name || "");
        setSlug(data.slug || "");
        setCity(data.city || "");
        setCountry(data.country || "Mexico");
        setDescription(data.description || "");
        setSpecialties((data.specialties || []).join(", "));
        setVerificationTier(data.verification_tier || "listed");
        setCoverPhotoUrl(data.cover_photo_url || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
        setHours(data.hours_of_operation || "");
        setLanguages((data.languages || []).join(", "));
      }
    });

    // Load admin review
    supabase.from("provider_admin_reviews" as any).select("*").eq("provider_slug", s).maybeSingle().then(({ data }: any) => {
      if (data) {
        setCatRating(parseFloat(data.rating) || 0);
        setCatReview(data.review_text || "");
        setPersonallyVisited(data.personally_visited || false);
      }
    });

    // Load services
    supabase.from("provider_services" as any).select("*").eq("provider_slug", s).then(({ data }: any) => {
      if (data?.length) {
        setServices(data.map((d: any) => ({
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

    // Load external links
    supabase.from("provider_external_links" as any).select("*").eq("provider_slug", s).maybeSingle().then(({ data }: any) => {
      if (data) {
        setWebsiteUrl(data.website_url || "");
        setInstagramUrl(data.instagram_url || "");
        setFacebookUrl(data.facebook_url || "");
        setGoogleBusinessUrl(data.google_business_url || "");
        setYelpUrl(data.yelp_url || "");
        setTiktokUrl(data.tiktok_url || "");
      }
    });

    // Load team
    supabase.from("provider_team_members" as any).select("*").eq("provider_slug", s).order("sort_order").then(({ data }: any) => {
      if (data?.length) {
        setMembers(data.map((d: any) => ({
          id: d.id, name: d.name, role: d.role, headshot_url: d.headshot_url || "",
          bio: d.bio || "", license_number: d.license_number || "", is_lead: d.is_lead,
        })));
      }
    });

    // Load policies
    supabase.from("provider_policies" as any).select("*").eq("provider_slug", s).maybeSingle().then(({ data }: any) => {
      if (data) {
        setCancellationPolicy(data.cancellation_policy || "");
        setDepositRequirements(data.deposit_requirements || "");
        setAcceptedPayments(data.accepted_payments || []);
        setPolicyLanguages((data.languages_spoken || []).join(", "));
      }
    });
  }, [existingSlug]);

  // Upload helper
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const path = `admin/${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("provider-onboarding").upload(path, file, {
      contentType: file.type || 'application/octet-stream',
    });
    if (error) return null;
    const { data } = supabase.storage.from("provider-onboarding").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim() || !city.trim()) {
      toast({ title: "Name and City are required", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      // 1. Upload cover photo if new
      let finalCoverUrl = coverPhotoUrl;
      if (newCoverPhoto) {
        const url = await uploadFile(newCoverPhoto, "cover");
        if (url) finalCoverUrl = url;
      }

      const finalSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      // 2. Save provider basics
      const providerPayload = {
        name: name.trim(),
        slug: finalSlug,
        city: city.trim() || null,
        country: country.trim() || "Mexico",
        address: address.trim() || null,
        phone: phone.trim() || null,
        description: description.trim() || null,
        specialties: specialties.split(",").map(s => s.trim()).filter(Boolean),
        languages: languages.split(",").map(s => s.trim()).filter(Boolean),
        hours_of_operation: hours.trim() || null,
        verification_tier: verificationTier,
        cover_photo_url: finalCoverUrl || null,
        admin_managed: true,
        admin_email: "cat@denied.care",
      };

      if (existingSlug) {
        const { error } = await supabase.from("providers" as any).update(providerPayload as any).eq("slug", existingSlug);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("providers" as any).insert(providerPayload as any);
        if (error) throw error;
      }

      const targetSlug = existingSlug || finalSlug;

      // 3. Save admin review (upsert)
      if (catRating > 0 || catReview.trim()) {
        await supabase.from("provider_admin_reviews" as any).upsert({
          provider_slug: targetSlug,
          rating: catRating,
          review_text: catReview.trim() || null,
          personally_visited: personallyVisited,
        } as any, { onConflict: "provider_slug" });
      }

      // 4. Save services
      const validServices = services.filter(s => s.procedure_name && s.base_price_usd);
      if (validServices.length > 0 || existingSlug) {
        await supabase.from("provider_services" as any).delete().eq("provider_slug", targetSlug);
        if (validServices.length > 0) {
          await supabase.from("provider_services" as any).insert(
            validServices.map(s => ({
              user_id: userId,
              provider_slug: targetSlug,
              procedure_name: s.procedure_name.trim(),
              description: s.description.trim() || null,
              base_price_usd: parseFloat(s.base_price_usd),
              estimated_duration: s.estimated_duration.trim() || null,
              recovery_time: s.recovery_time.trim() || null,
              package_deals: s.package_deals.trim() || null,
            })) as any
          );
        }
      }

      // 5. Save external links
      const hasAnyLink = websiteUrl || instagramUrl || facebookUrl || googleBusinessUrl || yelpUrl || tiktokUrl;
      if (hasAnyLink || existingSlug) {
        await supabase.from("provider_external_links" as any).upsert({
          user_id: userId,
          provider_slug: targetSlug,
          website_url: websiteUrl.trim() || null,
          instagram_url: instagramUrl.trim() || null,
          facebook_url: facebookUrl.trim() || null,
          google_business_url: googleBusinessUrl.trim() || null,
          yelp_url: yelpUrl.trim() || null,
          tiktok_url: tiktokUrl.trim() || null,
        } as any, { onConflict: "provider_slug" });
      }

      // 6. Save team members (upload headshots first)
      const activeMembers = members.filter(m => m.name.trim());
      if (activeMembers.length > 0 || existingSlug) {
        for (let i = 0; i < activeMembers.length; i++) {
          if (activeMembers[i].headshotFile) {
            const url = await uploadFile(activeMembers[i].headshotFile!, "headshots");
            if (url) activeMembers[i].headshot_url = url;
            activeMembers[i].headshotFile = null;
          }
        }
        await supabase.from("provider_team_members" as any).delete().eq("provider_slug", targetSlug);
        if (activeMembers.length > 0) {
          // Auto-assign lead if none
          if (!activeMembers.some(m => m.is_lead)) activeMembers[0].is_lead = true;
          await supabase.from("provider_team_members" as any).insert(
            activeMembers.map((m, i) => ({
              user_id: userId,
              provider_slug: targetSlug,
              name: m.name.trim(),
              role: m.role.trim() || "Staff",
              headshot_url: m.headshot_url || null,
              bio: m.bio.trim() || null,
              license_number: m.license_number.trim() || null,
              is_lead: m.is_lead,
              sort_order: i,
            })) as any
          );
        }
      }

      // 7. Save policies
      const hasPolicies = cancellationPolicy || depositRequirements || acceptedPayments.length || policyLanguages;
      if (hasPolicies || existingSlug) {
        await supabase.from("provider_policies" as any).upsert({
          user_id: userId,
          provider_slug: targetSlug,
          cancellation_policy: cancellationPolicy.trim() || null,
          deposit_requirements: depositRequirements.trim() || null,
          accepted_payments: acceptedPayments,
          languages_spoken: policyLanguages.split(",").map(l => l.trim()).filter(Boolean),
          hours_of_operation: hours.trim() || null,
        } as any, { onConflict: "provider_slug" });
      }

      toast({ title: existingSlug ? "Provider updated!" : "Provider created! 🎉" });
      onSaved(targetSlug);
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Service helpers
  const updateService = (idx: number, field: string, value: string) =>
    setServices(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  const addService = () => setServices(prev => [...prev, emptyService()]);
  const removeService = (idx: number) => setServices(prev => prev.filter((_, i) => i !== idx));

  // Team helpers
  const updateMember = (idx: number, field: string, value: any) =>
    setMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  const addMember = () => setMembers(prev => [...prev, emptyMember()]);
  const removeMember = (idx: number) => setMembers(prev => prev.filter((_, i) => i !== idx));

  const togglePayment = (method: string) =>
    setAcceptedPayments(prev => prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]);

  const defaultAccordionValues = isNew
    ? ["services", "contact", "links", "team", "policies"]
    : [];

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Providers
        </Button>
        <div className="h-4 w-px bg-border" />
        <h2 className="text-xl font-bold">
          {existingSlug ? `Edit — ${providerName || name}` : "Create Provider"}
        </h2>
      </div>

      {/* ========= BASICS (always visible) ========= */}
      <div className="space-y-4 p-6 rounded-xl border border-border/50 bg-card">
        <h3 className="text-lg font-semibold">Basics</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Clinic Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vive Medical Spa" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated" className="font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label>City <span className="text-destructive">*</span></Label>
            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Tijuana" />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={country} onChange={e => setCountry(e.target.value)} />
          </div>
        </div>

        {/* Cover photo */}
        <div className="space-y-2">
          <Label>Cover Photo</Label>
          {coverPhotoUrl && !newCoverPhoto ? (
            <div className="relative rounded-lg overflow-hidden border border-border/50 max-w-md">
              <img src={coverPhotoUrl} alt="Cover" className="w-full aspect-[16/10] object-cover" />
              <button onClick={() => setCoverPhotoUrl("")} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : newCoverPhoto ? (
            <div className="relative rounded-lg overflow-hidden border border-border/50 max-w-md">
              <img src={URL.createObjectURL(newCoverPhoto)} alt="Cover preview" className="w-full aspect-[16/10] object-cover" />
              <button onClick={() => setNewCoverPhoto(null)} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full max-w-md aspect-[16/10] rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Upload cover photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => setNewCoverPhoto(e.target.files?.[0] || null)} />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label>Short Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What makes this clinic special?" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Specialties (comma-separated)</Label>
            <Input value={specialties} onChange={e => setSpecialties(e.target.value)} placeholder="e.g. Dental, Cosmetic Surgery" />
          </div>
          <div className="space-y-2">
            <Label>Verification Tier</Label>
            <Select value={verificationTier} onValueChange={setVerificationTier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="listed">Listed</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ========= MY REVIEW (always visible) ========= */}
      <div className="space-y-4 p-6 rounded-xl border border-border/50 bg-card">
        <h3 className="text-lg font-semibold">My Review</h3>
        <p className="text-sm text-muted-foreground">Your personal editorial review. This appears on the provider's profile page.</p>

        <div className="space-y-2">
          <Label>Cat's Rating</Label>
          <StarSelector value={catRating} onChange={setCatRating} />
        </div>

        <div className="space-y-2">
          <Label>Cat's Review</Label>
          <Textarea value={catReview} onChange={e => setCatReview(e.target.value)} rows={4} placeholder="Your honest take on this clinic..." />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={personallyVisited} onCheckedChange={(c) => setPersonallyVisited(!!c)} />
          <span className="text-sm font-medium">I've been here (shows "Personally Visited" badge)</span>
        </label>
      </div>

      {/* ========= COLLAPSIBLE SECTIONS ========= */}
      <Accordion type="multiple" defaultValue={defaultAccordionValues} className="space-y-3">
        {/* Services & Pricing */}
        <AccordionItem value="services" className="border border-border/50 rounded-xl overflow-hidden bg-card px-6">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline">Services & Pricing</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            {services.map((svc, idx) => (
              <div key={idx} className="border border-border/50 rounded-lg p-4 space-y-4 relative">
                {services.length > 0 && (
                  <button onClick={() => removeService(idx)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Procedure</Label>
                    {svc.isCustom ? (
                      <Input value={svc.procedure_name} onChange={e => updateService(idx, "procedure_name", e.target.value)} placeholder="Custom procedure" />
                    ) : (
                      <Select value={svc.procedure_name} onValueChange={v => {
                        if (v === "__custom__") {
                          updateService(idx, "isCustom" as any, "true" as any);
                          updateService(idx, "procedure_name", "");
                        } else updateService(idx, "procedure_name", v);
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select procedure" /></SelectTrigger>
                        <SelectContent>
                          {STANDARD_PROCEDURES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          <SelectItem value="__custom__">+ Custom Procedure</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price (USD)</Label>
                    <Input type="number" min="0" value={svc.base_price_usd} onChange={e => updateService(idx, "base_price_usd", e.target.value)} placeholder="350" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={svc.description} onChange={e => updateService(idx, "description", e.target.value)} rows={2} />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input value={svc.estimated_duration} onChange={e => updateService(idx, "estimated_duration", e.target.value)} placeholder="2 hours" />
                  </div>
                  <div className="space-y-2">
                    <Label>Recovery Time</Label>
                    <Input value={svc.recovery_time} onChange={e => updateService(idx, "recovery_time", e.target.value)} placeholder="3-5 days" />
                  </div>
                  <div className="space-y-2">
                    <Label>Package Deals</Label>
                    <Input value={svc.package_deals} onChange={e => updateService(idx, "package_deals", e.target.value)} placeholder="5+ crowns: 10% off" />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addService} className="gap-2">
              <Plus className="w-4 h-4" /> Add Service
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Contact & Location */}
        <AccordionItem value="contact" className="border border-border/50 rounded-xl overflow-hidden bg-card px-6">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline">Contact & Location</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full street address" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+52 664 123 4567" />
              </div>
              <div className="space-y-2">
                <Label>Hours of Operation</Label>
                <Input value={hours} onChange={e => setHours(e.target.value)} placeholder="Mon-Fri 8am-6pm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Google Maps Link</Label>
              <Input value={googleMapsLink} onChange={e => setGoogleMapsLink(e.target.value)} placeholder="https://maps.google.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Languages (comma-separated)</Label>
              <Input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Spanish" />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* External Links */}
        <AccordionItem value="links" className="border border-border/50 rounded-xl overflow-hidden bg-card px-6">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline">External Links</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Google Business / Maps</Label>
                <Input value={googleBusinessUrl} onChange={e => setGoogleBusinessUrl(e.target.value)} placeholder="https://g.page/..." />
              </div>
              <div className="space-y-2">
                <Label>Yelp</Label>
                <Input value={yelpUrl} onChange={e => setYelpUrl(e.target.value)} placeholder="https://yelp.com/biz/..." />
              </div>
              <div className="space-y-2">
                <Label>TikTok</Label>
                <Input value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@..." />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Team */}
        <AccordionItem value="team" className="border border-border/50 rounded-xl overflow-hidden bg-card px-6">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline">Team</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            {members.map((member, idx) => (
              <div key={idx} className="border border-border/50 rounded-lg p-4 space-y-4 relative">
                <button onClick={() => removeMember(idx)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
                {member.is_lead && (
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Lead Practitioner</span>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={member.name} onChange={e => updateMember(idx, "name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Title / Role</Label>
                    <Input value={member.role} onChange={e => updateMember(idx, "role", e.target.value)} placeholder="e.g. Lead Dentist" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>License Number</Label>
                    <Input value={member.license_number} onChange={e => updateMember(idx, "license_number", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Headshot</Label>
                    {member.headshot_url ? (
                      <div className="flex items-center gap-3">
                        <img src={member.headshot_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                        <Button variant="outline" size="sm" onClick={() => updateMember(idx, "headshot_url", "")}>Change</Button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                        <Upload className="w-4 h-4" /> Upload headshot
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) updateMember(idx, "headshotFile", file);
                        }} />
                      </label>
                    )}
                    {member.headshotFile && <p className="text-xs text-muted-foreground">{member.headshotFile.name} (pending)</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={member.bio} onChange={e => updateMember(idx, "bio", e.target.value)} rows={2} />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addMember} className="gap-2">
              <UserPlus className="w-4 h-4" /> Add Team Member
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Policies */}
        <AccordionItem value="policies" className="border border-border/50 rounded-xl overflow-hidden bg-card px-6">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline">Policies</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6">
            <div className="space-y-3">
              <Label>Accepted Payment Methods</Label>
              <div className="flex flex-wrap gap-3">
                {PAYMENT_METHODS.map(method => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={acceptedPayments.includes(method)} onCheckedChange={() => togglePayment(method)} />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cancellation Policy</Label>
              <Textarea value={cancellationPolicy} onChange={e => setCancellationPolicy(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Deposit Requirements</Label>
              <Textarea value={depositRequirements} onChange={e => setDepositRequirements(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Languages Spoken</Label>
              <Input value={policyLanguages} onChange={e => setPolicyLanguages(e.target.value)} placeholder="English, Spanish" />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {existingSlug ? "Editing" : "Creating"}: <strong>{name || "Untitled"}</strong>
          </p>
          <Button onClick={handleSave} disabled={saving || !name.trim() || !city.trim()} size="lg" className="min-w-[160px]">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {saving ? "Saving..." : existingSlug ? "Save Changes" : "Create Provider"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminProviderForm;
