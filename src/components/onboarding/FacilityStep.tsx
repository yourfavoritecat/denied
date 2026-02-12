import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, Image } from "lucide-react";

interface Props {
  userId: string;
  providerSlug: string;
  onComplete: () => void;
}

const FacilityStep = ({ userId, providerSlug, onComplete }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newVideo, setNewVideo] = useState<File | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [newCoverPhoto, setNewCoverPhoto] = useState<File | null>(null);

  useEffect(() => {
    // Load facility data
    supabase
      .from("provider_facility" as any)
      .select("*")
      .eq("provider_slug", providerSlug)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setDescription(d.description || "");
          setPhotos(d.photos || []);
          setVideoUrl(d.video_tour_url || "");
        }
      });
    // Load existing cover photo from providers table
    supabase
      .from("providers")
      .select("cover_photo_url")
      .eq("slug", providerSlug)
      .single()
      .then(({ data }) => {
        if (data?.cover_photo_url) setCoverPhotoUrl(data.cover_photo_url);
      });
  }, [providerSlug]);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${userId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("provider-onboarding").upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
    });
    if (error) {
      console.error(`Upload failed for ${file.name}:`, error);
      toast({ title: `Failed to upload ${file.name}`, description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("provider-onboarding").getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 20 - photos.length - newPhotos.length;
    setNewPhotos((prev) => [...prev, ...files.slice(0, remaining)]);
  };

  const handleSave = async () => {
    setSaving(true);

    // Upload new photos
    const uploadedUrls: string[] = [];
    for (const file of newPhotos) {
      const url = await uploadFile(file, "facility");
      if (url) uploadedUrls.push(url);
    }

    // Upload video if any
    let videoTourUrl = videoUrl;
    if (newVideo) {
      const url = await uploadFile(newVideo, "facility-video");
      if (url) videoTourUrl = url;
    }

    // Upload cover photo if any
    let finalCoverUrl = coverPhotoUrl;
    if (newCoverPhoto) {
      const url = await uploadFile(newCoverPhoto, "cover");
      if (url) finalCoverUrl = url;
    }

    const allPhotos = [...photos, ...uploadedUrls];

    const payload = {
      user_id: userId,
      provider_slug: providerSlug,
      description: description.trim() || null,
      photos: allPhotos,
      video_tour_url: videoTourUrl || null,
    };

    const { error } = await supabase
      .from("provider_facility" as any)
      .upsert(payload as any, { onConflict: "provider_slug" });

    // Save cover photo URL to providers table
    if (!error && finalCoverUrl !== coverPhotoUrl) {
      await supabase
        .from("providers")
        .update({ cover_photo_url: finalCoverUrl || null } as any)
        .eq("slug", providerSlug);
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPhotos(allPhotos);
      setNewPhotos([]);
      setNewVideo(null);
      setNewCoverPhoto(null);
      if (finalCoverUrl) setCoverPhotoUrl(finalCoverUrl);
      if (videoTourUrl) setVideoUrl(videoTourUrl);
      toast({ title: "Facility info saved!" });
      onComplete();
    }
  };

  const removeExistingPhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));
  const removeNewPhoto = (idx: number) => setNewPhotos((prev) => prev.filter((_, i) => i !== idx));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facility</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cover Photo */}
        <div className="space-y-2">
          <Label>Cover Photo (shown on your search listing card)</Label>
          <p className="text-xs text-muted-foreground">Upload a wide photo (16:9 recommended) that best represents your clinic. This is the first thing patients see.</p>
          {coverPhotoUrl && !newCoverPhoto ? (
            <div className="relative rounded-lg overflow-hidden border border-border/50 max-w-md">
              <img src={coverPhotoUrl} alt="Cover" className="w-full aspect-[16/10] object-cover" />
              <button onClick={() => setCoverPhotoUrl("")} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : newCoverPhoto ? (
            <div className="relative rounded-lg overflow-hidden border border-border/50 max-w-md">
              <img src={URL.createObjectURL(newCoverPhoto)} alt="Cover preview" className="w-full aspect-[16/10] object-cover" />
              <button onClick={() => setNewCoverPhoto(null)} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full max-w-md aspect-[16/10] rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Upload cover photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewCoverPhoto(e.target.files?.[0] || null)} />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label>Facility Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe your clinic, equipment, and what patients can expect..." />
        </div>

        <div className="space-y-2">
          <Label>Photos (lobby, treatment rooms, equipment, sterilization, exterior)</Label>
          <div className="flex flex-wrap gap-3">
            {photos.map((url, i) => (
              <div key={`ex-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border/50">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeExistingPhoto(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {newPhotos.map((f, i) => (
              <div key={`new-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border/50">
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeNewPhoto(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
              <Image className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Add</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">{photos.length + newPhotos.length} photos</p>
        </div>

        <div className="space-y-2">
          <Label>Video Tour (optional)</Label>
          {videoUrl ? (
            <div className="flex items-center gap-3">
              <video src={videoUrl} className="w-48 h-28 rounded-lg object-cover border border-border/50" />
              <Button variant="outline" size="sm" onClick={() => setVideoUrl("")}>Remove</Button>
            </div>
          ) : newVideo ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="truncate">{newVideo.name}</span>
              <button onClick={() => setNewVideo(null)} className="text-destructive"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
              <Upload className="w-4 h-4" /> Upload video
              <input type="file" accept="video/*" className="hidden" onChange={(e) => setNewVideo(e.target.files?.[0] || null)} />
            </label>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save & Continue
        </Button>
      </CardContent>
    </Card>
  );
};

export default FacilityStep;
