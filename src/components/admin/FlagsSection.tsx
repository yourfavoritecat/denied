import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Trash2, CheckCircle, Eye, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlagRow {
  id: string;
  flagger_user_id: string;
  review_id: string | null;
  content_type: string;
  photo_url: string | null;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  flagger_name?: string;
  review_title?: string;
  review_provider?: string;
}

const FlagsSection = () => {
  const { toast } = useToast();
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFlag, setPreviewFlag] = useState<FlagRow | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [reviewDetail, setReviewDetail] = useState<any>(null);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("content_flags" as any)
      .select("*")
      .order("created_at", { ascending: false });

    const raw = (data as any[]) || [];

    // Enrich with flagger names and review info
    const userIds = [...new Set(raw.map((f) => f.flagger_user_id))];
    const reviewIds = [...new Set(raw.filter((f) => f.review_id).map((f) => f.review_id))];

    const [profilesRes, reviewsRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("user_id, first_name").in("user_id", userIds)
        : { data: [] },
      reviewIds.length > 0
        ? supabase.from("reviews" as any).select("id, title, provider_slug").in("id", reviewIds)
        : { data: [] },
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.first_name || "Unknown"]));
    const reviewMap = new Map((reviewsRes.data as any[] || []).map((r: any) => [r.id, r]));

    setFlags(
      raw.map((f) => ({
        ...f,
        flagger_name: profileMap.get(f.flagger_user_id) || "Unknown",
        review_title: reviewMap.get(f.review_id)?.title || "—",
        review_provider: reviewMap.get(f.review_id)?.provider_slug || "—",
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { loadFlags(); }, [loadFlags]);

  const handlePreview = async (flag: FlagRow) => {
    setPreviewFlag(flag);
    setAdminNotes(flag.admin_notes || "");
    if (flag.review_id) {
      const { data } = await supabase.from("reviews" as any).select("*").eq("id", flag.review_id).maybeSingle();
      setReviewDetail(data);
    } else {
      setReviewDetail(null);
    }
  };

  const handleDismiss = async (flag: FlagRow) => {
    await supabase
      .from("content_flags" as any)
      .update({ status: "dismissed", admin_notes: adminNotes, resolved_at: new Date().toISOString() } as any)
      .eq("id", flag.id);
    toast({ title: "Flag dismissed", description: "Content kept as-is." });
    setPreviewFlag(null);
    loadFlags();
  };

  const handleRemove = async (flag: FlagRow) => {
    if (flag.content_type === "review" && flag.review_id) {
      // Delete the review — ratings will no longer count
      await supabase.from("review_upvotes" as any).delete().eq("review_id", flag.review_id);
      await supabase.from("reviews" as any).delete().eq("id", flag.review_id);
    } else if (flag.content_type === "photo" && flag.review_id && flag.photo_url) {
      // Remove just the photo from the review
      const { data: review } = await supabase.from("reviews" as any).select("photos").eq("id", flag.review_id).maybeSingle();
      if (review) {
        const updatedPhotos = ((review as any).photos || []).filter((p: string) => p !== flag.photo_url);
        await supabase.from("reviews" as any).update({ photos: updatedPhotos } as any).eq("id", flag.review_id);
      }
    }

    // Mark all pending flags for same content as removed
    if (flag.content_type === "review" && flag.review_id) {
      await supabase
        .from("content_flags" as any)
        .update({ status: "removed", admin_notes: adminNotes, resolved_at: new Date().toISOString() } as any)
        .eq("review_id", flag.review_id)
        .eq("status", "pending");
    } else {
      await supabase
        .from("content_flags" as any)
        .update({ status: "removed", admin_notes: adminNotes, resolved_at: new Date().toISOString() } as any)
        .eq("id", flag.id);
    }

    toast({ title: "Content removed", description: flag.content_type === "review" ? "Review and its ratings have been deleted." : "Photo removed from review." });
    setPreviewFlag(null);
    loadFlags();
  };

  const pending = flags.filter((f) => f.status === "pending");
  const resolved = flags.filter((f) => f.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Flag className="w-6 h-6" /> Flagged Content
        </h2>
        <Badge variant="secondary">{pending.length} pending</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : pending.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No pending flags 🎉</CardContent></Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Flagged By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">{f.content_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {f.content_type === "review" ? f.review_title : "Photo"}
                    {f.review_provider !== "—" && (
                      <span className="text-xs text-muted-foreground ml-1">({f.review_provider})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{f.reason}</TableCell>
                  <TableCell className="text-muted-foreground">{f.flagger_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handlePreview(f)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Resolved flags */}
      {resolved.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            {resolved.length} resolved flag(s)
          </summary>
          <div className="border rounded-lg overflow-x-auto mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolved.map((f) => (
                  <TableRow key={f.id} className="opacity-60">
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{f.content_type}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{f.content_type === "review" ? f.review_title : "Photo"}</TableCell>
                    <TableCell>
                      <Badge variant={f.status === "removed" ? "destructive" : "secondary"} className="text-xs capitalize">
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      )}

      {/* Preview / Action Dialog */}
      <Dialog open={!!previewFlag} onOpenChange={() => setPreviewFlag(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Flagged Content</DialogTitle>
          </DialogHeader>
          {previewFlag && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p><strong>Type:</strong> {previewFlag.content_type}</p>
                <p><strong>Reason:</strong> {previewFlag.reason}</p>
                {previewFlag.details && <p><strong>Details:</strong> {previewFlag.details}</p>}
                <p><strong>Flagged by:</strong> {previewFlag.flagger_name}</p>
              </div>

              {/* Show the flagged content */}
              {previewFlag.content_type === "photo" && previewFlag.photo_url && (
                <div className="rounded-lg overflow-hidden border">
                  <img src={previewFlag.photo_url} alt="Flagged photo" className="w-full max-h-64 object-contain bg-black" />
                </div>
              )}

              {reviewDetail && (
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="font-medium">{reviewDetail.rating}/5</span>
                    <Badge variant="outline" className="text-xs">{reviewDetail.procedure_name}</Badge>
                  </div>
                  <h4 className="font-semibold">{reviewDetail.title}</h4>
                  <p className="text-sm text-muted-foreground">{reviewDetail.review_text}</p>
                  {(reviewDetail.photos || []).length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {reviewDetail.photos.map((url: string, i: number) => (
                        <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Optional notes about your decision..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handleDismiss(previewFlag)}
                >
                  <CheckCircle className="w-4 h-4" /> Keep Content
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => handleRemove(previewFlag)}
                >
                  <Trash2 className="w-4 h-4" /> Remove {previewFlag.content_type === "review" ? "Review" : "Photo"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlagsSection;
