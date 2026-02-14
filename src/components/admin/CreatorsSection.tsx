import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Copy, Check, ExternalLink, Eye, Lightbulb, Image as ImageIcon, Play } from "lucide-react";

interface InviteCode {
  id: string;
  code: string;
  handle: string | null;
  is_active: boolean;
  claimed_by: string | null;
  created_at: string;
}

interface CreatorRow {
  id: string;
  handle: string;
  display_name: string;
  is_published: boolean;
  featured_providers: string[];
  user_id: string;
  created_at: string;
  content_count?: number;
}

interface Suggestion {
  id: string;
  creator_id: string;
  status: string;
  name: string;
  city: string | null;
  country: string | null;
  website_url: string | null;
  description: string | null;
  specialties: string[];
  photos: string[];
  videos: string[];
  creator_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  creator_name?: string;
}

const CreatorsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Review dialog
  const [reviewItem, setReviewItem] = useState<Suggestion | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [invRes, crRes, sugRes] = await Promise.all([
      supabase.from("creator_invite_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("creator_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("provider_suggestions" as any).select("*").order("created_at", { ascending: false }),
    ]);

    setInvites((invRes.data as unknown as InviteCode[]) || []);

    const profiles = (crRes.data as unknown as CreatorRow[]) || [];

    // Fetch content counts
    if (profiles.length > 0) {
      const { data: contentCounts } = await supabase
        .from("creator_content")
        .select("creator_id")
        .in("creator_id", profiles.map((p) => p.id));

      const countMap: Record<string, number> = {};
      (contentCounts || []).forEach((c: any) => {
        countMap[c.creator_id] = (countMap[c.creator_id] || 0) + 1;
      });
      profiles.forEach((p) => (p.content_count = countMap[p.id] || 0));
    }

    setCreators(profiles);

    // Map creator names to suggestions
    const sugData = (sugRes.data as unknown as Suggestion[]) || [];
    const creatorMap: Record<string, string> = {};
    profiles.forEach((p) => (creatorMap[p.id] = p.display_name));
    sugData.forEach((s) => (s.creator_name = creatorMap[s.creator_id] || "Unknown"));
    setSuggestions(sugData);

    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newCode.trim() || !user) return;
    setCreating(true);

    const { error } = await supabase.from("creator_invite_codes").insert({
      code: newCode.trim().toLowerCase(),
      handle: newHandle.trim().toLowerCase() || null,
      created_by: user.id,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invite code created!" });
      setCreateOpen(false);
      setNewCode("");
      setNewHandle("");
      loadData();
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("creator_invite_codes").update({ is_active: active } as any).eq("id", id);
    setInvites((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: active } : i)));
  };

  const copyUrl = (code: string, id: string) => {
    navigator.clipboard.writeText(`https://denied.care/join/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied!" });
  };

  const handleApprove = async () => {
    if (!reviewItem || !user) return;
    setProcessing(true);

    // Update suggestion status
    await supabase
      .from("provider_suggestions" as any)
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reviewItem.id);

    // Create provider
    const slug = reviewItem.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + reviewItem.city?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "mexico";

    await supabase.from("providers").insert({
      name: reviewItem.name,
      slug,
      city: reviewItem.city,
      country: reviewItem.country || "Mexico",
      description: reviewItem.description,
      specialties: reviewItem.specialties,
      verification_tier: "unverified",
    });

    setProcessing(false);
    setReviewItem(null);
    toast({ title: "Provider approved and created! Edit their full profile in the Providers section. ✅" });
    loadData();
  };

  const handleReject = async () => {
    if (!reviewItem || !user) return;
    setProcessing(true);

    await supabase
      .from("provider_suggestions" as any)
      .update({
        status: "rejected",
        admin_notes: rejectNotes.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reviewItem.id);

    setProcessing(false);
    setReviewItem(null);
    setShowReject(false);
    setRejectNotes("");
    toast({ title: "Suggestion rejected" });
    loadData();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">Pending</Badge>;
      case "approved": return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">Rejected</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">creators</h2>

      <Tabs defaultValue="invites">
        <TabsList>
          <TabsTrigger value="invites">Invite Codes</TabsTrigger>
          <TabsTrigger value="active">Active Creators</TabsTrigger>
          <TabsTrigger value="suggestions">
            Provider Suggestions
            {suggestions.filter((s) => s.status === "pending").length > 0 && (
              <Badge className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0">
                {suggestions.filter((s) => s.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Invite Codes Tab */}
        <TabsContent value="invites" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" /> Create Invite
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Handle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.code}</TableCell>
                    <TableCell>{inv.handle || "—"}</TableCell>
                    <TableCell>
                      {inv.claimed_by ? (
                        <Badge variant="outline" className="text-xs">Claimed</Badge>
                      ) : (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Available</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => copyUrl(inv.code, inv.id)}
                      >
                        {copiedId === inv.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedId === inv.id ? "Copied" : "Copy"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={inv.is_active}
                        onCheckedChange={(v) => toggleActive(inv.id, v)}
                        disabled={!!inv.claimed_by}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {invites.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No invite codes yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Active Creators Tab */}
        <TabsContent value="active" className="space-y-4 mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Handle</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Providers</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creators.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.display_name}</TableCell>
                    <TableCell className="font-mono text-sm">{c.handle}</TableCell>
                    <TableCell>
                      {c.is_published ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Live</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>{c.featured_providers?.length || 0}</TableCell>
                    <TableCell>{c.content_count || 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {c.is_published && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/c/${c.handle}`} target="_blank" rel="noopener">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {creators.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No creators yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Provider Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4 mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Provider Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{s.creator_name}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-sm">{s.city || "—"}</TableCell>
                    <TableCell>
                      {s.website_url ? (
                        <a href={s.website_url} target="_blank" rel="noopener" className="text-primary hover:underline text-sm flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Link
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setReviewItem(s)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {suggestions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No provider suggestions yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Invite Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invite Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. katiedental"
              />
              {newCode && (
                <p className="text-xs text-muted-foreground">
                  Invite URL: <span className="font-mono">denied.care/join/{newCode}</span>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Pre-assigned Handle (optional)</Label>
              <Input
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. katiedental"
              />
              <p className="text-xs text-muted-foreground">If set, the creator will get this handle automatically</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newCode.trim()}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Suggestion Dialog */}
      <Dialog open={!!reviewItem} onOpenChange={(v) => { if (!v) { setReviewItem(null); setShowReject(false); setRejectNotes(""); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Provider Suggestion</DialogTitle>
          </DialogHeader>
          {reviewItem && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Submitted by</Label>
                <p className="font-medium">{reviewItem.creator_name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Provider Name</Label>
                <p className="font-medium">{reviewItem.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">City</Label>
                  <p>{reviewItem.city || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <p>{reviewItem.country || "Mexico"}</p>
                </div>
              </div>
              {reviewItem.website_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">Website</Label>
                  <a href={reviewItem.website_url} target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1 text-sm">
                    {reviewItem.website_url} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {reviewItem.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm">{reviewItem.description}</p>
                </div>
              )}
              {reviewItem.specialties?.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Specialties</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reviewItem.specialties.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {reviewItem.creator_notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Creator's Recommendation</Label>
                  <p className="text-sm italic">"{reviewItem.creator_notes}"</p>
                </div>
              )}

              {/* Photo gallery */}
              {reviewItem.photos?.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Photos</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {reviewItem.photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener" className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Video gallery */}
              {reviewItem.videos?.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Videos</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {reviewItem.videos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener" className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                        <video src={url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {reviewItem.status === "pending" && !showReject && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleApprove} disabled={processing} className="flex-1">
                    {processing ? "Processing..." : "✅ Approve & Create Provider"}
                  </Button>
                  <Button variant="destructive" onClick={() => setShowReject(true)} className="flex-1">
                    Reject
                  </Button>
                </div>
              )}

              {showReject && (
                <div className="space-y-2 pt-2">
                  <Label>Rejection reason</Label>
                  <Textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Why is this being rejected?"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowReject(false)} className="flex-1">Cancel</Button>
                    <Button variant="destructive" onClick={handleReject} disabled={processing} className="flex-1">
                      {processing ? "Rejecting..." : "Confirm Reject"}
                    </Button>
                  </div>
                </div>
              )}

              {reviewItem.status !== "pending" && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">Status: {statusBadge(reviewItem.status)}</p>
                  {reviewItem.admin_notes && (
                    <p className="text-sm mt-1">Notes: {reviewItem.admin_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorsSection;
