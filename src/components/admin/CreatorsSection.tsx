import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Copy, Check, ExternalLink, Eye } from "lucide-react";

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

const CreatorsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [invRes, crRes] = await Promise.all([
      supabase.from("creator_invite_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("creator_profiles").select("*").order("created_at", { ascending: false }),
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
        </TabsList>

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
    </div>
  );
};

export default CreatorsSection;
