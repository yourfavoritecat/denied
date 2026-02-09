import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface LeaveReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerSlug: string;
  providerName: string;
  procedures: string[];
  onReviewSubmitted: () => void;
}

const LeaveReviewModal = ({
  open, onOpenChange, providerSlug, providerName, procedures, onReviewSubmitted,
}: LeaveReviewModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [procedure, setProcedure] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 10));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setVideos((prev) => [...prev, ...files].slice(0, 2));
  };

  const uploadFiles = async (files: File[], type: "photos" | "videos") => {
    const urls: string[] = [];
    for (const file of files) {
      const path = `${user!.id}/${type}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("review-media")
        .upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("review-media").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!user || rating === 0 || !title || reviewText.length < 50 || !procedure) return;
    setIsSubmitting(true);

    const photoUrls = photos.length > 0 ? await uploadFiles(photos, "photos") : [];
    const videoUrls = videos.length > 0 ? await uploadFiles(videos, "videos") : [];

    const { error } = await supabase.from("reviews" as any).insert({
      user_id: user.id,
      provider_slug: providerSlug,
      rating,
      title: title.trim(),
      review_text: reviewText.trim(),
      procedure_name: procedure,
      recommend,
      photos: photoUrls,
      videos: videoUrls,
    } as any);

    setIsSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted!" });
      onReviewSubmitted();
      onOpenChange(false);
      // Reset
      setRating(0); setTitle(""); setReviewText(""); setProcedure("");
      setRecommend(true); setPhotos([]); setVideos([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review {providerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Star rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      s <= (hoverRating || rating)
                        ? "fill-secondary text-secondary"
                        : "text-border"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Procedure */}
          <div className="space-y-2">
            <Label>Procedure *</Label>
            <Select value={procedure} onValueChange={setProcedure}>
              <SelectTrigger><SelectValue placeholder="Select procedure" /></SelectTrigger>
              <SelectContent>
                {procedures.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Review Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarize your experience" maxLength={100} />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <Label>Your Review * (min 50 chars)</Label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell others about your experience..."
              rows={4}
            />
            <p className={`text-xs ${reviewText.length < 50 ? "text-destructive" : "text-muted-foreground"}`}>
              {reviewText.length}/50 minimum characters
            </p>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos (up to 10)</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((f, i) => (
                <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <label className="w-16 h-16 rounded-md border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </div>

          {/* Videos */}
          <div className="space-y-2">
            <Label>Videos (up to 2)</Label>
            <div className="flex flex-wrap gap-2">
              {videos.map((f, i) => (
                <div key={i} className="relative flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm">
                  {f.name.slice(0, 20)}
                  <button
                    type="button"
                    className="text-destructive"
                    onClick={() => setVideos((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {videos.length < 2 && (
                <label className="px-4 py-2 rounded-md border-2 border-dashed border-border flex items-center gap-2 cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" /> Add Video
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                </label>
              )}
            </div>
          </div>

          {/* Recommend */}
          <div className="flex items-center justify-between">
            <Label>Would you recommend this provider?</Label>
            <Switch checked={recommend} onCheckedChange={setRecommend} />
          </div>

          <Button
            className="w-full"
            disabled={isSubmitting || rating === 0 || !title || reviewText.length < 50 || !procedure}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveReviewModal;
