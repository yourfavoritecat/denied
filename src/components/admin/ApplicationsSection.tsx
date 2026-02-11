import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react";

interface Application {
  id: string;
  business_name: string;
  business_type: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  status: string;
  specialties: string[] | null;
  languages: string[] | null;
  website_url: string | null;
  certifications: string | null;
  why_join: string | null;
  whatsapp: string | null;
  years_in_practice: number | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const ApplicationsSection = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("provider_applications").select("*").order("created_at", { ascending: false });
    setApps((data as Application[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approveApplication = async (app: Application) => {
    setApproving(true);
    
    // 1. Generate slug from business name + city
    const slug = `${app.business_name}-${app.city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // 2. Create provider record
    const { error: providerError } = await supabase.from("providers" as any).insert({
      name: app.business_name,
      slug,
      city: app.city,
      country: app.country,
      phone: app.phone,
      specialties: app.specialties,
      languages: app.languages,
      verification_tier: "listed",
      admin_managed: true,
      admin_email: app.email,
    } as any);

    if (providerError) {
      // If slug conflict, try with a suffix
      if (providerError.code === "23505") {
        const slugRetry = `${slug}-${Date.now().toString(36).slice(-4)}`;
        const { error: retryError } = await supabase.from("providers" as any).insert({
          name: app.business_name,
          slug: slugRetry,
          city: app.city,
          country: app.country,
          phone: app.phone,
          specialties: app.specialties,
          languages: app.languages,
          verification_tier: "listed",
          admin_managed: true,
          admin_email: app.email,
        } as any);
        if (retryError) {
          toast({ title: "Error creating provider", description: retryError.message, variant: "destructive" });
          setApproving(false);
          return;
        }
      } else {
        toast({ title: "Error creating provider", description: providerError.message, variant: "destructive" });
        setApproving(false);
        return;
      }
    }

    // 3. Try to link to existing user account by email
    const { data: users } = await supabase.rpc("get_admin_user_list");
    const matchedUser = (users as any[])?.find((u: any) => u.email === app.email);
    
    if (matchedUser) {
      // Link the provider to their account
      const finalSlug = slug; // use the slug we created
      await supabase.from("profiles").update({ provider_slug: finalSlug }).eq("user_id", matchedUser.user_id);
      // Mark provider as self-managed since they have an account
      await supabase.from("providers" as any).update({ 
        owner_user_id: matchedUser.user_id, 
        admin_managed: false 
      } as any).eq("slug", finalSlug);
    }

    // 4. Update application status
    const { error } = await supabase.from("provider_applications").update({ status: "approved" }).eq("id", app.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Application approved ✓", 
        description: matchedUser 
          ? `Provider created & linked to ${app.email}. They'll be redirected to onboarding on next login.`
          : `Provider listing created. When ${app.email} creates an account, you can transfer ownership.`
      });
      setSelected((prev) => prev ? { ...prev, status: "approved" } : null);
      load();
    }
    setApproving(false);
  };

  const rejectApplication = async (id: string) => {
    const { error } = await supabase.from("provider_applications").update({ status: "rejected" }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Application rejected" });
      setSelected((prev) => prev ? { ...prev, status: "rejected" } : null);
      load();
    }
  };

  const filtered = apps.filter((a) =>
    [a.business_name, a.contact_name, a.city, a.email].some((f) => f.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">provider applications</h2>
        <span className="text-sm text-muted-foreground">{filtered.length} applications</span>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No applications</TableCell></TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(a)}>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_COLORS[a.status] || ""}`}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{a.business_name}</TableCell>
                    <TableCell>{a.contact_name}</TableCell>
                    <TableCell className="text-muted-foreground">{a.city}, {a.country}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.business_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <Badge className={`${STATUS_COLORS[selected.status] || ""}`}>{selected.status}</Badge>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{selected.contact_name}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selected.email}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selected.phone}</span></div>
                <div><span className="text-muted-foreground">WhatsApp:</span> <span className="font-medium">{selected.whatsapp || "—"}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{selected.business_type}</span></div>
                <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{selected.city}, {selected.country}</span></div>
                <div><span className="text-muted-foreground">Years:</span> <span className="font-medium">{selected.years_in_practice ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Website:</span> <span className="font-medium">{selected.website_url || "—"}</span></div>
              </div>

              {selected.specialties && selected.specialties.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Specialties</p>
                  <div className="flex flex-wrap gap-1">{selected.specialties.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
                </div>
              )}

              {selected.languages && selected.languages.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Languages</p>
                  <div className="flex flex-wrap gap-1">{selected.languages.map((l) => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}</div>
                </div>
              )}

              {selected.certifications && (
                <div><p className="text-sm text-muted-foreground mb-1">Certifications</p><p className="text-sm">{selected.certifications}</p></div>
              )}

              {selected.why_join && (
                <div><p className="text-sm text-muted-foreground mb-1">Why they want to join</p><p className="text-sm">{selected.why_join}</p></div>
              )}

              {selected.status === "approved" && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm text-primary font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Provider listing created
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A provider profile was auto-created. View it in the Providers section or visit their public page.
                  </p>
                </div>
              )}

              {selected.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => approveApplication(selected)} className="gap-1 flex-1" disabled={approving}>
                    {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} 
                    Approve & Create Provider
                  </Button>
                  <Button variant="outline" onClick={() => rejectApplication(selected.id)} className="gap-1 flex-1 text-destructive hover:text-destructive">
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsSection;
