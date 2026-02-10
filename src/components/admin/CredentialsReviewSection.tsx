import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import VerificationBadge from "@/components/providers/VerificationBadge";
import { Search, CheckCircle, XCircle, FileText, ExternalLink, Shield, ChevronRight } from "lucide-react";

interface Credential {
  id: string;
  provider_slug: string;
  credential_type: string;
  label: string;
  file_url: string;
  review_status: string;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface ProviderSummary {
  provider_slug: string;
  verification_tier: string;
  business_name: string;
  credentials: Credential[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  verified: "bg-secondary/10 text-secondary",
  rejected: "bg-destructive/10 text-destructive",
};

const CredentialsReviewSection = () => {
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<ProviderSummary | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    const [credRes, bizRes, profilesRes] = await Promise.all([
      supabase.from("provider_credentials").select("*").order("created_at", { ascending: false }),
      supabase.from("provider_business_info").select("provider_slug, legal_name, dba_name"),
      supabase.from("profiles").select("provider_slug, verification_tier").not("provider_slug", "is", null),
    ]);

    const creds = (credRes.data || []) as Credential[];
    const bizMap = new Map<string, string>();
    (bizRes.data || []).forEach((b: any) => bizMap.set(b.provider_slug, b.dba_name || b.legal_name));

    const tierMap = new Map<string, string>();
    (profilesRes.data || []).forEach((p: any) => {
      if (p.provider_slug) tierMap.set(p.provider_slug, p.verification_tier || "listed");
    });

    const grouped = new Map<string, ProviderSummary>();
    creds.forEach((c) => {
      if (!grouped.has(c.provider_slug)) {
        grouped.set(c.provider_slug, {
          provider_slug: c.provider_slug,
          verification_tier: tierMap.get(c.provider_slug) || "listed",
          business_name: bizMap.get(c.provider_slug) || c.provider_slug,
          credentials: [],
        });
      }
      grouped.get(c.provider_slug)!.credentials.push(c);
    });

    setProviders(Array.from(grouped.values()));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateCredentialStatus = async (credId: string, status: string, notes?: string) => {
    const { error } = await supabase
      .from("provider_credentials")
      .update({
        review_status: status,
        reviewer_notes: notes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", credId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Credential ${status}` });
      load();
      // Refresh selected provider
      if (selected) {
        setSelected((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            credentials: prev.credentials.map((c) =>
              c.id === credId ? { ...c, review_status: status, reviewer_notes: notes || null, reviewed_at: new Date().toISOString() } : c
            ),
          };
        });
      }
    }
  };

  const updateProviderTier = async (providerSlug: string, tier: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ verification_tier: tier })
      .eq("provider_slug", providerSlug);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Provider upgraded to ${tier}` });
      setSelected((prev) => prev ? { ...prev, verification_tier: tier } : null);
      load();
    }
  };

  const filtered = providers.filter((p) => {
    const matchesSearch = p.business_name.toLowerCase().includes(search.toLowerCase()) || p.provider_slug.toLowerCase().includes(search.toLowerCase());
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "pending") return matchesSearch && p.credentials.some((c) => c.review_status === "pending");
    return matchesSearch && p.verification_tier === filterStatus;
  });

  const getProgress = (creds: Credential[]) => {
    if (creds.length === 0) return 0;
    return Math.round((creds.filter((c) => c.review_status === "verified").length / creds.length) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Provider Verification</h2>
        <span className="text-sm text-muted-foreground">{filtered.length} providers</span>
      </div>

      <div className="flex gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search providers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All providers</SelectItem>
            <SelectItem value="pending">Has pending docs</SelectItem>
            <SelectItem value="listed">Listed tier</SelectItem>
            <SelectItem value="verified">Verified tier</SelectItem>
            <SelectItem value="premium">Premium tier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No providers with credentials found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const pending = p.credentials.filter((c) => c.review_status === "pending").length;
            const verified = p.credentials.filter((c) => c.review_status === "verified").length;
            const progress = getProgress(p.credentials);
            return (
              <Card key={p.provider_slug} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelected(p)}>
                <CardContent className="py-4 px-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{p.business_name}</span>
                        <VerificationBadge tier={p.verification_tier as any} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.credentials.length} documents · {verified} verified · {pending} pending
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                      <Progress value={progress} className="h-2" />
                      <p className="text-[10px] text-muted-foreground text-right mt-0.5">{progress}%</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Provider Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {selected?.business_name}
              {selected && <VerificationBadge tier={selected.verification_tier as any} size="sm" />}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              {/* Tier management */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Verification Tier</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  {(["listed", "verified", "premium"] as const).map((tier) => (
                    <Button
                      key={tier}
                      size="sm"
                      variant={selected.verification_tier === tier ? "default" : "outline"}
                      onClick={() => updateProviderTier(selected.provider_slug, tier)}
                      className="capitalize gap-1"
                    >
                      <VerificationBadge tier={tier} size="sm" />
                      {tier}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Credentials list */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Uploaded Credentials</h3>
                {selected.credentials.map((cred) => (
                  <div key={cred.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{cred.label}</p>
                          <p className="text-xs text-muted-foreground">{cred.credential_type} · Uploaded {new Date(cred.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${STATUS_COLORS[cred.review_status] || ""}`}>{cred.review_status}</Badge>
                        <a href={cred.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {cred.reviewer_notes && (
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">{cred.reviewer_notes}</p>
                    )}

                    {cred.review_status === "pending" && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Review notes (optional)..."
                          className="text-sm h-16"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => { updateCredentialStatus(cred.id, "verified", reviewNotes); setReviewNotes(""); }} className="gap-1">
                            <CheckCircle className="w-3 h-3" /> Verify
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { updateCredentialStatus(cred.id, "rejected", reviewNotes); setReviewNotes(""); }} className="gap-1 text-destructive hover:text-destructive">
                            <XCircle className="w-3 h-3" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CredentialsReviewSection;
