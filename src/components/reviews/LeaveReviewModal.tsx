import { useState, useEffect } from "react";
import heic2any from "heic2any";
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
import { REVIEW_CATEGORIES } from "@/data/providers";
import type { ReviewData } from "@/components/reviews/ReviewCard";

const VIBE_TAGS = [
  "Feels like a US office",
  "Walk-in friendly",
  "Great for nervous patients",
  "Family-run feel",
  "High-tech equipment",
  "Fast turnaround",
  "Bilingual staff",
  "Clean and modern",
  "No pressure sales",
  "Great with kids",
  "Luxury experience",
  "No-frills but solid",
  "Easy border crossing",
  "Good follow-up care",
];

const PHOTO_ACCEPT = ".jpg,.jpeg,.png,.heic,.heif";
const VIDEO_ACCEPT = ".mp4,.mov,.webm";
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

interface LeaveReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerSlug: string;
  providerName: string;
  procedures: string[];
  onReviewSubmitted: () => void;
  editReview?: ReviewData | null;
}

type CategoryRatings = Record<string, number>;

const CategoryStarPicker = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground min-w-0 truncate">{label}</span>
      <div className="flex shrink-0">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            className="p-1.5 -mx-0.5 touch-manipulation"
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(s)}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                s <= (hover || value) ? "fill-secondary text-secondary" : "text-border"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const LeaveReviewModal = ({
  open, onOpenChange, providerSlug, providerName, procedures, onReviewSubmitted, editReview,
}: LeaveReviewModalProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>({});
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [procedure, setProcedure] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vibeTags, setVibeTags] = useState<string[]>([]);

  const isEditing = !!editReview;

  useEffect(() => {
    if (editReview && open) {
      setCategoryRatings({
        rating_cleanliness: editReview.rating_cleanliness || 0,
        rating_communication: editReview.rating_communication || 0,
        rating_wait_time: editReview.rating_wait_time || 0,
        rating_outcome: editReview.rating_outcome || 0,
        rating_safety: editReview.rating_safety || 0,
        rating_value: editReview.rating_value || 0,
      });
      setTitle(editReview.title);
      setReviewText(editReview.review_text);
      setProcedure(editReview.procedure_name);
      setRecommend(editReview.recommend);
      setExistingPhotos(editReview.photos || []);
      setExistingVideos(editReview.videos || []);
      setNewPhotos([]);
      setNewVideos([]);
      setVibeTags((editReview as any).vibe_tags || []);
    } else if (!editReview && open) {
      setCategoryRatings({});
      setTitle(""); setReviewText(""); setProcedure("");
      setRecommend(true); setNewPhotos([]); setNewVideos([]);
      setExistingPhotos([]); setExistingVideos([]);
      setVibeTags([]);
    }
  }, [editReview, open]);

  const allCategoriesRated = REVIEW_CATEGORIES.every(
    ({ key }) => (categoryRatings[key] || 0) > 0
  );
  const overallRating = allCategoriesRated
    ? Math.round(
        (REVIEW_CATEGORIES.reduce((sum, { key }) => sum + (categoryRatings[key] || 0), 0) /
          REVIEW_CATEGORIES.length) *
          10
      ) / 10
    : 0;

  const totalPhotos = existingPhotos.length + newPhotos.length;
  const totalVideos = existingVideos.length + newVideos.length;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (f.size > MAX_PHOTO_SIZE) { toast({ title: `${f.name} exceeds 10MB limit`, variant: "destructive" }); return false; }
      return true;
    });
    setNewPhotos(prev => [...prev, ...valid.slice(0, 10 - totalPhotos)]);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (f.size > MAX_VIDEO_SIZE) { toast({ title: `${f.name} exceeds 100MB limit`, variant: "destructive" }); return false; }
      return true;
    });
    setNewVideos(prev => [...prev, ...valid.slice(0, 2 - totalVideos)]);
  };

  const convertToJpeg = async (file: File): Promise<File> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return file;
    
    // HEIC/HEIF conversion
    if (['heic', 'heif'].includes(ext)) {
      try {
        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
        const result = Array.isArray(blob) ? blob[0] : blob;
        return new File([result], file.name.replace(/\.[^.]+$/, '.jpeg'), { type: 'image/jpeg' });
      } catch (err) {
        console.error('HEIC conversion failed:', err);
        toast({ title: 'Photo format not supported', description: 'Please upload JPG or PNG instead.', variant: 'destructive' });
        throw err;
      }
    }

    // Other formats — try canvas conversion
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => {
          URL.revokeObjectURL(url);
          if (!b) { resolve(file); return; }
          resolve(new File([b], file.name.replace(/\.[^.]+$/, '.jpeg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  const uploadFiles = async (files: File[], type: "photos" | "videos") => {
    const urls: string[] = [];
    for (let file of files) {
      // Convert non-standard image formats to JPEG
      if (type === "photos") {
        file = await convertToJpeg(file);
      }
      const ext = file.name.split('.').pop() || 'jpeg';
      const path = `${user!.id}/${type}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("review-media").upload(path, file, {
        contentType: file.type || 'image/jpeg',
        cacheControl: "3600",
      });
      if (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        toast({ title: `Failed to upload ${file.name}`, description: error.message, variant: "destructive" });
      } else {
        const { data } = supabase.storage.from("review-media").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const hasAvatar = !!(profile as any)?.avatar_url;
  const hasName = !!(profile as any)?.first_name;
  const missingProfileInfo = !hasAvatar || !hasName;

  const handleSubmit = async () => {
    if (!user || !allCategoriesRated || !title || reviewText.length < 50 || !procedure) return;
    if (missingProfileInfo) {
      toast({
        title: "Complete your profile first",
        description: "You need a profile photo and name to leave a review. Go to your profile to add them.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);

    const uploadedPhotos = newPhotos.length > 0 ? await uploadFiles(newPhotos, "photos") : [];
    const uploadedVideos = newVideos.length > 0 ? await uploadFiles(newVideos, "videos") : [];
    const allPhotos = [...existingPhotos, ...uploadedPhotos];
    const allVideos = [...existingVideos, ...uploadedVideos];

    const reviewData = {
      rating: Math.round(overallRating),
      title: title.trim(),
      review_text: reviewText.trim(),
      procedure_name: procedure,
      recommend,
      photos: allPhotos,
      videos: allVideos,
      rating_cleanliness: categoryRatings.rating_cleanliness,
      rating_communication: categoryRatings.rating_communication,
      rating_wait_time: categoryRatings.rating_wait_time,
      rating_outcome: categoryRatings.rating_outcome,
      rating_safety: categoryRatings.rating_safety,
      rating_value: categoryRatings.rating_value,
      vibe_tags: vibeTags,
    };

    if (isEditing && editReview) {
      const { error } = await supabase.from("reviews" as any).update({ ...reviewData, is_edited: true } as any).eq("id", editReview.id);
      setIsSubmitting(false);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Review updated!" }); onReviewSubmitted(); onOpenChange(false); }
    } else {
      const { error } = await supabase.from("reviews" as any).insert({ ...reviewData, user_id: user.id, provider_slug: providerSlug } as any);
      setIsSubmitting(false);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else {
        toast({ title: "Review submitted!" }); onReviewSubmitted(); onOpenChange(false);
        setCategoryRatings({}); setTitle(""); setReviewText(""); setProcedure("");
        setRecommend(true); setNewPhotos([]); setNewVideos([]);
        setExistingPhotos([]); setExistingVideos([]);
        setVibeTags([]);
      }
    }
  };

  const toggleVibeTag = (tag: string) => {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Review" : `Review ${providerName}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Profile requirement notice */}
          {missingProfileInfo && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <p className="font-medium">Complete your profile to leave a review</p>
              <p className="text-xs mt-1">
                {!hasAvatar && "📸 Add a profile photo"}
                {!hasAvatar && !hasName && " • "}
                {!hasName && "✏️ Add your name"}
                {" — "}
                <a href="/profile" className="underline font-medium">Go to profile</a>
              </p>
            </div>
          )}
          <div className="space-y-3">
            <Label>Rate each category *</Label>
            <div className="space-y-2 bg-muted/50 rounded-lg p-3">
              {REVIEW_CATEGORIES.map(({ key, label }) => (
                <CategoryStarPicker
                  key={key}
                  label={label}
                  value={categoryRatings[key] || 0}
                  onChange={(v) => setCategoryRatings((prev) => ({ ...prev, [key]: v }))}
                />
              ))}
            </div>
            {allCategoriesRated && (
              <p className="text-sm text-muted-foreground">
                Overall: <span className="font-bold text-foreground">{overallRating}</span>/5
              </p>
            )}
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
            <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Tell others about your experience..." rows={4} />
            <p className={`text-xs ${reviewText.length < 50 ? "text-destructive" : "text-muted-foreground"}`}>
              {reviewText.length}/50 minimum characters
            </p>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos ({totalPhotos}/10)</Label>
            <div className="flex flex-wrap gap-2">
              {existingPhotos.map((url, i) => (
                <div key={`existing-${i}`} className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center" onClick={() => setExistingPhotos(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                </div>
              ))}
              {newPhotos.map((f, i) => (
                <div key={`new-${i}`} className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button type="button" className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center" onClick={() => setNewPhotos(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
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
            <Label>Videos ({totalVideos}/2) — 100MB max</Label>
            <div className="flex flex-wrap gap-2">
              {existingVideos.map((url, i) => (
                <div key={`ev-${i}`} className="relative flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm">
                  <span className="truncate max-w-[120px]">Video {i + 1}</span>
                  <button type="button" className="text-destructive" onClick={() => setExistingVideos(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                </div>
              ))}
              {newVideos.map((f, i) => (
                <div key={`nv-${i}`} className="relative flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm">
                  <span className="truncate max-w-[120px]">{f.name}</span>
                  <button type="button" className="text-destructive" onClick={() => setNewVideos(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
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

          {/* Vibe Tags */}
          <div className="space-y-2">
            <Label>Describe the vibe (up to 5)</Label>
            <div className="flex flex-wrap gap-2">
              {VIBE_TAGS.map((tag) => {
                const isSelected = vibeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleVibeTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-[#50FF90] text-black border-[#50FF90]"
                        : "bg-transparent text-[#50FF90] border-[#50FF90]/50 hover:border-[#50FF90]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recommend */}
          <div className="flex items-center justify-between">
            <Label>Would you recommend this provider?</Label>
            <Switch checked={recommend} onCheckedChange={setRecommend} />
          </div>

          <Button
            className="w-full"
            disabled={isSubmitting || !allCategoriesRated || !title || reviewText.length < 50 || !procedure || missingProfileInfo}
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
