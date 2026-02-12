import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, ArrowRightLeft, ExternalLink, Mail, ClipboardEdit, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AdminProviderOnboarding from "./AdminProviderOnboarding";

interface ProviderRow {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  country: string | null;
  admin_managed: boolean;
  verification_tier: string;
  owner_user_id: string | null;
  created_at: string;
}

interface OnboardingStatus {
  [slug: string]: boolean[]; // index matches ONBOARDING_SECTIONS order
}

const ONBOARDING_SECTIONS = [
  { table: "provider_business_info", label: "Business Info" },
  { table: "provider_team_members", label: "Team" },
  { table: "provider_credentials", label: "Credentials" },
  { table: "provider_services", label: "Services" },
  { table: "provider_facility", label: "Facility" },
  { table: "provider_external_links", label: "Links" },
  { table: "provider_policies", label: "Policies" },
] as const;

const ProvidersSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({});
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderRow | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [onboardingProvider, setOnboardingProvider] = useState<ProviderRow | null>(null);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=first confirm, 2=second confirm
  const [deleteTarget, setDeleteTarget] = useState<ProviderRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    slug: "",
    city: "",
    country: "Mexico",
    address: "",
    phone: "",
    description: "",
    specialties: "",
    languages: "English, Spanish",
    hours_of_operation: "",
    established_year: "",
    admin_email: "cat@denied.care",
    verification_tier: "listed",
    travel_info: "",
  });

  const fetchProviders = async () => {
    setLoading(true);
    const { data } = await supabase.from("providers" as any).select("*").order("created_at", { ascending: false });
    const providerList = (data as any[]) || [];
    setProviders(providerList);
    setLoading(false);

    // Fetch onboarding completion status for all providers
    if (providerList.length > 0) {
      const slugs = providerList.map(p => p.slug);
      const results = await Promise.all(
        ONBOARDING_SECTIONS.map(s =>
          supabase.from(s.table as any).select("provider_slug").in("provider_slug", slugs)
        )
      );

      const statusMap: OnboardingStatus = {};
      for (const slug of slugs) {
        statusMap[slug] = results.map(result => {
          const rows = (result.data as any[]) || [];
          return rows.some(r => r.provider_slug === slug);
        });
      }
      setOnboardingStatus(statusMap);
    }
  };

  useEffect(() => { fetchProviders(); }, []);

  const openCreate = () => {
    setSelectedProvider(null);
    setForm({
      name: "", slug: "", city: "", country: "Mexico", address: "", phone: "",
      description: "", specialties: "", languages: "English, Spanish",
      hours_of_operation: "", established_year: "", admin_email: "cat@denied.care",
      verification_tier: "listed", travel_info: "",
    });
    setEditOpen(true);
  };

  const openEdit = (p: ProviderRow) => {
    setSelectedProvider(p);
    // Fetch full data
    supabase.from("providers" as any).select("*").eq("id", p.id).single().then(({ data }: any) => {
      if (data) {
        setForm({
          name: data.name || "",
          slug: data.slug || "",
          city: data.city || "",
          country: data.country || "Mexico",
          address: data.address || "",
          phone: data.phone || "",
          description: data.description || "",
          specialties: (data.specialties || []).join(", "),
          languages: (data.languages || []).join(", "),
          hours_of_operation: data.hours_of_operation || "",
          established_year: data.established_year?.toString() || "",
          admin_email: data.admin_email || "cat@denied.care",
          verification_tier: data.verification_tier || "listed",
          travel_info: data.travel_info || "",
        });
      }
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      city: form.city || null,
      country: form.country || "Mexico",
      address: form.address || null,
      phone: form.phone || null,
      description: form.description || null,
      specialties: form.specialties.split(",").map(s => s.trim()).filter(Boolean),
      languages: form.languages.split(",").map(s => s.trim()).filter(Boolean),
      hours_of_operation: form.hours_of_operation || null,
      established_year: form.established_year ? parseInt(form.established_year) : null,
      admin_managed: true,
      admin_email: form.admin_email || "cat@denied.care",
      verification_tier: form.verification_tier,
      travel_info: form.travel_info || null,
    };

    if (selectedProvider) {
      const { error } = await supabase.from("providers" as any).update(payload as any).eq("id", selectedProvider.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Provider updated" });
    } else {
      const { error } = await supabase.from("providers" as any).insert(payload as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Provider created" });
    }
    setEditOpen(false);
    fetchProviders();
  };

  const handleTransfer = async () => {
    if (!selectedProvider || !transferEmail) return;
    // Find user by email
    const { data: users } = await supabase.rpc("get_admin_user_list");
    const targetUser = (users as any[])?.find((u: any) => u.email === transferEmail);
    if (!targetUser) {
      toast({ title: "User not found", description: "No account with that email exists.", variant: "destructive" });
      return;
    }
    // Update provider
    const { error } = await supabase.from("providers" as any).update({
      owner_user_id: targetUser.user_id,
      admin_managed: false,
    } as any).eq("id", selectedProvider.id);

    // Also update the profile's provider_slug
    await supabase.from("profiles").update({ provider_slug: selectedProvider.slug }).eq("user_id", targetUser.user_id);

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Ownership transferred!" });
    setTransferOpen(false);
    setTransferEmail("");
    fetchProviders();
  };

  const startDelete = (p: ProviderRow) => {
    setDeleteTarget(p);
    setDeleteStep(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const slug = deleteTarget.slug;
    // Delete all related onboarding data first, then the provider
    const tables = [
      "provider_policies", "provider_external_links", "provider_services",
      "provider_facility", "provider_credentials", "provider_team_members",
      "provider_business_info", "bookings", "booking_messages",
    ];
    for (const table of tables) {
      if (table === "booking_messages") {
        // Delete messages for bookings belonging to this provider
        const { data: bookingIds } = await supabase
          .from("bookings")
          .select("id")
          .eq("provider_slug", slug);
        if (bookingIds?.length) {
          for (const b of bookingIds) {
            await supabase.from("booking_messages").delete().eq("booking_id", b.id);
          }
        }
      } else if (table === "bookings") {
        await supabase.from(table).delete().eq("provider_slug", slug);
      } else {
        await supabase.from(table as any).delete().eq("provider_slug", slug);
      }
    }
    // Delete reviews
    await supabase.from("reviews").delete().eq("provider_slug", slug);
    // Finally delete the provider
    const { error } = await supabase.from("providers" as any).delete().eq("slug", slug);
    setDeleting(false);
    setDeleteStep(0);
    setDeleteTarget(null);
    if (error) {
      toast({ title: "Error deleting provider", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Provider deleted", description: `${deleteTarget.name} and all related data removed.` });
      fetchProviders();
    }
  };

  if (onboardingProvider && user) {
    return (
      <AdminProviderOnboarding
        userId={user.id}
        providerSlug={onboardingProvider.slug}
        providerName={onboardingProvider.name}
        onBack={() => setOnboardingProvider(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Providers</h2>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Create Provider</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : providers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No providers yet. Create one above.</CardContent></Card>
      ) : (
        <Card className="border border-border/50 shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.city}{p.country ? `, ${p.country}` : ""}</TableCell>
                  <TableCell>
                    {(() => {
                      const sections = onboardingStatus[p.slug] ?? Array(7).fill(false);
                      const completed = sections.filter(Boolean).length;
                      const total = ONBOARDING_SECTIONS.length;
                      const pct = Math.round((completed / total) * 100);
                      return (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 min-w-[120px] cursor-default">
                                <Progress value={pct} className="h-2 flex-1" />
                                <span className={`text-xs font-medium whitespace-nowrap ${completed === total ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {completed === total ? (
                                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>
                                  ) : (
                                    `${completed}/${total}`
                                  )}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="p-3 max-w-[200px]">
                              <ul className="space-y-1">
                                {ONBOARDING_SECTIONS.map((s, i) => (
                                  <li key={s.table} className="flex items-center gap-2 text-xs">
                                    {sections[i] ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <span className={sections[i] ? '' : 'text-muted-foreground'}>{s.label}</span>
                                  </li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.verification_tier === "verified" ? "default" : "secondary"} className="text-xs">
                      {p.verification_tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.admin_managed ? (
                      <Badge variant="outline" className="text-xs gap-1"><Mail className="w-3 h-3" /> Admin Managed</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-primary">Self-Managed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setOnboardingProvider(p)} title="Fill Out Profile">
                        <ClipboardEdit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/provider/${p.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
                      </Button>
                      {p.admin_managed && (
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedProvider(p); setTransferOpen(true); }}>
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => startDelete(p)} title="Delete Provider" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProvider ? "Edit Provider" : "Create Provider"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Clinic Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="clinic-name-city" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Established Year</Label>
              <Input value={form.established_year} onChange={(e) => setForm(f => ({ ...f, established_year: e.target.value }))} type="number" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Specialties (comma-separated)</Label>
              <Input value={form.specialties} onChange={(e) => setForm(f => ({ ...f, specialties: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Languages (comma-separated)</Label>
              <Input value={form.languages} onChange={(e) => setForm(f => ({ ...f, languages: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Hours of Operation</Label>
              <Input value={form.hours_of_operation} onChange={(e) => setForm(f => ({ ...f, hours_of_operation: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Admin Email</Label>
              <Input value={form.admin_email} onChange={(e) => setForm(f => ({ ...f, admin_email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Verification Tier</Label>
              <Select value={form.verification_tier} onValueChange={(v) => setForm(f => ({ ...f, verification_tier: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="listed">Listed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Travel Info</Label>
              <Textarea value={form.travel_info} onChange={(e) => setForm(f => ({ ...f, travel_info: e.target.value }))} rows={2} />
            </div>
          </div>
          <Button onClick={handleSave} className="w-full mt-4" disabled={!form.name || !form.slug}>
            {selectedProvider ? "Save Changes" : "Create Provider"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership — {selectedProvider?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the email of the provider's new account. This will link the listing to their account and remove admin management.
            </p>
            <div className="space-y-2">
              <Label>Provider's Email</Label>
              <Input value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="provider@example.com" type="email" />
            </div>
            <Button onClick={handleTransfer} className="w-full" disabled={!transferEmail}>Transfer Ownership</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Two-Step Delete Confirmation Dialog */}
      <Dialog open={deleteStep > 0} onOpenChange={(open) => { if (!open) { setDeleteStep(0); setDeleteTarget(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteStep === 1 ? "Delete Provider?" : "Are you REALLY sure? 😬"}
            </DialogTitle>
          </DialogHeader>
          {deleteStep === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You're about to delete <strong>{deleteTarget?.name}</strong>. This will permanently remove the provider and all their data including services, team members, credentials, facility info, bookings, and reviews.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setDeleteStep(0); setDeleteTarget(null); }}>Cancel</Button>
                <Button variant="destructive" onClick={() => setDeleteStep(2)}>Yes, Delete</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This is your last chance! <strong>{deleteTarget?.name}</strong> and ALL associated data will be gone forever. There is no undo.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setDeleteStep(0); setDeleteTarget(null); }}>Nevermind</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "I'm sure — Delete Forever"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProvidersSection;
