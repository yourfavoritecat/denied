import { useState, useEffect } from "react";
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
import type { ReviewData } from "@/components/reviews/ReviewCard";

const PHOTO_ACCEPT = ".jpg,.jpeg,.png,.heic,.heif";
const VIDEO_ACCEPT = ".mp4,.mov,.webm";
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB

interface LeaveReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerSlug: string;
  providerName: string;
  procedures: string[];
  onReviewSubmitted: () => void;
  editReview?: ReviewData | null;
}

const LeaveReviewModal = ({
  open, onOpenChange, providerSlug, providerName, procedures, onReviewSubmitted, editReview,
}: LeaveReviewModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [procedure, setProcedure] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editReview;

  // Pre-fill when editing
  useEffect(() => {
    if (editReview && open) {
      setRating(editReview.rating);
      setTitle(editReview.title);
      setReviewText(editReview.review_text);
      setProcedure(editReview.procedure_name);
      setRecommend(editReview.recommend);
      setExistingPhotos(editReview.photos || []);
      setExistingVideos(editReview.videos || []);
      setNewPhotos([]);
      setNewVideos([]);
    } else if (!editReview && open) {
      setRating(0); setTitle(""); setReviewText(""); setProcedure("");
      setRecommend(true); setNewPhotos([]); setNewVideos([]);
      setExistingPhotos([]); setExistingVideos([]);
    }
  }, [editReview, open]);

  const totalPhotos = existingPhotos.length + newPhotos.length;
  const totalVideos = existingVideos.length + newVideos.length;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (f.size > MAX_PHOTO_SIZE) {
        toast({ title: `${f.name} exceeds 10MB limit`, variant: "destructive" });
        return false;
      }
      return true;
    });
    const remaining = 10 - totalPhotos;
    setNewPhotos(prev => [...prev, ...valid.slice(0, remaining)]);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (f.size > MAX_VIDEO_SIZE) {
        toast({ title: `${f.name} exceeds 100MB limit`, variant: "destructive" });
        return false;
      }
      return true;
    });
    const remaining = 2 - totalVideos;
    setNewVideos(prev => [...prev, ...valid.slice(0, remaining)]);
  };

  const uploadFiles = async (files: File[], type: "photos" | "videos") => {
    const urls: string[] = [];
    for (const file of files) {
      const path = `${user!.id}/${type}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("review-media").upload(path, file);
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

    const uploadedPhotos = newPhotos.length > 0 ? await uploadFiles(newPhotos, "photos") : [];
    const uploadedVideos = newVideos.length > 0 ? await uploadFiles(newVideos, "videos") : [];

    const allPhotos = [...existingPhotos, ...uploadedPhotos];
    const allVideos = [...existingVideos, ...uploadedVideos];

    if (isEditing && editReview) {
      const { error } = await supabase.from("reviews" as any).update({
        rating,
        title: title.trim(),
        review_text: reviewText.trim(),
        procedure_name: procedure,
        recommend,
        photos: allPhotos,
        videos: allVideos,
        is_edited: true,
      } as any).eq("id", editReview.id);

      setIsSubmitting(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Review updated!" });
        onReviewSubmitted();
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.from("reviews" as any).insert({
        user_id: user.id,
        provider_slug: providerSlug,
        rating,
        title: title.trim(),
        review_text: reviewText.trim(),
        procedure_name: procedure,
        recommend,
        photos: allPhotos,
        videos: allVideos,
      } as any);

      setIsSubmitting(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Review submitted!" });
        onReviewSubmitted();
        onOpenChange(false);
        setRating(0); setTitle(""); setReviewText(""); setProcedure("");
        setRecommend(true); setNewPhotos([]); setNewVideos([]);
        setExistingPhotos([]); setExistingVideos([]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Review" : `Review ${providerName}`}</DialogTitle>
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
                      s <= (hoverRating || rating) ? "fill-secondary text-secondary" : "text-border"
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
            <Label>Photos ({totalPhotos}/10) — JPG, PNG, HEIC</Label>
            <div className="flex flex-wrap gap-2">
              {existingPhotos.map((url, i) => (
                <div key={`existing-${i}`} className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center"
                    onClick={() => setExistingPhotos(prev => prev.filter((_, j) => j !== i))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newPhotos.map((f, i) => (
                <div key={`new-${i}`} className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center"
                    onClick={() => setNewPhotos(prev => prev.filter((_, j) => j !== i))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {totalPhotos < 10 && (
                <label className="w-16 h-16 rounded-md border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <input type="file" accept={PHOTO_ACCEPT} multiple className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </div>

          {/* Videos */}
          <div className="space-y-2">
            <Label>Videos ({totalVideos}/2) — MP4, MOV, WebM · 100MB max</Label>
            <div className="flex flex-wrap gap-2">
              {existingVideos.map((url, i) => (
                <div key={`ev-${i}`} className="relative flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm">
                  <span className="truncate max-w-[120px]">Video {i + 1}</span>
                  <button type="button" className="text-destructive" onClick={() => setExistingVideos(prev => prev.filter((_, j) => j !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newVideos.map((f, i) => (
                <div key={`nv-${i}`} className="relative flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm">
                  <span className="truncate max-w-[120px]">{f.name}</span>
                  <button type="button" className="text-destructive" onClick={() => setNewVideos(prev => prev.filter((_, j) => j !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {totalVideos < 2 && (
                <label className="px-4 py-2 rounded-md border-2 border-dashed border-border flex items-center gap-2 cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" /> Add Video
                  <input type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={handleVideoUpload} />
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
            {isSubmitting ? (isEditing ? "Saving..." : "Submitting...") : (isEditing ? "Save Changes" : "Submit Review")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveReviewModal;
