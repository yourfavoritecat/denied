import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Plus, Pencil, ArrowRightLeft, ExternalLink, Mail, ClipboardEdit, Trash2, CheckCircle2, Circle, ArrowUpDown, Search, X, Star, ShieldCheck, Download, Upload, Image, Globe, Loader2, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AdminProviderForm from "./AdminProviderForm";

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
  specialties: string[] | null;
}

interface ProviderRatings {
  [slug: string]: number; // average rating
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
  const [formMode, setFormMode] = useState<null | "create" | "edit">(null);
  const [formSlug, setFormSlug] = useState<string | undefined>();
  const [formName, setFormName] = useState<string | undefined>();
  const [formInitialData, setFormInitialData] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderRow | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [onboardingProvider, setOnboardingProvider] = useState<ProviderRow | null>(null);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=first confirm, 2=second confirm
  const [deleteTarget, setDeleteTarget] = useState<ProviderRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortByIncomplete, setSortByIncomplete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteStep, setBulkDeleteStep] = useState<0 | 1 | 2>(0);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkTierOpen, setBulkTierOpen] = useState(false);
  const [bulkTierValue, setBulkTierValue] = useState("listed");
  const [bulkTierUpdating, setBulkTierUpdating] = useState(false);
  const [providerRatings, setProviderRatings] = useState<ProviderRatings>({});
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [newCoverPhoto, setNewCoverPhoto] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSource, setImportSource] = useState<string | null>(null);
  const [scrapedPhotos, setScrapedPhotos] = useState<string[]>([]);
  const [selectedScrapedPhoto, setSelectedScrapedPhoto] = useState<string | null>(null);
  const [navigateToOnboarding, setNavigateToOnboarding] = useState(false);

  // Filter state
  const [filterName, setFilterName] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterMinRating, setFilterMinRating] = useState("");
  const [filterTier, setFilterTier] = useState("all");

  const hasActiveFilters = filterName || filterLocation || filterSpecialty || filterMinRating || filterTier !== "all";

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

    // Fetch average ratings per provider
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("provider_slug, rating");
    if (reviewData?.length) {
      const ratingMap: Record<string, { sum: number; count: number }> = {};
      for (const r of reviewData) {
        if (!ratingMap[r.provider_slug]) ratingMap[r.provider_slug] = { sum: 0, count: 0 };
        ratingMap[r.provider_slug].sum += r.rating;
        ratingMap[r.provider_slug].count += 1;
      }
      const avgMap: ProviderRatings = {};
      for (const [slug, { sum, count }] of Object.entries(ratingMap)) {
        avgMap[slug] = Math.round((sum / count) * 10) / 10;
      }
      setProviderRatings(avgMap);
    }
  };

  useEffect(() => { fetchProviders(); }, []);

  // Apply filters (AND logic) then sort
  const filteredAndSortedProviders = useMemo(() => {
    let list = providers.filter(p => {
      if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false;
      const loc = `${p.city ?? ""} ${p.country ?? ""}`.toLowerCase();
      if (filterLocation && !loc.includes(filterLocation.toLowerCase())) return false;
      if (filterSpecialty) {
        const specs = (p.specialties ?? []).map(s => s.toLowerCase());
        if (!specs.some(s => s.includes(filterSpecialty.toLowerCase()))) return false;
      }
      if (filterMinRating) {
        const min = parseFloat(filterMinRating);
        if (!isNaN(min) && (providerRatings[p.slug] ?? 0) < min) return false;
      }
      if (filterTier !== "all" && p.verification_tier !== filterTier) return false;
      return true;
    });

    if (sortByIncomplete) {
      list = [...list].sort((a, b) => {
        const aCompleted = (onboardingStatus[a.slug] ?? []).filter(Boolean).length;
        const bCompleted = (onboardingStatus[b.slug] ?? []).filter(Boolean).length;
        return aCompleted - bCompleted;
      });
    }
    return list;
  }, [providers, onboardingStatus, sortByIncomplete, filterName, filterLocation, filterSpecialty, filterMinRating, filterTier, providerRatings]);

  const clearFilters = () => {
    setFilterName("");
    setFilterLocation("");
    setFilterSpecialty("");
    setFilterMinRating("");
    setFilterTier("all");
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const visibleIds = filteredAndSortedProviders.map(p => p.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleIds));
    }
  }, [filteredAndSortedProviders, selectedIds]);

  const selectedProviders = useMemo(
    () => providers.filter(p => selectedIds.has(p.id)),
    [providers, selectedIds]
  );

  const deleteProviderBySlug = async (slug: string) => {
    const tables = [
      "provider_policies", "provider_external_links", "provider_services",
      "provider_facility", "provider_credentials", "provider_team_members",
      "provider_business_info",
    ];
    for (const table of tables) {
      await supabase.from(table as any).delete().eq("provider_slug", slug);
    }
    const { data: bookingIds } = await supabase.from("bookings").select("id").eq("provider_slug", slug);
    if (bookingIds?.length) {
      for (const b of bookingIds) {
        await supabase.from("booking_messages").delete().eq("booking_id", b.id);
      }
    }
    await supabase.from("bookings").delete().eq("provider_slug", slug);
    await supabase.from("reviews").delete().eq("provider_slug", slug);
    await supabase.from("providers" as any).delete().eq("slug", slug);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    for (const p of selectedProviders) {
      await deleteProviderBySlug(p.slug);
    }
    setBulkDeleting(false);
    setBulkDeleteStep(0);
    setSelectedIds(new Set());
    toast({ title: "Bulk delete complete", description: `${selectedProviders.length} provider(s) deleted.` });
    fetchProviders();
  };

  const handleBulkTierChange = async () => {
    setBulkTierUpdating(true);
    for (const p of selectedProviders) {
      await supabase.from("providers" as any).update({ verification_tier: bulkTierValue } as any).eq("id", p.id);
    }
    setBulkTierUpdating(false);
    setBulkTierOpen(false);
    setSelectedIds(new Set());
    toast({ title: "Tier updated", description: `${selectedProviders.length} provider(s) set to "${bulkTierValue}".` });
    fetchProviders();
  };

  const exportCSV = useCallback(() => {
    const rows = filteredAndSortedProviders.map(p => {
      const sections = onboardingStatus[p.slug] ?? Array(ONBOARDING_SECTIONS.length).fill(false);
      const completed = sections.filter(Boolean).length;
      const rating = providerRatings[p.slug];
      const sectionColumns: Record<string, string> = {};
      ONBOARDING_SECTIONS.forEach((s, i) => {
        sectionColumns[`onboarding_${s.label.toLowerCase().replace(/\s+/g, "_")}`] = sections[i] ? "complete" : "incomplete";
      });
      return {
        name: p.name,
        slug: p.slug,
        city: p.city ?? "",
        country: p.country ?? "",
        verification_tier: p.verification_tier,
        type: p.admin_managed ? "admin_managed" : "self_managed",
        specialties: (p.specialties ?? []).join("; "),
        rating: rating != null ? rating.toString() : "",
        onboarding_total: `${completed}/${ONBOARDING_SECTIONS.length}`,
        ...sectionColumns,
        created_at: p.created_at,
      };
    });

    const headers = Object.keys(rows[0] ?? {});
    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        headers.map(h => {
          const val = String((row as any)[h]);
          return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `providers-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${rows.length} provider(s) exported to CSV.` });
  }, [filteredAndSortedProviders, onboardingStatus, providerRatings, toast]);

  const openCreate = (initialData?: any) => {
    setFormMode("create");
    setFormSlug(undefined);
    setFormName(undefined);
    setFormInitialData(initialData || null);
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-provider', {
        body: { url: importUrl.trim() },
      });
      if (error || !data?.success) {
        toast({ title: "Import failed", description: data?.error || error?.message || "Could not scrape that URL.", variant: "destructive" });
        setImporting(false);
        return;
      }
      const d = data.data;
      setImportOpen(false);
      // Go straight to the create form with scraped data
      const socialLinks = d.social_links || {};
      openCreate({
        name: d.name || "",
        slug: d.slug || "",
        city: d.city || "",
        country: d.country || "Mexico",
        address: d.address || "",
        phone: d.phone || "",
        description: d.description || "",
        specialties: (d.specialties || []).join(", "),
        languages: (d.languages || []).join(", ") || "English, Spanish",
        hours_of_operation: d.hours_of_operation || "",
        cover_photo_url: (d.photos && d.photos[0]) || "",
        website_url: socialLinks.website || "",
        instagram_url: socialLinks.instagram || "",
        facebook_url: socialLinks.facebook || "",
        google_business_url: socialLinks.google_maps || "",
        tiktok_url: socialLinks.tiktok || "",
      });
      toast({ title: "Data imported!", description: `Extracted info from ${new URL(importUrl.trim()).hostname}. Review and save.` });
    } catch (err) {
      toast({ title: "Import error", description: "Something went wrong during import.", variant: "destructive" });
    }
    setImporting(false);
    setImportUrl("");
  };

  const openEdit = (p: ProviderRow) => {
    setFormMode("edit");
    setFormSlug(p.slug);
    setFormName(p.name);
    setFormInitialData(null);
  };

  // handleSave is now handled by AdminProviderForm

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
    await deleteProviderBySlug(deleteTarget.slug);
    setDeleting(false);
    setDeleteStep(0);
    const name = deleteTarget.name;
    setDeleteTarget(null);
    toast({ title: "Provider deleted", description: `${name} and all related data removed.` });
    fetchProviders();
  };

  // Show form for create/edit/onboarding
  if ((formMode && user) || (onboardingProvider && user)) {
    const isCreating = formMode === "create";
    const editSlug = formMode === "edit" ? formSlug : onboardingProvider?.slug;
    const editName = formMode === "edit" ? formName : onboardingProvider?.name;
    return (
      <AdminProviderForm
        userId={user.id}
        providerSlug={editSlug}
        providerName={editName}
        isNew={isCreating}
        initialData={isCreating ? formInitialData : undefined}
        onBack={() => { setFormMode(null); setOnboardingProvider(null); fetchProviders(); }}
        onSaved={(slug) => {
          if (isCreating) {
            // After creating, switch to edit mode for same provider
            setFormMode("edit");
            setFormSlug(slug);
            setFormName(undefined);
            setFormInitialData(null);
          }
          fetchProviders();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Providers</h2>
        <div className="flex gap-2">
          <Button
            variant={sortByIncomplete ? "default" : "outline"}
            onClick={() => setSortByIncomplete(v => !v)}
            className="gap-2"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortByIncomplete ? "Incomplete First" : "Sort by Onboarding"}
          </Button>
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <Globe className="w-4 h-4" /> Import from URL
          </Button>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Create Provider</Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="border border-border/50 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                placeholder="Search name..."
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1 flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value)}
              placeholder="City or country..."
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Specialty</Label>
            <Input
              value={filterSpecialty}
              onChange={e => setFilterSpecialty(e.target.value)}
              placeholder="e.g. dental, cosmetic..."
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1 min-w-[100px]">
            <Label className="text-xs text-muted-foreground">Min Rating</Label>
            <div className="relative">
              <Star className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={filterMinRating}
                onChange={e => setFilterMinRating(e.target.value)}
                placeholder="e.g. 4"
                className="pl-8 h-9 text-sm w-[100px]"
                type="number"
                min="0"
                max="5"
                step="0.5"
              />
            </div>
          </div>
          <div className="space-y-1 min-w-[120px]">
            <Label className="text-xs text-muted-foreground">Verification</Label>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="h-9 text-sm w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="listed">Listed</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground h-9">
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing {filteredAndSortedProviders.length} of {providers.length} providers
          </p>
        )}
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : providers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No providers yet. Create one above.</CardContent></Card>
      ) : (
        <Card className="border border-border/50 shadow-lg overflow-hidden">
          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b border-border/50">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setBulkTierOpen(true)}>
                <ShieldCheck className="w-3.5 h-3.5" /> Change Tier
              </Button>
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setBulkDeleteStep(1)}>
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="ml-auto text-muted-foreground">
                Deselect All
              </Button>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={filteredAndSortedProviders.length > 0 && filteredAndSortedProviders.every(p => selectedIds.has(p.id))}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedProviders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No providers match your filters.</TableCell></TableRow>
              ) : filteredAndSortedProviders.map((p) => (
                <TableRow key={p.id} className={selectedIds.has(p.id) ? "bg-muted/30" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.city}{p.country ? `, ${p.country}` : ""}</TableCell>
                  <TableCell>
                    {providerRatings[p.slug] != null ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {providerRatings[p.slug]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
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
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="Edit Provider">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
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

      {/* Old Create/Edit Dialog removed — now using AdminProviderForm */}

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

      {/* Bulk Delete Two-Step Dialog */}
      <Dialog open={bulkDeleteStep > 0} onOpenChange={(open) => { if (!open) setBulkDeleteStep(0); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkDeleteStep === 1 ? `Delete ${selectedIds.size} Provider(s)?` : "Are you REALLY sure? 😬"}
            </DialogTitle>
          </DialogHeader>
          {bulkDeleteStep === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You're about to delete <strong>{selectedIds.size} provider(s)</strong> and all their associated data (services, team, credentials, bookings, reviews, etc).
              </p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                {selectedProviders.map(p => <li key={p.id}>{p.name}</li>)}
              </ul>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setBulkDeleteStep(0)}>Cancel</Button>
                <Button variant="destructive" onClick={() => setBulkDeleteStep(2)}>Yes, Delete All</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This is your last chance! <strong>{selectedIds.size} provider(s)</strong> and ALL associated data will be gone forever. There is no undo.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setBulkDeleteStep(0)}>Nevermind</Button>
                <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting}>
                  {bulkDeleting ? "Deleting..." : "I'm sure — Delete All Forever"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Change Tier Dialog */}
      <Dialog open={bulkTierOpen} onOpenChange={setBulkTierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Verification Tier — {selectedIds.size} Provider(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set the verification tier for: {selectedProviders.map(p => p.name).join(", ")}
            </p>
            <div className="space-y-2">
              <Label>New Tier</Label>
              <Select value={bulkTierValue} onValueChange={setBulkTierValue}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="listed">Listed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleBulkTierChange} className="w-full" disabled={bulkTierUpdating}>
              {bulkTierUpdating ? "Updating..." : `Set to "${bulkTierValue}"`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import from URL Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Provider from URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste a clinic's website, Google Maps listing, Yelp page, or any public page. We'll extract whatever info we can find.
            </p>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://example-clinic.com or Google Maps link..."
                type="url"
                onKeyDown={(e) => { if (e.key === 'Enter') handleImportFromUrl(); }}
              />
            </div>
            <Button onClick={handleImportFromUrl} className="w-full" disabled={importing || !importUrl.trim()}>
              {importing ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Scanning website...</>
              ) : (
                <><Globe className="w-4 h-4 mr-2" /> Import</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProvidersSection;
