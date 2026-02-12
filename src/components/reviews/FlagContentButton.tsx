import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const FLAG_REASONS = [
  "Spam or fake review",
  "Inappropriate or offensive content",
  "Contains personal information",
  "Not relevant to this provider",
  "Misleading or inaccurate",
  "Other",
];

interface FlagContentButtonProps {
  reviewId: string;
  contentType: "review" | "photo";
  photoUrl?: string;
  className?: string;
}

const FlagContentButton = ({ reviewId, contentType, photoUrl, className }: FlagContentButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);

    const { error } = await supabase.from("content_flags" as any).insert({
      flagger_user_id: user.id,
      review_id: reviewId,
      content_type: contentType,
      photo_url: contentType === "photo" ? photoUrl : null,
      reason,
      details: details.trim() || null,
    } as any);

    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already flagged", description: "You've already flagged this content." });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Flagged", description: "Thank you — our team will review this." });
      setOpen(false);
      setReason("");
      setDetails("");
    }
  };

  if (!user) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`gap-1 text-xs text-muted-foreground hover:text-destructive ${className || ""}`}
        onClick={() => setOpen(true)}
      >
        <Flag className="w-3 h-3" />
        Flag
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Flag {contentType === "review" ? "Review" : "Photo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>
                  {FLAG_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional details (optional)</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Tell us more..."
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              disabled={!reason || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Submit Flag"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FlagContentButton;
