import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Upload, Loader2 } from "lucide-react";

const SPECIALTY_OPTIONS = [
  "Dental Implants", "Veneers", "Crowns", "Root Canal", "Teeth Whitening",
  "Orthodontics", "Cosmetic Surgery", "Rhinoplasty", "Liposuction",
  "Tummy Tuck", "BBL", "Breast Augmentation", "Facelift", "Botox",
  "Dermal Fillers", "Bariatric Surgery", "LASIK", "Hair Transplant",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  onSubmitted: () => void;
}

export default function SuggestProviderModal({ open, onOpenChange, creatorId, onSubmitted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [creatorNotes, setCreatorNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const addCustomSpecialty = () => {
    const trimmed = specialtyInput.trim();
    if (trimmed && !specialties.includes(trimmed)) {
      setSpecialties([...specialties, trimmed]);
    }
    setSpecialtyInput("");
  };

  const uploadFiles = async (files: File[], type: "photos" | "videos") => {
    if (!user) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/suggestions/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("profile-media").upload(path, file, { contentType: file.type });
      if (error) {
        toast({ title: `Upload failed: ${file.name}`, variant: "destructive" });
        continue;
      }
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    if (type === "photos") setPhotos((prev) => [...prev, ...urls]);
    else setVideos((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !city.trim()) {
      toast({ title: "Name and City are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("provider_suggestions" as any).insert({
      creator_id: creatorId,
      name: name.trim(),
      city: city.trim(),
      website_url: websiteUrl.trim() || null,
      description: description.trim() || null,
      specialties,
      photos,
      videos,
      creator_notes: creatorNotes.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error submitting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Provider submitted for review! We'll let you know when it's approved. 🎉" });
      // Reset
      setName(""); setCity(""); setWebsiteUrl(""); setDescription("");
      setSpecialties([]); setCreatorNotes(""); setPhotos([]); setVideos([]);
      onOpenChange(false);
      onSubmitted();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suggest a New Provider</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Provider Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Garcia Dental Clinic" />
          </div>
          <div className="space-y-2">
            <Label>City *</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Tijuana" />
          </div>
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" />
            <p className="text-xs text-muted-foreground">We'll pull info from their site automatically</p>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us about this provider..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Specialties</Label>
            <div className="flex flex-wrap gap-1.5">
              {SPECIALTY_OPTIONS.map((s) => (
                <Badge
                  key={s}
                  variant={specialties.includes(s) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleSpecialty(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                placeholder="Add custom..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSpecialty())}
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={addCustomSpecialty} disabled={!specialtyInput.trim()}>
                Add
              </Button>
            </div>
            {specialties.filter((s) => !SPECIALTY_OPTIONS.includes(s)).map((s) => (
              <Badge key={s} className="mr-1 cursor-pointer" onClick={() => toggleSpecialty(s)}>
                {s} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => photoInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(Array.from(e.target.files || []), "photos")} />
          </div>

          {/* Videos */}
          <div className="space-y-2">
            <Label>Videos</Label>
            <div className="flex flex-wrap gap-2">
              {videos.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  <video src={url} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setVideos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </button>
            </div>
            <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => uploadFiles(Array.from(e.target.files || []), "videos")} />
          </div>

          <div className="space-y-2">
            <Label>Why do you recommend them?</Label>
            <Textarea value={creatorNotes} onChange={(e) => setCreatorNotes(e.target.value)} placeholder="Share your personal experience..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !city.trim()}>
            {submitting ? "Submitting..." : "Submit for Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
